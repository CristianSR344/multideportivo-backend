// controllers/espacio.js
import poolPromise from "../connect.js";
import sql from "mssql";

/* ======================================================
   Crear espacio
====================================================== */
export const createEspacio = async (req, res) => {
  const { descripcion = null, servicio = null } = req.body || {};

  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input("descripcion", sql.NVarChar(sql.MAX), descripcion)
      .input("servicio",   sql.NVarChar(sql.MAX), servicio)
      .query(`
        INSERT INTO dbo.espacio (descripcion, servicio)
        OUTPUT INSERTED.idEspacio, INSERTED.descripcion, INSERTED.servicio
        VALUES (@descripcion, @servicio);
      `);

    return res.status(201).json({
      message: "Espacio creado correctamente.",
      data: result.recordset[0],
    });
  } catch (err) {
    console.error("❌ createEspacio:", err);
    res.status(500).json({ error: err.message });
  }
};

/* ======================================================
   Listar todos los espacios
====================================================== */
export const listEspacios = async (_req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT idEspacio, descripcion, servicio
      FROM dbo.espacio
      ORDER BY idEspacio DESC;
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error("❌ listEspacios:", err);
    res.status(500).json({ error: err.message });
  }
};

/* ======================================================
   Obtener un espacio por ID
====================================================== */
export const getEspacioById = async (req, res) => {
  const { idEspacio } = req.params;

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input("idEspacio", sql.Int, idEspacio)
      .query(`
        SELECT idEspacio, descripcion, servicio
        FROM dbo.espacio
        WHERE idEspacio = @idEspacio;
      `);

    if (!result.recordset.length) {
      return res.status(404).json({ message: "Espacio no encontrado." });
    }

    res.json(result.recordset[0]);
  } catch (err) {
    console.error("❌ getEspacioById:", err);
    res.status(500).json({ error: err.message });
  }
};

/* ======================================================
   Actualizar espacio (PUT parcial con COALESCE)
====================================================== */
export const updateEspacio = async (req, res) => {
  const { idEspacio } = req.params;
  const { descripcion = null, servicio = null } = req.body || {};

  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input("idEspacio",   sql.Int, idEspacio)
      .input("descripcion", sql.NVarChar(sql.MAX), descripcion)
      .input("servicio",    sql.NVarChar(sql.MAX), servicio)
      .query(`
        UPDATE dbo.espacio
        SET
          descripcion = COALESCE(@descripcion, descripcion),
          servicio    = COALESCE(@servicio, servicio)
        WHERE idEspacio = @idEspacio;

        SELECT idEspacio, descripcion, servicio
        FROM dbo.espacio
        WHERE idEspacio = @idEspacio;
      `);

    if (!result.recordset.length) {
      return res.status(404).json({ message: "Espacio no encontrado." });
    }

    res.json({
      message: "Espacio actualizado correctamente.",
      data: result.recordset[0],
    });
  } catch (err) {
    console.error("❌ updateEspacio:", err);
    res.status(500).json({ error: err.message });
  }
};

/* ======================================================
   Eliminar espacio
====================================================== */
export const deleteEspacio = async (req, res) => {
  const { idEspacio } = req.params;

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input("idEspacio", sql.Int, idEspacio)
      .query(`DELETE FROM dbo.espacio WHERE idEspacio = @idEspacio;`);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: "Espacio no encontrado." });
    }

    res.json({ message: "Espacio eliminado correctamente." });
  } catch (err) {
    console.error("❌ deleteEspacio:", err);
    res.status(500).json({ error: err.message });
  }
};
