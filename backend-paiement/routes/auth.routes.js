import express from "express";
import {
  register,
  login,
  motDePasseOublie,
  reinitialiserMotDePasse,
  getProfil,
} from "../controllers/auth.controller.js";
import verifierToken from "../middleware/auth.middleware.js";

const router = express.Router();

// ═══════════════════════════════════════════════════════════════
//  ROUTES PUBLIQUES (sans token)
// ═══════════════════════════════════════════════════════════════

// POST /api/auth/register
router.post("/register", register);

// POST /api/auth/login
router.post("/login", login);

// POST /api/auth/forgot-password
router.post("/forgot-password", motDePasseOublie);

// POST /api/auth/reset-password
router.post("/reset-password", reinitialiserMotDePasse);

// ═══════════════════════════════════════════════════════════════
//  ROUTES PROTÉGÉES (token JWT obligatoire)
// ═══════════════════════════════════════════════════════════════

// GET /api/auth/profil
router.get("/profil", verifierToken, getProfil);

export default router;