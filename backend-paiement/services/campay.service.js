import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

// ═══════════════════════════════════════════════════════════════
//  CONFIGURATION CAMPAY
//  Docs : https://docs.campay.net
// ═══════════════════════════════════════════════════════════════
const CAMPAY_BASE_URL = "https://demo.campay.net/api"; // ← DEMO pour tester
// const CAMPAY_BASE_URL = "https://campay.net/api";   // ← PROD quand tu es prêt

// ── Obtenir un token d'accès CamPay ──
const getTokenCamPay = async () => {
  const response = await axios.post(`${CAMPAY_BASE_URL}/token/`, {
    username: process.env.CAMPAY_USERNAME,
    password: process.env.CAMPAY_PASSWORD,
  });
  return response.data.token;
};

// ═══════════════════════════════════════════════════════════════
//  COLLECTER DE L'ARGENT (Mobile Money → ton compte CamPay)
//  C'est ce qui est utilisé pour le "Top Up"
// ═══════════════════════════════════════════════════════════════
export const collecterPaiementCamPay = async ({ montant, telephone, description, reference }) => {
  const token = await getTokenCamPay();

  const response = await axios.post(
    `${CAMPAY_BASE_URL}/collect/`,
    {
      amount:       String(montant),
      from:         telephone,           // ex: "237670000000"
      description:  description || "Paiement SwiftCard",
      external_reference: reference,
      currency:     "XAF",
    },
    {
      headers: {
        Authorization: `Token ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
  // Retourne : { reference, ussd_code, status: "PENDING" }
};

// ═══════════════════════════════════════════════════════════════
//  ENVOYER DE L'ARGENT (ton compte CamPay → numéro Mobile Money)
//  C'est ce qui est utilisé pour le "Transfert Mobile Money"
// ═══════════════════════════════════════════════════════════════
export const initierPaiementCamPay = async ({ montant, telephone, description, reference }) => {
  const token = await getTokenCamPay();

  const response = await axios.post(
    `${CAMPAY_BASE_URL}/transfer/`,
    {
      amount:       String(montant),
      to:           telephone,           // ex: "237670000000" — numéro du bénéficiaire
      description:  description || "Transfert SwiftCard",
      external_reference: reference,
      currency:     "XAF",
    },
    {
      headers: {
        Authorization: `Token ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
  // Retourne : { reference, status: "PENDING" | "SUCCESSFUL" | "FAILED" }
};

// ═══════════════════════════════════════════════════════════════
//  VÉRIFIER LE STATUT D'UNE TRANSACTION
// ═══════════════════════════════════════════════════════════════
export const verifierStatutCamPay = async (reference) => {
  const token = await getTokenCamPay();

  const response = await axios.get(
    `${CAMPAY_BASE_URL}/transaction/${reference}/`,
    {
      headers: { Authorization: `Token ${token}` },
    }
  );

  return response.data;
  // Retourne : { status: "SUCCESSFUL" | "FAILED" | "PENDING", amount, operator, ... }
};

// ═══════════════════════════════════════════════════════════════
//  SOLDE DU COMPTE CAMPAY
// ═══════════════════════════════════════════════════════════════
export const getSoldeCamPay = async () => {
  const token = await getTokenCamPay();

  const response = await axios.get(`${CAMPAY_BASE_URL}/balance/`, {
    headers: { Authorization: `Token ${token}` },
  });

  return response.data;
  // Retourne : { total: "5000.00", currency: "XAF" }
};