// import axios from "axios";

// const CAMPAY_BASE_URL = process.env.CAMPAY_BASE_URL || "https://demo.campay.net/api";
// const CAMPAY_USERNAME = process.env.CAMPAY_USERNAME;
// const CAMPAY_PASSWORD = process.env.CAMPAY_PASSWORD;

// // ═══════════════════════════════════════════════════════════════
// //  HELPER : Formater le numéro pour CamPay (doit commencer par 237)
// // ═══════════════════════════════════════════════════════════════
// const formaterNumero = (telephone) => {
//   let numero = String(telephone).replace(/[\s+\-()]/g, "");
//   if (!numero.startsWith("237")) {
//     numero = "237" + numero;
//   }
//   return numero;
// };

// // ═══════════════════════════════════════════════════════════════
// //  Obtenir le token CamPay (Bearer)
// // ═══════════════════════════════════════════════════════════════
// const obtenirTokenCamPay = async () => {
//   if (!CAMPAY_USERNAME || !CAMPAY_PASSWORD) {
//     throw new Error("Variables d'environnement CAMPAY_USERNAME / CAMPAY_PASSWORD manquantes.");
//   }
//   const res = await axios.post(
//     `${CAMPAY_BASE_URL}/token/`,
//     { username: CAMPAY_USERNAME, password: CAMPAY_PASSWORD },
//     { headers: { "Content-Type": "application/json" } }
//   );
//   if (!res.data?.token) throw new Error("Token CamPay non reçu.");
//   return res.data.token;
// };

// // ═══════════════════════════════════════════════════════════════
// //  COLLECT — Mobile Money → PayVirtual (dépôt)
// //  Docs CamPay : POST /collect/
// // ═══════════════════════════════════════════════════════════════
// export const collecterPaiementCamPay = async ({ montant, telephone, description, reference }) => {
//   const token  = await obtenirTokenCamPay();
//   const numero = formaterNumero(telephone); // ✅ Toujours préfixé 237XXXXXXXXX

//   console.log(`📤 CamPay collect → ${numero} | ${montant} XAF | ref: ${reference}`);

//   const res = await axios.post(
//     `${CAMPAY_BASE_URL}/collect/`,
//     {
//       amount:             String(montant),
//       from:               numero,
//       description:        description || "PayVirtual dépôt",
//       external_reference: reference,
//     },
//     {
//       headers: {
//         Authorization:  `Token ${token}`,
//         "Content-Type": "application/json",
//       },
//     }
//   );

//   console.log("✅ CamPay collect réponse :", res.data);
//   return res.data; // { reference, ussd_code, ... }
// };

// // ═══════════════════════════════════════════════════════════════
// //  DISBURSEMENT — PayVirtual → Mobile Money (retrait / transfert)
// //  Docs CamPay : POST /transfer/
// // ═══════════════════════════════════════════════════════════════
// export const disbursementCamPay = async ({ montant, telephone, description, reference }) => {
//   const token  = await obtenirTokenCamPay();
//   const numero = formaterNumero(telephone); // ✅ Toujours préfixé 237XXXXXXXXX

//   console.log(`📤 CamPay disbursement → ${numero} | ${montant} XAF | ref: ${reference}`);

//   const res = await axios.post(
//     `${CAMPAY_BASE_URL}/transfer/`,
//     {
//       amount:             String(montant),
//       to:                 numero,
//       description:        description || "PayVirtual retrait",
//       external_reference: reference,
//     },
//     {
//       headers: {
//         Authorization:  `Token ${token}`,
//         "Content-Type": "application/json",
//       },
//     }
//   );

//   console.log("✅ CamPay disbursement réponse :", res.data);
//   return res.data; // { reference, operator, status, ... }
// };

// // ═══════════════════════════════════════════════════════════════
// //  VÉRIFIER STATUT d'une transaction
// //  Docs CamPay : GET /transaction/:reference/
// // ═══════════════════════════════════════════════════════════════
// export const verifierStatutCamPay = async (reference) => {
//   const token = await obtenirTokenCamPay();

//   const res = await axios.get(
//     `${CAMPAY_BASE_URL}/transaction/${reference}/`,
//     {
//       headers: { Authorization: `Token ${token}` },
//     }
//   );

//   return res.data; // { status: "SUCCESSFUL" | "FAILED" | "PENDING", ... }
// };









import axios from "axios";

const CAMPAY_BASE_URL = process.env.CAMPAY_BASE_URL || "https://demo.campay.net/api";
const CAMPAY_USERNAME = process.env.CAMPAY_USERNAME;
const CAMPAY_PASSWORD = process.env.CAMPAY_PASSWORD;

