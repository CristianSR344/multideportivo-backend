// controllers/actividad.js
import poolPromise from "../connect.js";
import sql from "mssql";

/* =======================================================
   Crear actividad
   Body: { id_usuario, nom_act, lugar, descripcion, cupo }
   ======================================================= */
export const createActividad = async (req, res) => {
  const { id_usuario, nom_act, lugar, descripcion, cupo } = req.body;

  if (!id_usuario) {
    return res.status(400).json({ message: "id_usuario es requerido" });
  }

  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input("id_usuario", sql.Int, id_usuario)
      .input("nom_act", sql.VarChar(200), nom_act ?? null)
      .input("lugar", sql.VarChar(200), lugar ?? null)
      .input("descripcion", sql.Text, descripcion ?? null) // SQL Server 'text'
      .input("cupo", sql.Int, cupo ?? null)
      .query(`
        INSERT INTO dbo.actividad (id_usuario, nom_act, lugar, descripcion, cupo)
        OUTPUT INSERTED.idactividad, INSERTED.id_usuario, INSERTED.nom_act, INSERTED.lugar, INSERTED.cupo
        VALUES (@id_usuario, @nom_act, @lugar, @descripcion, @cupo);
      `);

    res.status(201).json({ message: "Actividad creada", data: result.recordset[0] });
  } catch (err) {
    console.error("❌ createActividad:", err);
    res.status(500).json({ error: err.message });
  }
};

/* =======================================================
   Listar actividades (opcional filtro por id_usuario)
   GET /api/actividad?usuario=123
   ======================================================= */
export const getActividades = async (req, res) => {
  const idUsuario = req.query.usuario ? parseInt(req.query.usuario, 10) : null;

  try {
    const pool = await poolPromise;
    let result;

    if (idUsuario) {
      result = await pool.request()
        .input("id_usuario", sql.Int, idUsuario)
        .query(`
          SELECT idactividad, id_usuario, nom_act, lugar, descripcion, cupo
          FROM dbo.actividad
          WHERE id_usuario = @id_usuario
          ORDER BY idactividad DESC;
        `);
    } else {
      result = await pool.request().query(`
          SELECT idactividad, id_usuario, nom_act, lugar, descripcion, cupo
          FROM dbo.actividad
          ORDER BY idactividad DESC;
      `);
    }

    res.json(result.recordset);
  } catch (err) {
    console.error("❌ getActividades:", err);
    res.status(500).json({ error: err.message });
  }
};

/* =======================================================
   Obtener una actividad por id
   ======================================================= */
export const getActividadById = async (req, res) => {
  const { id } = req.params;

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input("id", sql.Int, id)
      .query(`
        SELECT idactividad, id_usuario, nom_act, lugar, descripcion, cupo
        FROM dbo.actividad
        WHERE idactividad = @id;
      `);

    if (!result.recordset.length) {
      return res.status(404).json({ message: "Actividad no encontrada" });
    }

    res.json(result.recordset[0]);
  } catch (err) {
    console.error("❌ getActividadById:", err);
    res.status(500).json({ error: err.message });
  }
};

/* =======================================================
   Actualizar (PUT completo o PATCH parcial)
   ======================================================= */
export const updateActividad = async (req, res) => {
  const { id } = req.params;
  const { id_usuario, nom_act, lugar, descripcion, cupo } = req.body;

  try {
    const pool = await poolPromise;

    // Usamos ISNULL para mantener valores existentes cuando vengan como null/undefined
    const result = await pool.request()
      .input("id", sql.Int, id)
      .input("id_usuario", sql.Int, id_usuario ?? null)
      .input("nom_act", sql.VarChar(200), nom_act ?? null)
      .input("lugar", sql.VarChar(200), lugar ?? null)
      .input("descripcion", sql.Text, descripcion ?? null)
      .input("cupo", sql.Int, cupo ?? null)
      .query(`
        UPDATE dbo.actividad
        SET
          id_usuario = COALESCE(@id_usuario, id_usuario),
          nom_act    = COALESCE(@nom_act, nom_act),
          lugar      = COALESCE(@lugar, lugar),
          descripcion= COALESCE(@descripcion, descripcion),
          cupo       = COALESCE(@cupo, cupo)
        WHERE idactividad = @id;

        SELECT idactividad, id_usuario, nom_act, lugar, descripcion, cupo
        FROM dbo.actividad
        WHERE idactividad = @id;
      `);

    if (!result.recordset.length) {
      return res.status(404).json({ message: "Actividad no encontrada" });
    }

    res.json({ message: "Actividad actualizada", data: result.recordset[0] });
  } catch (err) {
    console.error("❌ updateActividad:", err);
    res.status(500).json({ error: err.message });
  }
};

/* =======================================================
   Eliminar
   ======================================================= */
export const deleteActividad = async (req, res) => {
  const { id } = req.params;

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input("id", sql.Int, id)
      .query(`DELETE FROM dbo.actividad WHERE idactividad = @id;`);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: "Actividad no encontrada" });
    }

    res.json({ message: "Actividad eliminada" });
  } catch (err) {
    console.error("❌ deleteActividad:", err);
    res.status(500).json({ error: err.message });
  }
};
