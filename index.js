// index.js
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import userRoutes from "./routes/usuarios.js";
import rolesRoutes from "./routes/roles.js";
import membresiaRoutes from "./routes/membresia.js";
import authRoutes from "./routes/auth.js";

import { auth, requireRole, optionalAuth } from "./middleware/auth.js";

const app = express();

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "https://black-smoke-059d69b1e.2.azurestaticapps.net", // tu SWA
];

app.use(express.json());
app.use(cookieParser());

app.use((req, res, next) => {
  // Para ver qué Origin llega realmente
  // console.log("Origin:", req.headers.origin);
  next();
});

app.use(
  cors({
    origin: function (origin, callback) {
      // Permite request sin Origin (e.g. curl, Postman) y los orígenes de la lista
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS: " + origin));
    },
    credentials: true, // ⬅️ si usas cookies/JWT en cookie
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.options("*", cors());

// Rutas públicas (por ejemplo, login / register si lo quieres público)
app.use("/api/auth", authRoutes);

// Rutas que requieren estar autenticado (cualquier usuario)
app.use("/api/usuarios", auth, userRoutes);

// Catálogos restringidos a ADMIN (ejemplo: rol 1 = Admin)
app.use("/api/roles", auth, requireRole(1), rolesRoutes);

// Membresías solo para Admin (ajusta según tu lógica)
app.use("/api/membresias", auth, requireRole(1), membresiaRoutes);

// Ejemplo de ruta opcionalAuth (si quieres mostrar datos distintos según logueo)
app.get("/api/ping", optionalAuth, (req, res) => {
  res.json({
    ok: true,
    user: req.user || null,
  });
});

const PORT = process.env.PORT || 3000;
app.get("/", (_req, res) => res.send("Backend server is running!"));
app.listen(PORT, () => console.log(`Backend server is running on :${PORT}`));
