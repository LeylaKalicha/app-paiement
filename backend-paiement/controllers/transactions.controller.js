// import db from "../config/db.js";
// import {
//   collecterPaiementCamPay,
//   verifierStatutCamPay,
//   disbursementCamPay,
//   formaterNumero,
// } from "../services/campay.service.js";

// // ═══════════════════════════════════════════════════════════════
// //  CONSTANTES
// // ═══════════════════════════════════════════════════════════════
// const TAUX_FRAIS   = 0.01;  // ✅ 1% exactement, sans plancher fixe
// const DEPOT_MIN    = 5;     // ✅ minimum dépôt : 5 XAF
// const DEPOT_MAX    = 5000000;
// const RETRAIT_MIN  = 5;     // ✅ minimum retrait : 5 XAF

// // ═══════════════════════════════════════════════════════════════
// //  MODE SIMULATION
// //  Passe à false en production CamPay réelle.
// // ═══════════════════════════════════════════════════════════════
// const SIMULATION_MODE = true;

// // ─── Helpers ────────────────────────────────────────────────────
// const obtenirOuCreerCompte = async (userId) => {
//   let [[compte]] = await db.query(
//     "SELECT id, solde FROM compte WHERE utilisateur_id = ?", [userId]
//   );
//   if (!compte) {
//     await db.query(
//       "INSERT INTO compte (utilisateur_id, solde, devise, created_at, updated_at) VALUES (?, 0.00, 'XAF', NOW(), NOW())",
//       [userId]
//     );
//     [[compte]] = await db.query(
//       "SELECT id, solde FROM compte WHERE utilisateur_id = ?", [userId]
//     );
//   }
//   return compte;
// };

// // ─── Calcul des frais : 1% du montant, arrondi à 2 décimales ───
// const calculerFrais = (montant) => {
//   return Math.round(montant * TAUX_FRAIS * 100) / 100;
// };

// const notif = async (userId, titre, message) => {
//   try {
//     await db.query(
//       "INSERT INTO notification (utilisateur_id, titre, message, dateEnvoi, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW(), NOW())",
//       [userId, titre, message]
//     );
//   } catch (e) { console.error("notif error:", e.message); }
// };

// // ═══════════════════════════════════════════════════════════════
// //  GET /api/transactions/mes-transactions
// // ═══════════════════════════════════════════════════════════════
// export const getMesTransactions = async (req, res) => {
//   try {
//     const [transactions] = await db.query(
//       `SELECT t.id, t.montant, t.statut, t.dateTransaction,
//               tr.type AS typeTransfert, tr.paysSource, tr.paysDestination
//        FROM transaction t
//        LEFT JOIN transfert tr ON tr.transaction_id = t.id
//        WHERE t.utilisateur_id = ?
//        ORDER BY t.dateTransaction DESC LIMIT 50`,
//       [req.utilisateur.id]
//     );
//     return res.json({ transactions });
//   } catch (e) {
//     return res.status(500).json({ message: "Erreur serveur." });
//   }
// };

// // ═══════════════════════════════════════════════════════════════
// //  POST /api/transactions/topup
// //  Dépôt Mobile Money → Wallet
// //  ✅ Min : 5 XAF | Frais internes : 0 XAF (gratuit pour l'utilisateur)
// // ═══════════════════════════════════════════════════════════════
// export const topUp = async (req, res) => {
//   try {
//     const userId = req.utilisateur.id;
//     const { montant, telephone } = req.body;

//     if (!montant || !telephone)
//       return res.status(400).json({ message: "Montant et téléphone obligatoires." });

//     const n = Number(montant);
//     if (n < DEPOT_MIN) return res.status(400).json({ message: `Minimum : ${DEPOT_MIN} XAF.` });
//     if (n > DEPOT_MAX) return res.status(400).json({ message: `Maximum : ${DEPOT_MAX.toLocaleString("fr-FR")} XAF.` });

//     await obtenirOuCreerCompte(userId);

//     const [tx] = await db.query(
//       "INSERT INTO transaction (utilisateur_id, montant, statut, dateTransaction, created_at, updated_at) VALUES (?, ?, 'EN_ATTENTE', NOW(), NOW(), NOW())",
//       [userId, n]
//     );
//     const txId = tx.insertId;
//     const ref  = `TOPUP-${txId}-${Date.now()}`;

//     await db.query("UPDATE transaction SET reference_externe = ? WHERE id = ?", [ref, txId]);

//     try {
//       const r = await collecterPaiementCamPay({
//         montant: n, telephone: formaterNumero(telephone),
//         description: "Dépôt PayVirtual", reference: ref,
//       });
//       const refFinale = r.reference || ref;
//       if (refFinale !== ref)
//         await db.query("UPDATE transaction SET reference_externe = ? WHERE id = ?", [refFinale, txId]);

//       await notif(userId, "Dépôt en attente ⏳", `Confirmez ${n} XAF sur votre téléphone.`);

//       return res.json({
//         message:   "📲 Entrez votre code PIN Mobile Money pour confirmer.",
//         reference: refFinale,
//         transaction: { id: txId, statut: "EN_ATTENTE" },
//         ussd_code: r.ussd_code || null,
//       });
//     } catch (e) {
//       await db.query("UPDATE transaction SET statut = 'ANNULEE', updated_at = NOW() WHERE id = ?", [txId]);
//       return res.status(500).json({ message: e.response?.data?.message || e.response?.data?.detail || "Erreur CamPay." });
//     }
//   } catch (e) {
//     console.error("topUp:", e);
//     return res.status(500).json({ message: "Erreur serveur." });
//   }
// };

// // ═══════════════════════════════════════════════════════════════
// //  GET /api/transactions/campay/verifier/:reference  (SANS TOKEN)
// //  ✅ Crédite le wallet dès confirmation CamPay
// // ═══════════════════════════════════════════════════════════════
// export const verifierPaiement = async (req, res) => {
//   try {
//     const ref  = req.params.reference;
//     const data = await verifierStatutCamPay(ref);
//     const st   = data?.status || "PENDING";

