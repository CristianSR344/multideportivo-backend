// routes/curso.js
import { Router } from "express";
import {
    createCurso,
    listCursos,
    getCurso,
    updateCurso,
    deleteCurso,
} from "../controllers/curso.js";

const router = Router();

router.post("/", createCurso);
router.get("/", listCursos);
router.get("/:idCurso", getCurso);
router.put("/:idCurso", updateCurso);
router.delete("/:idCurso", deleteCurso);

export default router;
