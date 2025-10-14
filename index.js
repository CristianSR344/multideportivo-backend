import express from "express";
const app = express();
import cors from "cors";
import userRoutes from "./routes/usuarios.js";
// import sociosRoutes from "./routes/socios.js";
import rolesRoutes from "./routes/roles.js";
import membresiaRoutes from "./routes/membresia.js";
import authRoutes from "./routes/auth.js";
import cookieParser from "cookie-parser";

//Middlewares
app.use(express.json());
app.use(cors({
    origin: "*",
}));
app.use(cookieParser());

const corsOptions = {
    methods: "GET, POST",
    allowedHeaders: ["Content-Type", "Authorization"]
};

console.log("Starting....")

//Set up a port 
const PORT = process.env.PORT || 3000;

app.use("/api/auth", authRoutes);
app.use("/api/usuarios", userRoutes);
// app.use("/api/socios", sociosRoutes);
app.use("/api/roles", rolesRoutes);
app.use("/api/membresia", membresiaRoutes);

app.get("/", (req, res) => {
    res.send("Backend server is running!")
})


app.listen(PORT, () => {
    console.log(`Backend server is running on http://localhost:${PORT}!`)
});
