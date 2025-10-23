// routes/accidente.js
import { Router } from "express";
import {
  createAccidente,
  listAccidentes,
  getAccidente,
  updateAccidente,
  deleteAccidente,
} from "../controllers/accidente.js";

const router = Router();

router.post("/", createAccidente);
router.get("/", listAccidentes);
router.get("/:idAccidente", getAccidente);
router.put("/:idAccidente", updateAccidente);
router.delete("/:idAccidente", deleteAccidente);

export default router;
