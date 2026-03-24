import express from "express";
import { getMesTransactions, topUp, transfert, campayCallback, verifierPaiement } from "../controllers/transactions.controller.js";
import verifierToken from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/mes-transactions",           verifierToken, getMesTransactions);
router.post("/topup",                     verifierToken, topUp);
router.post("/transfert",                 verifierToken, transfert);
router.get("/campay/verifier/:reference", verifierToken, verifierPaiement);
router.post("/campay/callback",           campayCallback); // sans token — appelé par CamPay

export default router;