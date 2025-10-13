import express from 'express';
import { getUsuario } from '../controllers/usuarios.js';

const router = express.Router();

router.get("/find/:usuario", getUsuario);
 

export default router;