//     if (st === "SUCCESSFUL") {
//       const [[tx]] = await db.query(
//         "SELECT id, utilisateur_id, montant FROM transaction WHERE reference_externe = ? AND statut = 'EN_ATTENTE' LIMIT 1",
//         [ref]
//       );
//       if (tx) {
//         // ✅ Créditer le wallet
//         await db.query("UPDATE transaction SET statut = 'VALIDEE', updated_at = NOW() WHERE id = ?", [tx.id]);
//         await db.query("UPDATE compte SET solde = solde + ?, updated_at = NOW() WHERE utilisateur_id = ?",
//           [Math.abs(Number(tx.montant)), tx.utilisateur_id]);
//         await notif(tx.utilisateur_id, "Dépôt reçu ✅", `${Math.abs(Number(tx.montant))} XAF crédités sur votre wallet.`);
//         const [[c]] = await db.query("SELECT solde FROM compte WHERE utilisateur_id = ?", [tx.utilisateur_id]);
//         return res.json({ status:"SUCCESSFUL", message:"✅ Wallet crédité !", nouveauSolde: c?.solde || 0 });
//       }
//       return res.json({ status:"SUCCESSFUL", message:"Déjà traité." });
//     }

//     if (st === "FAILED") {
//       await db.query("UPDATE transaction SET statut = 'ANNULEE', updated_at = NOW() WHERE reference_externe = ? AND statut = 'EN_ATTENTE'", [ref]);
//       return res.json({ status:"FAILED", message:"Paiement refusé." });
//     }

//     return res.json({ ...data, status: st });
//   } catch (e) {
//     return res.json({ status:"PENDING", message:"Vérification en cours..." });
//   }
// };

// // ═══════════════════════════════════════════════════════════════
// //  POST /api/transactions/campay/callback  (SANS TOKEN)
// // ═══════════════════════════════════════════════════════════════
// export const campayCallback = async (req, res) => {
//   try {
//     const { reference, status } = req.body;
//     if (!reference) return res.status(400).json({ message: "Référence manquante." });
//     const [[tx]] = await db.query(
//       "SELECT id, utilisateur_id, montant FROM transaction WHERE reference_externe = ? AND statut = 'EN_ATTENTE' LIMIT 1",
//       [reference]
//     );
//     if (!tx) return res.json({ message: "Déjà traité." });
//     if (status === "SUCCESSFUL") {
//       await db.query("UPDATE transaction SET statut = 'VALIDEE', updated_at = NOW() WHERE id = ?", [tx.id]);
//       await db.query("UPDATE compte SET solde = solde + ?, updated_at = NOW() WHERE utilisateur_id = ?",
//         [Math.abs(Number(tx.montant)), tx.utilisateur_id]);
//       await notif(tx.utilisateur_id, "Dépôt reçu ✅", `${Math.abs(Number(tx.montant))} XAF crédités.`);
//     } else {
//       await db.query("UPDATE transaction SET statut = 'ANNULEE', updated_at = NOW() WHERE id = ?", [tx.id]);
//     }
//     return res.json({ message: "OK" });
//   } catch (e) {
//     return res.status(500).json({ message: "Erreur serveur." });
//   }
// };

// // ═══════════════════════════════════════════════════════════════
// //  POST /api/transactions/retrait
// //  ✅ Frais : 1% du montant (pas de minimum fixe)
// //  ✅ Minimum : 5 XAF
// //  ✅ Débit wallet immédiat (simulation)
// //  ✅ SMS notification au destinataire Mobile Money
// // ═══════════════════════════════════════════════════════════════
// export const retrait = async (req, res) => {
//   try {
//     const userId = req.utilisateur.id;
//     const { montant, telephone, nomBeneficiaire, numeroCompte, banque, raison } = req.body;

//     if (!montant) return res.status(400).json({ message: "Montant obligatoire." });

//     const n        = Number(montant);
//     const isMobile = !!telephone;

//     if (n < RETRAIT_MIN) return res.status(400).json({ message: `Minimum : ${RETRAIT_MIN} XAF.` });

//     // ✅ FRAIS : 1% du montant, sans plancher fixe
//     const frais      = calculerFrais(n);
//     const totalDebit = parseFloat((n + frais).toFixed(2));

//     const compte      = await obtenirOuCreerCompte(userId);
//     const soldeActuel = Number(compte.solde);

//     console.log(`💰 Retrait | solde=${soldeActuel} | montant=${n} | frais=${frais} (1%) | total=${totalDebit}`);

//     if (soldeActuel < totalDebit)
//       return res.status(400).json({
//         message: `Solde insuffisant. Besoin : ${n} + ${frais} XAF (frais 1%) = ${totalDebit} XAF. Votre solde : ${soldeActuel} XAF.`,
//       });

//     const ref = `RETRAIT-${userId}-${Date.now()}`;

//     // ✅ Débiter le wallet immédiatement
//     await db.query(
//       "UPDATE compte SET solde = solde - ?, updated_at = NOW() WHERE utilisateur_id = ?",
//       [totalDebit, userId]
//     );

//     const [txRow] = await db.query(
//       "INSERT INTO transaction (utilisateur_id, montant, statut, reference_externe, dateTransaction, created_at, updated_at) VALUES (?, ?, 'EN_ATTENTE', ?, NOW(), NOW(), NOW())",
//       [userId, -totalDebit, ref]
//     );
//     const txId = txRow.insertId;

//     // ── Mobile Money ───────────────────────────────────────────
//     if (isMobile) {
//       const num = formaterNumero(telephone);

//       // ── MODE SIMULATION ────────────────────────────────────
//       if (SIMULATION_MODE) {
//         console.log(`🧪 [SIMULATION] Retrait Mobile Money → ${num} | ${n} XAF | frais 1% : ${frais} XAF`);

//         await db.query(
//           "UPDATE transaction SET statut = 'VALIDEE', updated_at = NOW() WHERE id = ?",
//           [txId]
//         );

//         // ✅ Notification à l'expéditeur
//         await notif(
//           userId,
//           "Retrait effectué ✅",
//           `${n} XAF envoyés au +237${num.replace(/^237/, "")}. Frais : ${frais} XAF (1%).`
//         );

//         // ✅ Simulation SMS au destinataire (notification interne si le numéro correspond à un utilisateur)
//         const numeroLocal = num.replace(/^237/, "");
//         const [[destUser]] = await db.query(
//           "SELECT id FROM utilisateur WHERE telephone LIKE ? LIMIT 1",
//           [`%${numeroLocal}`]
//         ).catch(() => [[]]);

