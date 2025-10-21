import poolPromise from "../connect.js";
import sql from "mssql";

/* =======================================================
   📤 Crear imagen asociada a un evento
   ======================================================= */
export const createImagenEvento = async (req, res) => {
  const { idEvento, imagen } = req.body;

  try {
    if (!idEvento || !imagen) {
      return res.status(400).json({ message: "Faltan datos: idEvento o imagen." });
    }

    const pool = await poolPromise;

    const result = await pool.request()
      .input("idEvento", sql.Int, idEvento)
      .input("imagen", sql.VarBinary(sql.MAX), Buffer.from(imagen, "base64"))
      .query(`
        INSERT INTO dbo.imagenes_eventos (idEvento, imagen)
        OUTPUT INSERTED.idImagen, INSERTED.idEvento
        VALUES (@idEvento, @imagen);
      `);

    res.status(201).json({
      message: "Imagen guardada correctamente",
      data: result.recordset[0],
    });
  } catch (err) {
    console.error("❌ Error al crear imagen:", err);
    res.status(500).json({ error: err.message });
  }
};

/* =======================================================
   📥 Obtener imágenes por evento
   ======================================================= */
export const getImagenesByEvento = async (req, res) => {
  const { idEvento } = req.params;

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input("idEvento", sql.Int, idEvento)
      .query(`
        SELECT idImagen, idEvento,
               CAST(N'' AS XML).value('xs:base64Binary(sql:column("imagen"))', 'VARCHAR(MAX)') AS imagenBase64
        FROM dbo.imagenes_eventos
        WHERE idEvento = @idEvento
      `);

    res.json(result.recordset);
  } catch (err) {
    console.error("❌ Error al obtener imágenes:", err);
    res.status(500).json({ error: err.message });
  }
};

/* =======================================================
   🗑️ Eliminar una imagen por id
   ======================================================= */
export const deleteImagen = async (req, res) => {
  const { idImagen } = req.params;

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input("idImagen", sql.Int, idImagen)
      .query(`
        DELETE FROM dbo.imagenes_eventos WHERE idImagen = @idImagen;
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: "Imagen no encontrada" });
    }

    res.json({ message: "Imagen eliminada correctamente" });
  } catch (err) {
    console.error("❌ Error al eliminar imagen:", err);
    res.status(500).json({ error: err.message });
  }
};
