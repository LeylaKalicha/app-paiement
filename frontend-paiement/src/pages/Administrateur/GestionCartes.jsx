import { useState, useEffect } from "react";
import api from "../../services/api";

const themes = [
  { id: "violet", label: "Violet", gradient: "linear-gradient(135deg, #7c3aed, #4f46e5)" },
  { id: "noir",   label: "Noir",   gradient: "linear-gradient(135deg, #1e1e2e, #374151)" },
  { id: "or",     label: "Or",     gradient: "linear-gradient(135deg, #d97706, #f59e0b)" },
  { id: "bleu",   label: "Bleu",   gradient: "linear-gradient(135deg, #1d4ed8, #3b82f6)" },
];

function CarteVisuelle({ carte }) {
  const theme = themes.find(t => t.id === (carte.theme || "violet")) || themes[0];
  const numero = carte.numero || "0000000000000000";
  return (
    <div style={{ width: "100%", maxWidth: 300, height: 170, borderRadius: 16, background: theme.gradient, padding: "20px 22px", position: "relative", fontFamily: "'Courier New', monospace", boxShadow: "0 8px 32px rgba(0,0,0,0.1)" }}>
      <div style={{ position: "absolute", top: 16, right: 20, fontSize: 12, fontWeight: 900, color: "#fff", opacity: 0.9 }}>VISA</div>
      <div style={{ width: 34, height: 26, background: "rgba(255,255,255,0.25)", borderRadius: 4, marginBottom: 16 }} />
      <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", letterSpacing: 3, marginBottom: 16 }}>
        •••• •••• •••• {numero.slice(-4)}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.65)", marginBottom: 2 }}>TITULAIRE</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{carte.nomUtilisateur || "UTILISATEUR"}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.65)", marginBottom: 2 }}>EXPIRE</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>
            {carte.dateExpiration ? (() => { const d = new Date(carte.dateExpiration); return `${String(d.getMonth()+1).padStart(2,"0")}/${String(d.getFullYear()).slice(-2)}`; })() : "MM/YY"}
          </div>
        </div>
      </div>
      {carte.statut === "BLOQUEE" && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ color: "#fff", fontWeight: 900, fontSize: 15, letterSpacing: 3 }}>BLOQUÉE</span>
        </div>
      )}
    </div>
  );
}

export default function GestionCartes({ allerVers }) {
  const [cartes, setCartes]     = useState([]);
  const [selectId, setSelectId] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [msg, setMsg]           = useState(null);
  const [stats, setStats]       = useState({ totalActives: 0, totalBloquees: 0 });

  const token   = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const charger = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/cartes", { headers });
      const data = res.data;
      setCartes(data.cartes || []);
      setStats({ totalActives: data.totalActives || 0, totalBloquees: data.totalBloquees || 0 });
      if (data.cartes?.length > 0) setSelectId(data.cartes[0].id);
    } catch { setCartes([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { charger(); }, []);

  const bloquer = async (id) => {
    try {
      await api.put(`/admin/cartes/${id}/bloquer`, {}, { headers });
      setMsg({ type: "success", text: "Carte bloquée." });
      charger();
    } catch (e) { setMsg({ type: "error", text: e.response?.data?.message || "Erreur." }); }
  };

  const debloquer = async (id) => {
    try {
      await api.put(`/admin/cartes/${id}/debloquer`, {}, { headers });
      setMsg({ type: "success", text: "Carte débloquée." });
      charger();
    } catch (e) { setMsg({ type: "error", text: e.response?.data?.message || "Erreur." }); }
  };

  const carteActive = cartes.find(c => c.id === selectId);

  return (
    <div style={{ color: "#1e1e2e" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Gestion des cartes</h2>
          <p style={{ color: "#9ca3af", fontSize: 13, marginTop: 4 }}>Toutes les cartes virtuelles de la plateforme</p>
        </div>
        <button onClick={() => allerVers && allerVers("dashboard")} style={{ background: "none", border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#6b7280" }}>← Retour</button>
      </div>

      {msg && (
        <div style={{ padding: "10px 14px", borderRadius: 8, marginBottom: 14, fontSize: 13, fontWeight: 600, background: msg.type === "success" ? "#f0fdf4" : "#fef2f2", color: msg.type === "success" ? "#16a34a" : "#dc2626", border: `1px solid ${msg.type === "success" ? "#bbf7d0" : "#fecaca"}` }}>
          {msg.text}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 24 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Aperçu de la carte sélectionnée */}
          {carteActive && (
            <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>Aperçu — {carteActive.nomUtilisateur}</div>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <CarteVisuelle carte={carteActive} />
              </div>
            </div>
          )}

          {/* Liste des cartes depuis BDD */}
          <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>
              Toutes les cartes
              <span style={{ fontSize: 12, color: "#9ca3af", fontWeight: 400, marginLeft: 8 }}>{cartes.length} carte(s)</span>
            </div>

            {loading ? (
              <p style={{ color: "#94a3b8", textAlign: "center", padding: 20 }}>Chargement...</p>
            ) : cartes.length === 0 ? (
              <div style={{ textAlign: "center", padding: "30px 0", color: "#9ca3af" }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>💳</div>
                <p style={{ fontSize: 13 }}>Aucune carte créée</p>
              </div>
            ) : cartes.map(carte => {
              const selected = selectId === carte.id;
              const dateExp = carte.dateExpiration ? (() => { const d = new Date(carte.dateExpiration); return `${String(d.getMonth()+1).padStart(2,"0")}/${String(d.getFullYear()).slice(-2)}`; })() : "—";
              return (
                <div key={carte.id} onClick={() => setSelectId(carte.id)} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "12px 16px", borderRadius: 10, cursor: "pointer", marginBottom: 8,
                  border: `1.5px solid ${selected ? "#7c3aed" : "#e5e7eb"}`,
                  background: selected ? "#f5f3ff" : "#fafafa", transition: "all 0.2s"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 44, height: 28, borderRadius: 6, background: "linear-gradient(135deg, #7c3aed, #4f46e5)", flexShrink: 0 }} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{carte.nomUtilisateur || "—"}</div>
                      <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>•••• {carte.numero?.slice(-4)} · Exp {dateExp}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ background: carte.statut === "ACTIVE" ? "#dcfce7" : "#fee2e2", color: carte.statut === "ACTIVE" ? "#16a34a" : "#dc2626", padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700 }}>
                      {carte.statut}
                    </span>
                    {carte.statut === "ACTIVE"
                      ? <button onClick={e => { e.stopPropagation(); bloquer(carte.id); }} style={{ background: "none", border: "1px solid #e5e7eb", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer", color: "#d97706" }}>Bloquer</button>
                      : <button onClick={e => { e.stopPropagation(); debloquer(carte.id); }} style={{ background: "none", border: "1px solid #e5e7eb", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer", color: "#16a34a" }}>Débloquer</button>
                    }
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stats depuis BDD */}
        <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 6px rgba(0,0,0,0.05)", height: "fit-content" }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>Statistiques</div>
          {[
            { label: "Total des cartes",  val: cartes.length },
            { label: "Cartes actives",    val: stats.totalActives },
            { label: "Cartes bloquées",   val: stats.totalBloquees },
            { label: "Utilisateurs avec carte", val: [...new Set(cartes.map(c => c.email))].length },
          ].map((s, i, arr) => (
            <div key={s.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: i < arr.length - 1 ? "1px solid #f3f4f6" : "none" }}>
              <span style={{ fontSize: 13, color: "#6b7280" }}>{s.label}</span>
              <span style={{ fontWeight: 800, fontSize: 18, color: "#1e1e2e" }}>{s.val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}