//         if (destUser) {
//           await notif(
//             destUser.id,
//             "💰 Dépôt Mobile Money reçu",
//             `Vous avez reçu ${n} XAF sur votre numéro +237${numeroLocal} via PayVirtual.`
//           );
//         }

//         const [[c]] = await db.query("SELECT solde FROM compte WHERE utilisateur_id = ?", [userId]);

//         return res.json({
//           message: `✅ ${n} XAF envoyés sur +237${num.replace(/^237/, "")}. Un SMS de confirmation a été envoyé au destinataire.`,
//           transaction: { id: txId, montant: -totalDebit, statut: "VALIDEE" },
//           nouveauSolde: c?.solde || 0,
//           reference: ref,
//           simulation: true,
//         });
//       }

//       // ── MODE PRODUCTION ────────────────────────────────────
//       if (num.length < 12) {
//         // Rembourser si numéro invalide
//         await db.query("UPDATE compte SET solde = solde + ?, updated_at = NOW() WHERE utilisateur_id = ?", [totalDebit, userId]);
//         await db.query("UPDATE transaction SET statut = 'ANNULEE', updated_at = NOW() WHERE id = ?", [txId]);
//         return res.status(400).json({ message: "Numéro invalide (9 chiffres requis)." });
//       }

//       try {
//         await disbursementCamPay({
//           montant: n,
//           telephone: num,
//           description: `Retrait PayVirtual${raison ? " - " + raison : ""}`,
//           reference: ref,
//         });
//         await db.query("UPDATE transaction SET statut = 'VALIDEE', updated_at = NOW() WHERE id = ?", [txId]);
//         await notif(userId, "Retrait effectué ✅", `${n} XAF envoyés sur ${num}. Frais : ${frais} XAF (1%).`);
//         const [[c]] = await db.query("SELECT solde FROM compte WHERE utilisateur_id = ?", [userId]);
//         return res.json({
//           message: `✅ ${n} XAF envoyés sur ${num}. SMS de confirmation envoyé au destinataire.`,
//           transaction: { id: txId, montant: -totalDebit, statut: "VALIDEE" },
//           nouveauSolde: c?.solde || 0,
//           reference: ref,
//         });
//       } catch (e) {
//         // Rembourser si CamPay échoue
//         await db.query("UPDATE compte SET solde = solde + ?, updated_at = NOW() WHERE utilisateur_id = ?", [totalDebit, userId]);
//         await db.query("UPDATE transaction SET statut = 'ANNULEE', updated_at = NOW() WHERE id = ?", [txId]);
//         return res.status(500).json({
//           message: e.response?.data?.message || e.response?.data?.detail || "Erreur CamPay. Solde remboursé.",
//         });
//       }
//     }

//     // ── Virement bancaire ─────────────────────────────────────
//     await db.query("UPDATE transaction SET statut = 'VALIDEE', updated_at = NOW() WHERE id = ?", [txId]);
//     await db.query(
//       "INSERT INTO transfert (type, paysSource, paysDestination, transaction_id, created_at, updated_at) VALUES ('LOCAL','Cameroun','Cameroun',?,NOW(),NOW())",
//       [txId]
//     );
//     await notif(
//       userId,
//       "Retrait bancaire ✅",
//       `${n} XAF vers ${nomBeneficiaire || "bénéficiaire"} (${banque || "banque"}). Frais : ${frais} XAF (1%).`
//     );
//     const [[c]] = await db.query("SELECT solde FROM compte WHERE utilisateur_id = ?", [userId]);
//     return res.json({
//       message: `✅ Virement de ${n} XAF initié vers ${nomBeneficiaire} (${banque}).`,
//       transaction: { id: txId, montant: -totalDebit, statut: "VALIDEE" },
//       nouveauSolde: c?.solde || 0,
//     });

//   } catch (e) {
//     console.error("retrait:", e);
//     return res.status(500).json({ message: "Erreur serveur : " + e.message });
//   }
// };

// // ═══════════════════════════════════════════════════════════════
// //  POST /api/transactions/transfert
// //  ✅ Wallet P2P PayVirtual : GRATUIT (0 frais)
// //  ✅ Mobile Money : 1% du montant (sans plancher)
// //  ✅ Débit wallet dans tous les cas
// //  ✅ SMS/notification au destinataire
// // ═══════════════════════════════════════════════════════════════
// export const transfert = async (req, res) => {
//   try {
//     const userId = req.utilisateur.id;
//     const { montant, type, nomBeneficiaire, numeroCompte, banque, paysSrc, paysDest, raison } = req.body;

//     if (!montant || !nomBeneficiaire)
//       return res.status(400).json({ message: "Montant et bénéficiaire obligatoires." });

//     const n      = Math.abs(Number(montant));
//     const compte = await obtenirOuCreerCompte(userId);

//     if (Number(compte.solde) < n)
//       return res.status(400).json({ message: `Solde insuffisant. Disponible : ${Number(compte.solde)} XAF.` });

//     // ── Wallet interne PayVirtual (GRATUIT) ───────────────────
//     if (type === "wallet" || type === "payvirtual" || type === "payvirtual_business") {
//       if (!numeroCompte) return res.status(400).json({ message: "Email du destinataire obligatoire." });

//       const [[dest]] = await db.query(
//         "SELECT id, nom, email FROM utilisateur WHERE email = ? AND statut = 'ACTIF'",
//         [numeroCompte]
//       );
//       if (!dest) return res.status(404).json({ message: `Aucun compte trouvé : ${numeroCompte}` });
//       if (dest.id === userId) return res.status(400).json({ message: "Auto-transfert impossible." });

//       await obtenirOuCreerCompte(dest.id);

//       // ✅ Débiter l'expéditeur (0 frais)
//       await db.query("UPDATE compte SET solde = solde - ?, updated_at = NOW() WHERE utilisateur_id = ?", [n, userId]);
//       // ✅ Créditer le destinataire
//       await db.query("UPDATE compte SET solde = solde + ?, updated_at = NOW() WHERE utilisateur_id = ?", [n, dest.id]);

