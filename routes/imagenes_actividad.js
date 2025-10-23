// routes/imagenActividad.js
import { Router } from "express";
import {
  createImagenActividad,
  listImagenesActividad,
  getImagenActividad,
  updateImagenActividad,
  deleteImagenActividad,
} from "../controllers/imagenes_actividad.js";

const router = Router();

// POST   /api/imagen-actividad
router.post("/", createImagenActividad);

// GET    /api/imagen-actividad   (opcional ?idActividad=123)
router.get("/", listImagenesActividad);

// GET    /api/imagen-actividad/:idImagen
router.get("/:idImagen", getImagenActividad);

// PUT    /api/imagen-actividad/:idImagen
router.put("/:idImagen", updateImagenActividad);

// DELETE /api/imagen-actividad/:idImagen
router.delete("/:idImagen", deleteImagenActividad);

export default router;
