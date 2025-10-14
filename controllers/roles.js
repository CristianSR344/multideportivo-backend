import poolPromise from "../connect.js";
import sql from "mssql";

/* ============================
   CREAR NUEVO ROL (ID auto)
=============================== */
export const rol = async (req, res) => {
  const { descripcion } = req.body;

  try {
    const pool = await poolPromise;

    // 1️⃣ Verificar si ya existe un rol con esa descripción
    const existe = await pool.request()
      .input("descripcion", sql.VarChar(20), descripcion)
      .query(`SELECT 1 FROM dbo.roles WHERE descripcion = @descripcion`);

    if (existe.recordset.length > 0) {
      return res.status(409).json({ message: "El rol ya existe" });
    }

    // 2️⃣ Insertar nuevo rol (sin especificar idRoles)
    const result = await pool.request()
      .input("descripcion", sql.VarChar(20), descripcion)
      .query(`
        INSERT INTO dbo.roles (descripcion)
        OUTPUT INSERTED.idRoles, INSERTED.descripcion
        VALUES (@descripcion);
      `);

    // 3️⃣ Respuesta con el rol creado
    const newRole = result.recordset[0];
    res.status(201).json({
      message: "Rol creado correctamente",
      rol: newRole
    });

  } catch (err) {
    console.error("❌ Error al crear rol:", err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ Obtener roles
export const getRoles = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`SELECT idRoles, descripcion FROM dbo.roles`);
    res.json(result.recordset);
  } catch (err) {
    console.error("❌ Error al obtener roles:", err);
    res.status(500).json({ message: "Error al obtener roles" });
  }
};