//       const [tx] = await db.query(
//         "INSERT INTO transaction (utilisateur_id, montant, statut, dateTransaction, created_at, updated_at) VALUES (?, ?, 'VALIDEE', NOW(), NOW(), NOW())",
//         [userId, -n]
//       );
//       await db.query(
//         "INSERT INTO transaction (utilisateur_id, montant, statut, dateTransaction, created_at, updated_at) VALUES (?, ?, 'VALIDEE', NOW(), NOW(), NOW())",
//         [dest.id, n]
//       );
//       await db.query(
//         "INSERT INTO transfert (type, paysSource, paysDestination, transaction_id, created_at, updated_at) VALUES ('LOCAL','Cameroun','Cameroun',?,NOW(),NOW())",
//         [tx.insertId]
//       );

//       // ✅ Notifications des deux côtés
//       await notif(dest.id, "💰 Argent reçu",  `${n} XAF reçus sur votre wallet PayVirtual.${raison ? " Raison : " + raison : ""}`);
//       await notif(userId,  "Transfert ✅",     `${n} XAF envoyés à ${dest.nom} (0 frais — PayVirtual gratuit).`);

//       const [[c]] = await db.query("SELECT solde FROM compte WHERE utilisateur_id = ?", [userId]);
//       return res.json({
//         message: `✅ ${n} XAF envoyés à ${dest.nom} instantanément (0 frais) !`,
//         nouveauSolde: c.solde,
//         destinataire: { nom: dest.nom },
//       });
//     }

//     // ── Mobile Money (1% de frais, sans plancher) ─────────────
//     if (type === "mtn" || type === "orange" || type === "mobile_money") {
//       if (!numeroCompte) return res.status(400).json({ message: "Numéro Mobile Money obligatoire." });

//       // ✅ Frais : 1% du montant envoyé
//       const frais      = calculerFrais(n);
//       const totalDebit = parseFloat((n + frais).toFixed(2));

//       if (Number(compte.solde) < totalDebit)
//         return res.status(400).json({
//           message: `Solde insuffisant. Avec frais 1% (${frais} XAF) : total ${totalDebit} XAF. Disponible : ${Number(compte.solde)} XAF.`,
//         });

//       const num = formaterNumero(numeroCompte);
//       const ref = `MMTRANSFER-${userId}-${Date.now()}`;

//       // ✅ Débiter le wallet
//       await db.query("UPDATE compte SET solde = solde - ?, updated_at = NOW() WHERE utilisateur_id = ?", [totalDebit, userId]);
//       const [tx] = await db.query(
//         "INSERT INTO transaction (utilisateur_id, montant, statut, reference_externe, dateTransaction, created_at, updated_at) VALUES (?, ?, 'EN_ATTENTE', ?, NOW(), NOW(), NOW())",
//         [userId, -totalDebit, ref]
//       );

//       // ── MODE SIMULATION ────────────────────────────────────
//       if (SIMULATION_MODE) {
//         console.log(`🧪 [SIMULATION] Transfert MoMo → ${num} | ${n} XAF | frais 1% : ${frais} XAF`);

//         await db.query("UPDATE transaction SET statut = 'VALIDEE', updated_at = NOW() WHERE id = ?", [tx.insertId]);
//         await db.query(
//           "INSERT INTO transfert (type, paysSource, paysDestination, transaction_id, created_at, updated_at) VALUES ('LOCAL','Cameroun','Cameroun',?,NOW(),NOW())",
//           [tx.insertId]
//         );

//         // ✅ Notification à l'expéditeur
//         await notif(
//           userId,
//           "Transfert MoMo ✅",
//           `${n} XAF envoyés à ${nomBeneficiaire || num}. Frais : ${frais} XAF (1%). Le destinataire a reçu un SMS.`
//         );

//         // ✅ Simulation notification au destinataire (si utilisateur interne)
//         const numeroLocal = num.replace(/^237/, "");
//         const [[destUser]] = await db.query(
//           "SELECT id FROM utilisateur WHERE telephone LIKE ? LIMIT 1",
//           [`%${numeroLocal}`]
//         ).catch(() => [[]]);

//         if (destUser) {
//           await notif(
//             destUser.id,
//             "💰 Dépôt Mobile Money reçu",
//             `Vous avez reçu ${n} XAF sur votre numéro +237${numeroLocal} via PayVirtual.`
//           );
//         }

//         const [[c]] = await db.query("SELECT solde FROM compte WHERE utilisateur_id = ?", [userId]);
//         return res.json({
//           message: `✅ ${n} XAF envoyés à ${nomBeneficiaire || `+237${numeroLocal}`}. Un SMS de confirmation a été envoyé au destinataire.`,
//           nouveauSolde: c?.solde || 0,
//           simulation: true,
//         });
//       }

//       // ── MODE PRODUCTION ────────────────────────────────────
//       try {
//         await disbursementCamPay({
//           montant: n,
//           telephone: num,
//           description: `PayVirtual${raison ? " - " + raison : ""}`,
//           reference: ref,
//         });
//         await db.query("UPDATE transaction SET statut = 'VALIDEE', updated_at = NOW() WHERE id = ?", [tx.insertId]);
//         await db.query(
//           "INSERT INTO transfert (type, paysSource, paysDestination, transaction_id, created_at, updated_at) VALUES ('LOCAL','Cameroun','Cameroun',?,NOW(),NOW())",
//           [tx.insertId]
//         );
//         await notif(userId, "Transfert MoMo ✅", `${n} XAF envoyés à ${nomBeneficiaire || num}. Frais : ${frais} XAF (1%).`);
//         const [[c]] = await db.query("SELECT solde FROM compte WHERE utilisateur_id = ?", [userId]);
//         return res.json({
//           message: `✅ ${n} XAF envoyés à ${nomBeneficiaire || num}. SMS de confirmation envoyé.`,
//           nouveauSolde: c?.solde || 0,
//         });
//       } catch (e) {
//         // Rembourser si CamPay échoue
//         await db.query("UPDATE compte SET solde = solde + ?, updated_at = NOW() WHERE utilisateur_id = ?", [totalDebit, userId]);
//         await db.query("UPDATE transaction SET statut = 'ANNULEE', updated_at = NOW() WHERE id = ?", [tx.insertId]);
//         return res.status(500).json({ message: e.response?.data?.message || "Erreur CamPay. Solde remboursé." });
//       }
//     }

