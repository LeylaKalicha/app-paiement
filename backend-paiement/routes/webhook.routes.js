import express from "express";
import { flutterwaveWebhook } from "../controllers/webhook.controller.js";

const router = express.Router();

// Route PUBLIQUE — pas de verifierToken, Flutterwave appelle directement
// La sécurité se fait via la signature dans le header "verif-hash"
router.post("/flutterwave", flutterwaveWebhook);

export default router;