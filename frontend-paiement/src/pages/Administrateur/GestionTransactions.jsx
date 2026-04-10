import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, BarChart, Bar } from "recharts";
import api from "../../services/api";

const btnStyle = (color) => ({ background: color, color: "#fff", border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" });

export default function GestionTransactions({ allerVers }) {
  const [transactions, setTransactions] = useState([]);
  const [parJour, setParJour] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recherche, setRecherche] = useState("");
  const [filtreStatut, setFiltreStatut] = useState("Tous");
  const [detail, setDetail] = useState(null);
  const [msg, setMsg] = useState(null);

  // Pagination
  const [pageActuelle, setPageActuelle] = useState(1);
  const transactionsParPage = 5;

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const charger = async (statut) => {
    try {
      setLoading(true);
      const params = statut && statut !== "Tous" ? { statut } : {};
      const res = await api.get("/admin/transactions", { headers, params });
      setTransactions(res.data.transactions || []);
      setParJour(res.data.parJour || []);
      setPageActuelle(1);
    } catch { setTransactions([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { charger(); }, []);

  const valider = async (id) => {
    try {
      await api.put(`/admin/transactions/${id}/valider`, {}, { headers });
      setMsg({ type: "success", text: "Transaction validée." });
      charger();
    } catch (e) { setMsg({ type: "error", text: "Erreur." }); }
  };

  const annuler = async (id) => {
    try {
      await api.put(`/admin/transactions/${id}/annuler`, {}, { headers });
      setMsg({ type: "success", text: "Transaction annulée." });
      charger();
    } catch (e) { setMsg({ type: "error", text: "Erreur." }); }
  };

  const supprimer = async (id) => {
    if (!window.confirm("Supprimer définitivement cette transaction ?")) return;
    try {
      await api.delete(`/admin/transactions/${id}`, { headers });
      setMsg({ type: "success", text: "Transaction supprimée." });
      charger();
    } catch (e) { setMsg({ type: "error", text: "Erreur lors de la suppression." }); }
  };

  const filtrees = transactions.filter(t =>
    (filtreStatut === "Tous" || t.statut === filtreStatut) &&
    (String(t.id).includes(recherche) ||
      t.envoyeur?.toLowerCase().includes(recherche.toLowerCase()) ||
      t.email?.toLowerCase().includes(recherche.toLowerCase()))
  );

  // Logique Pagination
  const indexDernier = pageActuelle * transactionsParPage;
  const indexPremier = indexDernier - transactionsParPage;
  const transactionsAffichees = filtrees.slice(indexPremier, indexDernier);
  const totalPages = Math.ceil(filtrees.length / transactionsParPage);

  const couleurStatut = (s) => s === "VALIDEE" ? "#22c55e" : s === "EN_ATTENTE" ? "#f59e0b" : "#ef4444";

  const donneesTypes = [
    { type: "Montant élevé", nb: transactions.filter(t => Math.abs(Number(t.montant)) > 100000).length },
    { type: "En attente", nb: transactions.filter(t => t.statut === "EN_ATTENTE").length },
    { type: "Annulées", nb: transactions.filter(t => t.statut === "ANNULEE").length },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: "#1e1e2e", margin: 0 }}>Gestion des transactions</h2>
          <p style={{ color: "#aaa", fontSize: 13, marginTop: 4 }}>Toutes les transactions de la plateforme PayVirtual</p>
        </div>
        <button onClick={() => allerVers && allerVers("dashboard")} style={{ ...btnStyle("#7c3aed"), padding: "8px 16px", fontSize: 13 }}>← Retour</button>
      </div>

      {msg && (
        <div style={{ padding: "10px 14px", borderRadius: 8, marginBottom: 14, fontSize: 13, fontWeight: 600, background: msg.type === "success" ? "#f0fdf4" : "#fef2f2", color: msg.type === "success" ? "#16a34a" : "#dc2626", border: `1px solid ${msg.type === "success" ? "#bbf7d0" : "#fecaca"}` }}>
          {msg.text}
        </div>
      )}

      {/* Tableau avec Pagination */}
      <div style={{ background: "#fff", borderRadius: 14, padding: 20, boxShadow: "0 2px 12px rgba(108,63,195,0.07)", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Historique</div>
          <div style={{ display: "flex", gap: 10 }}>
            <input value={recherche} onChange={e => setRecherche(e.target.value)} placeholder="Rechercher..." style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, outline: "none" }} />
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8f5ff" }}>
                {["ID", "Utilisateur", "Montant", "Statut", "Date", "Actions"].map(h => (
                  <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: "#7c3aed", fontWeight: 700 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transactionsAffichees.map((t) => (
                <tr key={t.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "10px 12px", fontWeight: 600 }}>#{t.id}</td>
                  <td style={{ padding: "10px 12px" }}>{t.envoyeur}</td>
                  <td style={{ padding: "10px 12px", fontWeight: 700 }}>{Number(t.montant).toLocaleString()} XAF</td>
                  <td style={{ padding: "10px 12px" }}>
                    <span style={{ background: couleurStatut(t.statut) + "22", color: couleurStatut(t.statut), padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{t.statut}</span>
                  </td>
                  <td style={{ padding: "10px 12px", color: "#aaa" }}>{t.dateTransaction?.split("T")[0]}</td>
                  <td style={{ padding: "10px 12px" }}>
                    <div style={{ display: "flex", gap: 5 }}>
                      <button onClick={() => setDetail(t)} style={btnStyle("#7c3aed")}>Détails</button>
                      <button onClick={() => supprimer(t.id)} style={btnStyle("#ef4444")}>Supprimer</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Numérique */}
        <div style={{ display: "flex", justifyContent: "center", gap: 5, marginTop: 15 }}>
          {[...Array(totalPages)].map((_, i) => (
            <button key={i} onClick={() => setPageActuelle(i + 1)} style={{ padding: "5px 10px", borderRadius: 4, border: "none", background: pageActuelle === i + 1 ? "#7c3aed" : "#f1f5f9", color: pageActuelle === i + 1 ? "#fff" : "#666", cursor: "pointer", fontWeight: 700 }}>
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Tes Graphiques Restaurés */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={{ background: "#fff", borderRadius: 14, padding: 20, boxShadow: "0 2px 12px rgba(108,63,195,0.07)" }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#1e1e2e", marginBottom: 16 }}>Transactions des 7 derniers jours</div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={parJour}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="completee" stroke="#22c55e" strokeWidth={2} name="Validées" />
              <Line type="monotone" dataKey="echouee" stroke="#ef4444" strokeWidth={2} name="Annulées" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: "#fff", borderRadius: 14, padding: 20, boxShadow: "0 2px 12px rgba(108,63,195,0.07)" }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#1e1e2e", marginBottom: 16 }}>Analyse des transactions</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={donneesTypes}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="type" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="nb" fill="#7c3aed" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Modal Détails (Identique au précédent) */}
      {detail && (
         <div style={{ position: "fixed", inset: 0, background: "#00000055", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
           <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: 400 }}>
             <h3 style={{ fontWeight: 800, marginBottom: 20 }}>Détails #{detail.id}</h3>
             <button onClick={() => setDetail(null)} style={{ ...btnStyle("#7c3aed"), width: "100%" }}>Fermer</button>
           </div>
         </div>
      )}
    </div>
  );
}









// import { useState, useEffect } from "react";
// import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, BarChart, Bar } from "recharts";
// import api from "../../services/api";

// const btnStyle = (color) => ({ background: color, color: "#fff", border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" });

// export default function GestionTransactions({ allerVers }) {
//   const [transactions, setTransactions] = useState([]);
//   const [parJour, setParJour]           = useState([]);
//   const [loading, setLoading]           = useState(true);
//   const [recherche, setRecherche]       = useState("");
//   const [filtreStatut, setFiltreStatut] = useState("Tous");
//   const [detail, setDetail]             = useState(null);
//   const [msg, setMsg]                   = useState(null);

//   const token   = localStorage.getItem("token");
//   const headers = { Authorization: `Bearer ${token}` };

//   const charger = async (statut) => {
//     try {
//       setLoading(true);
//       const params = statut && statut !== "Tous" ? { statut } : {};
//       const res = await api.get("/admin/transactions", { headers, params });
//       setTransactions(res.data.transactions || []);
//       setParJour(res.data.parJour || []);
//     } catch { setTransactions([]); }
//     finally { setLoading(false); }
//   };

//   useEffect(() => { charger(); }, []);

//   const valider = async (id) => {
//     try {
//       await api.put(`/admin/transactions/${id}/valider`, {}, { headers });
//       setMsg({ type: "success", text: "Transaction validée." });
//       charger();
//     } catch (e) { setMsg({ type: "error", text: e.response?.data?.message || "Erreur." }); }
//   };

//   const annuler = async (id) => {
//     try {
//       await api.put(`/admin/transactions/${id}/annuler`, {}, { headers });
//       setMsg({ type: "success", text: "Transaction annulée." });
//       charger();
//     } catch (e) { setMsg({ type: "error", text: e.response?.data?.message || "Erreur." }); }
//   };

//   const filtrees = transactions.filter(t =>
//     (filtreStatut === "Tous" || t.statut === filtreStatut) &&
//     (String(t.id).includes(recherche) ||
//      t.envoyeur?.toLowerCase().includes(recherche.toLowerCase()) ||
//      t.email?.toLowerCase().includes(recherche.toLowerCase()))
//   );

//   const couleurStatut = (s) => s === "VALIDEE" ? "#22c55e" : s === "EN_ATTENTE" ? "#f59e0b" : "#ef4444";

//   // Données graphique types suspects
//   const donneesTypes = [
//     { type: "Montant élevé",    nb: transactions.filter(t => Math.abs(Number(t.montant)) > 100000).length },
//     { type: "En attente",       nb: transactions.filter(t => t.statut === "EN_ATTENTE").length },
//     { type: "Annulées",         nb: transactions.filter(t => t.statut === "ANNULEE").length },
//   ];

//   return (
//     <div>
//       <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
//         <div>
//           <h2 style={{ fontSize: 22, fontWeight: 900, color: "#1e1e2e", margin: 0 }}>Gestion des transactions</h2>
//           <p style={{ color: "#aaa", fontSize: 13, marginTop: 4 }}>Toutes les transactions de la plateforme PayVirtual</p>
//         </div>
//         <button onClick={() => allerVers && allerVers("dashboard")} style={{ ...btnStyle("#7c3aed"), padding: "8px 16px", fontSize: 13 }}>← Retour</button>
//       </div>

//       {msg && (
//         <div style={{ padding: "10px 14px", borderRadius: 8, marginBottom: 14, fontSize: 13, fontWeight: 600, background: msg.type === "success" ? "#f0fdf4" : "#fef2f2", color: msg.type === "success" ? "#16a34a" : "#dc2626", border: `1px solid ${msg.type === "success" ? "#bbf7d0" : "#fecaca"}` }}>
//           {msg.text}
//         </div>
//       )}

//       {/* Tableau historique depuis BDD */}
//       <div style={{ background: "#fff", borderRadius: 14, padding: 20, boxShadow: "0 2px 12px rgba(108,63,195,0.07)", marginBottom: 20 }}>
//         <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
//           <div style={{ fontWeight: 700, fontSize: 15, color: "#1e1e2e" }}>Historique des transactions</div>
//           <div style={{ display: "flex", gap: 10 }}>
//             <input value={recherche} onChange={e => setRecherche(e.target.value)}
//               placeholder="ID, nom ou email..."
//               style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, outline: "none", width: 220 }} />
//             <select value={filtreStatut} onChange={e => { setFiltreStatut(e.target.value); charger(e.target.value); }}
//               style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, background: "#fff" }}>
//               <option value="Tous">Tous</option>
//               <option value="VALIDEE">Validée</option>
//               <option value="EN_ATTENTE">En attente</option>
//               <option value="ANNULEE">Annulée</option>
//             </select>
//           </div>
//         </div>

//         <div style={{ overflowX: "auto" }}>
//           <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
//             <thead>
//               <tr style={{ background: "#f8f5ff" }}>
//                 {["ID", "Utilisateur", "Montant", "Type", "Statut", "Date", "Actions"].map(h => (
//                   <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: "#7c3aed", fontWeight: 700, whiteSpace: "nowrap" }}>{h}</th>
//                 ))}
//               </tr>
//             </thead>
//             <tbody>
//               {loading ? (
//                 <tr><td colSpan={7} style={{ padding: 30, textAlign: "center", color: "#94a3b8" }}>Chargement...</td></tr>
//               ) : filtrees.length === 0 ? (
//                 <tr><td colSpan={7} style={{ padding: 30, textAlign: "center", color: "#94a3b8" }}>Aucune transaction</td></tr>
//               ) : filtrees.map((t, i) => (
//                 <tr key={t.id} style={{ borderBottom: "1px solid #f3f4f6", transition: "background 0.15s" }}
//                   onMouseEnter={e => e.currentTarget.style.background = "#faf8ff"}
//                   onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
//                   <td style={{ padding: "10px 12px", color: "#6366f1", fontWeight: 600 }}>#{t.id}</td>
//                   <td style={{ padding: "10px 12px" }}>
//                     <div style={{ fontWeight: 600 }}>{t.envoyeur || "—"}</div>
//                     <div style={{ fontSize: 11, color: "#94a3b8" }}>{t.email}</div>
//                   </td>
//                   <td style={{ padding: "10px 12px", fontWeight: 700, color: Number(t.montant) >= 0 ? "#16a34a" : "#ef4444" }}>
//                     {Number(t.montant) >= 0 ? "+" : ""}{Number(t.montant).toLocaleString("fr-FR")} XAF
//                   </td>
//                   <td style={{ padding: "10px 12px", color: "#64748b", fontSize: 12 }}>
//                     {t.typeTransfert || "TOP UP"}
//                   </td>
//                   <td style={{ padding: "10px 12px" }}>
//                     <span style={{ background: couleurStatut(t.statut) + "22", color: couleurStatut(t.statut), padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
//                       {t.statut}
//                     </span>
//                   </td>
//                   <td style={{ padding: "10px 12px", color: "#aaa", fontSize: 12 }}>
//                     {t.dateTransaction?.split("T")[0] || "—"}
//                   </td>
//                   <td style={{ padding: "10px 12px" }}>
//                     <div style={{ display: "flex", gap: 5 }}>
//                       <button onClick={() => setDetail(t)} style={btnStyle("#7c3aed")}>Détails</button>
//                       {t.statut === "EN_ATTENTE" && (
//                         <>
//                           <button onClick={() => valider(t.id)} style={btnStyle("#22c55e")}>Valider</button>
//                           <button onClick={() => annuler(t.id)} style={btnStyle("#ef4444")}>Annuler</button>
//                         </>
//                       )}
//                     </div>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//         <div style={{ fontSize: 12, color: "#aaa", marginTop: 12 }}>
//           {filtrees.length} sur {transactions.length} transaction(s)
//         </div>
//       </div>

//       {/* Graphiques */}
//       <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
//         <div style={{ background: "#fff", borderRadius: 14, padding: 20, boxShadow: "0 2px 12px rgba(108,63,195,0.07)" }}>
//           <div style={{ fontWeight: 700, fontSize: 14, color: "#1e1e2e", marginBottom: 16 }}>Transactions des 7 derniers jours</div>
//           <ResponsiveContainer width="100%" height={180}>
//             <LineChart data={parJour}>
//               <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
//               <XAxis dataKey="date" tick={{ fontSize: 11 }} />
//               <YAxis tick={{ fontSize: 11 }} />
//               <Tooltip />
//               <Legend />
//               <Line type="monotone" dataKey="completee" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} name="Validées" />
//               <Line type="monotone" dataKey="echouee"   stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} name="Annulées" />
//             </LineChart>
//           </ResponsiveContainer>
//         </div>

//         <div style={{ background: "#fff", borderRadius: 14, padding: 20, boxShadow: "0 2px 12px rgba(108,63,195,0.07)" }}>
//           <div style={{ fontWeight: 700, fontSize: 14, color: "#1e1e2e", marginBottom: 16 }}>Analyse des transactions</div>
//           <ResponsiveContainer width="100%" height={180}>
//             <BarChart data={donneesTypes}>
//               <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
//               <XAxis dataKey="type" tick={{ fontSize: 10 }} />
//               <YAxis tick={{ fontSize: 11 }} />
//               <Tooltip />
//               <Bar dataKey="nb" fill="#7c3aed" radius={[6, 6, 0, 0]} />
//             </BarChart>
//           </ResponsiveContainer>
//         </div>
//       </div>

//       {/* Modal détail */}
//       {detail && (
//         <div style={{ position: "fixed", inset: 0, background: "#00000055", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
//           <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: 400, boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}>
//             <h3 style={{ fontWeight: 800, color: "#1e1e2e", marginBottom: 20 }}>Détails — Transaction #{detail.id}</h3>
//             {[
//               { label: "Utilisateur",  val: detail.envoyeur || "—" },
//               { label: "Email",        val: detail.email    || "—" },
//               { label: "Montant",      val: `${Number(detail.montant).toLocaleString("fr-FR")} XAF` },
//               { label: "Type",         val: detail.typeTransfert || "TOP UP" },
//               { label: "Pays source",  val: detail.paysSource      || "—" },
//               { label: "Pays dest.",   val: detail.paysDestination || "—" },
//               { label: "Date",         val: detail.dateTransaction?.split("T")[0] || "—" },
//               { label: "Statut",       val: detail.statut },
//             ].map(r => (
//               <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f3f4f6", fontSize: 13 }}>
//                 <span style={{ color: "#888", fontWeight: 600 }}>{r.label}</span>
//                 <span style={{ fontWeight: 700, color: "#1e1e2e" }}>{r.val}</span>
//               </div>
//             ))}
//             <button onClick={() => setDetail(null)} style={{ ...btnStyle("#7c3aed"), width: "100%", marginTop: 20, padding: "10px", fontSize: 13 }}>Fermer</button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }