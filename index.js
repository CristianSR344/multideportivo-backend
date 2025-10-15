import express from "express";
const app = express();
import cors from "cors";
import userRoutes from "./routes/usuarios.js";
import sociosRoutes from "./routes/socios.js";
import rolesRoutes from "./routes/roles.js";
import membresiaRoutes from "./routes/membresia.js";
import authRoutes from "./routes/auth.js";
import cookieParser from "cookie-parser";

//Middlewares
app.use(express.json());
app.use(cookieParser());

const ALLOWED_ORIGINS = [
    "http://localhost:3000", // desarrollo local
    "https://black-smoke-059d69b1e.2.azurestaticapps.net", // tu Static Web App
    // agrega otros orígenes válidos si los tienes (tu dominio custom si aplica)
];

app.use(
    cors({
        origin: function (origin, callback) {
            // permitir herramientas tipo Postman/ThunderClient (origin = undefined)
            if (!origin) return callback(null, true);
            if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
            return callback(new Error("Not allowed by CORS"));
        },
        credentials: true, // si vas a usar cookies (JWT en login)
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

// Responder preflight
// app.options("*", cors());
console.log("Starting....")

//Set up a port 
const PORT = process.env.PORT || 3000;

app.use("/api/auth", authRoutes);
app.use("/api/usuarios", userRoutes);
app.use("/api/socios", sociosRoutes);
app.use("/api/roles", rolesRoutes);
app.use("/api/membresias", membresiaRoutes);

app.get("/", (req, res) => {
    res.send("Backend server is running!")
})


app.listen(PORT, () => {
    console.log(`Backend server is running on http://localhost:${PORT}!`)
});
