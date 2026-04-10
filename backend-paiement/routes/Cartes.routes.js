import express from "express";
import {
  getMesCartes,
  creerCarte,
  bloquerCarte,
  debloquerCarte,
  supprimerCarte,
  rechargerCarte,   // ← NOUVEAU
} from "../controllers/Cartes.controller.js";
import verifierToken from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/mes-cartes",       verifierToken, getMesCartes);
router.post("/creer",           verifierToken, creerCarte);
router.put("/:id/bloquer",      verifierToken, bloquerCarte);
router.put("/:id/debloquer",    verifierToken, debloquerCarte);
router.delete("/:id",           verifierToken, supprimerCarte);
router.post("/:id/recharger",   verifierToken, rechargerCarte);   // ← NOUVEAU

export default router;










// import express from "express";
// import {
//   getMesCartes,
//   creerCarte,
//   bloquerCarte,
//   debloquerCarte,
//   supprimerCarte,
//   rechargerCarte,   // ← NOUVEAU
// } from "../controllers/carte.controller.js";
// import { authentifier } from "../middlewares/auth.middleware.js";
 
// const routerCartes = express.Router();
 
// routerCartes.get("/mes-cartes",           authentifier, getMesCartes);
// routerCartes.post("/creer",               authentifier, creerCarte);
// routerCartes.put("/:id/bloquer",          authentifier, bloquerCarte);
// routerCartes.put("/:id/debloquer",        authentifier, debloquerCarte);
// routerCartes.delete("/:id",              authentifier, supprimerCarte);
// routerCartes.post("/:id/recharger",      authentifier, rechargerCarte);   // ← NOUVEAU
 
// export default routerCartes;
 