// ═══════════════════════════════════════════════════════════════
//  HELPER : Formater le numéro → "237XXXXXXXXX"
//  Accepte : "697833505", "+237697833505", "237697833505"
// ═══════════════════════════════════════════════════════════════
export const formaterNumero = (telephone) => {
  // Supprimer tous les espaces, +, -, (, )
  let num = String(telephone).replace(/[\s+\-()]/g, "");

  // Si commence déjà par 237 et fait 12 chiffres → OK
  if (num.startsWith("237") && num.length === 12) return num;

  // Si 9 chiffres → ajouter 237
  if (num.length === 9) return `237${num}`;

  // Si commence par 237 mais longueur incorrecte → nettoyer
  if (num.startsWith("237")) return num;

  return num;
};

// ═══════════════════════════════════════════════════════════════
//  Obtenir le token CamPay (Bearer)
// ═══════════════════════════════════════════════════════════════
const obtenirTokenCamPay = async () => {
  try {
    const res = await axios.post(
      `${CAMPAY_BASE_URL}/token/`,
      {
        username: CAMPAY_USERNAME,
        password: CAMPAY_PASSWORD,
      },
      { headers: { "Content-Type": "application/json" } }
    );
    return res.data.token;
  } catch (error) {
    console.error(
      "❌ CamPay auth error:",
      error.response?.data || error.message
    );
    throw new Error(
      error.response?.data?.detail ||
        "Impossible de s'authentifier auprès de CamPay."
    );
  }
};

// ═══════════════════════════════════════════════════════════════
//  COLLECT — Mobile Money → PayVirtual  (dépôt)
//  CamPay envoie une notification USSD/SMS au téléphone.
//  L'utilisateur entre son code PIN → CamPay confirme.
//  Retourne : { reference, ussd_code, operator, ... }
// ═══════════════════════════════════════════════════════════════
export const collecterPaiementCamPay = async ({
  montant,
  telephone,
  description,
  reference,
}) => {
  try {
    const token = await obtenirTokenCamPay();
    const numeroFormate = formaterNumero(telephone);

    console.log(
      `📲 CamPay COLLECT → ${numeroFormate} | ${montant} XAF | ref: ${reference}`
    );

    const res = await axios.post(
      `${CAMPAY_BASE_URL}/collect/`,
      {
        amount: String(montant),
        from: numeroFormate, // ✅ format obligatoire : "237XXXXXXXXX"
        description: description || "Dépôt PayVirtual",
        external_reference: reference,
      },
      {
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ CamPay collect response:", res.data);
    return res.data; // { reference, ussd_code, operator, ... }
  } catch (error) {
    console.error(
      "❌ CamPay collect error:",
      error.response?.data || error.message
    );
    throw error;
  }
};

// ═══════════════════════════════════════════════════════════════
//  DISBURSEMENT — PayVirtual → Mobile Money  (retrait / transfert)
//  Le destinataire reçoit un SMS automatique de confirmation.
//  Retourne : { reference, operator, status, ... }
// ═══════════════════════════════════════════════════════════════
export const disbursementCamPay = async ({
  montant,
  telephone,
  description,
  reference,
}) => {
  try {
    const token = await obtenirTokenCamPay();
    const numeroFormate = formaterNumero(telephone);

    console.log(
      `💸 CamPay DISBURSEMENT → ${numeroFormate} | ${montant} XAF | ref: ${reference}`
    );

    const res = await axios.post(
      `${CAMPAY_BASE_URL}/transfer/`,
      {
        amount: String(montant),
        to: numeroFormate, // ✅ format obligatoire : "237XXXXXXXXX"
        description: description || "PayVirtual - Transfert",
        external_reference: reference,
      },
      {
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ CamPay disbursement response:", res.data);
    return res.data;
  } catch (error) {
    console.error(
      "❌ CamPay disbursement error:",
      error.response?.data || error.message
    );
    throw error;
  }
};

// ═══════════════════════════════════════════════════════════════
//  VÉRIFIER STATUT d'une transaction CamPay
//  Retourne : { status: "SUCCESSFUL" | "FAILED" | "PENDING", ... }
// ═══════════════════════════════════════════════════════════════
export const verifierStatutCamPay = async (reference) => {
  try {
    const token = await obtenirTokenCamPay();

    const res = await axios.get(
      `${CAMPAY_BASE_URL}/transaction/${reference}/`,
      {
        headers: { Authorization: `Token ${token}` },
      }
    );

    console.log(`🔍 CamPay statut [${reference}]:`, res.data?.status);
    return res.data;
  } catch (error) {
    console.error(
      "❌ CamPay vérification error:",
      error.response?.data || error.message
    );
    // Retourner PENDING plutôt que crasher — le polling continuera
    return { status: "PENDING", message: "Vérification en cours..." };
  }
};