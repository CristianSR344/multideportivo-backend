import { Router } from "express";
import {
  createActividad,
  listActividades,
  getActividadById,
  updateActividad,
  deleteActividad,
} from "../controllers/actividad.js";

const router = Router();

router.post("/", createActividad);            // Crear
router.get("/", listActividades);             // Listar
router.get("/:idActividad", getActividadById);// Obtener uno
router.put("/:idActividad", updateActividad); // Actualizar
router.delete("/:idActividad", deleteActividad); // Eliminar

export default router;
