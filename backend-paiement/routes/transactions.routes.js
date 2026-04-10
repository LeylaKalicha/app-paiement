import express from "express";
import {
  getMesTransactions,
  topUp,
  transfert,
  retrait,
  campayCallback,
  verifierPaiement,
} from "../controllers/transactions.controller.js";
import verifierToken from "../middleware/auth.middleware.js";

const router = express.Router();

// ── Routes protégées (JWT obligatoire) ──
router.get("/mes-transactions", verifierToken, getMesTransactions);
router.post("/topup",           verifierToken, topUp);
router.post("/transfert",       verifierToken, transfert);
router.post("/retrait",         verifierToken, retrait);

// ── Routes SANS token ──
// verifierPaiement : polled par le frontend toutes les 6s après un dépôt
// campayCallback   : appelé automatiquement par CamPay (webhook)
router.get("/campay/verifier/:reference", verifierPaiement);
router.post("/campay/callback",           campayCallback);

export default router;