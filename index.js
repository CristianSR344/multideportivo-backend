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
import imagenesEspaciosRoutes from "./routes/imagenes_espacios.js";
import espaciosRoutes from "./routes/espacio.js";
import espacioActividadRoutes from "./routes/espacio_actividad.js";
import imagenActividadRoutes from "./routes/imagenes_actividad.js";
import cursoRoutes from "./routes/curso.js";
import asistenciaRoutes from "./routes/asistencia.js";
import cursoAsistenciaRoutes from "./routes/curso_has_asistencia.js";
import accidenteRoutes from "./routes/accidente.js";
import usuariosRoutes from "./routes/usuarios.js";


// Middlewares de autenticación
import { auth, requireRole, optionalAuth } from "./middleware/auth.js";

const app = express();

/* =======================================================
   🔒 CONFIGURACIÓN DE CORS PARA DESARROLLO LOCAL
   ======================================================= */
const allowedOrigins = [
  "http://localhost:3000", // desarrollo local
  "https://black-smoke-059d69b1e.2.azurestaticapps.net", // ⚙️ Descomenta cuando pruebes en Azure
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
app.use("/api/imagenes-espacios", imagenesEspaciosRoutes);
app.use("/api/espacio", espaciosRoutes);
app.use("/api/espacio-actividad", /* opcional: auth */ espacioActividadRoutes);
app.use("/api/imagen-actividad", /* auth opcional */ imagenActividadRoutes);
app.use("/api/cursos", cursoRoutes);
app.use("/api/asistencias", asistenciaRoutes);
app.use("/api/curso_asistencia", cursoAsistenciaRoutes);
app.use("/api/accidentes", accidenteRoutes);
app.use("/api/usuarios", usuariosRoutes);
app.use("/api/roles", rolesRoutes);






// 🛡️ Rutas restringidas según rol
app.use("/api/usuarios",  userRoutes);//auth, requireRole([1, 2, 3]),
app.use("/api/membresias", membresiaRoutes); //, auth, requireRole([1, 3])

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
