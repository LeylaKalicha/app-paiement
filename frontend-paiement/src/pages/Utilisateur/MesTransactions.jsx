import { useState, useEffect } from "react";
import { FiArrowLeft, FiSearch, FiFilter, FiRepeat, FiArrowUp, FiArrowDown, FiClock } from "react-icons/fi";
import { Bar, Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from "chart.js";
import api from "../../services/api";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

export default function MesTransactions({ retour, dashData }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [recherche, setRecherche]       = useState("");
  const [filtre, setFiltre]             = useState("Tous");
  const [onglet, setOnglet]             = useState("liste"); // "liste" | "activite"

  useEffect(() => {
    const fetch = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await api.get("/transactions/mes-transactions", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTransactions(res.data.transactions || []);
      } catch {
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const solde        = Number(dashData?.solde || 0);
  const totalRecu    = transactions.filter(t => t.montant > 0).reduce((s, t) => s + Number(t.montant), 0);
  const totalEnvoye  = transactions.filter(t => t.montant < 0).reduce((s, t) => s + Math.abs(Number(t.montant)), 0);
  const enAttente    = transactions.filter(t => t.statut === "EN_ATTENTE").length;
  const totalTx      = transactions.length;

  const filtrees = transactions.filter(t =>
    (filtre === "Tous" || t.statut === filtre) &&
    (String(t.id).includes(recherche) || (t.description || "").toLowerCase().includes(recherche.toLowerCase()))
  );

  // ── Graphique vue d'ensemble ──
  const barData = {
    labels: ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"],
    datasets: [{
      label: "Transactions",
      data: [0,0,0,0,0,0,0,0,0,0,0,totalTx],
      backgroundColor: "#7c3aed",
      borderRadius: 4,
    }]
  };

  // ── Graphique types ──
  const doughnutData = {
    labels: ["Entrant", "Sortant", "En attente"],
    datasets: [{
      data: [
        transactions.filter(t => t.montant > 0).length,
        transactions.filter(t => t.montant < 0).length,
        enAttente
      ],
      backgroundColor: ["#22c55e", "#ef4444", "#f59e0b"],
      borderWidth: 0,
    }]
  };

  const couleurStatut = (s) => s === "VALIDEE" ? "#16a34a" : s === "EN_ATTENTE" ? "#d97706" : "#dc2626";
  const bgStatut = (s) => s === "VALIDEE" ? "#dcfce7" : s === "EN_ATTENTE" ? "#fef3c7" : "#fee2e2";

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={retour} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, padding: "7px 10px", cursor: "pointer", display: "flex", alignItems: "center", color: "#64748b" }}>
            <FiArrowLeft size={16} />
          </button>
          <div>
            <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>Accueil › Transactions</p>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", margin: 0 }}>Mes Transactions</h2>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 20, padding: "7px 14px" }}>
            <FiSearch size={13} color="#94a3b8" />
            <input value={recherche} onChange={e => setRecherche(e.target.value)} placeholder="Rechercher transactions..."
              style={{ border: "none", background: "transparent", fontSize: 13, outline: "none", width: 160 }} />
          </div>
          <button style={{ display: "flex", alignItems: "center", gap: 6, background: "#7c3aed", color: "#fff", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            <FiFilter size={13} /> Filtrer
          </button>
        </div>
      </div>

      {/* Onglets */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "#f1f5f9", borderRadius: 10, padding: 4, width: "fit-content" }}>
        {[{ id: "liste", label: "Transactions" }, { id: "activite", label: "Activité des paiements" }].map(o => (
          <button key={o.id} onClick={() => setOnglet(o.id)} style={{
            padding: "7px 18px", borderRadius: 8, border: "none", cursor: "pointer",
            background: onglet === o.id ? "#fff" : "transparent",
            color: onglet === o.id ? "#7c3aed" : "#64748b",
            fontWeight: onglet === o.id ? 700 : 500, fontSize: 13,
            boxShadow: onglet === o.id ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
          }}>{o.label}</button>
        ))}
      </div>

      {/* ════ VUE LISTE (photos 1 & 3) ════ */}
      {onglet === "liste" && (
        <>
          {/* 4 cartes stats */}
          <div style={{ display: "flex", gap: 14, marginBottom: 20 }}>
            {[
              { label: "Solde",              val: `${solde.toLocaleString("fr-FR")} XAF`, bg: "#ef4444", icon: <FiArrowDown size={16}/> },
              { label: "Ce mois",            val: `+${totalRecu.toLocaleString("fr-FR")} XAF`, bg: "#22c55e", icon: <FiArrowUp size={16}/> },
              { label: "En attente",         val: `${enAttente} transactions`, bg: "#f59e0b", icon: <FiClock size={16}/> },
              { label: "Total Transactions", val: totalTx, bg: "#3b82f6", icon: <FiRepeat size={16}/> },
            ].map(c => (
              <div key={c.label} style={{ flex: 1, background: "#fff", borderRadius: 12, padding: "14px 18px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: c.bg, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0 }}>
                  {c.icon}
                </div>
                <div>
                  <p style={{ fontSize: 11, color: "#94a3b8", margin: 0, fontWeight: 500 }}>{c.label}</p>
                  <p style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: 0 }}>{c.val}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Tableau */}
          <div style={{ background: "#fff", borderRadius: 14, padding: "20px 24px", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", margin: 0 }}>Transactions récentes</p>
              <div style={{ display: "flex", gap: 6 }}>
                {["Tous", "VALIDEE", "EN_ATTENTE", "ANNULEE"].map(f => (
                  <button key={f} onClick={() => setFiltre(f)} style={{
                    padding: "4px 12px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600,
                    background: filtre === f ? "#7c3aed" : "#f1f5f9",
                    color: filtre === f ? "#fff" : "#64748b",
                  }}>{f === "Tous" ? "Tous" : f === "VALIDEE" ? "Validée" : f === "EN_ATTENTE" ? "En attente" : "Annulée"}</button>
                ))}
              </div>
            </div>

            {/* En-tête tableau */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: 12, padding: "8px 12px", background: "#7c3aed", borderRadius: 8, marginBottom: 8 }}>
              {["TRANSACTION", "MONTANT", "DATE", "STATUT", "ACTION"].map(h => (
                <span key={h} style={{ fontSize: 11, fontWeight: 700, color: "#fff", letterSpacing: 0.5 }}>{h}</span>
              ))}
            </div>

            {loading ? (
              <p style={{ textAlign: "center", color: "#94a3b8", padding: 30 }}>Chargement...</p>
            ) : filtrees.length === 0 ? (
              <div style={{ textAlign: "center", padding: "30px 0", color: "#94a3b8" }}>
                <FiRepeat size={28} style={{ marginBottom: 8, opacity: 0.3 }} />
                <p style={{ fontSize: 13 }}>Aucune donnée disponible</p>
              </div>
            ) : filtrees.map((tx, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: 12, padding: "10px 12px", borderBottom: "1px solid #f1f5f9", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#f5f3ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#7c3aed" }}><FiRepeat size={13} /></div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>#{tx.id}</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: tx.montant > 0 ? "#16a34a" : "#dc2626" }}>
                  {tx.montant > 0 ? "+" : ""}{Number(tx.montant).toLocaleString("fr-FR")} XAF
                </span>
                <span style={{ fontSize: 12, color: "#94a3b8" }}>{tx.dateTransaction?.split("T")[0] || "—"}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: couleurStatut(tx.statut), background: bgStatut(tx.statut), padding: "3px 8px", borderRadius: 20, display: "inline-block" }}>{tx.statut}</span>
                <button style={{ fontSize: 11, background: "#f5f3ff", border: "1px solid #ede9fe", color: "#7c3aed", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontWeight: 600 }}>Détails</button>
              </div>
            ))}
          </div>

          {/* Actions rapides */}
          <div style={{ background: "#fff", borderRadius: 14, padding: "20px 24px", border: "1px solid #e2e8f0", marginTop: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 14, background: "#7c3aed", color: "#fff", padding: "8px 14px", borderRadius: 8, display: "inline-block" }}>Actions rapides</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { label: "Top Up",    bg: "#7c3aed", color: "#fff" },
                { label: "Retrait",   bg: "#f97316", color: "#fff" },
                { label: "Envoyer",   bg: "#fff",    color: "#374151", border: "1px solid #e2e8f0" },
                { label: "Payer Bill",bg: "#fff",    color: "#374151", border: "1px solid #e2e8f0" },
              ].map(a => (
                <button key={a.label} style={{ padding: "10px 0", borderRadius: 8, border: a.border || "none", background: a.bg, color: a.color, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>{a.label}</button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ════ VUE ACTIVITÉ (photos 2 & 4) ════ */}
      {onglet === "activite" && (
        <>
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: "#7c3aed", margin: "0 0 4px" }}>Tableau de bord des activités de paiement</h3>
            <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>Suivez et analysez vos activités de paiement en temps réel</p>
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginBottom: 20 }}>
            <button style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer", color: "#374151" }}>
              ↓ Exporter
            </button>
            <button style={{ display: "flex", alignItems: "center", gap: 6, background: "#7c3aed", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              <FiFilter size={13} /> Filtres
            </button>
          </div>

          {/* 4 cartes activité */}
          <div style={{ display: "flex", gap: 14, marginBottom: 20 }}>
            {[
              { label: "SOLDE TOTAL",    val: `XAF ${solde.toLocaleString("fr-FR")}`,          bg: "#7c3aed", icon: "💜" },
              { label: "TOTAL REÇU",    val: `XAF ${totalRecu.toLocaleString("fr-FR")}`,       bg: "#22c55e", icon: "✅" },
              { label: "TOTAL ENVOYÉ",  val: `XAF ${totalEnvoye.toLocaleString("fr-FR")}`,     bg: "#ef4444", icon: "🔴" },
              { label: "EN ATTENTE",    val: `${enAttente} Transactions`,                       bg: "#f59e0b", icon: "🟠" },
            ].map(c => (
              <div key={c.label} style={{ flex: 1, background: "#fff", borderRadius: 12, padding: "16px 18px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: c.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{c.icon}</div>
                <div>
                  <p style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, letterSpacing: 0.5, margin: 0, textTransform: "uppercase" }}>{c.label}</p>
                  <p style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", margin: 0 }}>{c.val}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Graphiques */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
            <div style={{ background: "#fff", borderRadius: 14, padding: "20px 24px", border: "1px solid #e2e8f0" }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>Vue d'ensemble des transactions</p>
              <p style={{ fontSize: 11, color: "#94a3b8", marginBottom: 16 }}>7 246 ce mois</p>
              <Bar data={barData} options={{ responsive: true, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { beginAtZero: true, grid: { color: "#f1f5f9" } } } }} height={120} />
            </div>
            <div style={{ background: "#fff", borderRadius: 14, padding: "20px 24px", border: "1px solid #e2e8f0" }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 16 }}>Types de transactions</p>
              {transactions.length === 0 ? (
                <div style={{ height: 150, display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: 13 }}>Aucune donnée</div>
              ) : (
                <Doughnut data={doughnutData} options={{ responsive: true, plugins: { legend: { position: "bottom" } } }} />
              )}
              <div style={{ display: "flex", gap: 14, justifyContent: "center", marginTop: 12 }}>
                {[{ label: "Entrant", color: "#22c55e" }, { label: "Sortant", color: "#ef4444" }, { label: "En attente", color: "#f59e0b" }].map(l => (
                  <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#64748b" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: l.color }} />
                    {l.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}