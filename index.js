// index.js
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

// Rutas
import userRoutes from "./routes/usuarios.js";
import rolesRoutes from "./routes/roles.js";
import membresiaRoutes from "./routes/membresia.js";
import authRoutes from "./routes/auth.js";

// Middlewares de autenticación (ajusta si los usas)
import { auth, requireRole, optionalAuth } from "./middleware/auth.js";

const app = express();

/* =======================================================
   🔒 CONFIGURACIÓN DE CORS (para localhost y Azure)
   ======================================================= */
const allowedOrigins = [
  "http://localhost:3000", // desarrollo local
  "https://black-smoke-059d69b1e.2.azurestaticapps.net", // tu front en Azure SWA
];

const corsOptions = {
  origin: function (origin, callback) {
    // Permitir llamadas sin Origin (curl/Postman) y las de la lista blanca
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS: " + origin));
  },
  credentials: true, // ⬅️ necesario si usas cookies JWT httpOnly
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// Aplicar CORS global
app.use(cors(corsOptions));
// Responder correctamente a preflights OPTIONS
app.options(/.*/, cors(corsOptions));

/* =======================================================
   🧩 MIDDLEWARES BÁSICOS
   ======================================================= */
app.use(express.json({ limit: "10mb" })); // soporte para imágenes base64
app.use(cookieParser());

/* =======================================================
   🚏 RUTAS
   ======================================================= */

// 🔓 Rutas públicas (registro / login)
app.use("/api/auth", authRoutes);

// 🔐 Rutas protegidas (requieren estar autenticado)
app.use("/api/usuarios", auth, userRoutes);

// 🛡️ Rutas restringidas según rol (por ejemplo, 1 = Admin)
app.use("/api/roles", auth, requireRole(1), rolesRoutes);
app.use("/api/membresias", auth, requireRole(1), membresiaRoutes);

// Ejemplo de ruta semi-pública (puede responder diferente si hay token)
app.get("/api/ping", optionalAuth, (req, res) => {
  res.json({
    ok: true,
    message: "Servidor activo ✅",
    user: req.user || null,
  });
});

/* =======================================================
   🚀 SERVIDOR
   ======================================================= */
const PORT = process.env.PORT || 8800;

app.get("/", (_req, res) => res.send("✅ Backend server is running!"));

app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});
