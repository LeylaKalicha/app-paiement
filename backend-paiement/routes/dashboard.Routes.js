import express from "express";
import { getDashboard } from "../controllers/dashboard.Controller.js";
import verifierToken from "../middleware/auth.middleware.js";

const router = express.Router();

// GET /api/dashboard  → token obligatoire
router.get("/", verifierToken, getDashboard);

export default router;