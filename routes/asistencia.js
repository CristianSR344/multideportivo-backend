// routes/asistencia.js
import { Router } from "express";
import {
    createAsistencia,
    listAsistencias,
    getAsistencia,
    listAsistenciasBySocio,
    updateAsistencia,
    deleteAsistencia,
    marcarAsistencia,
} from "../controllers/asistencia.js";

const router = Router();

router.post("/", createAsistencia);
router.get("/", listAsistencias);
router.get("/:idAsistencia", getAsistencia);

router.get("/socio/:idSocios", listAsistenciasBySocio);

router.put("/:idAsistencia", updateAsistencia);
router.delete("/:idAsistencia", deleteAsistencia);
router.patch("/:idAsistencia/marcar", marcarAsistencia);

export default router;
