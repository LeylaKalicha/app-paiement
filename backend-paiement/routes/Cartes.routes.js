import express from "express";
import { getMesCartes, creerCarte, bloquerCarte, debloquerCarte, supprimerCarte } from "../controllers/cartes.controller.js";
import verifierToken from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/mes-cartes",       verifierToken, getMesCartes);
router.post("/creer",           verifierToken, creerCarte);
router.put("/:id/bloquer",      verifierToken, bloquerCarte);
router.put("/:id/debloquer",    verifierToken, debloquerCarte);
router.delete("/:id",           verifierToken, supprimerCarte);

export default router;