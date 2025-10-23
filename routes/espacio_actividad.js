import { Router } from "express";
import {
  linkEspacioActividad,
  listEspaciosByActividad,
  listActividadesByEspacio,
  replaceEspaciosForActividad,
  unlinkEspacioActividad,
} from "../controllers/espacio_actividad.js";

const router = Router();

// Crear vínculo
router.post("/", linkEspacioActividad);

// Listar espacios de una actividad
router.get("/actividad/:idActividad", listEspaciosByActividad);

// Listar actividades de un espacio
router.get("/espacio/:idEspacio", listActividadesByEspacio);

// Reemplazar TODOS los espacios de una actividad (transacción)
router.put("/actividad/:idActividad", replaceEspaciosForActividad);

// Eliminar vínculo específico
router.delete("/", unlinkEspacioActividad);

export default router;