//     // ── Virement bancaire externe ─────────────────────────────
//     const frais      = calculerFrais(n);
//     const totalDebit = parseFloat((n + frais).toFixed(2));

//     if (Number(compte.solde) < totalDebit)
//       return res.status(400).json({ message: `Solde insuffisant. Total avec frais 1% : ${totalDebit} XAF.` });

//     await db.query("UPDATE compte SET solde = solde - ?, updated_at = NOW() WHERE utilisateur_id = ?", [totalDebit, userId]);
//     const [tx] = await db.query(
//       "INSERT INTO transaction (utilisateur_id, montant, statut, dateTransaction, created_at, updated_at) VALUES (?, ?, 'VALIDEE', NOW(), NOW(), NOW())",
//       [userId, -totalDebit]
//     );
//     await db.query(
//       "INSERT INTO transfert (type, paysSource, paysDestination, transaction_id, created_at, updated_at) VALUES ('INTERNATIONAL',?,?,?,NOW(),NOW())",
//       [paysSrc || "Cameroun", paysDest || "Cameroun", tx.insertId]
//     );
//     await notif(userId, "Virement ✅", `${n} XAF vers ${nomBeneficiaire}. Frais : ${frais} XAF (1%).`);
//     const [[c]] = await db.query("SELECT solde FROM compte WHERE utilisateur_id = ?", [userId]);
//     return res.json({
//       message: `✅ Virement de ${n} XAF vers ${nomBeneficiaire} !`,
//       nouveauSolde: c?.solde || 0,
//     });

//   } catch (e) {
//     console.error("transfert:", e);
//     return res.status(500).json({ message: "Erreur serveur : " + e.message });
//   }
// };















import db from "../config/db.js";
import {
  collecterPaiementCamPay,
  verifierStatutCamPay,
  disbursementCamPay,
  formaterNumero,
} from "../services/campay.service.js";

// ═══════════════════════════════════════════════════════════════
//  FRAIS — fixes, jamais plus de 2 XAF
// ═══════════════════════════════════════════════════════════════
const FRAIS_MOBILE  = 1;   // 1 XAF fixe — Mobile Money
const FRAIS_BANQUE  = 2;   // 2 XAF fixe — Banque
const DEPOT_MIN     = 1;
const DEPOT_MAX     = 25;
const RETRAIT_MIN   = 1;

// ═══════════════════════════════════════════════════════════════
//  MODE SIMULATION
//  En mode démo CamPay, les disbursements échouent car le solde
//  marchand est à 0. On simule le succès localement :
//  le wallet est débité + la transaction est enregistrée VALIDEE.
//  Passe à false quand tu passes en production CamPay réelle.
// ═══════════════════════════════════════════════════════════════
const SIMULATION_MODE = true;

// ─── Helpers ────────────────────────────────────────────────────
const obtenirOuCreerCompte = async (userId) => {
  let [[compte]] = await db.query(
    "SELECT id, solde FROM compte WHERE utilisateur_id = ?", [userId]
  );
  if (!compte) {
    await db.query(
      "INSERT INTO compte (utilisateur_id, solde, devise, created_at, updated_at) VALUES (?, 0.00, 'XAF', NOW(), NOW(), NOW())",
      [userId]
    );
    [[compte]] = await db.query(
      "SELECT id, solde FROM compte WHERE utilisateur_id = ?", [userId]
    );
  }
  return compte;
};

const notif = async (userId, titre, message) => {
  try {
    await db.query(
      "INSERT INTO notification (utilisateur_id, titre, message, dateEnvoi, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW(), NOW())",
      [userId, titre, message]
    );
  } catch (e) { console.error("notif error:", e.message); }
};

// ═══════════════════════════════════════════════════════════════
//  GET /api/transactions/mes-transactions
// ═══════════════════════════════════════════════════════════════
export const getMesTransactions = async (req, res) => {
  try {
    const [transactions] = await db.query(
      `SELECT t.id, t.montant, t.statut, t.dateTransaction,
              tr.type AS typeTransfert, tr.paysSource, tr.paysDestination
       FROM transaction t
       LEFT JOIN transfert tr ON tr.transaction_id = t.id
       WHERE t.utilisateur_id = ?
       ORDER BY t.dateTransaction DESC LIMIT 50`,
      [req.utilisateur.id]
    );
    return res.json({ transactions });
  } catch (e) {
    return res.status(500).json({ message: "Erreur serveur." });
  }
};

// ═══════════════════════════════════════════════════════════════
//  POST /api/transactions/topup
//  Dépôt Mobile Money → Wallet
//  Min : 1 XAF | Max : 25 XAF | Frais internes : 0 XAF
// ═══════════════════════════════════════════════════════════════
export const topUp = async (req, res) => {
  try {
    const userId = req.utilisateur.id;
    const { montant, telephone } = req.body;

    if (!montant || !telephone)
      return res.status(400).json({ message: "Montant et téléphone obligatoires." });

    const n = Number(montant);
    if (n < DEPOT_MIN) return res.status(400).json({ message: `Minimum : ${DEPOT_MIN} XAF.` });
    if (n > DEPOT_MAX) return res.status(400).json({ message: `Maximum : ${DEPOT_MAX} XAF.` });

    await obtenirOuCreerCompte(userId);

    const [tx] = await db.query(
      "INSERT INTO transaction (utilisateur_id, montant, statut, dateTransaction, created_at, updated_at) VALUES (?, ?, 'EN_ATTENTE', NOW(), NOW(), NOW())",
      [userId, n]
    );
    const txId = tx.insertId;
    const ref  = `TOPUP-${txId}-${Date.now()}`;

    await db.query("UPDATE transaction SET reference_externe = ? WHERE id = ?", [ref, txId]);

    try {
      const r = await collecterPaiementCamPay({
        montant: n, telephone: formaterNumero(telephone),
        description: "Dépôt PayVirtual", reference: ref,
      });
      const refFinale = r.reference || ref;
      if (refFinale !== ref)
        await db.query("UPDATE transaction SET reference_externe = ? WHERE id = ?", [refFinale, txId]);

      await notif(userId, "Dépôt en attente ⏳", `Confirmez ${n} XAF sur votre téléphone.`);

      return res.json({
        message:   "📲 Entrez votre code PIN sur votre téléphone pour confirmer.",
        reference: refFinale,
        transaction: { id: txId, statut: "EN_ATTENTE" },
        ussd_code: r.ussd_code || null,
      });
    } catch (e) {
      await db.query("UPDATE transaction SET statut = 'ANNULEE', updated_at = NOW() WHERE id = ?", [txId]);
      return res.status(500).json({ message: e.response?.data?.message || e.response?.data?.detail || "Erreur CamPay." });
    }
  } catch (e) {
    console.error("topUp:", e);
    return res.status(500).json({ message: "Erreur serveur." });
  }
};

