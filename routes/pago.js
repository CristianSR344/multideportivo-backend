// routes/pagos.js
import express from "express";
import {
  createPago,
  listPagos,
  updatePago,
  deletePago,
} from "../controllers/pago.js";

const router = express.Router();

// GET /api/pagos
router.get("/", listPagos);

// POST /api/pagos
router.post("/", createPago);

// PUT /api/pagos/:idPago
router.put("/:idPago", updatePago);

// DELETE /api/pagos/:idPago
router.delete("/:idPago", deletePago);

export default router;
