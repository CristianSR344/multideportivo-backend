// routes/usuarios.js
import { Router } from "express";
import {
  listUsuarios,
  getUsuario,
  updateUsuario,
  deleteUsuario
} from "../controllers/usuarios.js";

const router = Router();


router.get("/", listUsuarios);
router.get("/:id_usuario", getUsuario);
router.put("/:id_usuario", updateUsuario);
router.delete("/:id_usuario", deleteUsuario);

export default router;