// ═══════════════════════════════════════════════════════════════
//  GET /api/transactions/campay/verifier/:reference  (SANS TOKEN)
// ═══════════════════════════════════════════════════════════════
export const verifierPaiement = async (req, res) => {
  try {
    const ref  = req.params.reference;
    const data = await verifierStatutCamPay(ref);
    const st   = data?.status || "PENDING";

    if (st === "SUCCESSFUL") {
      const [[tx]] = await db.query(
        "SELECT id, utilisateur_id, montant FROM transaction WHERE reference_externe = ? AND statut = 'EN_ATTENTE' LIMIT 1",
        [ref]
      );
      if (tx) {
        await db.query("UPDATE transaction SET statut = 'VALIDEE', updated_at = NOW() WHERE id = ?", [tx.id]);
        await db.query("UPDATE compte SET solde = solde + ?, updated_at = NOW() WHERE utilisateur_id = ?",
          [Math.abs(Number(tx.montant)), tx.utilisateur_id]);
        await notif(tx.utilisateur_id, "Dépôt reçu ✅", `${Math.abs(Number(tx.montant))} XAF crédités.`);
        const [[c]] = await db.query("SELECT solde FROM compte WHERE utilisateur_id = ?", [tx.utilisateur_id]);
        return res.json({ status:"SUCCESSFUL", message:"✅ Wallet crédité !", nouveauSolde: c?.solde || 0 });
      }
      return res.json({ status:"SUCCESSFUL", message:"Déjà traité." });
    }

    if (st === "FAILED") {
      await db.query("UPDATE transaction SET statut = 'ANNULEE', updated_at = NOW() WHERE reference_externe = ? AND statut = 'EN_ATTENTE'", [ref]);
      return res.json({ status:"FAILED", message:"Paiement refusé." });
    }

    return res.json({ ...data, status: st });
  } catch (e) {
    return res.json({ status:"PENDING", message:"Vérification en cours..." });
  }
};

// ═══════════════════════════════════════════════════════════════
//  POST /api/transactions/campay/callback  (SANS TOKEN)
// ═══════════════════════════════════════════════════════════════
export const campayCallback = async (req, res) => {
  try {
    const { reference, status } = req.body;
    if (!reference) return res.status(400).json({ message: "Référence manquante." });
    const [[tx]] = await db.query(
      "SELECT id, utilisateur_id, montant FROM transaction WHERE reference_externe = ? AND statut = 'EN_ATTENTE' LIMIT 1",
      [reference]
    );
    if (!tx) return res.json({ message: "Déjà traité." });
    if (status === "SUCCESSFUL") {
      await db.query("UPDATE transaction SET statut = 'VALIDEE', updated_at = NOW() WHERE id = ?", [tx.id]);
      await db.query("UPDATE compte SET solde = solde + ?, updated_at = NOW() WHERE utilisateur_id = ?",
        [Math.abs(Number(tx.montant)), tx.utilisateur_id]);
      await notif(tx.utilisateur_id, "Dépôt reçu ✅", `${Math.abs(Number(tx.montant))} XAF crédités.`);
    } else {
      await db.query("UPDATE transaction SET statut = 'ANNULEE', updated_at = NOW() WHERE id = ?", [tx.id]);
    }
    return res.json({ message: "OK" });
  } catch (e) {
    return res.status(500).json({ message: "Erreur serveur." });
  }
};

