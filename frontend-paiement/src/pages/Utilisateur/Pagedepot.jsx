import { useState, useRef } from "react";
import { FiSmartphone, FiCheckCircle, FiXCircle, FiLoader, FiAlertCircle } from "react-icons/fi";
import api from "../../services/api";

// ─── Config ───────────────────────────────────────────────────
const POLL_INTERVAL_MS = 6000;   // toutes les 6 secondes
const POLL_TIMEOUT_MS  = 300000; // 5 minutes max

const operateurs = [
  { id: "mtn",    label: "MTN Mobile Money",  icon: "🟡", indicatif: "237", prefixes: ["67", "65"] },
  { id: "orange", label: "Orange Money",      icon: "🟠", indicatif: "237", prefixes: ["69", "65"] },
];

const montantsRapides = [500, 1000, 2000, 5000, 10000, 25000];

const C = {
  primary:  "#7c3aed",
  primary2: "#6d28d9",
  border:   "#ede9fe",
  bg:       "#f5f3ff",
  text:     "#1e1b4b",
  muted:    "#6b7280",
  success:  "#16a34a",
  error:    "#dc2626",
};

const lbl = { display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 };
const inp = {
  width: "100%", padding: "10px 14px",
  border: `1px solid ${C.border}`, borderRadius: 8,
  fontSize: 14, outline: "none", background: "#fafafa",
  boxSizing: "border-box",
};

