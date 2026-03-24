import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const donneesEvolution = [
  { mois: "Jan", entree: 450000, sortie: 280000 },
  { mois: "Fév", entree: 380000, sortie: 310000 },
  { mois: "Mar", entree: 520000, sortie: 390000 },
  { mois: "Avr", entree: 610000, sortie: 420000 },
  { mois: "Mai", entree: 490000, sortie: 360000 },
  { mois: "Jun", entree: 570000, sortie: 410000 },
];

const transactionsInitiales = [
  { id: "FND001", type: "Dépôt",    utilisateur: "Christabel", montant: 150000, date: "2025-03-06", statut: "completé",   description: "Dépôt mobile money" },
  { id: "FND002", type: "Retrait",  utilisateur: "Kevin",      montant: -80000, date: "2025-03-06", statut: "completé",   description: "Retrait MTN" },
  { id: "FND003", type: "Transfert",utilisateur: "Leyla",      montant: 50000,  date: "2025-03-05", statut: "en attente", description: "Transfert interne" },
  { id: "FND004", type: "Dépôt",    utilisateur: "Pearl",      montant: 200000, date: "2025-03-05", statut: "completé",   description: "Dépôt Campay" },
  { id: "FND005", type: "Retrait",  utilisateur: "Mcbright",   montant: -35000, date: "2025-03-04", statut: "échoué",     description: "Retrait Orange Money" },
  { id: "FND006", type: "Dépôt",    utilisateur: "Cindy",      montant: 95000,  date: "2025-03-04", statut: "completé",   description: "Dépôt PayPal" },
];

const couleurStatut = (s) => s === "completé" ? "#16a34a" : s === "en attente" ? "#d97706" : "#dc2626";
const bgStatut     = (s) => s === "completé" ? "#dcfce7"  : s === "en attente" ? "#fef3c7"  : "#fee2e2";
const couleurType  = (t) => t === "Dépôt" ? "#7c3aed" : t === "Retrait" ? "#dc2626" : "#2563eb";

