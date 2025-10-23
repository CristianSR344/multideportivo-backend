import poolPromise from "../connect.js";
import sql from "mssql";

/* ======================================================
   Crear actividad
====================================================== */
export const createActividad = async (req, res) => {
  const { idUsuario, nombre, descripcion, cupo } = req.body;

  // Validación básica
  if (!idUsuario || !nombre) {
    return res.status(400).json({
      message: "idUsuario y nombre son obligatorios.",
    });
  }

  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input("idUsuario", sql.Int, idUsuario)
      .input("nombre", sql.VarChar(100), nombre)
      .input("descripcion", sql.VarChar(sql.MAX), descripcion ?? null)
      .input("cupo", sql.Int, cupo ?? null)
      .query(`
        INSERT INTO dbo.actividad (idUsuario, nombre, descripcion, cupo)
        OUTPUT INSERTED.idActividad, INSERTED.idUsuario, INSERTED.nombre, INSERTED.descripcion, INSERTED.cupo
        VALUES (@idUsuario, @nombre, @descripcion, @cupo);
      `);

    return res.status(201).json({
      message: "Actividad creada correctamente.",
      data: result.recordset[0],
    });
  } catch (err) {
    console.error("❌ createActividad:", err);
    res.status(500).json({ error: err.message });
  }
};

/* ======================================================
   Listar actividades
====================================================== */
export const listActividades = async (_req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT 
        a.idActividad,
        a.idUsuario,
        u.nombre AS nombreUsuario,
        a.nombre,
        a.descripcion,
        a.cupo
      FROM dbo.actividad a
      LEFT JOIN dbo.usuarios u ON u.id_usuario = a.idUsuario
      ORDER BY a.idActividad DESC;
    `);

    res.json(result.recordset);
  } catch (err) {
    console.error("❌ listActividades:", err);
    res.status(500).json({ error: err.message });
  }
};

/* ======================================================
   Obtener actividad por ID
====================================================== */
export const getActividadById = async (req, res) => {
  const { idActividad } = req.params;

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input("idActividad", sql.Int, idActividad)
      .query(`
        SELECT 
          a.idActividad,
          a.idUsuario,
          u.nombre AS nombreUsuario,
          a.nombre,
          a.descripcion,
          a.cupo
        FROM dbo.actividad a
        LEFT JOIN dbo.usuarios u ON u.id_usuario = a.idUsuario
        WHERE a.idActividad = @idActividad;
      `);

    if (!result.recordset.length) {
      return res.status(404).json({ message: "Actividad no encontrada." });
    }

    res.json(result.recordset[0]);
  } catch (err) {
    console.error("❌ getActividadById:", err);
    res.status(500).json({ error: err.message });
  }
};

/* ======================================================
   Actualizar actividad
====================================================== */
export const updateActividad = async (req, res) => {
  const { idActividad } = req.params;
  const { idUsuario, nombre, descripcion, cupo } = req.body;

  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input("idActividad", sql.Int, idActividad)
      .input("idUsuario", sql.Int, idUsuario ?? null)
      .input("nombre", sql.VarChar(100), nombre ?? null)
      .input("descripcion", sql.VarChar(sql.MAX), descripcion ?? null)
      .input("cupo", sql.Int, cupo ?? null)
      .query(`
        UPDATE dbo.actividad
        SET
          idUsuario   = COALESCE(@idUsuario, idUsuario),
          nombre      = COALESCE(@nombre, nombre),
          descripcion = COALESCE(@descripcion, descripcion),
          cupo        = COALESCE(@cupo, cupo)
        WHERE idActividad = @idActividad;

        SELECT 
          a.idActividad,
          a.idUsuario,
          u.nombre AS nombreUsuario,
          a.nombre,
          a.descripcion,
          a.cupo
        FROM dbo.actividad a
        LEFT JOIN dbo.usuarios u ON u.id_usuario = a.idUsuario
        WHERE a.idActividad = @idActividad;
      `);

    if (!result.recordset.length) {
      return res.status(404).json({ message: "Actividad no encontrada." });
    }

    res.json({
      message: "Actividad actualizada correctamente.",
      data: result.recordset[0],
    });
  } catch (err) {
    console.error("❌ updateActividad:", err);
    res.status(500).json({ error: err.message });
  }
};

/* ======================================================
   Eliminar actividad
====================================================== */
export const deleteActividad = async (req, res) => {
  const { idActividad } = req.params;

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input("idActividad", sql.Int, idActividad)
      .query(`DELETE FROM dbo.actividad WHERE idActividad = @idActividad;`);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: "Actividad no encontrada." });
    }

    res.json({ message: "Actividad eliminada correctamente." });
  } catch (err) {
    console.error("❌ deleteActividad:", err);
    res.status(500).json({ error: err.message });
  }
};
