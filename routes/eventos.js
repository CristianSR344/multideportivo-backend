// routes/eventos.js
import { Router } from "express";
import {
  listEventos,
  getEvento,
  createEvento,
  updateEvento,
  deleteEvento,
  getEventos
} from "../controllers/eventos.js";

const router = Router();

router.get("/listEventos", listEventos);
router.get("/getEventos", getEventos);
router.get("/:id", getEvento);
router.post("/createEvento", createEvento);
router.put("/:id", updateEvento);
router.delete("/:id", deleteEvento);

export default router;