export default function GestionFonds({ allerVers }) {
  const [transactions, setTransactions] = useState(transactionsInitiales);
  const [filtreType, setFiltreType] = useState("Tous");
  const [filtreStatut, setFiltreStatut] = useState("Tous");
  const [recherche, setRecherche] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ type: "Dépôt", utilisateur: "", montant: "", description: "" });
  const [detailTx, setDetailTx] = useState(null);

  const totalEntrees  = transactions.filter(t => t.montant > 0).reduce((s, t) => s + t.montant, 0);
  const totalSorties  = transactions.filter(t => t.montant < 0).reduce((s, t) => s + Math.abs(t.montant), 0);
  const solde         = totalEntrees - totalSorties;
  const enAttente     = transactions.filter(t => t.statut === "en attente").length;

  const filtrees = transactions.filter(t =>
    (filtreType   === "Tous" || t.type   === filtreType) &&
    (filtreStatut === "Tous" || t.statut === filtreStatut) &&
    (t.utilisateur.toLowerCase().includes(recherche.toLowerCase()) ||
     t.id.toLowerCase().includes(recherche.toLowerCase()) ||
     t.description.toLowerCase().includes(recherche.toLowerCase()))
  );

  const ajouterTransaction = () => {
    if (!form.utilisateur.trim() || !form.montant) return;
    const montantNum = form.type === "Retrait" ? -Math.abs(Number(form.montant)) : Math.abs(Number(form.montant));
    setTransactions([{
      id: `FND${String(transactions.length + 1).padStart(3, "0")}`,
      type: form.type, utilisateur: form.utilisateur,
      montant: montantNum, date: new Date().toISOString().split("T")[0],
      statut: "en attente", description: form.description || `${form.type} manuel`
    }, ...transactions]);
    setForm({ type: "Dépôt", utilisateur: "", montant: "", description: "" });
    setShowModal(false);
  };

  const changerStatut = (id, statut) => setTransactions(t => t.map(x => x.id === id ? { ...x, statut } : x));

  const formatMontant = (m) => `${m > 0 ? "+" : ""}${m.toLocaleString("fr-FR")} XAF`;

  return (
    <div style={{ color: "#1e1e2e" }}>

      {/* En-tête */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Gestion des fonds</h2>
          <p style={{ color: "#9ca3af", fontSize: 13, marginTop: 4 }}>Suivez les entrées, sorties et le solde global de la plateforme</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => allerVers && allerVers("dashboard")}
            style={{ background: "none", border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#6b7280" }}>
            ← Retour
          </button>
          <button onClick={() => setShowModal(true)} style={{
            background: "#7c3aed", color: "#fff", border: "none",
            borderRadius: 8, padding: "8px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer"
          }}>+ Nouvelle transaction</button>
        </div>
      </div>

      {/* Cartes stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Solde total",       val: formatMontant(solde),         sous: "Solde net de la plateforme",    border: "#7c3aed" },
          { label: "Total des entrées", val: `+${totalEntrees.toLocaleString("fr-FR")} XAF`, sous: "Dépôts et transferts reçus", border: "#16a34a" },
          { label: "Total des sorties", val: `-${totalSorties.toLocaleString("fr-FR")} XAF`, sous: "Retraits et transferts émis", border: "#dc2626" },
          { label: "En attente",        val: enAttente,                    sous: "Transactions à valider",        border: "#d97706" },
        ].map(c => (
          <div key={c.label} style={{ background: "#fff", borderRadius: 12, padding: "18px 20px", boxShadow: "0 1px 6px #0000000d", borderTop: `3px solid ${c.border}` }}>
            <div style={{ fontSize: 12, color: "#9ca3af", fontWeight: 600, marginBottom: 6 }}>{c.label}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#1e1e2e" }}>{c.val}</div>
            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>{c.sous}</div>
          </div>
        ))}
      </div>

      {/* Graphique */}
      <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 6px #0000000d", marginBottom: 24 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Évolution des fonds</div>
        <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 20 }}>Entrées et sorties des 6 derniers mois</div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={donneesEvolution}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="mois" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
            <Tooltip formatter={(v) => `${v.toLocaleString("fr-FR")} XAF`} />
            <Line type="monotone" dataKey="entree" stroke="#7c3aed" strokeWidth={2} dot={{ r: 3 }} name="Entrées" />
            <Line type="monotone" dataKey="sortie" stroke="#dc2626" strokeWidth={2} dot={{ r: 3 }} name="Sorties" />
          </LineChart>
        </ResponsiveContainer>
        <div style={{ display: "flex", gap: 20, justifyContent: "center", marginTop: 12 }}>
          {[{ label: "Entrées", color: "#7c3aed" }, { label: "Sorties", color: "#dc2626" }].map(l => (
            <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#6b7280" }}>
              <div style={{ width: 24, height: 2, background: l.color, borderRadius: 2 }} />
              {l.label}
            </div>
          ))}
        </div>
      </div>

      {/* Tableau */}
      <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 6px #0000000d" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>Historique des transactions</div>
          <div style={{ display: "flex", gap: 8 }}>
            <input value={recherche} onChange={e => setRecherche(e.target.value)}
              placeholder="Rechercher..."
              style={{ padding: "7px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, outline: "none", width: 200 }} />
            <select value={filtreType} onChange={e => setFiltreType(e.target.value)}
              style={{ padding: "7px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, background: "#fff" }}>
              <option value="Tous">Tous les types</option>
              <option>Dépôt</option>
              <option>Retrait</option>
              <option>Transfert</option>
            </select>
            <select value={filtreStatut} onChange={e => setFiltreStatut(e.target.value)}
              style={{ padding: "7px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, background: "#fff" }}>
              <option value="Tous">Tous les statuts</option>
              <option>completé</option>
              <option>en attente</option>
              <option>échoué</option>
            </select>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f9fafb" }}>
                {["ID", "Type", "Utilisateur", "Montant", "Description", "Date", "Statut", "Actions"].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: "#6b7280", fontWeight: 600, whiteSpace: "nowrap", borderBottom: "1px solid #f3f4f6" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrees.map(t => (
                <tr key={t.id} style={{ borderBottom: "1px solid #f9fafb" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "12px 14px", fontWeight: 600, color: "#6366f1" }}>{t.id}</td>
                  <td style={{ padding: "12px 14px" }}>
                    <span style={{ background: couleurType(t.type) + "18", color: couleurType(t.type), padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{t.type}</span>
                  </td>
                  <td style={{ padding: "12px 14px", fontWeight: 600 }}>{t.utilisateur}</td>
                  <td style={{ padding: "12px 14px", fontWeight: 700, color: t.montant > 0 ? "#16a34a" : "#dc2626" }}>
                    {formatMontant(t.montant)}
                  </td>
                  <td style={{ padding: "12px 14px", color: "#6b7280" }}>{t.description}</td>
                  <td style={{ padding: "12px 14px", color: "#9ca3af", fontSize: 12 }}>{t.date}</td>
                  <td style={{ padding: "12px 14px" }}>
                    <span style={{ background: bgStatut(t.statut), color: couleurStatut(t.statut), padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{t.statut}</span>
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => setDetailTx(t)}
                        style={{ background: "none", border: "1px solid #e5e7eb", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer", color: "#6b7280" }}>
                        Détails
                      </button>
                      {t.statut === "en attente" && (
                        <>
                          <button onClick={() => changerStatut(t.id, "completé")}
                            style={{ background: "none", border: "1px solid #bbf7d0", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer", color: "#16a34a" }}>
                            Valider
                          </button>
                          <button onClick={() => changerStatut(t.id, "échoué")}
                            style={{ background: "none", border: "1px solid #fecaca", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer", color: "#dc2626" }}>
                            Rejeter
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 12 }}>
          {filtrees.length} sur {transactions.length} transaction(s)
        </div>
      </div>

      {/* Modal nouvelle transaction */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 32, width: 440, boxShadow: "0 16px 48px rgba(0,0,0,0.15)" }}>
            <h3 style={{ fontWeight: 800, fontSize: 18, color: "#1e1e2e", marginBottom: 4 }}>Nouvelle transaction</h3>
            <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 24 }}>Enregistrez manuellement une transaction</p>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Type</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, background: "#fafafa", outline: "none" }}>
                <option>Dépôt</option>
                <option>Retrait</option>
                <option>Transfert</option>
              </select>
            </div>

            {[
              { label: "Utilisateur",       key: "utilisateur",  placeholder: "Nom de l'utilisateur" },
              { label: "Montant (XAF)",     key: "montant",      placeholder: "ex: 50000", type: "number" },
              { label: "Description",       key: "description",  placeholder: "Description de la transaction" },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>{f.label}</label>
                <input type={f.type || "text"} value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                  placeholder={f.placeholder}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, outline: "none", boxSizing: "border-box", background: "#fafafa" }} />
              </div>
            ))}

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
              <button onClick={() => setShowModal(false)}
                style={{ background: "none", border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#6b7280" }}>
                Annuler
              </button>
              <button onClick={ajouterTransaction}
                style={{ background: "#7c3aed", color: "#fff", border: "none", borderRadius: 8, padding: "10px 24px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal détail */}
      {detailTx && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 32, width: 400, boxShadow: "0 16px 48px rgba(0,0,0,0.15)" }}>
            <h3 style={{ fontWeight: 800, fontSize: 18, color: "#1e1e2e", marginBottom: 20 }}>Détails de la transaction</h3>
            {[
              { label: "ID",          val: detailTx.id },
              { label: "Type",        val: detailTx.type },
              { label: "Utilisateur", val: detailTx.utilisateur },
              { label: "Montant",     val: formatMontant(detailTx.montant) },
              { label: "Description", val: detailTx.description },
              { label: "Date",        val: detailTx.date },
              { label: "Statut",      val: detailTx.statut },
            ].map(r => (
              <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid #f3f4f6", fontSize: 13 }}>
                <span style={{ color: "#9ca3af", fontWeight: 600 }}>{r.label}</span>
                <span style={{ fontWeight: 700 }}>{r.val}</span>
              </div>
            ))}
            <button onClick={() => setDetailTx(null)} style={{
              width: "100%", background: "#7c3aed", color: "#fff", border: "none",
              borderRadius: 8, padding: "11px 0", fontSize: 13, fontWeight: 700, cursor: "pointer", marginTop: 20
            }}>Fermer</button>
          </div>
        </div>
      )}
    </div>
  );
}