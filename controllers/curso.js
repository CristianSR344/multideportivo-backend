// controllers/curso.js
import poolPromise from "../connect.js";
import sql from "mssql";

/* ======================================================
   Crear curso
====================================================== */
export const createCurso = async (req, res) => {
    const { idUsuario, idActividad, nombre, horario, estatus } = req.body;

    if (!idUsuario || !idActividad || !nombre) {
        return res
            .status(400)
            .json({ message: "idUsuario, idActividad y nombre son requeridos." });
    }

    try {
        const pool = await poolPromise;

        // Validar que el usuario exista
        const user = await pool
            .request()
            .input("idUsuario", sql.Int, idUsuario)
            .query(`SELECT 1 FROM dbo.usuarios WHERE id_usuario = @idUsuario;`);
        if (!user.recordset.length)
            return res.status(400).json({ message: "El usuario no existe." });

        // Validar que la actividad exista
        const act = await pool
            .request()
            .input("idActividad", sql.Int, idActividad)
            .query(`SELECT 1 FROM dbo.actividad WHERE idActividad = @idActividad;`);
        if (!act.recordset.length)
            return res.status(400).json({ message: "La actividad no existe." });

        const result = await pool
            .request()
            .input("idUsuario", sql.Int, idUsuario)
            .input("idActividad", sql.Int, idActividad)
            .input("nombre", sql.VarChar(100), nombre)
            .input("horario", sql.DateTime2, horario ? new Date(horario) : null)
            .input("estatus", sql.Int, estatus ?? 1)
            .query(`
        INSERT INTO dbo.curso (idUsuario, idActividad, nombre, horario, estatus)
        OUTPUT INSERTED.idCurso, INSERTED.idUsuario, INSERTED.idActividad, INSERTED.nombre, INSERTED.horario, INSERTED.estatus
        VALUES (@idUsuario, @idActividad, @nombre, @horario, @estatus);
      `);

        res.status(201).json({
            message: "Curso creado correctamente.",
            data: result.recordset[0],
        });
    } catch (err) {
        console.error("❌ createCurso:", err);
        res.status(500).json({ error: err.message });
    }
};

/* ======================================================
   Listar cursos
====================================================== */
export const listCursos = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
      SELECT 
        c.idCurso,
        c.idUsuario,
        u.nombre AS nombreUsuario,
        c.idActividad,
        a.nombre AS nombreActividad,
        c.nombre AS nombreCurso,
        c.horario,
        c.estatus
      FROM dbo.curso c
      LEFT JOIN dbo.usuarios u ON u.id_usuario = c.idUsuario
      LEFT JOIN dbo.actividad a ON a.idActividad = c.idActividad
      ORDER BY c.idCurso DESC;
    `);

        res.json(result.recordset);
    } catch (err) {
        console.error("❌ listCursos:", err);
        res.status(500).json({ error: err.message });
    }
};

/* ======================================================
   Obtener curso por ID
====================================================== */
export const getCurso = async (req, res) => {
    const { idCurso } = req.params;

    try {
        const pool = await poolPromise;
        const result = await pool
            .request()
            .input("idCurso", sql.Int, idCurso)
            .query(`
        SELECT 
          c.idCurso,
          c.idUsuario,
          u.nombre AS nombreUsuario,
          c.idActividad,
          a.nombre AS nombreActividad,
          c.nombre AS nombreCurso,
          c.horario,
          c.estatus
        FROM dbo.curso c
        LEFT JOIN dbo.usuarios u ON u.id_usuario = c.idUsuario
        LEFT JOIN dbo.actividad a ON a.idActividad = c.idActividad
        WHERE c.idCurso = @idCurso;
      `);

        if (!result.recordset.length)
            return res.status(404).json({ message: "Curso no encontrado." });

        res.json(result.recordset[0]);
    } catch (err) {
        console.error("❌ getCurso:", err);
        res.status(500).json({ error: err.message });
    }
};

/* ======================================================
   Actualizar curso
====================================================== */
export const updateCurso = async (req, res) => {
    const { idCurso } = req.params;
    const { idUsuario, idActividad, nombre, horario, estatus } = req.body;

    try {
        const pool = await poolPromise;

        const result = await pool
            .request()
            .input("idCurso", sql.Int, idCurso)
            .input("idUsuario", sql.Int, idUsuario ?? null)
            .input("idActividad", sql.Int, idActividad ?? null)
            .input("nombre", sql.VarChar(100), nombre ?? null)
            .input("horario", sql.DateTime2, horario ? new Date(horario) : null)
            .input("estatus", sql.Int, estatus ?? null)
            .query(`
        UPDATE dbo.curso
        SET 
          idUsuario = COALESCE(@idUsuario, idUsuario),
          idActividad = COALESCE(@idActividad, idActividad),
          nombre = COALESCE(@nombre, nombre),
          horario = COALESCE(@horario, horario),
          estatus = COALESCE(@estatus, estatus)
        WHERE idCurso = @idCurso;

        SELECT * FROM dbo.curso WHERE idCurso = @idCurso;
      `);

        if (!result.recordset.length)
            return res.status(404).json({ message: "Curso no encontrado." });

        res.json({
            message: "Curso actualizado correctamente.",
            data: result.recordset[0],
        });
    } catch (err) {
        console.error("❌ updateCurso:", err);
        res.status(500).json({ error: err.message });
    }
};

/* ======================================================
   Eliminar curso
====================================================== */
export const deleteCurso = async (req, res) => {
    const { idCurso } = req.params;

    try {
        const pool = await poolPromise;
        const result = await pool
            .request()
            .input("idCurso", sql.Int, idCurso)
            .query(`DELETE FROM dbo.curso WHERE idCurso = @idCurso;`);

        if (result.rowsAffected[0] === 0)
            return res.status(404).json({ message: "Curso no encontrado." });

        res.json({ message: "Curso eliminado correctamente." });
    } catch (err) {
        console.error("❌ deleteCurso:", err);
        res.status(500).json({ error: err.message });
    }
};
