import poolPromise from "../connect.js";
import sql from "mssql";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

/* ============================
   REGISTRO
=============================== */
export const register = async (req, res) => {
  const {
    id_usuario,
    nombre,
    apellidoP,
    apellidoM,
    correo,
    password,
    cp,
    colonia,
    calle,
    numero,
    sexo,
    dob,
    imagen,
    rol
  } = req.body;

  try {
    const pool = await poolPromise;

    // ¿Existe por ID o correo?
    const exists = await pool.request()
      .input("id_usuario", sql.Int, id_usuario)
      .input("correo", sql.VarChar(50), correo)
      .query(`
        SELECT 1 FROM dbo.usuarios
        WHERE id_usuario = @id_usuario OR correo = @correo
      `);

    if (exists.recordset.length) {
      return res.status(409).json({ message: "El usuario ya existe" });
    }

    // Hash
    const salt = bcrypt.genSaltSync(10);
    const hashed = bcrypt.hashSync(password, salt);

    // INSERT 
    await pool.request()
      .input("id_usuario", sql.Int, id_usuario)
      .input("nombre", sql.VarChar(45), nombre)
      .input("apellidoP", sql.VarChar(50), apellidoP)
      .input("apellidoM", sql.VarChar(50), apellidoM)
      .input("correo", sql.VarChar(50), correo)
      .input("password", sql.VarChar(200), hashed)       // parámetro ASCII
      .input("cp", sql.Int, cp)
      .input("colonia", sql.VarChar(100), colonia)
      .input("calle", sql.VarChar(100), calle)
      .input("numero", sql.Int, numero)
      .input("sexo", sql.VarChar(10), sexo)
      .input("dob", sql.Date, dob ? new Date(dob) : null)
      .input("imagen", sql.VarBinary(sql.MAX), imagen ? Buffer.from(imagen, "base64") : null)
      .input("rol", sql.Int, rol)
      .query(`
        INSERT INTO dbo.usuarios
        (nombre, apellidoP, apellidoM, correo, contraseña, cp, colonia, calle, numero, sexo, dob, imagen, rol)
        VALUES
        (@nombre, @apellidoP, @apellidoM, @correo, @password, @cp, @colonia, @calle, @numero, @sexo, @dob, @imagen, @rol);
      `);

    return res.status(201).json({ message: "Usuario creado correctamente" });
  } catch (err) {
    console.error("❌ Error en register:", err);
    return res.status(500).json({ error: err.message });
  }
};

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


/* ============================
   LOGIN por id_usuario (con JWT + cookie)
=============================== */
export const login = async (req, res) => {
  const { id_usuario, password } = req.body;

  try {
    const pool = await poolPromise;

    const r = await pool.request()
      .input("id_usuario", sql.Int, id_usuario)
      .query(`
        SELECT id_usuario, nombre, apellidoP, apellidoM, correo, [contraseña] AS hash, rol
        FROM dbo.usuarios
        WHERE id_usuario = @id_usuario;
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
      "mi_secreto_super_seguro_123",     // para pruebas locales
      { expiresIn: "1d" }
    );

    res.cookie("accessToken", token, {
      httpOnly: true,
      secure: false,       // en local sin HTTPS
      sameSite: "Lax",
      maxAge: 24 * 60 * 60 * 1000
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
    sameSite:"none"
    }).status(200).json("Sesion Cerrada!")
};

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