// ═══════════════════════════════════════════════════════════════
//  POST /api/transactions/retrait
//  Frais FIXE : 1 XAF mobile | 2 XAF banque (JAMAIS PLUS)
//  Minimum : 1 XAF
//  En SIMULATION_MODE : bypass CamPay, débite + enregistre VALIDEE
// ═══════════════════════════════════════════════════════════════
export const retrait = async (req, res) => {
  try {
    const userId = req.utilisateur.id;
    const { montant, telephone, nomBeneficiaire, numeroCompte, banque, raison } = req.body;

    if (!montant) return res.status(400).json({ message: "Montant obligatoire." });

    const n        = Number(montant);
    const isMobile = !!telephone;

    if (n < RETRAIT_MIN) return res.status(400).json({ message: `Minimum : ${RETRAIT_MIN} XAF.` });

    // ✅ FRAIS FIXE — 1 XAF mobile, 2 XAF banque
    const frais      = isMobile ? FRAIS_MOBILE : FRAIS_BANQUE;
    const totalDebit = n + frais;

    const compte      = await obtenirOuCreerCompte(userId);
    const soldeActuel = Number(compte.solde);

    console.log(`💰 Retrait | solde=${soldeActuel} | montant=${n} | frais=${frais} | total=${totalDebit}`);

    if (soldeActuel < totalDebit)
      return res.status(400).json({
        message: `Solde insuffisant. Il faut ${n} + ${frais} XAF frais = ${totalDebit} XAF. Votre solde : ${soldeActuel} XAF.`,
      });

    const ref = `RETRAIT-${userId}-${Date.now()}`;

    // ── Débiter le wallet ──────────────────────────────────────
    await db.query(
      "UPDATE compte SET solde = solde - ?, updated_at = NOW() WHERE utilisateur_id = ?",
      [totalDebit, userId]
    );

    const [txRow] = await db.query(
      "INSERT INTO transaction (utilisateur_id, montant, statut, reference_externe, dateTransaction, created_at, updated_at) VALUES (?, ?, 'EN_ATTENTE', ?, NOW(), NOW(), NOW())",
      [userId, -totalDebit, ref]
    );
    const txId = txRow.insertId;

    // ── Mobile Money ───────────────────────────────────────────
    if (isMobile) {
      const num = formaterNumero(telephone);

      // ── MODE SIMULATION (compte démo CamPay) ───────────────
      if (SIMULATION_MODE) {
        console.log(`🧪 [SIMULATION] Retrait Mobile Money → ${num} | ${n} XAF | frais ${frais} XAF`);

        // Marquer la transaction VALIDEE directement
        await db.query(
          "UPDATE transaction SET statut = 'VALIDEE', updated_at = NOW() WHERE id = ?",
          [txId]
        );

        await notif(
          userId,
          "Retrait effectué ✅ (simulation)",
          `${n} XAF envoyés sur +237${num.replace(/^237/, "")}. Frais : ${frais} XAF fixe.`
        );

        const [[c]] = await db.query(
          "SELECT solde FROM compte WHERE utilisateur_id = ?",
          [userId]
        );

        return res.json({
          message: `✅ ${n} XAF envoyés sur +237${num.replace(/^237/, "")}. (Mode simulation — compte démo CamPay)`,
          transaction: { id: txId, montant: -totalDebit, statut: "VALIDEE" },
          nouveauSolde: c?.solde || 0,
          reference: ref,
          simulation: true,
        });
      }

      // ── MODE PRODUCTION (vrai appel CamPay) ────────────────
      if (num.length < 12) {
        await db.query("UPDATE compte SET solde = solde + ?, updated_at = NOW() WHERE utilisateur_id = ?", [totalDebit, userId]);
        await db.query("UPDATE transaction SET statut = 'ANNULEE', updated_at = NOW() WHERE id = ?", [txId]);
        return res.status(400).json({ message: "Numéro invalide (9 chiffres requis)." });
      }

      try {
        await disbursementCamPay({
          montant: n,
          telephone: num,
          description: `Retrait PayVirtual${raison ? " - " + raison : ""}`,
          reference: ref,
        });
        await db.query("UPDATE transaction SET statut = 'VALIDEE', updated_at = NOW() WHERE id = ?", [txId]);
        await notif(userId, "Retrait effectué ✅", `${n} XAF envoyés sur ${num}. Frais : ${frais} XAF.`);
        const [[c]] = await db.query("SELECT solde FROM compte WHERE utilisateur_id = ?", [userId]);
        return res.json({
          message: `✅ ${n} XAF envoyés sur ${num}. SMS de confirmation en route.`,
          transaction: { id: txId, montant: -totalDebit, statut: "VALIDEE" },
          nouveauSolde: c?.solde || 0,
          reference: ref,
        });
      } catch (e) {
        // Rembourser si CamPay échoue
        await db.query("UPDATE compte SET solde = solde + ?, updated_at = NOW() WHERE utilisateur_id = ?", [totalDebit, userId]);
        await db.query("UPDATE transaction SET statut = 'ANNULEE', updated_at = NOW() WHERE id = ?", [txId]);
        return res.status(500).json({
          message: e.response?.data?.message || e.response?.data?.detail || "Erreur CamPay. Solde non débité.",
        });
      }
    }

    // ── Virement bancaire (pas de CamPay nécessaire) ──────────
    await db.query("UPDATE transaction SET statut = 'VALIDEE', updated_at = NOW() WHERE id = ?", [txId]);
    await db.query(
      "INSERT INTO transfert (type, paysSource, paysDestination, transaction_id, created_at, updated_at) VALUES ('LOCAL','Cameroun','Cameroun',?,NOW(),NOW())",
      [txId]
    );
    await notif(
      userId,
      "Retrait bancaire ✅",
      `${n} XAF vers ${nomBeneficiaire || "bénéficiaire"} (${banque || "banque"}).`
    );
    const [[c]] = await db.query("SELECT solde FROM compte WHERE utilisateur_id = ?", [userId]);
    return res.json({
      message: `✅ Virement de ${n} XAF initié vers ${nomBeneficiaire} (${banque}).`,
      transaction: { id: txId, montant: -totalDebit, statut: "VALIDEE" },
      nouveauSolde: c?.solde || 0,
    });

  } catch (e) {
    console.error("retrait:", e);
    return res.status(500).json({ message: "Erreur serveur : " + e.message });
  }
};

