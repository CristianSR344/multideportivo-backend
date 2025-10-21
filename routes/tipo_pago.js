// routes/tipoPago.js
import express from "express";
import {
  createTipoPago,
  getTiposPago,
  updateTipoPago,
  deleteTipoPago,
} from "../controllers/tipo_pago.js";

const router = express.Router();

router.post("/", createTipoPago);
router.get("/", getTiposPago);
router.put("/:idTipo", updateTipoPago);
router.delete("/:idTipo", deleteTipoPago);

export default router;
