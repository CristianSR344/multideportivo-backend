import express from 'express';
import {getRoles, rol  } from '../controllers/roles.js';

const router = express.Router();

router.get("/getRoles", getRoles);
router.post("/rol", rol);

export default router;