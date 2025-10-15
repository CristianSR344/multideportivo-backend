import poolPromise from "../connect.js";
import sql from "mssql";

/* ============================
   CREAR SOCIO
=============================== */
export const crearSocio = async (req, res) => {
    const {
        idSocio,
        idUsuario,
        idMembresia,
    } = req.body;

    try {
        const pool = await poolPromise;

        // ¿Existe por ID o correo?
        const exists = await pool.request()
            .input("idSocio", sql.Int, idSocio)
            .query(`
        SELECT 1 FROM dbo.socios
        WHERE idSocio = @idSocio
      `);

        if (exists.recordset.length) {
            return res.status(409).json({ message: "El socio ya existe" });
        }


        // INSERT 
        await pool.request()
            .input("idSocio", sql.Int, idSocio)
            .input("idUsuario", sql.Int, idUsuario)
            .input("idMembresia", sql.Int, idMembresia)
            .query(`
        INSERT INTO dbo.socios
        (idSocio, idUsuario, idMembresia)
        VALUES
        (@idSocio, @idUsuario, @idMembresia);
      `);

        return res.status(201).json({ message: "Usuario creado correctamente" });
    } catch (err) {
        console.error("❌ Error en register:", err);
        return res.status(500).json({ error: err.message });
    }
};

/* ============================
   GET SOCIO
=============================== */
export const getSocios = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`SELECT idSocio, idUsuario, idMembresia FROM dbo.socios`);
        res.json(result.recordset);
    } catch (err) {
        console.error("❌ Error al obtener socios:", err);
        res.status(500).json({ message: "Error al obtener socios" });
    }
};
