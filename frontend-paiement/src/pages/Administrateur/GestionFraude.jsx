// ════════════════════════════════════════════════════
//  GestionFraude.jsx — données depuis BDD
// ════════════════════════════════════════════════════
import { useState, useEffect } from "react";
import api from "../../services/api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function GestionFraude({ allerVers }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  const token   = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    const charger = async () => {
      try {
        const res = await api.get("/admin/fraudes", { headers });
        setData(res.data);
      } catch { }
      finally { setLoading(false); }
    };
    charger();
  }, []);

  const couleur = (s) => s === "VALIDEE" ? "#16a34a" : s === "EN_ATTENTE" ? "#d97706" : "#dc2626";
  const bg      = (s) => s === "VALIDEE" ? "#dcfce7" : s === "EN_ATTENTE" ? "#fef3c7" : "#fee2e2";

  const donneesTypes = data ? [
    { type: "Montant élevé", nb: data.parType?.montantEleve || 0 },
    { type: "En attente prolongé", nb: data.parType?.enAttenteProlong || 0 },
  ] : [];

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Chargement...</div>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1e1e2e", margin: 0 }}>Gestion des fraudes</h2>
          <p style={{ color: "#9ca3af", fontSize: 13, marginTop: 4 }}>Transactions suspectes détectées automatiquement</p>
        </div>
        <button onClick={() => allerVers && allerVers("dashboard")} style={{ background: "none", border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#6b7280" }}>← Retour</button>
      </div>

      {/* Alerte */}
      <div style={{ background: "#fef2f2", borderRadius: 10, padding: "14px 18px", marginBottom: 20, border: "1px solid #fecaca" }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: "#dc2626", margin: 0 }}>
          🚨 {data?.totalSuspectes || 0} transaction(s) suspecte(s) détectée(s)
        </p>
        <p style={{ fontSize: 11, color: "#ef4444", margin: "4px 0 0" }}>
          Critères : montant &gt; 100 000 XAF ou EN_ATTENTE depuis + de 24h
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        {/* Graphique */}
        <div style={{ background: "#fff", borderRadius: 12, padding: 20, border: "1px solid #e2e8f0" }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: "#1e1e2e", marginBottom: 16 }}>Types de fraudes détectées</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={donneesTypes}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="type" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="nb" fill="#ef4444" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Stats */}
        <div style={{ background: "#fff", borderRadius: 12, padding: 20, border: "1px solid #e2e8f0" }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: "#1e1e2e", marginBottom: 16 }}>Résumé</p>
          {[
            { label: "Total suspectes",     val: data?.totalSuspectes || 0,                color: "#dc2626" },
            { label: "Montant élevé",       val: data?.parType?.montantEleve || 0,         color: "#f59e0b" },
            { label: "Attente prolongée",   val: data?.parType?.enAttenteProlong || 0,     color: "#3b82f6" },
          ].map(s => (
            <div key={s.label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f1f5f9" }}>
              <span style={{ fontSize: 13, color: "#64748b" }}>{s.label}</span>
              <span style={{ fontSize: 16, fontWeight: 800, color: s.color }}>{s.val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tableau */}
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#dc2626" }}>
              {["ID", "Utilisateur", "Montant", "Type", "Statut", "Date", "Raison"].map(h => (
                <th key={h} style={{ padding: "10px 14px", fontSize: 11, fontWeight: 700, color: "#fff", textAlign: "left" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!data?.fraudes?.length ? (
              <tr><td colSpan={7} style={{ padding: 30, textAlign: "center", color: "#94a3b8" }}>✅ Aucune transaction suspecte</td></tr>
            ) : data.fraudes.map((f, i) => (
              <tr key={f.id} style={{ borderBottom: "1px solid #f1f5f9", background: i % 2 === 0 ? "#fff" : "#fff5f5" }}>
                <td style={{ padding: "10px 14px", fontSize: 12, fontFamily: "monospace", color: "#dc2626" }}>#{f.id}</td>
                <td style={{ padding: "10px 14px" }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>{f.nomUtilisateur || "—"}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>{f.telephone}</div>
                </td>
                <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 700, color: "#dc2626" }}>
                  {Number(f.montant).toLocaleString("fr-FR")} XAF
                </td>
                <td style={{ padding: "10px 14px", fontSize: 11, color: "#64748b" }}>{f.typeTransfert || "TOP UP"}</td>
                <td style={{ padding: "10px 14px" }}>
                  <span style={{ padding: "3px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: bg(f.statut), color: couleur(f.statut) }}>{f.statut}</span>
                </td>
                <td style={{ padding: "10px 14px", fontSize: 11, color: "#94a3b8" }}>{f.dateTransaction?.split("T")[0]}</td>
                <td style={{ padding: "10px 14px", fontSize: 11, color: "#dc2626", fontWeight: 600 }}>
                  {Math.abs(Number(f.montant)) > 100000 ? "⚠️ Montant élevé" : "⏱️ Attente prolongée"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}