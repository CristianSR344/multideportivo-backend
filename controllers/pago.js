import poolPromise from "../connect.js";
import sql from "mssql";

/* ======================================================
   Crear pago
====================================================== */
export const createPago = async (req, res) => {
  const { tipoPago, concepto, liquidado, fecha, total } = req.body;

  if (!tipoPago || !concepto || !fecha || total == null) {
    return res.status(400).json({ message: "tipoPago, concepto, fecha y total son requeridos." });
  }

  try {
    const pool = await poolPromise;

    // Validar que el tipo de pago exista
    const tipoExiste = await pool.request()
      .input("idTipo", sql.Int, tipoPago)
      .query(`SELECT 1 FROM dbo.tipo_pago WHERE idTipo = @idTipo`);
    if (!tipoExiste.recordset.length) {
      return res.status(400).json({ message: "tipoPago no válido." });
    }

    const result = await pool.request()
      .input("tipoPago", sql.Int, tipoPago)
      .input("concepto", sql.VarChar(200), concepto)
      .input("liquidado", sql.Decimal(10,2), liquidado ?? 0)
      .input("fecha", sql.Date, new Date(fecha))
      .input("total", sql.Decimal(10,2), total)
      .query(`
        INSERT INTO dbo.pagos (tipoPago, concepto, liquidado, fecha, total)
        OUTPUT INSERTED.idPago, INSERTED.tipoPago, INSERTED.concepto, INSERTED.liquidado, INSERTED.fecha, INSERTED.total
        VALUES (@tipoPago, @concepto, @liquidado, @fecha, @total);
      `);

    res.status(201).json({
      message: "Pago registrado correctamente.",
      data: result.recordset[0],
    });
  } catch (err) {
    console.error("❌ createPago:", err);
    res.status(500).json({ error: err.message });
  }
};

/* ======================================================
   Obtener lista de pagos
====================================================== */
export const listPagos = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT 
        p.idPago, 
        p.tipoPago, 
        tp.descripcion AS tipoPagoDescripcion,
        p.concepto,
        p.liquidado,
        p.total,
        (p.total - p.liquidado) AS pendiente,
        p.fecha
      FROM dbo.pagos p
      LEFT JOIN dbo.tipo_pago tp ON tp.idTipo = p.tipoPago
      ORDER BY p.fecha DESC;
    `);

    res.json(result.recordset);
  } catch (err) {
    console.error("❌ listPagos:", err);
    res.status(500).json({ error: err.message });
  }
};

/* ======================================================
   Actualizar pago (monto liquidado o total)
====================================================== */
export const updatePago = async (req, res) => {
  const { idPago } = req.params;
  const { tipoPago, concepto, liquidado, fecha, total } = req.body;

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input("idPago", sql.Int, idPago)
      .input("tipoPago", sql.Int, tipoPago ?? null)
      .input("concepto", sql.VarChar(200), concepto ?? null)
      .input("liquidado", sql.Decimal(10,2), liquidado ?? null)
      .input("fecha", sql.Date, fecha ? new Date(fecha) : null)
      .input("total", sql.Decimal(10,2), total ?? null)
      .query(`
        UPDATE dbo.pagos
        SET
          tipoPago = COALESCE(@tipoPago, tipoPago),
          concepto = COALESCE(@concepto, concepto),
          liquidado = COALESCE(@liquidado, liquidado),
          fecha = COALESCE(@fecha, fecha),
          total = COALESCE(@total, total)
        WHERE idPago = @idPago;

        SELECT 
          p.idPago, p.tipoPago, tp.descripcion AS tipoPagoDescripcion,
          p.concepto, p.liquidado, p.total, (p.total - p.liquidado) AS pendiente, p.fecha
        FROM dbo.pagos p
        LEFT JOIN dbo.tipo_pago tp ON tp.idTipo = p.tipoPago
        WHERE p.idPago = @idPago;
      `);

    if (!result.recordset.length) {
      return res.status(404).json({ message: "Pago no encontrado." });
    }

    res.json({
      message: "Pago actualizado correctamente.",
      data: result.recordset[0],
    });
  } catch (err) {
    console.error("❌ updatePago:", err);
    res.status(500).json({ error: err.message });
  }
};

/* ======================================================
   Eliminar pago
====================================================== */
export const deletePago = async (req, res) => {
  const { idPago } = req.params;

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input("idPago", sql.Int, idPago)
      .query(`DELETE FROM dbo.pagos WHERE idPago = @idPago;`);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: "Pago no encontrado." });
    }

    res.json({ message: "Pago eliminado correctamente." });
  } catch (err) {
    console.error("❌ deletePago:", err);
    res.status(500).json({ error: err.message });
  }
};
