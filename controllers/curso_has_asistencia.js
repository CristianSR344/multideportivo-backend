// controllers/cursoAsistencia.js
import poolPromise from "../connect.js";
import sql from "mssql";

/* ======================================================
   Crear relación curso-asistencia
====================================================== */
export const createCursoAsistencia = async (req, res) => {
    const { idCurso, idAsistencia } = req.body;

    if (!idCurso || !idAsistencia) {
        return res.status(400).json({ message: "idCurso e idAsistencia son requeridos." });
    }

    try {
        const pool = await poolPromise;

        // Verificar que el curso exista
        const curso = await pool.request()
            .input("idCurso", sql.Int, idCurso)
            .query(`SELECT 1 FROM dbo.curso WHERE idCurso = @idCurso;`);
        if (!curso.recordset.length) {
            return res.status(400).json({ message: "El curso no existe." });
        }

        // Verificar que la asistencia exista
        const asistencia = await pool.request()
            .input("idAsistencia", sql.Int, idAsistencia)
            .query(`SELECT 1 FROM dbo.asistencia WHERE idAsistencia = @idAsistencia;`);
        if (!asistencia.recordset.length) {
            return res.status(400).json({ message: "La asistencia no existe." });
        }

        // Insertar relación
        const result = await pool.request()
            .input("idCurso", sql.Int, idCurso)
            .input("idAsistencia", sql.Int, idAsistencia)
            .query(`
        INSERT INTO dbo.curso_asistencia (idCurso, idAsistencia)
        OUTPUT INSERTED.idCurso, INSERTED.idAsistencia
        VALUES (@idCurso, @idAsistencia);
      `);

        res.status(201).json({
            message: "Relación curso-asistencia creada correctamente.",
            data: result.recordset[0],
        });
    } catch (err) {
        console.error("❌ createCursoAsistencia:", err);
        res.status(500).json({ error: err.message });
    }
};

/* ======================================================
   Obtener todas las relaciones
====================================================== */
export const listCursoAsistencia = async (_req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
      SELECT 
        ca.idCurso,
        c.nombre AS nombreCurso,
        ca.idAsistencia,
        a.idSocios,
        a.asistio
      FROM dbo.curso_asistencia ca
      LEFT JOIN dbo.curso c ON c.idCurso = ca.idCurso
      LEFT JOIN dbo.asistencia a ON a.idAsistencia = ca.idAsistencia
      ORDER BY ca.idCurso DESC, ca.idAsistencia DESC;
    `);

        res.json(result.recordset);
    } catch (err) {
        console.error("❌ listCursoAsistencia:", err);
        res.status(500).json({ error: err.message });
    }
};

/* ======================================================
   Obtener asistencias de un curso
   GET /api/curso_asistencia/curso/:idCurso
====================================================== */
export const getAsistenciasByCurso = async (req, res) => {
    const { idCurso } = req.params;

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input("idCurso", sql.Int, idCurso)
            .query(`
        SELECT 
          ca.idCurso,
          ca.idAsistencia,
          a.idSocios,
          a.asistio
        FROM dbo.curso_asistencia ca
        INNER JOIN dbo.asistencia a ON a.idAsistencia = ca.idAsistencia
        WHERE ca.idCurso = @idCurso;
      `);

        res.json(result.recordset);
    } catch (err) {
        console.error("❌ getAsistenciasByCurso:", err);
        res.status(500).json({ error: err.message });
    }
};

/* ======================================================
   Obtener cursos de una asistencia
   GET /api/curso_asistencia/asistencia/:idAsistencia
====================================================== */
export const getCursosByAsistencia = async (req, res) => {
    const { idAsistencia } = req.params;

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input("idAsistencia", sql.Int, idAsistencia)
            .query(`
        SELECT 
          ca.idAsistencia,
          ca.idCurso,
          c.nombre AS nombreCurso
        FROM dbo.curso_asistencia ca
        INNER JOIN dbo.curso c ON c.idCurso = ca.idCurso
        WHERE ca.idAsistencia = @idAsistencia;
      `);

        res.json(result.recordset);
    } catch (err) {
        console.error("❌ getCursosByAsistencia:", err);
        res.status(500).json({ error: err.message });
    }
};

/* ======================================================
   Eliminar una relación curso-asistencia
====================================================== */
export const deleteCursoAsistencia = async (req, res) => {
    const { idCurso, idAsistencia } = req.params;

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input("idCurso", sql.Int, idCurso)
            .input("idAsistencia", sql.Int, idAsistencia)
            .query(`
        DELETE FROM dbo.curso_asistencia
        WHERE idCurso = @idCurso AND idAsistencia = @idAsistencia;
      `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: "Relación no encontrada." });
        }

        res.json({ message: "Relación eliminada correctamente." });
    } catch (err) {
        console.error("❌ deleteCursoAsistencia:", err);
        res.status(500).json({ error: err.message });
    }
};
