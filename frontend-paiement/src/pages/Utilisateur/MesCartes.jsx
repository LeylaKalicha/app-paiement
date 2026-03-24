import { useState, useEffect } from "react";
import { FiArrowLeft, FiCreditCard, FiPlus } from "react-icons/fi";
import api from "../../services/api";

const designs = [
  { id: "blue",    label: "Bleu",       gradient: "linear-gradient(135deg,#1d4ed8,#3b82f6)",   preview: "#3b82f6" },
  { id: "violet",  label: "Violet",     gradient: "linear-gradient(135deg,#7c3aed,#a78bfa)",   preview: "#7c3aed" },
  { id: "orange",  label: "Orange",     gradient: "linear-gradient(135deg,#ea580c,#fb923c)",   preview: "#fb923c" },
  { id: "nature",  label: "Nature",     gradient: "linear-gradient(135deg,#065f46,#10b981)",   preview: "#10b981" },
];

export default function MesCartes({ retour, dashData }) {
  const [cartes, setCartes]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [msg, setMsg]             = useState(null);
  const [designChoisi, setDesign] = useState("blue");
  const [cardType, setCardType]   = useState("Visa");
  const [devise, setDevise]       = useState("XAF");
  const [limite, setLimite]       = useState("1000000");
  const [nomCarte, setNomCarte]   = useState(dashData?.user?.nom?.toUpperCase() || "NOM TITULAIRE");
  const [creating, setCreating]   = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await api.get("/cartes/mes-cartes", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCartes(res.data.cartes || []);
      } catch {
        setCartes([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const creerCarte = async () => {
    try {
      setCreating(true);
      const token = localStorage.getItem("token");
      await api.post("/cartes/creer", { type: cardType, devise, limite: Number(limite), design: designChoisi }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMsg({ type: "success", text: "Carte créée avec succès !" });
      // Recharger les cartes
      const res = await api.get("/cartes/mes-cartes", { headers: { Authorization: `Bearer ${token}` } });
      setCartes(res.data.cartes || []);
    } catch (e) {
      setMsg({ type: "error", text: e.response?.data?.message || "Erreur lors de la création." });
    } finally {
      setCreating(false);
    }
  };

  const designActif = designs.find(d => d.id === designChoisi) || designs[0];

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button onClick={retour} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, padding: "7px 10px", cursor: "pointer", display: "flex", color: "#64748b" }}>
          <FiArrowLeft size={16} />
        </button>
        <div>
          <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>Accueil › Créer une carte virtuelle</p>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", margin: 0 }}>Créer une carte virtuelle</h2>
          <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>Choisissez un design et personnalisez votre carte de paiement virtuelle</p>
        </div>
      </div>

      {msg && (
        <div style={{ padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 13, fontWeight: 600, background: msg.type === "success" ? "#f0fdf4" : "#fef2f2", color: msg.type === "success" ? "#16a34a" : "#dc2626", border: `1px solid ${msg.type === "success" ? "#bbf7d0" : "#fecaca"}` }}>
          {msg.text}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 28 }}>

        {/* Aperçu carte */}
        <div>
          <div style={{ width: "100%", height: 180, borderRadius: 16, background: designActif.gradient, padding: "20px 22px", color: "#fff", boxShadow: "0 8px 32px rgba(124,58,237,0.25)", marginBottom: 20, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 32, height: 32, background: "rgba(255,255,255,0.2)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 16 }}>S</div>
              <span style={{ fontWeight: 700, fontSize: 14 }}>SwiftCard</span>
            </div>
            <div>
              <p style={{ fontSize: 9, opacity: 0.7, margin: "0 0 8px" }}>Carte Virtuelle</p>
              <p style={{ fontSize: 14, fontWeight: 700, letterSpacing: 2, margin: "0 0 12px" }}>•••• •••• •••• 0000</p>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, fontWeight: 600 }}>{nomCarte}</span>
                <span style={{ fontSize: 11 }}>{cardType}</span>
              </div>
            </div>
          </div>

          {/* Sélecteur design */}
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 10 }}>Choisir le design de la carte</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {designs.map(d => (
                <div key={d.id} onClick={() => setDesign(d.id)} style={{
                  width: 52, height: 36, borderRadius: 8, background: d.gradient, cursor: "pointer",
                  border: designChoisi === d.id ? "3px solid #0f172a" : "3px solid transparent",
                  transition: "border 0.15s"
                }} title={d.label} />
              ))}
              <div style={{ width: 52, height: 36, borderRadius: 8, background: "#f1f5f9", border: "2px dashed #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 9, color: "#94a3b8", fontWeight: 600 }}>Défaut</div>
            </div>
          </div>
        </div>

        {/* Formulaire */}
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div>
              <label style={lbl}>Nom du titulaire</label>
              <input value={nomCarte} onChange={e => setNomCarte(e.target.value)} placeholder="NOM PRÉNOM" style={inp} />
            </div>
            <div>
              <label style={lbl}>Design de la carte</label>
              <select value={designChoisi} onChange={e => setDesign(e.target.value)} style={sel}>
                {designs.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Type de carte</label>
              <select value={cardType} onChange={e => setCardType(e.target.value)} style={sel}>
                <option>Visa</option>
                <option>Mastercard</option>
              </select>
            </div>
            <div>
              <label style={lbl}>Devise</label>
              <select value={devise} onChange={e => setDevise(e.target.value)} style={sel}>
                <option>XAF</option>
                <option>USD</option>
                <option>EUR</option>
              </select>
            </div>
            <div style={{ gridColumn: "span 2" }}>
              <label style={lbl}>Limite de dépenses (XAF)</label>
              <input type="number" value={limite} onChange={e => setLimite(e.target.value)} placeholder="1000000" style={inp} />
            </div>
          </div>

          <button onClick={creerCarte} disabled={creating} style={{
            display: "flex", alignItems: "center", gap: 8, background: "#7c3aed", color: "#fff",
            border: "none", borderRadius: 10, padding: "12px 28px", fontSize: 14, fontWeight: 700,
            cursor: creating ? "not-allowed" : "pointer", opacity: creating ? 0.7 : 1, float: "right"
          }}>
            <FiPlus size={16} /> {creating ? "Création en cours..." : "+ Créer la carte"}
          </button>

          {/* Cartes existantes */}
          {cartes.length > 0 && (
            <div style={{ marginTop: 60 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 14 }}>Vos cartes ({cartes.length})</p>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                {cartes.map((c, i) => (
                  <div key={i} style={{ width: 180, height: 108, borderRadius: 12, background: designs[i % designs.length].gradient, padding: "12px 14px", color: "#fff", boxShadow: "0 4px 12px rgba(124,58,237,0.2)" }}>
                    <p style={{ fontSize: 8, opacity: 0.7, margin: "0 0 14px" }}>Carte Virtuelle</p>
                    <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, margin: "0 0 10px" }}>•••• •••• •••• {c.numero?.slice(-4) || "0000"}</p>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 8, opacity: 0.7 }}>{c.statut}</span>
                      <span style={{ fontSize: 8, opacity: 0.7 }}>{c.dateExpiration || "12/27"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const lbl = { display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 };
const inp = { width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none", background: "#fafafa", boxSizing: "border-box" };
const sel = { width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none", background: "#fafafa", cursor: "pointer", boxSizing: "border-box" };