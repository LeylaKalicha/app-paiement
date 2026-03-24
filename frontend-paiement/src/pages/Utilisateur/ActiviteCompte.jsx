import { useState, useEffect } from "react";
import { FiArrowLeft, FiSearch, FiTrendingUp, FiTrendingDown } from "react-icons/fi";

const CRYPTO_MOCK = [
  { nom: "Bitcoin",  symbole: "BTC", prix: 43250.80, change: 2.34,  volume: "28.4B", cap: "847B",  color: "#f59e0b" },
  { nom: "Ethereum", symbole: "ETH", prix: 2280.50,  change: -1.12, volume: "14.2B", cap: "274B",  color: "#6366f1" },
  { nom: "BNB",      symbole: "BNB", prix: 312.40,   change: 0.87,  volume: "1.8B",  cap: "47B",   color: "#f59e0b" },
  { nom: "Solana",   symbole: "SOL", prix: 98.30,    change: 5.21,  volume: "3.2B",  cap: "42B",   color: "#a855f7" },
  { nom: "Cardano",  symbole: "ADA", prix: 0.58,     change: -2.45, volume: "0.8B",  cap: "20B",   color: "#3b82f6" },
  { nom: "XRP",      symbole: "XRP", prix: 0.62,     change: 1.08,  volume: "1.1B",  cap: "33B",   color: "#22c55e" },
];

export default function ActiviteCompte({ retour }) {
  const [recherche, setRecherche] = useState("");
  const [filtre, setFiltre]       = useState("Tous");
  const [cryptos, setCryptos]     = useState(CRYPTO_MOCK);
  const [erreur, setErreur]       = useState(false);

  const filtrees = cryptos.filter(c =>
    (filtre === "Tous" || (filtre === "Top Gainers" && c.change > 0) || (filtre === "Top Losers" && c.change < 0)) &&
    (c.nom.toLowerCase().includes(recherche.toLowerCase()) || c.symbole.toLowerCase().includes(recherche.toLowerCase()))
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button onClick={retour} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, padding: "7px 10px", cursor: "pointer", display: "flex", color: "#64748b" }}>
          <FiArrowLeft size={16} />
        </button>
        <div>
          <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>Accueil › Crypto</p>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", margin: 0 }}>Tableau de bord Cryptomonnaie</h2>
        </div>
      </div>

      {/* Barre recherche + filtres */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 14px" }}>
          <FiSearch size={14} color="#94a3b8" />
          <input value={recherche} onChange={e => setRecherche(e.target.value)} placeholder="Rechercher des cryptomonnaies..."
            style={{ border: "none", background: "transparent", fontSize: 13, outline: "none", flex: 1 }} />
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {["Tous", "Top Gainers", "Top Losers", "Favoris"].map(f => (
            <button key={f} onClick={() => setFiltre(f)} style={{
              padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600,
              background: filtre === f ? "#7c3aed" : "#fff",
              color: filtre === f ? "#fff" : "#64748b",
              border: filtre === f ? "none" : "1px solid #e2e8f0"
            }}>{f}</button>
          ))}
        </div>
      </div>

      {erreur ? (
        <div style={{ textAlign: "center", padding: "40px 0", color: "#ef4444" }}>
          <p style={{ fontSize: 14, fontWeight: 600 }}>Échec du chargement des données. Veuillez réessayer.</p>
          <button onClick={() => { setErreur(false); setCryptos(CRYPTO_MOCK); }} style={{ marginTop: 12, padding: "8px 20px", background: "#7c3aed", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}>Réessayer</button>
        </div>
      ) : (
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", overflow: "hidden" }}>
          {/* En-tête */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: 12, padding: "12px 20px", background: "#f8fafc", borderBottom: "1px solid #f1f5f9" }}>
            {["Cryptomonnaie", "Prix", "Variation 24h", "Volume", "Cap. marché"].map(h => (
              <span key={h} style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</span>
            ))}
          </div>

          {filtrees.length === 0 ? (
            <div style={{ textAlign: "center", padding: "30px 0", color: "#94a3b8" }}>
              <p style={{ fontSize: 13 }}>Aucune cryptomonnaie trouvée</p>
            </div>
          ) : filtrees.map((c, i) => (
            <div key={c.symbole} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: 12, padding: "14px 20px", borderBottom: "1px solid #f9fafb", transition: "background 0.1s", cursor: "pointer" }}
              onMouseEnter={e => e.currentTarget.style.background = "#fafafa"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: c.color + "22", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: c.color }}>{c.symbole.slice(0, 2)}</span>
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", margin: 0 }}>{c.nom}</p>
                  <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>{c.symbole}</p>
                </div>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", alignSelf: "center" }}>
                ${c.prix.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 4, alignSelf: "center" }}>
                {c.change > 0 ? <FiTrendingUp size={14} color="#16a34a" /> : <FiTrendingDown size={14} color="#dc2626" />}
                <span style={{ fontSize: 12, fontWeight: 700, color: c.change > 0 ? "#16a34a" : "#dc2626" }}>
                  {c.change > 0 ? "+" : ""}{c.change}%
                </span>
              </div>
              <span style={{ fontSize: 12, color: "#64748b", alignSelf: "center" }}>{c.volume}</span>
              <span style={{ fontSize: 12, color: "#64748b", alignSelf: "center" }}>{c.cap}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}