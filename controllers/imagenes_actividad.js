// controllers/imagenActividad.js
import poolPromise from "../connect.js";
import sql from "mssql";

/* ======================================================
   Crear imagen para una actividad
   Body: { idActividad: number, imagenBase64: string }
====================================================== */
export const createImagenActividad = async (req, res) => {
  const { idActividad, imagenBase64 } = req.body;

  if (!idActividad || !imagenBase64) {
    return res
      .status(400)
      .json({ message: "idActividad e imagenBase64 son requeridos." });
  }

  try {
    const pool = await poolPromise;

    // Validar que exista la actividad
    const existe = await pool
      .request()
      .input("idActividad", sql.Int, idActividad)
      .query(`SELECT 1 FROM dbo.actividad WHERE idActividad = @idActividad;`);

    if (!existe.recordset.length) {
      return res.status(400).json({ message: "La actividad no existe." });
    }

    const result = await pool
      .request()
      .input("idActividad", sql.Int, idActividad)
      .input(
        "imagen",
        sql.VarBinary(sql.MAX),
        Buffer.from(imagenBase64, "base64")
      )
      .query(`
        INSERT INTO dbo.imagen_actividad (idActividad, imagen)
        OUTPUT INSERTED.idImagen, INSERTED.idActividad
        VALUES (@idActividad, @imagen);
      `);

    res.status(201).json({
      message: "Imagen guardada correctamente.",
      data: result.recordset[0],
    });
  } catch (err) {
    console.error("❌ createImagenActividad:", err);
    res.status(500).json({ error: err.message });
  }
};

/* ======================================================
   Listar imágenes (opcional por actividad)
   GET /?idActividad=123
====================================================== */
export const listImagenesActividad = async (req, res) => {
  const { idActividad } = req.query;

  try {
    const pool = await poolPromise;

    const query = idActividad
      ? `
        SELECT idImagen, idActividad, imagen
        FROM dbo.imagen_actividad
        WHERE idActividad = @idActividad
        ORDER BY idImagen DESC;
      `
      : `
        SELECT idImagen, idActividad, imagen
        FROM dbo.imagen_actividad
        ORDER BY idImagen DESC;
      `;

    const request = pool.request();
    if (idActividad) request.input("idActividad", sql.Int, Number(idActividad));

    const result = await request.query(query);

    // Convertir Buffer -> base64 para el front
    const rows = (result.recordset || []).map((r) => ({
      idImagen: r.idImagen,
      idActividad: r.idActividad,
      imagenBase64: r.imagen ? Buffer.from(r.imagen).toString("base64") : null,
    }));

    res.json(rows);
  } catch (err) {
    console.error("❌ listImagenesActividad:", err);
    res.status(500).json({ error: err.message });
  }
};

/* ======================================================
   Obtener una imagen por idImagen
====================================================== */
export const getImagenActividad = async (req, res) => {
  const { idImagen } = req.params;

  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("idImagen", sql.Int, idImagen)
      .query(`
        SELECT idImagen, idActividad, imagen
        FROM dbo.imagen_actividad
        WHERE idImagen = @idImagen;
      `);

    if (!result.recordset.length) {
      return res.status(404).json({ message: "Imagen no encontrada." });
    }

    const row = result.recordset[0];
    res.json({
      idImagen: row.idImagen,
      idActividad: row.idActividad,
      imagenBase64: row.imagen ? Buffer.from(row.imagen).toString("base64") : null,
    });
  } catch (err) {
    console.error("❌ getImagenActividad:", err);
    res.status(500).json({ error: err.message });
  }
};

/* ======================================================
   Actualizar imagen y/o idActividad
   Body: { idActividad?: number, imagenBase64?: string }
====================================================== */
export const updateImagenActividad = async (req, res) => {
  const { idImagen } = req.params;
  const { idActividad, imagenBase64 } = req.body;

  try {
    const pool = await poolPromise;

    // Si viene idActividad nuevo, validar que exista
    if (idActividad) {
      const existsAct = await pool
        .request()
        .input("idActividad", sql.Int, idActividad)
        .query(
          `SELECT 1 FROM dbo.actividad WHERE idActividad = @idActividad;`
        );
      if (!existsAct.recordset.length) {
        return res.status(400).json({ message: "La actividad no existe." });
      }
    }

    // Hacer UPDATE con COALESCE
    const result = await pool
      .request()
      .input("idImagen", sql.Int, idImagen)
      .input("idActividad", sql.Int, idActividad ?? null)
      .input(
        "imagen",
        sql.VarBinary(sql.MAX),
        imagenBase64 ? Buffer.from(imagenBase64, "base64") : null
      )
      .query(`
        UPDATE dbo.imagen_actividad
        SET
          idActividad = COALESCE(@idActividad, idActividad),
          imagen      = COALESCE(@imagen, imagen)
        WHERE idImagen = @idImagen;

        SELECT idImagen, idActividad, imagen
        FROM dbo.imagen_actividad
        WHERE idImagen = @idImagen;
      `);

    if (!result.recordset.length) {
      return res.status(404).json({ message: "Imagen no encontrada." });
    }

    const row = result.recordset[0];
    res.json({
      message: "Imagen actualizada correctamente.",
      data: {
        idImagen: row.idImagen,
        idActividad: row.idActividad,
        imagenBase64: row.imagen ? Buffer.from(row.imagen).toString("base64") : null,
      },
    });
  } catch (err) {
    console.error("❌ updateImagenActividad:", err);
    res.status(500).json({ error: err.message });
  }
};

/* ======================================================
   Eliminar imagen
====================================================== */
export const deleteImagenActividad = async (req, res) => {
  const { idImagen } = req.params;

  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("idImagen", sql.Int, idImagen)
      .query(`DELETE FROM dbo.imagen_actividad WHERE idImagen = @idImagen;`);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: "Imagen no encontrada." });
    }

    res.json({ message: "Imagen eliminada correctamente." });
  } catch (err) {
    console.error("❌ deleteImagenActividad:", err);
    res.status(500).json({ error: err.message });
  }
};
