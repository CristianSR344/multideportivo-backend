// routes/imagenesEspacios.js
import express from "express";
import {
  createImagenEspacio,
  listImagenesPorEspacio,
  getImagenById,
  deleteImagen,
} from "../controllers/imagenes_espacios.js";

const router = express.Router();

// POST /api/imagenes-espacios
router.post("/", createImagenEspacio);

// GET /api/imagenes-espacios/espacio/:idEspacio
router.get("/espacio/:idEspacio", listImagenesPorEspacio);

// GET /api/imagenes-espacios/:idImagen
router.get("/:idImagen", getImagenById);

// DELETE /api/imagenes-espacios/:idImagen
router.delete("/:idImagen", deleteImagen);

export default router;