// ═══════════════════════════════════════════════════════════════
//  POST /api/transactions/transfert
//  Wallet interne : gratuit | Mobile Money : 1 XAF frais fixe
// ═══════════════════════════════════════════════════════════════
export const transfert = async (req, res) => {
  try {
    const userId = req.utilisateur.id;
    const { montant, type, nomBeneficiaire, numeroCompte, banque, paysSrc, paysDest, raison } = req.body;

    if (!montant || !nomBeneficiaire)
      return res.status(400).json({ message: "Montant et bénéficiaire obligatoires." });

    const n      = Math.abs(Number(montant));
    const compte = await obtenirOuCreerCompte(userId);

    if (Number(compte.solde) < n)
      return res.status(400).json({ message: `Solde insuffisant. Disponible : ${Number(compte.solde)} XAF.` });

    // ── Wallet interne (gratuit) ──────────────────────────────
    if (type === "wallet" || type === "payvirtual" || type === "payvirtual_business") {
      if (!numeroCompte) return res.status(400).json({ message: "Email du destinataire obligatoire." });
      const [[dest]] = await db.query(
        "SELECT id, nom, email FROM utilisateur WHERE email = ? AND statut = 'ACTIF'",
        [numeroCompte]
      );
      if (!dest) return res.status(404).json({ message: `Aucun compte : ${numeroCompte}` });
      if (dest.id === userId) return res.status(400).json({ message: "Auto-transfert impossible." });

      await obtenirOuCreerCompte(dest.id);
      await db.query("UPDATE compte SET solde = solde - ?, updated_at = NOW() WHERE utilisateur_id = ?", [n, userId]);
      await db.query("UPDATE compte SET solde = solde + ?, updated_at = NOW() WHERE utilisateur_id = ?", [n, dest.id]);

      const [tx] = await db.query(
        "INSERT INTO transaction (utilisateur_id, montant, statut, dateTransaction, created_at, updated_at) VALUES (?, ?, 'VALIDEE', NOW(), NOW(), NOW())",
        [userId, -n]
      );
      await db.query(
        "INSERT INTO transaction (utilisateur_id, montant, statut, dateTransaction, created_at, updated_at) VALUES (?, ?, 'VALIDEE', NOW(), NOW(), NOW())",
        [dest.id, n]
      );
      await db.query(
        "INSERT INTO transfert (type, paysSource, paysDestination, transaction_id, created_at, updated_at) VALUES ('LOCAL','Cameroun','Cameroun',?,NOW(),NOW())",
        [tx.insertId]
      );

      await notif(dest.id, "💰 Argent reçu", `${n} XAF reçus sur votre wallet.${raison ? " Raison : " + raison : ""}`);
      await notif(userId,  "Transfert ✅",    `${n} XAF envoyés à ${dest.nom}.`);

      const [[c]] = await db.query("SELECT solde FROM compte WHERE utilisateur_id = ?", [userId]);
      return res.json({
        message: `✅ ${n} XAF envoyés à ${dest.nom} !`,
        nouveauSolde: c.solde,
        destinataire: { nom: dest.nom },
      });
    }

    // ── Mobile Money (1 XAF frais fixe) ──────────────────────
    if (type === "mtn" || type === "orange" || type === "mobile_money") {
      if (!numeroCompte) return res.status(400).json({ message: "Numéro Mobile Money obligatoire." });

      const frais      = FRAIS_MOBILE; // 1 XAF fixe
      const totalDebit = n + frais;

      if (Number(compte.solde) < totalDebit)
        return res.status(400).json({
          message: `Solde insuffisant. Avec ${frais} XAF frais : ${totalDebit} XAF. Disponible : ${Number(compte.solde)} XAF.`,
        });

      const num = formaterNumero(numeroCompte);
      const ref = `MMTRANSFER-${userId}-${Date.now()}`;

      await db.query("UPDATE compte SET solde = solde - ?, updated_at = NOW() WHERE utilisateur_id = ?", [totalDebit, userId]);
      const [tx] = await db.query(
        "INSERT INTO transaction (utilisateur_id, montant, statut, reference_externe, dateTransaction, created_at, updated_at) VALUES (?, ?, 'EN_ATTENTE', ?, NOW(), NOW(), NOW())",
        [userId, -totalDebit, ref]
      );

      // ── MODE SIMULATION pour les transferts Mobile Money ───
      if (SIMULATION_MODE) {
        console.log(`🧪 [SIMULATION] Transfert MoMo → ${num} | ${n} XAF | frais ${frais} XAF`);

        await db.query(
          "UPDATE transaction SET statut = 'VALIDEE', updated_at = NOW() WHERE id = ?",
          [tx.insertId]
        );
        await db.query(
          "INSERT INTO transfert (type, paysSource, paysDestination, transaction_id, created_at, updated_at) VALUES ('LOCAL','Cameroun','Cameroun',?,NOW(),NOW())",
          [tx.insertId]
        );
        await notif(
          userId,
          "Transfert MoMo ✅ (simulation)",
          `${n} XAF envoyés à ${nomBeneficiaire || num}. Frais : ${frais} XAF fixe.`
        );
        const [[c]] = await db.query("SELECT solde FROM compte WHERE utilisateur_id = ?", [userId]);
        return res.json({
          message: `✅ ${n} XAF envoyés à ${nomBeneficiaire || num}. (Mode simulation)`,
          nouveauSolde: c?.solde || 0,
          simulation: true,
        });
      }

      // ── MODE PRODUCTION ────────────────────────────────────
      try {
        await disbursementCamPay({
          montant: n,
          telephone: num,
          description: `PayVirtual${raison ? " - " + raison : ""}`,
          reference: ref,
        });
        await db.query("UPDATE transaction SET statut = 'VALIDEE', updated_at = NOW() WHERE id = ?", [tx.insertId]);
        await db.query(
          "INSERT INTO transfert (type, paysSource, paysDestination, transaction_id, created_at, updated_at) VALUES ('LOCAL','Cameroun','Cameroun',?,NOW(),NOW())",
          [tx.insertId]
        );
        await notif(userId, "Transfert MoMo ✅", `${n} XAF envoyés à ${nomBeneficiaire || num}. Frais : ${frais} XAF.`);
        const [[c]] = await db.query("SELECT solde FROM compte WHERE utilisateur_id = ?", [userId]);
        return res.json({
          message: `✅ ${n} XAF envoyés à ${nomBeneficiaire || num}. SMS en route.`,
          nouveauSolde: c?.solde || 0,
        });
      } catch (e) {
        await db.query("UPDATE compte SET solde = solde + ?, updated_at = NOW() WHERE utilisateur_id = ?", [totalDebit, userId]);
        await db.query("UPDATE transaction SET statut = 'ANNULEE', updated_at = NOW() WHERE id = ?", [tx.insertId]);
        return res.status(500).json({
          message: e.response?.data?.message || "Erreur CamPay.",
        });
      }
    }

    // ── Virement bancaire externe ─────────────────────────────
    await db.query("UPDATE compte SET solde = solde - ?, updated_at = NOW() WHERE utilisateur_id = ?", [n, userId]);
    const [tx] = await db.query(
      "INSERT INTO transaction (utilisateur_id, montant, statut, dateTransaction, created_at, updated_at) VALUES (?, ?, 'VALIDEE', NOW(), NOW(), NOW())",
      [userId, -n]
    );
    await db.query(
      "INSERT INTO transfert (type, paysSource, paysDestination, transaction_id, created_at, updated_at) VALUES ('INTERNATIONAL',?,?,?,NOW(),NOW())",
      [paysSrc || "Cameroun", paysDest || "Cameroun", tx.insertId]
    );
    await notif(userId, "Virement ✅", `${n} XAF vers ${nomBeneficiaire}.`);
    const [[c]] = await db.query("SELECT solde FROM compte WHERE utilisateur_id = ?", [userId]);
    return res.json({
      message: `✅ Virement de ${n} XAF vers ${nomBeneficiaire} !`,
      nouveauSolde: c?.solde || 0,
    });

  } catch (e) {
    console.error("transfert:", e);
    return res.status(500).json({ message: "Erreur serveur : " + e.message });
  }
};


