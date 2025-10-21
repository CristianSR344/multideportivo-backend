// controllers/tipoPago.js
import poolPromise from "../connect.js";
import sql from "mssql";

/* =======================================================
   Crear tipo de pago
   ======================================================= */
export const createTipoPago = async (req, res) => {
  const { descripcion } = req.body;

  if (!descripcion) {
    return res.status(400).json({ message: "La descripción es requerida." });
  }

  try {
    const pool = await poolPromise;

    // Verificar si ya existe un tipo con la misma descripción
    const existe = await pool.request()
      .input("descripcion", sql.VarChar(100), descripcion)
      .query(`SELECT 1 FROM dbo.tipo_pago WHERE descripcion = @descripcion`);

    if (existe.recordset.length > 0) {
      return res.status(409).json({ message: "El tipo de pago ya existe." });
    }

    // Insertar nuevo registro
    const result = await pool.request()
      .input("descripcion", sql.VarChar(100), descripcion)
      .query(`
        INSERT INTO dbo.tipo_pago (descripcion)
        OUTPUT INSERTED.idTipo, INSERTED.descripcion
        VALUES (@descripcion);
      `);

    res.status(201).json({
      message: "Tipo de pago creado correctamente.",
      data: result.recordset[0],
    });
  } catch (err) {
    console.error("❌ Error en createTipoPago:", err);
    res.status(500).json({ error: err.message });
  }
};

/* =======================================================
   Obtener todos los tipos de pago
   ======================================================= */
export const getTiposPago = async (_req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT idTipo, descripcion FROM dbo.tipo_pago ORDER BY idTipo ASC;
    `);

    res.json(result.recordset);
  } catch (err) {
    console.error("❌ Error en getTiposPago:", err);
    res.status(500).json({ error: err.message });
  }
};

/* =======================================================
   Actualizar tipo de pago
   ======================================================= */
export const updateTipoPago = async (req, res) => {
  const { idTipo } = req.params;
  const { descripcion } = req.body;

  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input("idTipo", sql.Int, idTipo)
      .input("descripcion", sql.VarChar(100), descripcion)
      .query(`
        UPDATE dbo.tipo_pago
        SET descripcion = @descripcion
        WHERE idTipo = @idTipo;

        SELECT idTipo, descripcion FROM dbo.tipo_pago WHERE idTipo = @idTipo;
      `);

    if (!result.recordset.length) {
      return res.status(404).json({ message: "Tipo de pago no encontrado." });
    }

    res.json({
      message: "Tipo de pago actualizado correctamente.",
      data: result.recordset[0],
    });
  } catch (err) {
    console.error("❌ Error en updateTipoPago:", err);
    res.status(500).json({ error: err.message });
  }
};

/* =======================================================
   Eliminar tipo de pago
   ======================================================= */
export const deleteTipoPago = async (req, res) => {
  const { idTipo } = req.params;

  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input("idTipo", sql.Int, idTipo)
      .query(`DELETE FROM dbo.tipo_pago WHERE idTipo = @idTipo;`);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: "Tipo de pago no encontrado." });
    }

    res.json({ message: "Tipo de pago eliminado correctamente." });
  } catch (err) {
    console.error("❌ Error en deleteTipoPago:", err);
    res.status(500).json({ error: err.message });
  }
};
