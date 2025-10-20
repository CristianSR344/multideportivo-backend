import poolPromise from "../connect.js";
import sql from "mssql";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";


/* ============================
   REGISTRO
=============================== */
export const register = async (req, res) => {
  const {
    nombre,
    apellidoP,
    apellidoM,
    correo,
    password,
    cp,
    colonia,
    calle,
    numero,
    sexo, // 1 o 0
    dob,
    imagen, // base64 o null
    rol // idRoles
  } = req.body;

  try {
    const pool = await poolPromise;

    console.log("📥 Recibido registro de usuario:", { nombre, correo, rol });

    // 1️⃣ Validar correo duplicado
    const exists = await pool.request()
      .input("correo", sql.VarChar(50), correo)
      .query(`SELECT 1 FROM dbo.usuarios WHERE correo = @correo`);

    if (exists.recordset.length > 0) {
      console.warn("⚠️ Usuario duplicado:", correo);
      return res.status(409).json({ message: "El usuario ya existe" });
    }

    // 2️⃣ Generar hash
    const salt = bcrypt.genSaltSync(10);
    const hashed = bcrypt.hashSync(password, salt);

    // 3️⃣ Ejecutar INSERT y devolver id
    console.log("🛠️ Insertando usuario...");

    const result = await pool.request()
      .input("nombre", sql.VarChar(45), nombre)
      .input("apellidoP", sql.VarChar(50), apellidoP)
      .input("apellidoM", sql.VarChar(50), apellidoM)
      .input("correo", sql.VarChar(50), correo)
      .input("password", sql.VarChar(200), hashed)
      .input("cp", sql.Int, cp || null)
      .input("colonia", sql.VarChar(100), colonia || null)
      .input("calle", sql.VarChar(100), calle || null)
      .input("numero", sql.Int, numero || null)
      .input("sexo", sql.Int, typeof sexo === "number" ? sexo : null)
      .input("dob", sql.Date, dob ? new Date(dob) : null)
      .input("imagen", sql.VarBinary(sql.MAX), imagen ? Buffer.from(imagen, "base64") : null)
      .input("rol", sql.Int, rol || null)
      .query(`
        INSERT INTO dbo.usuarios
        (nombre, apellidoP, apellidoM, correo, [contraseña], cp, colonia, calle, numero, sexo, dob, imagen, rol)
        OUTPUT INSERTED.id_usuario
        VALUES
        (@nombre, @apellidoP, @apellidoM, @correo, @password, @cp, @colonia, @calle, @numero, @sexo, @dob, @imagen, @rol);
      `);

    // Verificar resultado
    if (!result.recordset || result.recordset.length === 0) {
      throw new Error("El INSERT no devolvió ningún id_usuario");
    }

    const userId = result.recordset[0].id_usuario;
    console.log("✅ Usuario insertado con id:", userId);

    return res.status(201).json({
      message: "Usuario creado correctamente",
      userId
    });

  } catch (err) {
    console.error("❌ Error en register:", err);
    return res.status(500).json({ error: err.message });
  }
};


/* ============================
   LOGIN por id_usuario (con JWT + cookie)
=============================== */
export const login = async (req, res) => {
  const { correo, password } = req.body;   // ⬅️ ahora correo

  try {
    const pool = await poolPromise;

    const r = await pool.request()
      .input("correo", sql.VarChar(50), correo)
      .query(`
        SELECT id_usuario, nombre, apellidoP, apellidoM, correo,
               [contraseña] AS hash, rol
        FROM dbo.usuarios
        WHERE correo = @correo;
      `);

    if (r.recordset.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const user = r.recordset[0];
    const ok = bcrypt.compareSync(password, user.hash);
    if (!ok) {
      return res.status(401).json({ message: "Contraseña incorrecta" });
    }

    const token = jwt.sign(
      { sub: user.id_usuario, rol: user.rol },
      "mi_secreto_super_seguro_123",
      { expiresIn: "1d" }
    );

    res.cookie("accessToken", token, {
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    const { hash, ...safe } = user;
    return res.status(200).json({ message: "Login exitoso", user: safe, token });
  } catch (err) {
    console.error("❌ Error en login:", err);
    return res.status(500).json({ error: err.message });
  }
};


/* ============================
   LOGOUT
=============================== */
export const logout = (_req, res) => {
  res.clearCookie("accessToken", {
    secrue: true,
    sameSite: "none"
  }).status(200).json("Sesion Cerrada!")
};

