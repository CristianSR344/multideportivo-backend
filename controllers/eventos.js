// controllers/eventos.js
import poolPromise from "../connect.js";
import sql from "mssql";

const TABLE = "dbo.eventos";
const PK = "idEvento";

/**
 * GET /api/eventos
 * Query params:
 *  - q: filtro por nombre del evento (LIKE)
 *  - userId: filtrar por id_usuario (solo admin puede usarlo libremente)
 *  - from, to: rango de fechas (fechaInicio BETWEEN from AND to)
 *  - page, pageSize
 */
export const listEventos = async (req, res) => {
    const { q = "", userId, from, to, page = 1, pageSize = 20 } = req.query;
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const sizeNum = Math.min(Math.max(parseInt(pageSize, 10) || 20, 1), 100);

    const isAdmin = [1, 3].includes(req.user?.rol);
    const requesterId = req.user?.sub;

    try {
        const pool = await poolPromise;

        const requestBase = pool.request()
            .input("q", sql.VarChar(200), `%${q}%`)
            .input("from", sql.Date, from ? new Date(from) : null)
            .input("to", sql.Date, to ? new Date(to) : null)
            .input("userId", sql.Int, userId ? Number(userId) : null)
            .input("requesterId", sql.Int, requesterId || null)
            .input("isAdmin", sql.Bit, isAdmin ? 1 : 0);

        const where = `
      WHERE
        (@q = '%%' OR nomEvento LIKE @q)
        AND (@from IS NULL OR fechaInicio >= @from)
        AND (@to   IS NULL OR fechaTermino <= @to)
        AND (
              @isAdmin = 1
              OR id_usuario = @requesterId
              OR (@userId IS NOT NULL AND @isAdmin = 1)
            )
        AND (@userId IS NULL OR id_usuario = @userId)
    `;

        const totalRs = await requestBase.query(`
      SELECT COUNT(*) AS total
      FROM ${TABLE}
      ${where}
    `);

        const total = totalRs.recordset[0].total;

        const rows = await requestBase
            .input("offset", sql.Int, (pageNum - 1) * sizeNum)
            .input("limit", sql.Int, sizeNum)
            .query(`
        SELECT ${PK}, nomEvento, descripcion, fechaInicio, fechaTermino, id_usuario
        FROM ${TABLE}
        ${where}
        ORDER BY ${PK} DESC
        OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
      `);

        res.json({ data: rows.recordset, page: pageNum, pageSize: sizeNum, total });
    } catch (err) {
        console.error("listEventos error:", err);
        res.status(500).json({ message: "Error al listar eventos", error: err.message });
    }
};

// ✅ Obtener eventos
export const getEventos = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`SELECT ${PK}, nomEvento, descripcion, fechaInicio, fechaTermino, id_usuario FROM ${TABLE}`);
    res.json(result.recordset);
  } catch (err) {
    console.error("❌ Error al obtener roles:", err);
    res.status(500).json({ message: "Error al obtener roles" });
  }
};

/**
 * GET /api/eventos/:id
 */
export const getEvento = async (req, res) => {
    const { id } = req.params;
    const isAdmin = req.user?.rol === 1;
    const requesterId = req.user?.sub;

    try {
        const pool = await poolPromise;
        const r = await pool.request()
            .input("id", sql.Int, id)
            .input("requesterId", sql.Int, requesterId || null)
            .input("isAdmin", sql.Bit, isAdmin ? 1 : 0)
            .query(`
        SELECT ${PK}, nomEvento, descripcion, fechaInicio, fechaTermino, id_usuario
        FROM ${TABLE}
        WHERE ${PK} = @id
          AND (@isAdmin = 1 OR id_usuario = @requesterId)
      `);

        if (r.recordset.length === 0) return res.status(404).json({ message: "Evento no encontrado" });
        res.json(r.recordset[0]);
    } catch (err) {
        console.error("getEvento error:", err);
        res.status(500).json({ message: "Error al obtener evento", error: err.message });
    }
};

/**
 * POST /api/eventos
 * body: { id_usuario?, nomEvento, descripcion, fechaInicio, fechaTermino }
 * - si no es admin, id_usuario se fuerza a req.user.sub
 * - valida fechas
 */
