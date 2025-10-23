import poolPromise from "../connect.js";
import sql from "mssql";

/* ======================================================
   POST /api/espacio-actividad
   Crea un vínculo espacio↔actividad
====================================================== */
export const linkEspacioActividad = async (req, res) => {
  const { idEspacio, idActividad } = req.body;
  if (!idEspacio || !idActividad) {
    return res.status(400).json({ message: "idEspacio e idActividad son requeridos." });
  }

  try {
    const pool = await poolPromise;

    // Validar existencia de ambos lados
    const existencia = await pool.request()
      .input("idEspacio", sql.Int, idEspacio)
      .input("idActividad", sql.Int, idActividad)
      .query(`
        SELECT
          (SELECT COUNT(*) FROM dbo.espacio   WHERE idEspacio   = @idEspacio)   AS existeEspacio,
          (SELECT COUNT(*) FROM dbo.actividad WHERE idActividad = @idActividad) AS existeActividad
      `);

    const { existeEspacio, existeActividad } = existencia.recordset[0];
    if (!existeEspacio) return res.status(400).json({ message: "El espacio no existe." });
    if (!existeActividad) return res.status(400).json({ message: "La actividad no existe." });

    // Evitar duplicado
    const dup = await pool.request()
      .input("idEspacio", sql.Int, idEspacio)
      .input("idActividad", sql.Int, idActividad)
      .query(`
        SELECT 1 FROM dbo.espacio_actividad
        WHERE idEspacio = @idEspacio AND idActividad = @idActividad
      `);

    if (dup.recordset.length) {
      return res.status(409).json({ message: "La relación ya existe." });
    }

    await pool.request()
      .input("idEspacio", sql.Int, idEspacio)
      .input("idActividad", sql.Int, idActividad)
      .query(`
        INSERT INTO dbo.espacio_actividad (idEspacio, idActividad)
        VALUES (@idEspacio, @idActividad);
      `);

    return res.status(201).json({
      message: "Relación espacio-actividad creada correctamente.",
      data: { idEspacio, idActividad }
    });
  } catch (err) {
    console.error("❌ linkEspacioActividad:", err);
    res.status(500).json({ error: err.message });
  }
};

/* ======================================================
   GET /api/espacio-actividad/actividad/:idActividad
   Lista espacios asignados a una actividad
====================================================== */
export const listEspaciosByActividad = async (req, res) => {
  const { idActividad } = req.params;

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input("idActividad", sql.Int, idActividad)
      .query(`
        SELECT ea.idEspacio, e.descripcion, e.servicio
        FROM dbo.espacio_actividad ea
        JOIN dbo.espacio e ON e.idEspacio = ea.idEspacio
        WHERE ea.idActividad = @idActividad
        ORDER BY ea.idEspacio;
      `);

    res.json(result.recordset);
  } catch (err) {
    console.error("❌ listEspaciosByActividad:", err);
    res.status(500).json({ error: err.message });
  }
};

/* ======================================================
   GET /api/espacio-actividad/espacio/:idEspacio
   Lista actividades asignadas a un espacio
====================================================== */
export const listActividadesByEspacio = async (req, res) => {
  const { idEspacio } = req.params;

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input("idEspacio", sql.Int, idEspacio)
      .query(`
        SELECT ea.idActividad, a.nombre, a.descripcion, a.cupo, a.idUsuario
        FROM dbo.espacio_actividad ea
        JOIN dbo.actividad a ON a.idActividad = ea.idActividad
        WHERE ea.idEspacio = @idEspacio
        ORDER BY ea.idActividad DESC;
      `);

    res.json(result.recordset);
  } catch (err) {
    console.error("❌ listActividadesByEspacio:", err);
    res.status(500).json({ error: err.message });
  }
};

/* ======================================================
   PUT /api/espacio-actividad/actividad/:idActividad
   Reemplaza TODOS los espacios de una actividad (transacción)
   Body: { espacios: [1,2,3] }
====================================================== */
export const replaceEspaciosForActividad = async (req, res) => {
  const { idActividad } = req.params;
  const { espacios } = req.body; // array de ids

  if (!Array.isArray(espacios)) {
    return res.status(400).json({ message: "El cuerpo debe incluir 'espacios' como arreglo de IDs." });
  }

  const pool = await poolPromise;
  const tx = new sql.Transaction(pool);

  try {
    await tx.begin();

    const tReq = new sql.Request(tx);

    // Validar actividad
    const act = await tReq
      .input("idActividad", sql.Int, idActividad)
      .query(`SELECT 1 FROM dbo.actividad WHERE idActividad = @idActividad;`);
    if (!act.recordset.length) {
      await tx.rollback();
      return res.status(400).json({ message: "La actividad no existe." });
    }

    // Borrar todos los vínculos actuales
    await tReq
      .input("idActividad", sql.Int, idActividad)
      .query(`DELETE FROM dbo.espacio_actividad WHERE idActividad = @idActividad;`);

    // Insertar los nuevos (si viene vacío, queda sin vincular)
    for (const idEspacio of espacios) {
      await tReq
        .input("idActividad", sql.Int, idActividad)
        .input("idEspacio", sql.Int, idEspacio)
        .query(`
          INSERT INTO dbo.espacio_actividad (idEspacio, idActividad)
          VALUES (@idEspacio, @idActividad);
        `);
    }

    await tx.commit();

    // Devolver lista final
    const finalList = await pool.request()
      .input("idActividad", sql.Int, idActividad)
      .query(`
        SELECT ea.idEspacio, e.descripcion, e.servicio
        FROM dbo.espacio_actividad ea
        JOIN dbo.espacio e ON e.idEspacio = ea.idEspacio
        WHERE ea.idActividad = @idActividad
        ORDER BY ea.idEspacio;
      `);

    res.json({
      message: "Relaciones actualizadas correctamente.",
      data: finalList.recordset,
    });
  } catch (err) {
    await tx.rollback().catch(() => {});
    console.error("❌ replaceEspaciosForActividad:", err);
    res.status(500).json({ error: err.message });
  }
};

/* ======================================================
   DELETE /api/espacio-actividad
   Body: { idEspacio, idActividad }  → elimina el vínculo
====================================================== */
export const unlinkEspacioActividad = async (req, res) => {
  const { idEspacio, idActividad } = req.body;
  if (!idEspacio || !idActividad) {
    return res.status(400).json({ message: "idEspacio e idActividad son requeridos." });
  }

  try {
    const pool = await poolPromise;
    const r = await pool.request()
      .input("idEspacio", sql.Int, idEspacio)
      .input("idActividad", sql.Int, idActividad)
      .query(`
        DELETE FROM dbo.espacio_actividad
        WHERE idEspacio = @idEspacio AND idActividad = @idActividad;
      `);

    if (r.rowsAffected[0] === 0) {
      return res.status(404).json({ message: "La relación no existe." });
    }

    res.json({ message: "Relación eliminada correctamente." });
  } catch (err) {
    console.error("❌ unlinkEspacioActividad:", err);
    res.status(500).json({ error: err.message });
  }
};
