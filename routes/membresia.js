import express from 'express';
import { getMembresias } from '../controllers/membresia.js';

const router = express.Router();

router.get("/membresias", getMembresias);

export default router;