export const createEvento = async (req, res) => {
    const isAdmin = req.user?.rol === 1;
    const requesterId = req.user?.sub;

    let {
        id_usuario,
        nomEvento,
        descripcion,
        fechaInicio,
        fechaTermino,
    } = req.body;

    // res.json({ message: req.body });
    // Forzar dueño para no admin
    if (!isAdmin) id_usuario = requesterId;

    if (!id_usuario) {
        return res.status(400).json({ message: "id_usuario es requerido" });
    }
    if (!nomEvento || !nomEvento.trim()) {
        return res.status(400).json({ message: "nomEvento es requerido" });
    }

    const dIni = fechaInicio ? new Date(fechaInicio) : null;
    const dFin = fechaTermino ? new Date(fechaTermino) : null;
    if (dIni && dFin && dFin < dIni) {
        return res.status(400).json({ message: "fechaTermino no puede ser menor a fechaInicio" });
    }

    try {
        const pool = await poolPromise;
        const insert = await pool.request()
            .input("id_usuario", sql.Int, id_usuario)
            .input("nomEvento", sql.VarChar(200), nomEvento)
            .input("descripcion", sql.NVarChar(sql.MAX), descripcion ?? null)
            .input("fechaInicio", sql.Date, dIni)
            .input("fechaTermino", sql.Date, dFin)
            .query(`
        INSERT INTO ${TABLE} (nomEvento, descripcion, fechaInicio, fechaTermino,id_usuario)
        OUTPUT INSERTED.${PK}
        VALUES (@nomEvento, @descripcion, @fechaInicio, @fechaTermino,@id_usuario)
      `);

        const newId = insert.recordset[0][PK];
        res.status(201).json({ message: "Evento creado", id: newId });
    } catch (err) {
        console.error("createEvento error:", err);
        res.status(500).json({ message: "Error al crear evento", error: err.message });
    }
};

/**
 * PUT /api/eventos/:id
 * - Solo admin o dueño puede modificar
 */
export const updateEvento = async (req, res) => {
    const { id } = req.params;
    const isAdmin = req.user?.rol === 1;
    const requesterId = req.user?.sub;

    const {
        nomEvento,
        descripcion,
        fechaInicio,
        fechaTermino,
    } = req.body;

    const dIni = fechaInicio ? new Date(fechaInicio) : null;
    const dFin = fechaTermino ? new Date(fechaTermino) : null;
    if (dIni && dFin && dFin < dIni) {
        return res.status(400).json({ message: "fechaTermino no puede ser menor a fechaInicio" });
    }

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input("id", sql.Int, id)
            .input("nomEvento", sql.VarChar(200), nomEvento ?? null)
            .input("descripcion", sql.NVarChar(sql.MAX), descripcion ?? null)
            .input("fechaInicio", sql.Date, dIni)
            .input("fechaTermino", sql.Date, dFin)
            .input("requesterId", sql.Int, requesterId || null)
            .input("isAdmin", sql.Bit, isAdmin ? 1 : 0)
            .query(`
        UPDATE E
        SET
          nomEvento = COALESCE(@nomEvento, nomEvento),
          descripcion = COALESCE(@descripcion, descripcion),
          fechaInicio = COALESCE(@fechaInicio, fechaInicio),
          fechaTermino = COALESCE(@fechaTermino, fechaTermino)
        FROM ${TABLE} AS E
        WHERE E.${PK} = @id;

        SELECT @@ROWCOUNT AS affected;
      `);

        if (result.recordset?.[0]?.affected === 0) {
            return res.status(404).json({ message: "No encontrado o sin permisos" });
        }
        res.json({ message: "Evento actualizado" });
    } catch (err) {
        console.error("updateEvento error:", err);
        res.status(500).json({ message: "Error al actualizar evento", error: err.message });
    }
};

/**
 * DELETE /api/eventos/:id
 * - Solo admin o dueño
 */
export const deleteEvento = async (req, res) => {
    const { id } = req.params;
    const isAdmin = req.user?.rol === 1;
    const requesterId = req.user?.sub;

    try {
        const pool = await poolPromise;
        const del = await pool.request()
            .input("id", sql.Int, id)
            .input("requesterId", sql.Int, requesterId || null)
            .input("isAdmin", sql.Bit, isAdmin ? 1 : 0)
            .query(`
        DELETE FROM ${TABLE}
        WHERE ${PK} = @id
          AND (@isAdmin = 1 OR id_usuario = @requesterId);

        SELECT @@ROWCOUNT AS affected;
      `);

        if (del.recordset?.[0]?.affected === 0) {
            return res.status(404).json({ message: "No encontrado o sin permisos" });
        }
        res.json({ message: "Evento eliminado" });
    } catch (err) {
        console.error("deleteEvento error:", err);
        res.status(500).json({ message: "Error al eliminar evento", error: err.message });
    }
};
