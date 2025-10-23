// controllers/usuarios.js
import poolPromise from "../connect.js";
import sql from "mssql";
import bcrypt from "bcryptjs";

/* ======================================================
   Listar usuarios
====================================================== */
export const listUsuarios = async (_req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT
        u.id_usuario,
        u.nombre,
        u.apellidoP,
        u.apellidoM,
        u.correo,
        u.cp,
        u.colonia,
        u.calle,
        u.numero,
        u.sexo,
        u.dob,
        u.rol,
        r.descripcion AS rolDescripcion
      FROM dbo.usuarios u
      LEFT JOIN dbo.roles r ON r.idRoles = u.rol
      ORDER BY u.id_usuario DESC;
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error("❌ listUsuarios:", err);
    res.status(500).json({ error: err.message });
  }
};

/* ======================================================
   Obtener usuario por ID
====================================================== */
export const getUsuario = async (req, res) => {
  const { id_usuario } = req.params;

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input("id_usuario", sql.Int, id_usuario)
      .query(`
        SELECT
          u.id_usuario,
          u.nombre,
          u.apellidoP,
          u.apellidoM,
          u.correo,
          u.cp,
          u.colonia,
          u.calle,
          u.numero,
          u.sexo,
          u.dob,
          u.rol,
          r.descripcion AS rolDescripcion
        FROM dbo.usuarios u
        LEFT JOIN dbo.roles r ON r.idRoles = u.rol
        WHERE id_usuario = @id_usuario;
      `);

    if (!result.recordset.length) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    res.json(result.recordset[0]);
  } catch (err) {
    console.error("❌ getUsuario:", err);
    res.status(500).json({ error: err.message });
  }
};

/* ======================================================
   Actualizar usuario
====================================================== */
export const updateUsuario = async (req, res) => {
  const { id_usuario } = req.params;
  const {
    nombre, apellidoP, apellidoM, correo, contraseña,
    cp, colonia, calle, numero, sexo, dob, imagen, rol
  } = req.body;

  try {
    const pool = await poolPromise;

    const hashed = contraseña ? bcrypt.hashSync(contraseña, 10) : null;

    const result = await pool.request()
      .input("id_usuario", sql.Int, id_usuario)
      .input("nombre", sql.VarChar(50), nombre ?? null)
      .input("apellidoP", sql.VarChar(50), apellidoP ?? null)
      .input("apellidoM", sql.VarChar(50), apellidoM ?? null)
      .input("correo", sql.VarChar(100), correo ?? null)
      .input("contraseña", sql.VarChar(200), hashed ?? null)
      .input("cp", sql.Int, cp ?? null)
      .input("colonia", sql.VarChar(100), colonia ?? null)
      .input("calle", sql.VarChar(100), calle ?? null)
      .input("numero", sql.Int, numero ?? null)
      .input("sexo", sql.Int, sexo ?? null)
      .input("dob", sql.Date, dob ? new Date(dob) : null)
      .input("imagen", sql.VarBinary(sql.MAX), imagen ? Buffer.from(imagen, "base64") : null)
      .input("rol", sql.Int, rol ?? null)
      .query(`
        UPDATE dbo.usuarios
        SET
          nombre = COALESCE(@nombre, nombre),
          apellidoP = COALESCE(@apellidoP, apellidoP),
          apellidoM = COALESCE(@apellidoM, apellidoM),
          correo = COALESCE(@correo, correo),
          contraseña = COALESCE(@contraseña, contraseña),
          cp = COALESCE(@cp, cp),
          colonia = COALESCE(@colonia, colonia),
          calle = COALESCE(@calle, calle),
          numero = COALESCE(@numero, numero),
          sexo = COALESCE(@sexo, sexo),
          dob = COALESCE(@dob, dob),
          imagen = COALESCE(@imagen, imagen),
          rol = COALESCE(@rol, rol)
        WHERE id_usuario = @id_usuario;

        SELECT * FROM dbo.usuarios WHERE id_usuario = @id_usuario;
      `);

    if (!result.recordset.length)
      return res.status(404).json({ message: "Usuario no encontrado." });

    res.json({
      message: "Usuario actualizado correctamente.",
      data: result.recordset[0],
    });
  } catch (err) {
    console.error("❌ updateUsuario:", err);
    res.status(500).json({ error: err.message });
  }
};

/* ======================================================
   Eliminar usuario
====================================================== */
export const deleteUsuario = async (req, res) => {
  const { id_usuario } = req.params;

  try {
    const pool = await poolPromise;
    const r = await pool.request()
      .input("id_usuario", sql.Int, id_usuario)
      .query("DELETE FROM dbo.usuarios WHERE id_usuario = @id_usuario;");

    if (r.rowsAffected[0] === 0) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    res.json({ message: "Usuario eliminado correctamente." });
  } catch (err) {
    console.error("❌ deleteUsuario:", err);
    res.status(500).json({ error: err.message });
  }
};