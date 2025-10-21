import express from "express";
import { createImagenEvento, getImagenesByEvento, deleteImagen } from "../controllers/imagenes_evento.js";

const router = express.Router();

// Crear imagen para un evento
router.post("/create", createImagenEvento);

// Obtener imágenes por idEvento
router.get("/byEvento/:idEvento", getImagenesByEvento);

// Eliminar imagen por id
router.delete("/delete/:idImagen", deleteImagen);

export default router;
