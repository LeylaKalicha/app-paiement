import express from "express";
import { getMesNotifications } from "../controllers/notification.controller.js";
import verifierToken from "../middleware/auth.middleware.js";
const router = express.Router();

// GET /api/notifications/mes-notifs
// Récupère les notifications de l'utilisateur connecté
router.get("/mes-notifs", verifierToken, getMesNotifications);

export default router;