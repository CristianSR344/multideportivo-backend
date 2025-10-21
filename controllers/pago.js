import poolPromise from "../connect.js";
import sql from "mssql";

/* ============================
   CREAR NUEVO PAGO (ID auto)
=============================== */
export const pago = async (req, res) => {
  const { concepto, pagado, fecha, total } = req.body;

  try {
    const pool = await poolPromise;

    // Insertar nuevo pago (sin especificar idPagos)
    const result = await pool.request()
      .input("concepto", sql.VarChar(20), concepto)
      .query(`
        INSERT INTO dbo.Pagos (concepto, pagado, fecha, total)
        OUTPUT INSERTED.concepto, INSERTED.pagado, INSERTED.fecha, INSERTED.total
        VALUES (@concepto, @pagado, @fecha, @total);
      `);

    // 3️⃣ Respuesta con el rol creado
    const newPago = result.recordset[0];
    res.status(201).json({
      message: "Pago creado correctamente",
      pago: newPago
    });

  } catch (err) {
    console.error("❌ Error al crear pago:", err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ Obtener pagos
export const getPagos = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`SELECT idPagos, concepto, pagado, fecha, total FROM dbo.Pagos`);
    res.json(result.recordset);
  } catch (err) {
    console.error("❌ Error al obtener pagos:", err);
    res.status(500).json({ message: "Error al obtener pagos" });
  }
};