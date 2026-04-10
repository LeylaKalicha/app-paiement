import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import api from "../../services/api";

const couleurStatut = (s) => s === "VALIDEE" ? "#16a34a" : s === "EN_ATTENTE" ? "#d97706" : "#dc2626";
const bgStatut      = (s) => s === "VALIDEE" ? "#dcfce7"  : s === "EN_ATTENTE" ? "#fef3c7"  : "#fee2e2";

export default function GestionFonds({ allerVers }) {
  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [filtreStatut, setFiltreStatut] = useState("Tous");
  const [recherche, setRecherche]       = useState("");
  const [detailTx, setDetailTx]         = useState(null);
  const [msg, setMsg]                   = useState(null);
  
  const [pageActuelle, setPageActuelle] = useState(1);
  const TX_PAR_PAGE = 8;

  const token   = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const charger = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/fonds", { headers });
      setData(res.data);
    } catch { 
      setMsg({ type: "error", text: "Erreur lors du chargement des données." });
    } finally { setLoading(false); }
  };

  useEffect(() => { charger(); }, []);

  const validerTx = async (id) => {
    try {
      await api.put(`/admin/fonds/transactions/${id}/valider`, {}, { headers });
      setMsg({ type: "success", text: "Transaction validée." });
      charger();
    } catch (e) { setMsg({ type: "error", text: "Erreur validation." }); }
  };

  const supprimerTx = async (id) => {
    if (!window.confirm("Supprimer définitivement cette transaction ?")) return;
    try {
      await api.delete(`/admin/fonds/transactions/${id}`, { headers });
      setMsg({ type: "success", text: "Transaction supprimée." });
      charger();
    } catch (e) { setMsg({ type: "error", text: "Erreur suppression." }); }
  };

  const txFiltrees = (data?.transactions || []).filter(t =>
    (filtreStatut === "Tous" || t.statut === filtreStatut) &&
    (t.utilisateur?.toLowerCase().includes(recherche.toLowerCase()) || String(t.id).includes(recherche))
  );

  const totalPages = Math.ceil(txFiltrees.length / TX_PAR_PAGE);
  const indexDernierElement = pageActuelle * TX_PAR_PAGE;
  const indexPremierElement = indexDernierElement - TX_PAR_PAGE;
  const transactionsAffichees = txFiltrees.slice(indexPremierElement, indexDernierElement);

  const formatMontant = (m) => `${Number(m) >= 0 ? "+" : ""}${Number(m).toLocaleString("fr-FR")} XAF`;

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Chargement PayVirtual...</div>;

  return (
    <div style={{ color: "#1e1e2e", padding: "10px" }}>
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Gestion des fonds</h2>
          <p style={{ color: "#9ca3af", fontSize: 13, marginTop: 4 }}>Suivi des flux financiers et statistiques</p>
        </div>
        <button onClick={() => allerVers("dashboard")} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#6b7280" }}>← Retour</button>
      </div>

      {msg && (
        <div style={{ padding: "12px", borderRadius: 8, marginBottom: 16, fontSize: 13, fontWeight: 600, background: msg.type === "success" ? "#f0fdf4" : "#fef2f2", color: msg.type === "success" ? "#16a34a" : "#dc2626", border: "1px solid" }}>
          {msg.text}
        </div>
      )}

      {/* CARTES STATISTIQUES */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Solde total",     val: `${Number(data?.soldeTotal || 0).toLocaleString("fr-FR")} XAF`, sous: "Trésorerie globale",     border: "#7c3aed" },
          { label: "Total entrées",   val: `+${Number(data?.totalEntrees || 0).toLocaleString("fr-FR")} XAF`, sous: "Flux entrants",     border: "#16a34a" },
          { label: "Total sorties",   val: `-${Number(data?.totalSorties || 0).toLocaleString("fr-FR")} XAF`, sous: "Flux sortants",     border: "#dc2626" },
          { label: "En attente",      val: data?.enAttente || 0,                                                                    sous: "Transactions à valider", border: "#d97706" },
        ].map(c => (
          <div key={c.label} style={{ background: "#fff", borderRadius: 12, padding: "18px 20px", boxShadow: "0 1px 6px rgba(0,0,0,0.05)", borderTop: `3px solid ${c.border}` }}>
            <div style={{ fontSize: 12, color: "#9ca3af", fontWeight: 600, marginBottom: 6 }}>{c.label}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#1e1e2e" }}>{c.val}</div>
            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>{c.sous}</div>
          </div>
        ))}
      </div>

      {/* GRAPHIQUE */}
      <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 6px rgba(0,0,0,0.05)", marginBottom: 24 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 20 }}>Évolution mensuelle des fonds</div>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data?.evolution || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis dataKey="mois" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000)}k`} />
            <Tooltip />
            <Line type="monotone" dataKey="entree" stroke="#7c3aed" strokeWidth={3} dot={{ r: 4 }} name="Entrées" />
            <Line type="monotone" dataKey="sortie" stroke="#dc2626" strokeWidth={3} dot={{ r: 4 }} name="Sorties" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* TABLEAU */}
      <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontWeight: 700 }}>Historique des transactions</div>
          <div style={{ display: "flex", gap: 10 }}>
            <input value={recherche} onChange={e => { setRecherche(e.target.value); setPageActuelle(1); }} placeholder="Rechercher..." style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, outline: "none" }} />
          </div>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#f9fafb", textAlign: "left" }}>
              <th style={{ padding: "12px 14px", color: "#6b7280" }}>ID</th>
              <th style={{ padding: "12px 14px", color: "#6b7280" }}>Utilisateur</th>
              <th style={{ padding: "12px 14px", color: "#6b7280" }}>Montant</th>
              <th style={{ padding: "12px 14px", color: "#6b7280" }}>Statut</th>
              <th style={{ padding: "12px 14px", color: "#6b7280", textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {transactionsAffichees.map(t => (
              <tr key={t.id} style={{ borderBottom: "1px solid #f9fafb" }}>
                <td style={{ padding: "14px", fontWeight: 600, color: "#6366f1" }}>#{t.id}</td>
                <td style={{ padding: "14px" }}>
                  <div style={{ fontWeight: 600 }}>{t.utilisateur}</div>
                  <div style={{ fontSize: 11, color: "#9ca3af" }}>{t.email}</div>
                </td>
                <td style={{ padding: "14px", fontWeight: 700, color: Number(t.montant) >= 0 ? "#16a34a" : "#dc2626" }}>
                  {formatMontant(t.montant)}
                </td>
                <td style={{ padding: "14px" }}>
                  <span style={{ background: bgStatut(t.statut), color: couleurStatut(t.statut), padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{t.statut}</span>
                </td>
                <td style={{ padding: "14px", textAlign: "right" }}>
                  <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                    <button onClick={() => setDetailTx(t)} style={{ background: "#7c3aed", color: "#fff", border: "none", borderRadius: 6, padding: "6px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Détails</button>
                    {t.statut === "EN_ATTENTE" && (
                      <button onClick={() => validerTx(t.id)} style={{ background: "#16a34a", color: "#fff", border: "none", borderRadius: 6, padding: "6px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Valider</button>
                    )}
                    <button onClick={() => supprimerTx(t.id)} style={{ background: "#dc2626", color: "#fff", border: "none", borderRadius: 6, padding: "6px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Supprimer</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 5, marginTop: 20 }}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(num => (
              <button key={num} onClick={() => setPageActuelle(num)} style={{ width: 32, height: 32, borderRadius: 6, border: "none", background: pageActuelle === num ? "#7c3aed" : "#f3f4f6", color: pageActuelle === num ? "#fff" : "#6b7280", cursor: "pointer", fontWeight: 700 }}>{num}</button>
            ))}
          </div>
        )}
      </div>

      {/* MODAL DE DÉTAILS PROFESSIONNEL */}
      {detailTx && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
          <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: "450px", boxShadow: "0 20px 25px rgba(0,0,0,0.2)", overflow: "hidden" }}>
            
            <div style={{ background: "#f8fafc", padding: "20px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 800 }}>Détails Transaction</h3>
                <span style={{ fontSize: "12px", color: "#64748b" }}>#{detailTx.id}</span>
              </div>
              <span style={{ background: bgStatut(detailTx.statut), color: couleurStatut(detailTx.statut), padding: "4px 12px", borderRadius: "8px", fontSize: "11px", fontWeight: 800 }}>{detailTx.statut}</span>
            </div>

            <div style={{ padding: "24px" }}>
               <div style={{ marginBottom: "20px" }}>
                 <div style={{ fontSize: "11px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", marginBottom: "10px" }}>Client</div>
                 <div style={{ fontWeight: 700, fontSize: "14px" }}>{detailTx.utilisateur}</div>
                 <div style={{ color: "#64748b", fontSize: "13px" }}>{detailTx.email}</div>
               </div>

               <div style={{ marginBottom: "20px" }}>
                 <div style={{ fontSize: "11px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", marginBottom: "10px" }}>Finances</div>
                 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc", padding: "12px", borderRadius: "10px" }}>
                   <span style={{ fontSize: "13px", color: "#64748b" }}>Montant net</span>
                   <span style={{ fontSize: "16px", fontWeight: 800, color: couleurStatut(detailTx.statut) }}>{formatMontant(detailTx.montant)}</span>
                 </div>
               </div>

               <div>
                 <div style={{ fontSize: "11px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", marginBottom: "10px" }}>Informations système</div>
                 <div style={{ fontSize: "13px", display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                   <span style={{ color: "#64748b" }}>Date de création :</span>
                   <span style={{ fontWeight: 600 }}>{detailTx.dateTransaction}</span>
                 </div>
               </div>
            </div>

            <div style={{ padding: "20px 24px", background: "#f8fafc", borderTop: "1px solid #e2e8f0" }}>
              <button onClick={() => setDetailTx(null)} style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "none", background: "#1e293b", color: "#fff", fontWeight: 700, cursor: "pointer" }}>Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}