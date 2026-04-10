import axios from "axios";

const FLW_SECRET_KEY = process.env.FLW_SECRET_KEY;
const BASE_URL       = "https://api.flutterwave.com/v3";

// ═══════════════════════════════════════════════════════════════
//  Initier un virement bancaire via Flutterwave
//  Doc : https://developer.flutterwave.com/reference/transfers
// ═══════════════════════════════════════════════════════════════
export const initierVirementBancaire = async ({
  montant,
  devise,
  banque,
  numeroCompte,
  nomBeneficiaire,
  reference,
  narration,
}) => {
  const payload = {
    account_bank:   banque,           // ex: "057" (code banque Flutterwave)
    account_number: numeroCompte,
    amount:         montant,
    currency:       devise || "XAF",
    narration:      narration || "Virement PayVirtual",
    reference,                        // identifiant unique côté PayVirtual
    beneficiary_name: nomBeneficiaire,
    callback_url: `${process.env.BACKEND_URL}/api/webhooks/flutterwave`,
  };

  const response = await axios.post(`${BASE_URL}/transfers`, payload, {
    headers: {
      Authorization: `Bearer ${FLW_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
  });

  return response.data; // { status, message, data: { id, status, reference, ... } }
};

// ═══════════════════════════════════════════════════════════════
//  Récupérer la liste des banques disponibles par pays
//  Utile pour alimenter le select "Banque" côté frontend
//  Ex: getBanques("CM") → banques du Cameroun
// ═══════════════════════════════════════════════════════════════
export const getBanques = async (codePays = "CM") => {
  const response = await axios.get(`${BASE_URL}/banks/${codePays}`, {
    headers: { Authorization: `Bearer ${FLW_SECRET_KEY}` },
  });
  return response.data.data; // [{ id, code, name }, ...]
};

// ═══════════════════════════════════════════════════════════════
//  Vérifier le statut d'un transfert par référence
// ═══════════════════════════════════════════════════════════════
export const verifierVirement = async (reference) => {
  const response = await axios.get(
    `${BASE_URL}/transfers?reference=${reference}`,
    { headers: { Authorization: `Bearer ${FLW_SECRET_KEY}` } }
  );
  return response.data;
};