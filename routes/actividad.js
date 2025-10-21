// routes/actividad.js
import express from "express";
import {
  createActividad,
  getActividades,
  getActividadById,
  updateActividad,
  deleteActividad,
} from "../controllers/actividad.js";

const router = express.Router();

router.post("/", createActividad);           // Crear
router.get("/", getActividades);             // Listar (opcional ?usuario=ID)
router.get("/:id", getActividadById);        // Detalle
router.put("/:id", updateActividad);         // Update total/parcial
router.patch("/:id", updateActividad);       // (alias)
router.delete("/:id", deleteActividad);      // Borrar

export default router;
