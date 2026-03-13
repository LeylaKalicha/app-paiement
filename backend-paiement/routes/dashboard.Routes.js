import express from "express";
import { getDashboard } from "../controllers/dashboard.controller.js";
import { verifyToken } from "../middleware/authMiddleware.js";
const router = express.Router();

// 🔐 Route protégée
router.get("/", verifyToken, getDashboard);

export default router;
