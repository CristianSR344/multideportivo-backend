// controllers/accidente.js
import poolPromise from "../connect.js";
import sql from "mssql";

/* ======================================================
   Crear accidente
====================================================== */
export const createAccidente = async (req, res) => {
    const { idUsuario, idCurso, descripcion, fecha, peso, altura } = req.body;

    if (!idUsuario || !idCurso) {
        return res.status(400).json({ message: "idUsuario e idCurso son requeridos." });
    }

    try {
        const pool = await poolPromise;

        // Validaciones simples (opcional, quítalas si no las necesitas)
        const user = await pool.request()
            .input("idUsuario", sql.Int, idUsuario)
            .query(`SELECT 1 FROM dbo.usuarios WHERE id_usuario = @idUsuario;`);
        if (!user.recordset.length) {
            return res.status(400).json({ message: "El usuario no existe." });
        }

        const curso = await pool.request()
            .input("idCurso", sql.Int, idCurso)
            .query(`SELECT 1 FROM dbo.curso WHERE idCurso = @idCurso;`);
        if (!curso.recordset.length) {
            return res.status(400).json({ message: "El curso no existe." });
        }

        // Insert
        const result = await pool.request()
            .input("idUsuario", sql.Int, idUsuario)
            .input("idCurso", sql.Int, idCurso)
            .input("descripcion", sql.NVarChar(sql.MAX), descripcion ?? null)
            .input("fecha", sql.Date, fecha ? new Date(fecha) : null)
            .input("peso", sql.Decimal(10, 2), peso ?? null)
            .input("altura", sql.Decimal(10, 2), altura ?? null)
            .query(`
        INSERT INTO dbo.accidente (idUsuario, idCurso, descripcion, fecha, peso, altura)
        OUTPUT INSERTED.*
        VALUES (@idUsuario, @idCurso, @descripcion, @fecha, @peso, @altura);
      `);

        res.status(201).json({
            message: "Accidente registrado correctamente.",
            data: result.recordset[0],
        });
    } catch (err) {
        console.error("❌ createAccidente:", err);
        res.status(500).json({ error: err.message });
    }
};

/* ======================================================
   Listar accidentes (con nombres de usuario y curso)
====================================================== */
export const listAccidentes = async (_req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
      SELECT 
        a.idAccidente,
        a.idUsuario,
        u.nombre     AS nombreUsuario,
        a.idCurso,
        c.nombre     AS nombreCurso,
        a.descripcion,
        a.fecha,
        a.peso,
        a.altura
      FROM dbo.accidente a
      LEFT JOIN dbo.usuarios u ON u.id_usuario = a.idUsuario
      LEFT JOIN dbo.curso c     ON c.idCurso     = a.idCurso
      ORDER BY a.fecha DESC, a.idAccidente DESC;
    `);

        res.json(result.recordset);
    } catch (err) {
        console.error("❌ listAccidentes:", err);
        res.status(500).json({ error: err.message });
    }
};

/* ======================================================
   Obtener accidente por ID
====================================================== */
export const getAccidente = async (req, res) => {
    const { idAccidente } = req.params;

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input("idAccidente", sql.Int, idAccidente)
            .query(`
        SELECT 
          a.idAccidente,
          a.idUsuario,
          u.nombre AS nombreUsuario,
          a.idCurso,
          c.nombre AS nombreCurso,
          a.descripcion,
          a.fecha,
          a.peso,
          a.altura
        FROM dbo.accidente a
        LEFT JOIN dbo.usuarios u ON u.id_usuario = a.idUsuario
        LEFT JOIN dbo.curso c     ON c.idCurso     = a.idCurso
        WHERE a.idAccidente = @idAccidente;
      `);

        if (!result.recordset.length) {
            return res.status(404).json({ message: "Accidente no encontrado." });
        }
        res.json(result.recordset[0]);
    } catch (err) {
        console.error("❌ getAccidente:", err);
        res.status(500).json({ error: err.message });
    }
};

/* ======================================================
   Actualizar accidente
====================================================== */
export const updateAccidente = async (req, res) => {
    const { idAccidente } = req.params;
    const { idUsuario, idCurso, descripcion, fecha, peso, altura } = req.body;

    try {
        const pool = await poolPromise;

        const result = await pool.request()
            .input("idAccidente", sql.Int, idAccidente)
            .input("idUsuario", sql.Int, idUsuario ?? null)
            .input("idCurso", sql.Int, idCurso ?? null)
            .input("descripcion", sql.NVarChar(sql.MAX), descripcion ?? null)
            .input("fecha", sql.Date, fecha ? new Date(fecha) : null)
            .input("peso", sql.Decimal(10, 2), peso ?? null)
            .input("altura", sql.Decimal(10, 2), altura ?? null)
            .query(`
        UPDATE dbo.accidente
        SET
          idUsuario   = COALESCE(@idUsuario, idUsuario),
          idCurso     = COALESCE(@idCurso, idCurso),
          descripcion = COALESCE(@descripcion, descripcion),
          fecha       = COALESCE(@fecha, fecha),
          peso        = COALESCE(@peso, peso),
          altura      = COALESCE(@altura, altura)
        WHERE idAccidente = @idAccidente;

        SELECT * FROM dbo.accidente WHERE idAccidente = @idAccidente;
      `);

        if (!result.recordset.length) {
            return res.status(404).json({ message: "Accidente no encontrado." });
        }

        res.json({
            message: "Accidente actualizado correctamente.",
            data: result.recordset[0],
        });
    } catch (err) {
        console.error("❌ updateAccidente:", err);
        res.status(500).json({ error: err.message });
    }
};

/* ======================================================
   Eliminar accidente
====================================================== */
export const deleteAccidente = async (req, res) => {
    const { idAccidente } = req.params;

    try {
        const pool = await poolPromise;
        const r = await pool.request()
            .input("idAccidente", sql.Int, idAccidente)
            .query(`DELETE FROM dbo.accidente WHERE idAccidente = @idAccidente;`);

        if (r.rowsAffected[0] === 0) {
            return res.status(404).json({ message: "Accidente no encontrado." });
        }

        res.json({ message: "Accidente eliminado correctamente." });
    } catch (err) {
        console.error("❌ deleteAccidente:", err);
        res.status(500).json({ error: err.message });
    }
};
