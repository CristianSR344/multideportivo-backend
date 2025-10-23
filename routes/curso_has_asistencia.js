// routes/cursoAsistencia.js
import { Router } from "express";
import {
  createCursoAsistencia,
  listCursoAsistencia,
  getAsistenciasByCurso,
  getCursosByAsistencia,
  deleteCursoAsistencia
} from "../controllers/curso_has_asistencia.js";

const router = Router();

router.post("/", createCursoAsistencia);
router.get("/", listCursoAsistencia);
router.get("/curso/:idCurso", getAsistenciasByCurso);
router.get("/asistencia/:idAsistencia", getCursosByAsistencia);
router.delete("/:idCurso/:idAsistencia", deleteCursoAsistencia);

export default router;
