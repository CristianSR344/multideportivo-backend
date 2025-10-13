import express from 'express';
import {  } from '../controllers/socios.js';

const router = express.Router();

router.get("", (req, res) => {
  res.send("Socios endpoint working!");
});

export default router;