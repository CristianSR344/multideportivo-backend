// index.js
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

// Rutas
import userRoutes from "./routes/usuarios.js";
import rolesRoutes from "./routes/roles.js";
import membresiaRoutes from "./routes/membresia.js";
import pagosRoutes from "./routes/pago.js";
import authRoutes from "./routes/auth.js";
import eventosRoutes from "./routes/eventos.js";
import imagenesEventosRoutes from "./routes/imagenes_evento.js";
import actividadRoutes from "./routes/actividad.js";
import tipoPagoRoutes from "./routes/tipo_pago.js";


// Middlewares de autenticación
import { auth, requireRole, optionalAuth } from "./middleware/auth.js";

const app = express();

/* =======================================================
   🔒 CONFIGURACIÓN DE CORS PARA DESARROLLO LOCAL
   ======================================================= */
const allowedOrigins = [
  "http://localhost:3000", // desarrollo local
  // "https://black-smoke-059d69b1e.2.azurestaticapps.net", // ⚙️ Descomenta cuando pruebes en Azure
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS: " + origin));
    },
    credentials: true, // necesario si usas cookies JWT
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Maneja las preflight requests correctamente
app.options(/.*/, cors());

/* =======================================================
   🧩 MIDDLEWARES
   ======================================================= */
app.use(express.json({ limit: "10mb" })); // soporte para base64 / imágenes
app.use(cookieParser());

/* =======================================================
   🚏 RUTAS
   ======================================================= */
app.use("/api/auth", authRoutes);
app.use("/api/pagos", pagosRoutes);
app.use("/api/eventos", eventosRoutes);
app.use("/api/imagenes_eventos", imagenesEventosRoutes);
app.use("/api/actividad", actividadRoutes);/* auth, requireRole([1,3]) */
app.use("/api/tipoPago", tipoPagoRoutes);
app.use("/api/pagos", pagosRoutes);

// 🛡️ Rutas restringidas según rol
app.use("/api/usuarios", auth, requireRole([1, 2, 3]), userRoutes);
app.use("/api/roles", auth, requireRole(1), rolesRoutes);
app.use("/api/membresias", auth, requireRole([1, 3]), membresiaRoutes);

// Ruta de prueba
app.get("/api/ping", optionalAuth, (req, res) => {
  res.json({
    ok: true,
    message: "Servidor activo ✅ (modo local)",
    user: req.user || null,
  });
});

/* =======================================================
   🚀 SERVIDOR LOCAL
   ======================================================= */
const PORT = process.env.PORT || 8800;

app.get("/", (_req, res) => res.send("✅ Backend local corriendo correctamente!"));

app.listen(PORT, () => {
  console.log(`🚀 Backend corriendo en: http://localhost:${PORT}`);
});
