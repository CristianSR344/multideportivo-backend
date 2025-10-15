import express from 'express';
import { getMembresias, membresia } from '../controllers/membresia.js';

const router = express.Router();

router.get("/getMembresias", getMembresias);
router.post("/createMembresia", membresia);

export default router;