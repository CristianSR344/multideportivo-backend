import poolPromise from "../connect.js";
import sql from "mssql";


/* ============================
   CREAR NUEVO MEMBRESIA (ID auto)
=============================== */
export const membresia = async (req, res) => {
  const { descripcion } = req.body;

  try {
    const pool = await poolPromise;

    // 1️⃣ Verificar si ya existe un rol con esa descripción
    const existe = await pool.request()
      .input("descripcion", sql.VarChar(20), descripcion)
      .query(`SELECT 1 FROM dbo.membresia WHERE descripcion = @descripcion`);

    if (existe.recordset.length > 0) {
      return res.status(409).json({ message: "La membresia ya existe" });
    }

    // 2️⃣ Insertar nuevo rol (sin especificar idRoles)
    const result = await pool.request()
      .input("descripcion", sql.VarChar(20), descripcion)
      .query(`
        INSERT INTO dbo.membresia (descripcion)
        OUTPUT INSERTED.idMembresia, INSERTED.descripcion
        VALUES (@descripcion);
      `);

    // 3️⃣ Respuesta con el rol creado
    const newRole = result.recordset[0];
    res.status(201).json({
      message: "Membresia creada correctamente",
      rol: newRole
    });

  } catch (err) {
    console.error("❌ Error al crear membresia:", err);
    res.status(500).json({ error: err.message });
  }
};


// ✅ Obtener tipos de membresía (si tienes esa tabla)
export const getMembresias = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`SELECT idMembresia, descripcion FROM dbo.membresia`);
    res.json(result.recordset);
  } catch (err) {
    console.error("❌ Error al obtener membresías:", err);
    res.status(500).json({ message: "Error al obtener membresías" });
  }
};