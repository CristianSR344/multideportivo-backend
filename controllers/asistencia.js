// controllers/asistencia.js
import poolPromise from "../connect.js";
import sql from "mssql";

/* ======================================================
   Crear asistencia
   body: { idSocios, asistio? }
====================================================== */
export const createAsistencia = async (req, res) => {
    const { idSocios, asistio } = req.body;

    if (!idSocios) {
        return res.status(400).json({ message: "idSocios es requerido." });
    }

    try {
        const pool = await poolPromise;

        // Validar socio existe (ajusta nombre de tabla/PK si difiere)
        const socio = await pool.request()
            .input("idSocios", sql.Int, idSocios)
            .query(`SELECT 1 FROM dbo.socios WHERE idSocio = @idSocios;`);
        if (!socio.recordset.length) {
            return res.status(400).json({ message: "El socio no existe." });
        }

        const result = await pool.request()
            .input("idSocios", sql.Int, idSocios)
            .input("asistio", sql.Int, typeof asistio === "number" ? asistio : 1)
            .query(`
        INSERT INTO dbo.asistencia (idSocios, asistio)
        OUTPUT INSERTED.idAsistencia, INSERTED.idSocios, INSERTED.asistio
        VALUES (@idSocios, @asistio);
      `);

        res.status(201).json({
            message: "Asistencia registrada correctamente.",
            data: result.recordset[0],
        });
    } catch (err) {
        console.error("❌ createAsistencia:", err);
        res.status(500).json({ error: err.message });
    }
};

/* ======================================================
   Listar asistencias (con datos del socio/usuario opcional)
====================================================== */
export const listAsistencias = async (_req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
      SELECT
        a.idAsistencia,
        a.idSocios,
        a.asistio,
        s.idUsuario,
        u.nombre AS nombreUsuario,
        u.apellidoP,
        u.apellidoM
      FROM dbo.asistencia a
      LEFT JOIN dbo.socios s ON s.idSocio = a.idSocios
      LEFT JOIN dbo.usuarios u ON u.id_usuario = s.idUsuario
      ORDER BY a.idAsistencia DESC;
    `);

        res.json(result.recordset);
    } catch (err) {
        console.error("❌ listAsistencias:", err);
        res.status(500).json({ error: err.message });
    }
};

/* ======================================================
   Obtener una asistencia por ID
====================================================== */
export const getAsistencia = async (req, res) => {
    const { idAsistencia } = req.params;

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input("idAsistencia", sql.Int, idAsistencia)
            .query(`
        SELECT 
          a.idAsistencia,
          a.idSocios,
          a.asistio,
          s.idUsuario,
          u.nombre AS nombreUsuario,
          u.apellidoP,
          u.apellidoM
        FROM dbo.asistencia a
        LEFT JOIN dbo.socios s ON s.idSocio = a.idSocios
        LEFT JOIN dbo.usuarios u ON u.id_usuario = s.idUsuario
        WHERE a.idAsistencia = @idAsistencia;
      `);

        if (!result.recordset.length)
            return res.status(404).json({ message: "Asistencia no encontrada." });

        res.json(result.recordset[0]);
    } catch (err) {
        console.error("❌ getAsistencia:", err);
        res.status(500).json({ error: err.message });
    }
};

/* ======================================================
   Listar por socio
   GET /api/asistencias/socio/:idSocios
====================================================== */
export const listAsistenciasBySocio = async (req, res) => {
    const { idSocios } = req.params;

    try {
        const pool = await poolPromise;

        const r = await pool.request()
            .input("idSocios", sql.Int, idSocios)
            .query(`
        SELECT idAsistencia, idSocios, asistio
        FROM dbo.asistencia
        WHERE idSocios = @idSocios
        ORDER BY idAsistencia DESC;
      `);

        res.json(r.recordset);
    } catch (err) {
        console.error("❌ listAsistenciasBySocio:", err);
        res.status(500).json({ error: err.message });
    }
};

/* ======================================================
   Actualizar asistencia
   body: { idSocios?, asistio? }
====================================================== */
export const updateAsistencia = async (req, res) => {
    const { idAsistencia } = req.params;
    const { idSocios, asistio } = req.body;

    try {
        const pool = await poolPromise;

        const result = await pool.request()
            .input("idAsistencia", sql.Int, idAsistencia)
            .input("idSocios", sql.Int, idSocios ?? null)
            .input("asistio", sql.Int, typeof asistio === "number" ? asistio : null)
            .query(`
        UPDATE dbo.asistencia
        SET
          idSocios = COALESCE(@idSocios, idSocios),
          asistio  = COALESCE(@asistio, asistio)
        WHERE idAsistencia = @idAsistencia;

        SELECT * FROM dbo.asistencia WHERE idAsistencia = @idAsistencia;
      `);

        if (!result.recordset.length)
            return res.status(404).json({ message: "Asistencia no encontrada." });

        res.json({
            message: "Asistencia actualizada correctamente.",
            data: result.recordset[0],
        });
    } catch (err) {
        console.error("❌ updateAsistencia:", err);
        res.status(500).json({ error: err.message });
    }
};

/* ======================================================
   Eliminar asistencia
====================================================== */
export const deleteAsistencia = async (req, res) => {
    const { idAsistencia } = req.params;

    try {
        const pool = await poolPromise;
        const r = await pool.request()
            .input("idAsistencia", sql.Int, idAsistencia)
            .query(`DELETE FROM dbo.asistencia WHERE idAsistencia = @idAsistencia;`);

        if (r.rowsAffected[0] === 0)
            return res.status(404).json({ message: "Asistencia no encontrada." });

        res.json({ message: "Asistencia eliminada correctamente." });
    } catch (err) {
        console.error("❌ deleteAsistencia:", err);
        res.status(500).json({ error: err.message });
    }
};

/* ======================================================
   Marcar asistencia rápida (toggle o set explícito)
   PATCH /api/asistencias/:idAsistencia/marcar
   body (opcional): { asistio: 0|1 }
====================================================== */
export const marcarAsistencia = async (req, res) => {
    const { idAsistencia } = req.params;
    const { asistio } = req.body;

    try {
        const pool = await poolPromise;

        // valor actual
        const cur = await pool.request()
            .input("idAsistencia", sql.Int, idAsistencia)
            .query(`SELECT asistio FROM dbo.asistencia WHERE idAsistencia = @idAsistencia;`);

        if (!cur.recordset.length)
            return res.status(404).json({ message: "Asistencia no encontrada." });

        const nuevo = (typeof asistio === "number")
            ? asistio
            : (cur.recordset[0].asistio ? 0 : 1);

        const r = await pool.request()
            .input("idAsistencia", sql.Int, idAsistencia)
            .input("asistio", sql.Int, nuevo)
            .query(`
        UPDATE dbo.asistencia SET asistio = @asistio WHERE idAsistencia = @idAsistencia;
        SELECT * FROM dbo.asistencia WHERE idAsistencia = @idAsistencia;
      `);

        res.json({
            message: "Asistencia actualizada.",
            data: r.recordset[0],
        });
    } catch (err) {
        console.error("❌ marcarAsistencia:", err);
        res.status(500).json({ error: err.message });
    }
};
