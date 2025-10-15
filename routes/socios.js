import express from 'express';
import { getSocios, crearSocio } from '../controllers/socios.js';

const router = express.Router();

router.get("/getSocios", getSocios);
router.post("/createSocio", crearSocio);

export default router;