export default function PageDepot({ retour, dashData, onDepotReussi }) {
  const [operateur,   setOperateur]   = useState(null);
  const [telephone,   setTelephone]   = useState("");
  const [montant,     setMontant]     = useState("");
  const [etape,       setEtape]       = useState(1); // 1=form 2=attente PIN 3=succès 4=echec
  const [msg,         setMsg]         = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [reference,   setReference]   = useState(null);
  const [nouveauSolde, setNouveauSolde] = useState(null);
  const [pollSecondes, setPollSecondes] = useState(0);

  const pollIntervalRef = useRef(null);
  const pollTimeoutRef  = useRef(null);
  const pollCounterRef  = useRef(null);

  const solde = Number(dashData?.solde || 0);

  // ── Arrêter le polling ────────────────────────────────────────
  const stopPolling = () => {
    if (pollIntervalRef.current)  clearInterval(pollIntervalRef.current);
    if (pollTimeoutRef.current)   clearTimeout(pollTimeoutRef.current);
    if (pollCounterRef.current)   clearInterval(pollCounterRef.current);
  };

  // ── Démarrer le polling ───────────────────────────────────────
  const demarrerPolling = (ref) => {
    setPollSecondes(0);

    // Compteur d'affichage (chaque seconde)
    pollCounterRef.current = setInterval(() => {
      setPollSecondes((s) => s + 1);
    }, 1000);

    // Polling réel toutes les 6 secondes — SANS token (route publique)
    pollIntervalRef.current = setInterval(async () => {
      try {
        // ✅ Appel direct fetch sans Authorization header
        const res  = await fetch(`/api/transactions/campay/verifier/${ref}`);
        const data = await res.json();

        console.log("📡 Polling statut :", data.status);

        if (data.status === "SUCCESSFUL") {
          stopPolling();
          setNouveauSolde(data.nouveauSolde);
          setEtape(3);
          // Notifier le parent pour rafraîchir le dashboard
          if (onDepotReussi) onDepotReussi(data.nouveauSolde);
        } else if (data.status === "FAILED") {
          stopPolling();
          setMsg({ type: "error", text: "Paiement refusé ou expiré. Veuillez réessayer." });
          setEtape(4);
        }
        // PENDING → on continue
      } catch (e) {
        console.error("Polling error:", e);
      }
    }, POLL_INTERVAL_MS);

    // Timeout global : arrêter après 5 minutes
    pollTimeoutRef.current = setTimeout(() => {
      stopPolling();
      setMsg({
        type: "error",
        text: "Temps d'attente dépassé (5 min). Si vous avez confirmé le paiement, vérifiez vos transactions.",
      });
      setEtape(4);
    }, POLL_TIMEOUT_MS);
  };

  // ── Soumettre le dépôt ────────────────────────────────────────
  const soumettre = async () => {
    setMsg(null);

    if (!operateur)
      return setMsg({ type: "error", text: "Choisissez un opérateur." });
    if (!telephone || telephone.length !== 9)
      return setMsg({ type: "error", text: "Entrez 9 chiffres (ex: 697833505)." });
    if (!montant || Number(montant) < 10)
      return setMsg({ type: "error", text: "Montant minimum : 10 XAF." });
    if (Number(montant) > solde + Number(montant)) {
      // Pas de vérification solde pour un dépôt (on ajoute de l'argent)
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const res = await api.post(
        "/transactions/topup",
        { montant: Number(montant), telephone },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const ref = res.data.reference;
      setReference(ref);
      setEtape(2); // passer en mode "attente PIN"

      // Démarrer le polling
      demarrerPolling(ref);
    } catch (e) {
      const errMsg =
        e.response?.data?.message ||
        e.response?.data?.detail ||
        "Erreur serveur. Vérifiez le numéro et réessayez.";
      setMsg({ type: "error", text: errMsg });
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    stopPolling();
    setEtape(1);
    setMsg(null);
    setReference(null);
    setNouveauSolde(null);
    setTelephone("");
    setMontant("");
    setOperateur(null);
    setPollSecondes(0);
  };

  // ────────────────────────────────────────────────────────────────
  //  RENDU
  // ────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 520, margin: "0 auto" }}>

      {/* ── Bannière solde ── */}
      <div style={{
        background: "linear-gradient(135deg,#2e1065,#7c3aed)",
        borderRadius: 14, padding: "18px 24px", marginBottom: 24,
        color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div>
          <p style={{ fontSize: 16, fontWeight: 800, margin: "0 0 4px" }}>Recharger mon wallet</p>
          <p style={{ fontSize: 12, opacity: 0.8, margin: 0 }}>
            Déposez via Mobile Money — votre wallet est crédité automatiquement
          </p>
        </div>
        <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 10, padding: "8px 14px", textAlign: "right" }}>
          <div style={{ fontSize: 10, opacity: 0.7, marginBottom: 2 }}>Solde actuel</div>
          <div style={{ fontSize: 15, fontWeight: 800 }}>
            {(nouveauSolde ?? solde).toLocaleString("fr-FR")} XAF
          </div>
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: 14, padding: "24px 28px", border: `1px solid ${C.border}` }}>

        {/* ══════════════════════════════════════
            ÉTAPE 1 : Formulaire dépôt
        ══════════════════════════════════════ */}
        {etape === 1 && (
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 20 }}>
              📱 Dépôt Mobile Money
            </h3>

            {/* Message d'erreur */}
            {msg && (
              <div style={{
                padding: "10px 14px", borderRadius: 8, marginBottom: 16,
                fontSize: 13, fontWeight: 600,
                background: "#fef2f2", color: C.error, border: "1px solid #fecaca",
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <FiAlertCircle size={16} /> {msg.text}
              </div>
            )}

            {/* Choix opérateur */}
            <div style={{ marginBottom: 18 }}>
              <label style={lbl}>Opérateur *</label>
              <div style={{ display: "flex", gap: 12 }}>
                {operateurs.map((op) => (
                  <div
                    key={op.id}
                    onClick={() => setOperateur(op)}
                    style={{
                      flex: 1, padding: "14px 16px", borderRadius: 12, cursor: "pointer",
                      border: `2px solid ${operateur?.id === op.id ? C.primary : C.border}`,
                      background: operateur?.id === op.id ? C.bg : "#fafafa",
                      display: "flex", alignItems: "center", gap: 10,
                      transition: "all 0.15s",
                    }}
                  >
                    <span style={{ fontSize: 24 }}>{op.icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{op.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Numéro de téléphone */}
            <div style={{ marginBottom: 18 }}>
              <label style={lbl}>Votre numéro {operateur?.label || "Mobile Money"} *</label>
              <div style={{
                display: "flex", alignItems: "center", gap: 0,
                border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden",
                background: "#fafafa",
              }}>
                <div style={{
                  padding: "10px 14px", background: "#f0f0f0",
                  fontSize: 13, fontWeight: 700, color: C.muted,
                  borderRight: `1px solid ${C.border}`, whiteSpace: "nowrap",
                }}>
                  🇨🇲 +237
                </div>
                <input
                  value={telephone}
                  onChange={(e) =>
                    setTelephone(e.target.value.replace(/\D/g, "").slice(0, 9))
                  }
                  placeholder="6XXXXXXXX"
                  maxLength={9}
                  style={{ ...inp, border: "none", borderRadius: 0, flex: 1 }}
                />
              </div>
              <p style={{
                fontSize: 10, marginTop: 4,
                color: telephone.length === 9 ? C.success : C.muted,
              }}>
                {telephone.length}/9 chiffres{telephone.length === 9 ? " ✓" : ""}
              </p>
            </div>

            {/* Montant */}
            <div style={{ marginBottom: 18 }}>
              <label style={lbl}>Montant à déposer (XAF) *</label>
              <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
                <div style={{ padding: "14px 16px", background: "#fafafa" }}>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <input
                      type="number"
                      value={montant}
                      onChange={(e) => setMontant(e.target.value)}
                      placeholder="0"
                      style={{
                        flex: 1, border: "none", background: "transparent",
                        fontSize: 28, fontWeight: 700, color: C.text, outline: "none",
                      }}
                    />
                    <span style={{ fontSize: 14, fontWeight: 700, color: C.muted }}>XAF</span>
                  </div>
                  <p style={{ fontSize: 10, color: C.muted, margin: "4px 0 0" }}>
                    Minimum : 10 XAF
                  </p>
                </div>
              </div>

              {/* Montants rapides */}
              <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                {montantsRapides.map((v) => (
                  <button
                    key={v}
                    onClick={() => setMontant(v)}
                    style={{
                      padding: "5px 12px", borderRadius: 20, cursor: "pointer",
                      border: `1px solid ${C.border}`,
                      background: Number(montant) === v ? C.primary : C.bg,
                      color: Number(montant) === v ? "#fff" : C.muted,
                      fontSize: 11, fontWeight: 600,
                    }}
                  >
                    {v.toLocaleString("fr-FR")}
                  </button>
                ))}
              </div>
            </div>

            {/* Récap frais */}
            {montant && Number(montant) > 0 && (
              <div style={{
                background: C.bg, borderRadius: 10, padding: "12px 16px",
                marginBottom: 18, border: `1px solid ${C.border}`,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                  <span style={{ color: C.muted }}>Montant</span>
                  <span style={{ fontWeight: 700 }}>{Number(montant).toLocaleString("fr-FR")} XAF</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                  <span style={{ color: C.muted }}>Frais de dépôt</span>
                  <span style={{ fontWeight: 700, color: C.success }}>0 XAF</span>
                </div>
                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 8, display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                  <span style={{ fontWeight: 700 }}>Total crédité</span>
                  <span style={{ fontWeight: 800, color: C.primary }}>
                    {Number(montant).toLocaleString("fr-FR")} XAF
                  </span>
                </div>
              </div>
            )}

            {/* Bouton soumettre */}
            <button
              onClick={soumettre}
              disabled={loading}
              style={{
                width: "100%",
                background: loading ? "#a78bfa" : "linear-gradient(135deg,#6d28d9,#a78bfa)",
                color: "#fff", border: "none", borderRadius: 10,
                padding: "13px 0", fontSize: 14, fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              {loading ? (
                <>
                  <FiLoader size={16} style={{ animation: "spin 1s linear infinite" }} />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <FiSmartphone size={16} />
                  Déposer via {operateur?.label || "Mobile Money"}
                </>
              )}
            </button>

            <button
              onClick={retour}
              style={{
                width: "100%", marginTop: 10, background: "none",
                border: "none", color: C.muted, fontSize: 13,
                cursor: "pointer", padding: "8px 0",
              }}
            >
              ← Retour au tableau de bord
            </button>
          </div>
        )}

        {/* ══════════════════════════════════════
            ÉTAPE 2 : Attente confirmation PIN
        ══════════════════════════════════════ */}
        {etape === 2 && (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            {/* Animation pulsante */}
            <div style={{
              width: 80, height: 80, borderRadius: "50%",
              background: C.bg, border: `3px solid ${C.primary}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 20px",
              animation: "pulse 2s infinite",
            }}>
              <FiSmartphone size={36} color={C.primary} />
            </div>

            <h3 style={{ fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 8 }}>
              📲 Vérifiez votre téléphone
            </h3>
            <p style={{ fontSize: 13, color: C.muted, marginBottom: 20, lineHeight: 1.6 }}>
              Une notification {operateur?.label} a été envoyée au<br />
              <strong style={{ color: C.text }}>+237 {telephone}</strong><br />
              Entrez votre <strong>code PIN</strong> pour confirmer le dépôt.
            </p>

            {/* Montant en attente */}
            <div style={{
              background: C.bg, borderRadius: 12, padding: "14px 20px",
              marginBottom: 20, border: `1px solid ${C.border}`,
            }}>
              <p style={{ fontSize: 12, color: C.muted, margin: "0 0 4px" }}>Montant en attente</p>
              <p style={{ fontSize: 24, fontWeight: 900, color: C.primary, margin: 0 }}>
                {Number(montant).toLocaleString("fr-FR")} XAF
              </p>
            </div>

            {/* Indicateur de polling */}
            <div style={{
              background: "#f0fdf4", borderRadius: 10, padding: "12px 16px",
              marginBottom: 20, border: "1px solid #bbf7d0",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            }}>
              <FiLoader size={16} color={C.success} style={{ animation: "spin 1s linear infinite" }} />
              <span style={{ fontSize: 12, color: "#15803d", fontWeight: 600 }}>
                Vérification en cours... ({pollSecondes}s)
              </span>
            </div>

            <p style={{ fontSize: 11, color: C.muted, marginBottom: 16 }}>
              La page se met à jour automatiquement dès que vous confirmez.<br />
              Temps restant : {Math.max(0, Math.floor((POLL_TIMEOUT_MS / 1000) - pollSecondes))}s
            </p>

            <button
              onClick={() => {
                stopPolling();
                reset();
              }}
              style={{
                background: "#fef2f2", border: "1px solid #fecaca",
                color: C.error, borderRadius: 8, padding: "10px 20px",
                fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}
            >
              Annuler
            </button>

            {/* CSS animations inline */}
            <style>{`
              @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
              @keyframes pulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.05); opacity: 0.85; } }
            `}</style>
          </div>
        )}

        {/* ══════════════════════════════════════
            ÉTAPE 3 : Succès — wallet crédité
        ══════════════════════════════════════ */}
        {etape === 3 && (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{
              width: 72, height: 72, borderRadius: "50%",
              background: "#dcfce7", display: "flex", alignItems: "center",
              justifyContent: "center", margin: "0 auto 20px", color: C.success,
            }}>
              <FiCheckCircle size={36} />
            </div>

            <h3 style={{ fontSize: 20, fontWeight: 800, color: C.success, marginBottom: 8 }}>
              Dépôt confirmé !
            </h3>
            <p style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>
              Votre code PIN a été validé avec succès.
            </p>

            <div style={{
              background: "#f0fdf4", borderRadius: 12, padding: "18px 20px",
              marginBottom: 20, border: "1px solid #bbf7d0",
            }}>
              <p style={{ fontSize: 12, color: "#15803d", margin: "0 0 8px" }}>Montant crédité</p>
              <p style={{ fontSize: 32, fontWeight: 900, color: C.success, margin: "0 0 12px" }}>
                +{Number(montant).toLocaleString("fr-FR")} XAF
              </p>
              {nouveauSolde !== null && (
                <div style={{ borderTop: "1px solid #bbf7d0", paddingTop: 12 }}>
                  <p style={{ fontSize: 12, color: "#15803d", margin: "0 0 4px" }}>Nouveau solde</p>
                  <p style={{ fontSize: 18, fontWeight: 800, color: C.primary, margin: 0 }}>
                    {Number(nouveauSolde).toLocaleString("fr-FR")} XAF
                  </p>
                </div>
              )}
            </div>

            <div style={{
              background: C.bg, borderRadius: 10, padding: "10px 16px",
              marginBottom: 20, fontSize: 12, color: C.primary,
            }}>
              ✅ Via {operateur?.label} · +237 {telephone}
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={retour}
                style={{
                  flex: 1, background: "#f1f5f9", border: "none",
                  borderRadius: 8, padding: "11px 0", fontSize: 13,
                  fontWeight: 600, cursor: "pointer", color: C.muted,
                }}
              >
                Tableau de bord
              </button>
              <button
                onClick={reset}
                style={{
                  flex: 1, background: C.primary, color: "#fff",
                  border: "none", borderRadius: 8, padding: "11px 0",
                  fontSize: 13, fontWeight: 700, cursor: "pointer",
                }}
              >
                Nouveau dépôt
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════
            ÉTAPE 4 : Échec / Timeout
        ══════════════════════════════════════ */}
        {etape === 4 && (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{
              width: 72, height: 72, borderRadius: "50%",
              background: "#fef2f2", display: "flex", alignItems: "center",
              justifyContent: "center", margin: "0 auto 20px", color: C.error,
            }}>
              <FiXCircle size={36} />
            </div>

            <h3 style={{ fontSize: 18, fontWeight: 800, color: C.error, marginBottom: 8 }}>
              Dépôt non confirmé
            </h3>

            {msg && (
              <div style={{
                background: "#fef2f2", borderRadius: 10, padding: "14px",
                marginBottom: 20, border: "1px solid #fecaca",
                fontSize: 13, color: C.error, lineHeight: 1.6,
              }}>
                {msg.text}
              </div>
            )}

            <p style={{ fontSize: 12, color: C.muted, marginBottom: 20 }}>
              Si votre argent a été débité, contactez le support PayVirtual.<br />
              Référence : <code style={{ background: "#f1f5f9", padding: "2px 6px", borderRadius: 4 }}>{reference}</code>
            </p>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={retour}
                style={{
                  flex: 1, background: "#f1f5f9", border: "none",
                  borderRadius: 8, padding: "11px 0", fontSize: 13,
                  fontWeight: 600, cursor: "pointer", color: C.muted,
                }}
              >
                Retour
              </button>
              <button
                onClick={reset}
                style={{
                  flex: 1, background: C.primary, color: "#fff",
                  border: "none", borderRadius: 8, padding: "11px 0",
                  fontSize: 13, fontWeight: 700, cursor: "pointer",
                }}
              >
                Réessayer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


