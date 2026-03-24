import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, BarChart, Bar } from "recharts";

const transactionsInitiales = [
  { id: "TX860462", envoyeur: "Dale",       receveur: "Kevin",     montant: -900.00,  statut: "completée", date: "Mar 18, 2025" },
  { id: "TX799610", envoyeur: "Kevin",      receveur: "Christabel",montant: -1350.00, statut: "completée", date: "Mar 17, 2025" },
  { id: "TX75703o", envoyeur: "Christabel", receveur: "Kevin",     montant: -1000.00, statut: "completée", date: "Mar 17, 2025" },
  { id: "TX787371", envoyeur: "Kevin",      receveur: "Cindy",     montant: -750.00,  statut: "completée", date: "Mar 16, 2025" },
  { id: "TX166353", envoyeur: "Kevin",      receveur: "Mcbright",  montant: -50.00,   statut: "completée", date: "Mar 16, 2025" },
  { id: "TX65e662", envoyeur: "Kevin",      receveur: "Christabel",montant: -500.00,  statut: "completée", date: "Mar 15, 2025" },
  { id: "TX631266", envoyeur: "Kevin",      receveur: "Christabel",montant: -1430.00, statut: "completée", date: "Mar 15, 2025" },
];

const donneesTemps = [
  { date: "Mar 10", completée: 2, echouée: 0 },
  { date: "Mar 12", completée: 1, echouée: 1 },
  { date: "Mar 14", completée: 3, echouée: 0 },
  { date: "Mar 16", completée: 4, echouée: 0 },
  { date: "Mar 18", completée: 2, echouée: 0 },
];

const donneesTypes = [
  { type: "Montant élevé",         nb: 3, fill: "#ef4444" },
  { type: "Transactions multiples",nb: 2, fill: "#3b82f6" },
  { type: "Localisation inhabituelle", nb: 1, fill: "#f59e0b" },
];

const btnStyle = (color) => ({ background: color, color: "#fff", border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" });

export default function GestionTransactions({ allerVers }) {
  const [transactions] = useState(transactionsInitiales);
  const [recherche, setRecherche] = useState("");
  const [filtreStatut, setFiltreStatut] = useState("Tous");
  const [detail, setDetail] = useState(null);

  const filtrees = transactions.filter(t =>
    (filtreStatut === "Tous" || t.statut === filtreStatut) &&
    (t.id.toLowerCase().includes(recherche.toLowerCase()) ||
     t.envoyeur.toLowerCase().includes(recherche.toLowerCase()) ||
     t.receveur.toLowerCase().includes(recherche.toLowerCase()))
  );

  const couleurStatut = (s) => s === "completée" ? "#22c55e" : s === "en attente" ? "#f59e0b" : "#ef4444";

  return (
    <div>
      {/* Titre */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 900, color: "#1e1e2e", margin: 0 }}>Gestion des transactions</h2>
          <p style={{ color: "#aaa", fontSize: 13, marginTop: 4 }}>Suivez et analysez toutes les transactions de la plateforme</p>
        </div>
        <button onClick={() => allerVers && allerVers("dashboard")} style={{ ...btnStyle("#7c3aed"), padding: "8px 16px", fontSize: 13 }}>← Retour</button>
      </div>

      {/* Historique des transactions */}
      <div style={{ background: "#fff", borderRadius: 14, padding: 20, boxShadow: "0 2px 12px #6c3fc311", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#1e1e2e" }}>Historique des transactions</div>
          <div style={{ display: "flex", gap: 10 }}>
            <input value={recherche} onChange={e => setRecherche(e.target.value)}
              placeholder="Rechercher par ID, envoyeur ou receveur..."
              style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, outline: "none", width: 260 }} />
            <select value={filtreStatut} onChange={e => setFiltreStatut(e.target.value)}
              style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, background: "#fff" }}>
              <option value="Tous">Tous</option>
              <option value="completée">Completée</option>
              <option value="en attente">En attente</option>
              <option value="echouée">Échouée</option>
            </select>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8f5ff" }}>
                {["Date", "Envoyeur", "Receveur", "Transaction ID", "Montant", "Statut", "Actions"].map(h => (
                  <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: "#7c3aed", fontWeight: 700, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrees.map(t => (
                <tr key={t.id} style={{ borderBottom: "1px solid #f3f4f6" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#faf8ff"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "10px 12px", color: "#aaa", fontSize: 12 }}>{t.date}</td>
                  <td style={{ padding: "10px 12px", fontWeight: 600 }}>{t.envoyeur}</td>
                  <td style={{ padding: "10px 12px", fontWeight: 600 }}>{t.receveur}</td>
                  <td style={{ padding: "10px 12px", color: "#6366f1", fontWeight: 600 }}>#{t.id}</td>
                  <td style={{ padding: "10px 12px", color: "#ef4444", fontWeight: 700 }}>
                    F{Math.abs(t.montant).toLocaleString("fr-FR", { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <span style={{ background: couleurStatut(t.statut) + "22", color: couleurStatut(t.statut), padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                      {t.statut}
                    </span>
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <button onClick={() => setDetail(t)} style={btnStyle("#7c3aed")}>Détails</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ fontSize: 12, color: "#aaa", marginTop: 12 }}>
          Affichage de {filtrees.length} sur {transactions.length} entrées
        </div>
      </div>

      {/* Graphiques */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={{ background: "#fff", borderRadius: 14, padding: 20, boxShadow: "0 2px 12px #6c3fc311" }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#1e1e2e", marginBottom: 16 }}>Transactions dans le temps</div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={donneesTemps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="completée" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} name="Completée" />
              <Line type="monotone" dataKey="echouée"   stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} name="Échouée" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: "#fff", borderRadius: 14, padding: 20, boxShadow: "0 2px 12px #6c3fc311" }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#1e1e2e", marginBottom: 4 }}>Types de transactions suspectes</div>
          <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
            {[{ label: "Montant élevé", color: "#ef4444" }, { label: "Transactions multiples", color: "#3b82f6" }, { label: "Localisation inhabituelle", color: "#f59e0b" }].map(l => (
              <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: l.color }} />
                {l.label}
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={155}>
            <BarChart data={donneesTypes}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="type" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="nb" radius={[6, 6, 0, 0]} fill="#7c3aed" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Modal détail */}
      {detail && (
        <div style={{ position: "fixed", inset: 0, background: "#00000055", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: 400, boxShadow: "0 8px 32px #0002" }}>
            <h3 style={{ fontWeight: 800, color: "#1e1e2e", marginBottom: 20 }}>Détails de la transaction</h3>
            {[
              { label: "ID Transaction", val: `#${detail.id}` },
              { label: "Envoyeur",       val: detail.envoyeur },
              { label: "Receveur",       val: detail.receveur },
              { label: "Montant",        val: `F${Math.abs(detail.montant).toLocaleString("fr-FR", { minimumFractionDigits: 2 })}` },
              { label: "Date",           val: detail.date },
              { label: "Statut",         val: detail.statut },
            ].map(row => (
              <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f3f4f6", fontSize: 13 }}>
                <span style={{ color: "#888", fontWeight: 600 }}>{row.label}</span>
                <span style={{ fontWeight: 700, color: "#1e1e2e" }}>{row.val}</span>
              </div>
            ))}
            <button onClick={() => setDetail(null)} style={{ ...btnStyle("#7c3aed"), width: "100%", marginTop: 20, padding: "10px", fontSize: 13 }}>Fermer</button>
          </div>
        </div>
      )}
    </div>
  );
}