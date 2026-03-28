import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import api from "../../services/api";

const couleurStatut = (s) => s === "VALIDEE" ? "#16a34a" : s === "EN_ATTENTE" ? "#d97706" : "#dc2626";
const bgStatut      = (s) => s === "VALIDEE" ? "#dcfce7"  : s === "EN_ATTENTE" ? "#fef3c7"  : "#fee2e2";

export default function GestionFonds({ allerVers }) {
  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [filtreType, setFiltreType]     = useState("Tous");
  const [filtreStatut, setFiltreStatut] = useState("Tous");
  const [recherche, setRecherche]       = useState("");
  const [showModal, setShowModal]       = useState(false);
  const [detailTx, setDetailTx]         = useState(null);
  const [msg, setMsg]                   = useState(null);
  const [form, setForm] = useState({ utilisateur_id: "", montant: "", description: "" });
  const [envoi, setEnvoi] = useState(false);

  const token   = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const charger = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/fonds", { headers });
      setData(res.data);
    } catch { }
    finally { setLoading(false); }
  };

  useEffect(() => { charger(); }, []);

  const crediter = async () => {
    if (!form.utilisateur_id || !form.montant) {
      setMsg({ type: "error", text: "Sélectionnez un utilisateur et entrez un montant." });
      return;
    }
    try {
      setEnvoi(true);
      const res = await api.post("/admin/fonds/crediter", form, { headers });
      setMsg({ type: "success", text: res.data.message });
      setForm({ utilisateur_id: "", montant: "", description: "" });
      setShowModal(false);
      charger();
    } catch (e) {
      setMsg({ type: "error", text: e.response?.data?.message || "Erreur." });
    } finally { setEnvoi(false); }
  };

  const validerTx = async (id) => {
    try {
      await api.put(`/admin/fonds/transactions/${id}/valider`, {}, { headers });
      setMsg({ type: "success", text: "Transaction validée." });
      charger();
    } catch (e) { setMsg({ type: "error", text: "Erreur." }); }
  };

  const txFiltrees = (data?.transactions || []).filter(t =>
    (filtreStatut === "Tous" || t.statut === filtreStatut) &&
    (t.utilisateur?.toLowerCase().includes(recherche.toLowerCase()) || String(t.id).includes(recherche))
  );

  const formatMontant = (m) => `${Number(m) >= 0 ? "+" : ""}${Number(m).toLocaleString("fr-FR")} XAF`;

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Chargement...</div>;

  return (
    <div style={{ color: "#1e1e2e" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Gestion des fonds</h2>
          <p style={{ color: "#9ca3af", fontSize: 13, marginTop: 4 }}>Entrées, sorties et solde global — données en temps réel</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => allerVers && allerVers("dashboard")} style={{ background: "none", border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#6b7280" }}>← Retour</button>
          <button onClick={() => setShowModal(true)} style={{ background: "#7c3aed", color: "#fff", border: "none", borderRadius: 8, padding: "8px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>💰 Créditer un compte</button>
        </div>
      </div>

      {msg && (
        <div style={{ padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 13, fontWeight: 600, background: msg.type === "success" ? "#f0fdf4" : "#fef2f2", color: msg.type === "success" ? "#16a34a" : "#dc2626", border: `1px solid ${msg.type === "success" ? "#bbf7d0" : "#fecaca"}` }}>
          {msg.text}
        </div>
      )}

      {/* Stats depuis BDD */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Solde total",       val: `${Number(data?.soldeTotal || 0).toLocaleString("fr-FR")} XAF`, sous: "Total plateforme",       border: "#7c3aed" },
          { label: "Total entrées",     val: `+${Number(data?.totalEntrees || 0).toLocaleString("fr-FR")} XAF`, sous: "Dépôts validés",     border: "#16a34a" },
          { label: "Total sorties",     val: `-${Number(data?.totalSorties || 0).toLocaleString("fr-FR")} XAF`, sous: "Retraits validés",   border: "#dc2626" },
          { label: "En attente",        val: data?.enAttente || 0,                                               sous: "À valider",          border: "#d97706" },
        ].map(c => (
          <div key={c.label} style={{ background: "#fff", borderRadius: 12, padding: "18px 20px", boxShadow: "0 1px 6px rgba(0,0,0,0.05)", borderTop: `3px solid ${c.border}` }}>
            <div style={{ fontSize: 12, color: "#9ca3af", fontWeight: 600, marginBottom: 6 }}>{c.label}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#1e1e2e" }}>{c.val}</div>
            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>{c.sous}</div>
          </div>
        ))}
      </div>

      {/* Graphique évolution depuis BDD */}
      <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 6px rgba(0,0,0,0.05)", marginBottom: 24 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Évolution des fonds (6 derniers mois)</div>
        <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 20 }}>Données réelles depuis la base de données</div>
        {data?.evolution?.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data.evolution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="mois" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={v => `${v.toLocaleString("fr-FR")} XAF`} />
              <Line type="monotone" dataKey="entree" stroke="#7c3aed" strokeWidth={2} dot={{ r: 3 }} name="Entrées" />
              <Line type="monotone" dataKey="sortie" stroke="#dc2626" strokeWidth={2} dot={{ r: 3 }} name="Sorties" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p style={{ textAlign: "center", color: "#94a3b8", padding: "20px 0" }}>Pas encore de données d'évolution</p>
        )}
      </div>

      {/* Tableau transactions depuis BDD */}
      <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>Historique des transactions</div>
          <div style={{ display: "flex", gap: 8 }}>
            <input value={recherche} onChange={e => setRecherche(e.target.value)} placeholder="Rechercher..."
              style={{ padding: "7px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, outline: "none", width: 180 }} />
            <select value={filtreStatut} onChange={e => setFiltreStatut(e.target.value)}
              style={{ padding: "7px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, background: "#fff" }}>
              <option value="Tous">Tous les statuts</option>
              <option value="VALIDEE">VALIDÉE</option>
              <option value="EN_ATTENTE">EN ATTENTE</option>
              <option value="ANNULEE">ANNULÉE</option>
            </select>
          </div>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#f9fafb" }}>
              {["ID", "Utilisateur", "Montant", "Type", "Date", "Statut", "Actions"].map(h => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: "#6b7280", fontWeight: 600, whiteSpace: "nowrap", borderBottom: "1px solid #f3f4f6" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {txFiltrees.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: 30, textAlign: "center", color: "#94a3b8" }}>Aucune transaction</td></tr>
            ) : txFiltrees.map(t => (
              <tr key={t.id} style={{ borderBottom: "1px solid #f9fafb" }}
                onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <td style={{ padding: "12px 14px", fontWeight: 600, color: "#6366f1" }}>#{t.id}</td>
                <td style={{ padding: "12px 14px" }}>
                  <div style={{ fontWeight: 600 }}>{t.utilisateur || "—"}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>{t.email}</div>
                </td>
                <td style={{ padding: "12px 14px", fontWeight: 700, color: Number(t.montant) >= 0 ? "#16a34a" : "#dc2626" }}>
                  {formatMontant(t.montant)}
                </td>
                <td style={{ padding: "12px 14px", color: "#6b7280" }}>{t.typeTransfert || "TOP UP"}</td>
                <td style={{ padding: "12px 14px", color: "#9ca3af", fontSize: 12 }}>{t.dateTransaction?.split("T")[0]}</td>
                <td style={{ padding: "12px 14px" }}>
                  <span style={{ background: bgStatut(t.statut), color: couleurStatut(t.statut), padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{t.statut}</span>
                </td>
                <td style={{ padding: "12px 14px" }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => setDetailTx(t)} style={{ background: "none", border: "1px solid #e5e7eb", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer", color: "#6b7280" }}>Détails</button>
                    {t.statut === "EN_ATTENTE" && (
                      <button onClick={() => validerTx(t.id)} style={{ background: "none", border: "1px solid #bbf7d0", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer", color: "#16a34a" }}>Valider</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 12 }}>{txFiltrees.length} sur {data?.transactions?.length || 0} transaction(s)</div>
      </div>

      {/* Modal créditer */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 32, width: 440, boxShadow: "0 16px 48px rgba(0,0,0,0.15)" }}>
            <h3 style={{ fontWeight: 800, fontSize: 18, color: "#1e1e2e", marginBottom: 20 }}>💰 Créditer un compte</h3>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Utilisateur</label>
              <select value={form.utilisateur_id} onChange={e => setForm({ ...form, utilisateur_id: e.target.value })}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, background: "#fafafa", outline: "none" }}>
                <option value="">-- Sélectionner un utilisateur --</option>
                {(data?.comptes || []).map(c => (
                  <option key={c.id} value={c.utilisateur_id}>
                    {c.nom} ({c.email}) — {Number(c.solde).toLocaleString("fr-FR")} XAF
                  </option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Montant (XAF)</label>
              <input type="number" value={form.montant} onChange={e => setForm({ ...form, montant: e.target.value })}
                placeholder="ex: 10000"
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, outline: "none", boxSizing: "border-box", background: "#fafafa" }} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Raison (optionnel)</label>
              <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Bonus, remboursement..."
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, outline: "none", boxSizing: "border-box", background: "#fafafa" }} />
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#6b7280" }}>Annuler</button>
              <button onClick={crediter} disabled={envoi} style={{ background: "#7c3aed", color: "#fff", border: "none", borderRadius: 8, padding: "10px 24px", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: envoi ? 0.7 : 1 }}>
                {envoi ? "Crédit..." : "Créditer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal détail */}
      {detailTx && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 32, width: 400, boxShadow: "0 16px 48px rgba(0,0,0,0.15)" }}>
            <h3 style={{ fontWeight: 800, fontSize: 18, color: "#1e1e2e", marginBottom: 20 }}>Détails — #{detailTx.id}</h3>
            {[
              { label: "Utilisateur", val: detailTx.utilisateur || "—" },
              { label: "Email",       val: detailTx.email       || "—" },
              { label: "Montant",     val: formatMontant(detailTx.montant) },
              { label: "Type",        val: detailTx.typeTransfert || "TOP UP" },
              { label: "Date",        val: detailTx.dateTransaction?.split("T")[0] || "—" },
              { label: "Statut",      val: detailTx.statut },
            ].map(r => (
              <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid #f3f4f6", fontSize: 13 }}>
                <span style={{ color: "#9ca3af", fontWeight: 600 }}>{r.label}</span>
                <span style={{ fontWeight: 700 }}>{r.val}</span>
              </div>
            ))}
            <button onClick={() => setDetailTx(null)} style={{ width: "100%", background: "#7c3aed", color: "#fff", border: "none", borderRadius: 8, padding: "11px 0", fontSize: 13, fontWeight: 700, cursor: "pointer", marginTop: 20 }}>Fermer</button>
          </div>
        </div>
      )}
    </div>
  );
}