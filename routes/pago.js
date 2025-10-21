import express from 'express';
import {getPagos, pago  } from '../controllers/pago.js';

const router = express.Router();

router.get("/getPagos", getPagos);
router.post("/pago", pago);

export default router;