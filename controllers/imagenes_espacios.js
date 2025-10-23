// controllers/imagenesEspacios.js
import poolPromise from "../connect.js";
import sql from "mssql";

/* ======================================================
   Crear una imagen asociada a un espacio
====================================================== */
export const createImagenEspacio = async (req, res) => {
    const { idEspacio, imagen } = req.body;

    if (!idEspacio || !imagen) {
        return res.status(400).json({ message: "idEspacio e imagen son requeridos" });
    }

    try {
        const pool = await poolPromise;

        // Validar que el espacio exista
        const exists = await pool.request()
            .input("idEspacio", sql.Int, idEspacio)
            .query(`SELECT 1 FROM dbo.espacios WHERE idEspacio = @idEspacio`);
        if (!exists.recordset.length) {
            return res.status(400).json({ message: "El espacio especificado no existe." });
        }

        const result = await pool.request()
            .input("idEspacio", sql.Int, idEspacio)
            .input("imagen", sql.VarBinary(sql.MAX), Buffer.from(imagen, "base64"))
            .query(`
        INSERT INTO dbo.Imagenes_Espacios (Espacio_idEspacio, Imagen)
        OUTPUT INSERTED.idImagenesEspacios, INSERTED.Espacio_idEspacio
        VALUES (@idEspacio, @imagen);
      `);

        res.status(201).json({
            message: "Imagen guardada correctamente.",
            data: result.recordset[0],
        });
    } catch (err) {
        console.error("❌ createImagenEspacio:", err);
        res.status(500).json({ error: err.message });
    }
};

/* ======================================================
   Listar imágenes de un espacio
====================================================== */
export const listImagenesPorEspacio = async (req, res) => {
    const { idEspacio } = req.params;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input("idEspacio", sql.Int, idEspacio)
            .query(`
        SELECT idImagenesEspacios, Imagen
        FROM dbo.Imagenes_Espacios
        WHERE Espacio_idEspacio = @idEspacio;
      `);

        // Convertir a base64 para respuesta
        const data = result.recordset.map((img) => ({
            idImagenesEspacios: img.idImagenesEspacios,
            imagen: img.Imagen ? img.Imagen.toString("base64") : null,
        }));

        res.json(data);
    } catch (err) {
        console.error("❌ listImagenesPorEspacio:", err);
        res.status(500).json({ error: err.message });
    }
};

/* ======================================================
   Obtener una imagen por ID
====================================================== */
export const getImagenById = async (req, res) => {
    const { idImagen } = req.params;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input("idImagen", sql.Int, idImagen)
            .query(`
        SELECT idImagenesEspacios, Espacio_idEspacio, Imagen
        FROM dbo.Imagenes_Espacios
        WHERE idImagenesEspacios = @idImagen;
      `);

        if (!result.recordset.length) {
            return res.status(404).json({ message: "Imagen no encontrada" });
        }

        const img = result.recordset[0];
        res.json({
            idImagenesEspacios: img.idImagenesEspacios,
            idEspacio: img.Espacio_idEspacio,
            imagen: img.Imagen ? img.Imagen.toString("base64") : null,
        });
    } catch (err) {
        console.error("❌ getImagenById:", err);
        res.status(500).json({ error: err.message });
    }
};

/* ======================================================
   Eliminar imagen
====================================================== */
export const deleteImagen = async (req, res) => {
    const { idImagen } = req.params;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input("idImagen", sql.Int, idImagen)
            .query(`DELETE FROM dbo.Imagenes_Espacios WHERE idImagenesEspacios = @idImagen;`);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: "Imagen no encontrada" });
        }

        res.json({ message: "Imagen eliminada correctamente" });
    } catch (err) {
        console.error("❌ deleteImagen:", err);
        res.status(500).json({ error: err.message });
    }
};
