import { useState, useEffect } from "react";
import api from "../../services/api";

function StatCard({ label, valeur, sous, icon, color }) {
  return (
    <div style={{ background: "#fff", borderRadius: 14, padding: "18px 22px", flex: 1, minWidth: 150, boxShadow: "0 2px 12px rgba(108,63,195,0.07)", borderTop: `4px solid ${color}`, position: "relative" }}>
      <div style={{ fontSize: 12, color: "#888", fontWeight: 600, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: "#1e1e2e" }}>{valeur}</div>
      {sous && <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>{sous}</div>}
      <div style={{ position: "absolute", right: 18, top: 18, background: color + "22", borderRadius: 10, padding: 8, fontSize: 20 }}>{icon}</div>
    </div>
  );
}

const btnStyle = (color) => ({ background: color, color: "#fff", border: "none", borderRadius: 6, padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" });

export default function GestionUtilisateurs({ allerVers }) {
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [recherche, setRecherche]       = useState("");
  const [filtreStatut, setFiltreStatut] = useState("Tous");
  const [msg, setMsg]                   = useState(null);

  const token   = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const charger = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/utilisateurs", { headers });
      setUtilisateurs(res.data.utilisateurs || []);
    } catch { setUtilisateurs([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { charger(); }, []);

  const suspendre = async (id) => {
    try {
      await api.put(`/admin/utilisateurs/${id}/suspendre`, {}, { headers });
      setMsg({ type: "success", text: "Utilisateur suspendu." });
      charger();
    } catch (e) { setMsg({ type: "error", text: e.response?.data?.message || "Erreur." }); }
  };

  const activer = async (id) => {
    try {
      await api.put(`/admin/utilisateurs/${id}/activer`, {}, { headers });
      setMsg({ type: "success", text: "Utilisateur activé." });
      charger();
    } catch (e) { setMsg({ type: "error", text: e.response?.data?.message || "Erreur." }); }
  };

  const supprimer = async (id) => {
    if (!window.confirm("Supprimer cet utilisateur ? Cette action est irréversible.")) return;
    try {
      await api.delete(`/admin/utilisateurs/${id}`, { headers });
      setMsg({ type: "success", text: "Utilisateur supprimé." });
      charger();
    } catch (e) { setMsg({ type: "error", text: e.response?.data?.message || "Erreur." }); }
  };

  const filtres = utilisateurs.filter(u =>
    (u.nom?.toLowerCase().includes(recherche.toLowerCase()) || u.email?.toLowerCase().includes(recherche.toLowerCase())) &&
    (filtreStatut === "Tous" || u.statut === filtreStatut)
  );

  const suspendus = utilisateurs.filter(u => u.statut === "SUSPENDU").length;
  const total     = utilisateurs.length;

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1e1e2e", marginBottom: 16 }}>Gestion des utilisateurs</h2>

      {/* Stats depuis BDD */}
      <div style={{ display: "flex", gap: 14, marginBottom: 20, flexWrap: "wrap" }}>
        <StatCard label="Total utilisateurs"  valeur={total}     sous="dans la plateforme" icon="👥" color="#7c3aed" />
        <StatCard label="Comptes actifs"      valeur={utilisateurs.filter(u => u.statut === "ACTIF").length} sous="comptes actifs" icon="✅" color="#22c55e" />
        <StatCard label="Comptes suspendus"   valeur={suspendus} sous="comptes bloqués"    icon="🚫" color="#ef4444" />
      </div>

      {msg && (
        <div style={{ padding: "10px 14px", borderRadius: 8, marginBottom: 14, fontSize: 13, fontWeight: 600, background: msg.type === "success" ? "#f0fdf4" : "#fef2f2", color: msg.type === "success" ? "#16a34a" : "#dc2626", border: `1px solid ${msg.type === "success" ? "#bbf7d0" : "#fecaca"}` }}>
          {msg.text}
        </div>
      )}

      <div style={{ background: "#fff", borderRadius: 14, padding: 20, boxShadow: "0 2px 12px rgba(108,63,195,0.07)" }}>
        {/* Filtres */}
        <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "center" }}>
          <input value={recherche} onChange={e => setRecherche(e.target.value)} placeholder="Rechercher par nom ou email"
            style={{ flex: 1, padding: "9px 14px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, outline: "none" }} />
          <select value={filtreStatut} onChange={e => setFiltreStatut(e.target.value)}
            style={{ padding: "9px 14px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, background: "#fff", cursor: "pointer" }}>
            <option value="Tous">Tous</option>
            <option value="ACTIF">ACTIF</option>
            <option value="SUSPENDU">SUSPENDU</option>
            <option value="INACTIF">INACTIF</option>
          </select>
          <span style={{ fontSize: 12, color: "#94a3b8" }}>{filtres.length} résultat(s)</span>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#f8f5ff" }}>
              {["#", "Nom", "Téléphone", "Email", "Type", "Statut", "Solde", "Date", "Actions"].map(h => (
                <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: "#7c3aed", fontWeight: 700, whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{ padding: 30, textAlign: "center", color: "#94a3b8" }}>Chargement...</td></tr>
            ) : filtres.length === 0 ? (
              <tr><td colSpan={9} style={{ padding: 30, textAlign: "center", color: "#94a3b8" }}>Aucun utilisateur trouvé</td></tr>
            ) : filtres.map((u, i) => (
              <tr key={u.id} style={{ borderBottom: "1px solid #f3f4f6", transition: "background 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.background = "#faf8ff"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <td style={{ padding: "10px 12px", color: "#6366f1", fontWeight: 600, fontSize: 11 }}>#{u.id}</td>
                <td style={{ padding: "10px 12px", fontWeight: 600 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#a78bfa)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 700 }}>
                      {u.nom?.[0]?.toUpperCase()}
                    </div>
                    {u.nom}
                  </div>
                </td>
                <td style={{ padding: "10px 12px", color: "#555" }}>{u.telephone || "—"}</td>
                <td style={{ padding: "10px 12px", color: "#555" }}>{u.email}</td>
                <td style={{ padding: "10px 12px" }}>
                  <span style={{ background: u.type === "ADMIN" ? "#fef3c7" : "#f1f5f9", color: u.type === "ADMIN" ? "#d97706" : "#64748b", padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700 }}>
                    {u.type}
                  </span>
                </td>
                <td style={{ padding: "10px 12px" }}>
                  <span style={{ background: u.statut === "ACTIF" ? "#dcfce7" : u.statut === "SUSPENDU" ? "#fee2e2" : "#fef3c7", color: u.statut === "ACTIF" ? "#16a34a" : u.statut === "SUSPENDU" ? "#dc2626" : "#d97706", padding: "2px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700 }}>
                    {u.statut}
                  </span>
                </td>
                <td style={{ padding: "10px 12px", fontWeight: 700, color: "#7c3aed" }}>
                  {Number(u.solde || 0).toLocaleString("fr-FR")} XAF
                </td>
                <td style={{ padding: "10px 12px", color: "#aaa", fontSize: 11 }}>
                  {u.created_at?.split("T")[0] || "—"}
                </td>
                <td style={{ padding: "10px 12px" }}>
                  <div style={{ display: "flex", gap: 5 }}>
                    {u.statut !== "SUSPENDU"
                      ? <button onClick={() => suspendre(u.id)} style={btnStyle("#f59e0b")}>Suspendre</button>
                      : <button onClick={() => activer(u.id)}   style={btnStyle("#22c55e")}>Réactiver</button>
                    }
                    <button onClick={() => supprimer(u.id)} style={btnStyle("#ef4444")}>Supprimer</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}