// routes/espacio.js
import { Router } from "express";
import {
  createEspacio,
  listEspacios,
  getEspacioById,
  updateEspacio,
  deleteEspacio,
} from "../controllers/espacio.js";

const router = Router();

router.post("/", createEspacio);          // Crear
router.get("/", listEspacios);            // Listar
router.get("/:idEspacio", getEspacioById);// Obtener por ID
router.put("/:idEspacio", updateEspacio); // Actualizar
router.delete("/:idEspacio", deleteEspacio); // Eliminar

export default router;
