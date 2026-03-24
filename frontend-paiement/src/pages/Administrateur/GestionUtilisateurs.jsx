import { useState } from "react";

// ── Données initiales ─────────────────────────────────────────────────────
const donneesInitiales = [
  { id: "IUF108228", nom: "Christabel", telephone: "(+237) 631 485 955", email: "nebachristabel@gmail.com", statut: "ACTIF", date: "2025-03-05 19:40:31" },
  { id: "IU315610",  nom: "Cindy",      telephone: "(+237) 675 332 947", email: "sangangcindy@gmail.com",  statut: "ACTIF", date: "2025-03-06 08:53:43" },
  { id: "IU420598",  nom: "Leyla",      telephone: "+237697 833 305",    email: "leylanjoya-6@gmail.com", statut: "ACTIF", date: "2026-01-26 17:22:16" },
  { id: "IU420014",  nom: "Pearl",      telephone: "(+237) 659 432 581", email: "pearls@gmail.com",       statut: "ACTIF", date: "2025-01-10 22:58:43" },
  { id: "IUE30671",  nom: "Mcbright",   telephone: "(+237) 676 134 504", email: "Nebamcbright@gmail.com", statut: "ACTIF", date: "2025-03-04 12:54:38" },
];

// ── Composants locaux ─────────────────────────────────────────────────────
function Badge({ statut }) {
  return (
    <span style={{
      background: statut === "ACTIF" ? "#22c55e22" : "#ef444422",
      color: statut === "ACTIF" ? "#16a34a" : "#dc2626",
      padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, letterSpacing: 1
    }}>
      {statut}
    </span>
  );
}

function StatCard({ label, valeur, sous, icon, color }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 14, padding: "18px 22px", flex: 1, minWidth: 150,
      boxShadow: "0 2px 12px #6c3fc311", borderTop: `4px solid ${color}`, position: "relative"
    }}>
      <div style={{ fontSize: 12, color: "#888", fontWeight: 600, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: "#1e1e2e" }}>{valeur}</div>
      {sous && <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>{sous}</div>}
      <div style={{
        position: "absolute", right: 18, top: 18, background: color + "22",
        borderRadius: 10, padding: 8, fontSize: 20
      }}>{icon}</div>
    </div>
  );
}

const btnStyle = (color) => ({
  background: color, color: "#fff", border: "none", borderRadius: 6,
  padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap"
});

// ── Page principale ───────────────────────────────────────────────────────
export default function GestionUtilisateurs() {
  const [recherche, setRecherche]     = useState("");
  const [utilisateurs, setUtilisateurs] = useState(donneesInitiales);
  const [filtreStatut, setFiltreStatut] = useState("Tous");
  const [page, setPage]               = useState(1);

  const filtres = utilisateurs.filter(u =>
    (u.nom.toLowerCase().includes(recherche.toLowerCase()) ||
     u.email.toLowerCase().includes(recherche.toLowerCase())) &&
    (filtreStatut === "Tous" || u.statut === filtreStatut)
  );

  const suspendre = (id) =>
    setUtilisateurs(u =>
      u.map(x => x.id === id ? { ...x, statut: x.statut === "ACTIF" ? "SUSPENDU" : "ACTIF" } : x)
    );

  const supprimer = (id) =>
    setUtilisateurs(u => u.filter(x => x.id !== id));

  const suspendus = utilisateurs.filter(u => u.statut === "SUSPENDU").length;

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1e1e2e", marginBottom: 16 }}>
        Gestion des utilisateurs
      </h2>

      {/* ── Cartes stats ── */}
      <div style={{ display: "flex", gap: 14, marginBottom: 20, flexWrap: "wrap" }}>
        <StatCard label="Nombre total de clients" valeur={utilisateurs.length} sous="0% qu'hier"                   icon="👥" color="#7c3aed" />
        <StatCard label="Utilisateurs ce mois"    valeur={1}                   sous="4.76% que le mois dernier"    icon="🆕" color="#6366f1" />
        <StatCard label="Comptes suspendus"        valeur={suspendus}           sous="0% qu'hier"                   icon="🚫" color="#ef4444" />
      </div>

      {/* ── Tableau ── */}
      <div style={{ background: "#fff", borderRadius: 14, padding: 20, boxShadow: "0 2px 12px #6c3fc311" }}>

        {/* Barre de recherche + filtre */}
        <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "center" }}>
          <input
            value={recherche}
            onChange={e => setRecherche(e.target.value)}
            placeholder="Rechercher par nom ou email"
            style={{
              flex: 1, padding: "9px 14px", borderRadius: 8,
              border: "1px solid #e5e7eb", fontSize: 13, outline: "none"
            }}
          />
          <select
            value={filtreStatut}
            onChange={e => setFiltreStatut(e.target.value)}
            style={{
              padding: "9px 14px", borderRadius: 8, border: "1px solid #e5e7eb",
              fontSize: 13, background: "#fff", cursor: "pointer"
            }}
          >
            <option>Tous</option>
            <option>ACTIF</option>
            <option>SUSPENDU</option>
          </select>
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8f5ff" }}>
                {["#", "Nom", "Téléphone", "Email", "Statut", "Date", "Actions"].map(h => (
                  <th key={h} style={{
                    padding: "10px 12px", textAlign: "left",
                    color: "#7c3aed", fontWeight: 700, whiteSpace: "nowrap"
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtres.map(u => (
                <tr
                  key={u.id}
                  style={{ borderBottom: "1px solid #f3f4f6", transition: "background 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#faf8ff"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <td style={{ padding: "10px 12px", color: "#6366f1", fontWeight: 600 }}>{u.id}</td>
                  <td style={{ padding: "10px 12px", fontWeight: 600 }}>{u.nom}</td>
                  <td style={{ padding: "10px 12px", color: "#555" }}>{u.telephone}</td>
                  <td style={{ padding: "10px 12px", color: "#555" }}>{u.email}</td>
                  <td style={{ padding: "10px 12px" }}><Badge statut={u.statut} /></td>
                  <td style={{ padding: "10px 12px", color: "#aaa", fontSize: 12 }}>{u.date}</td>
                  <td style={{ padding: "10px 12px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button style={btnStyle("#6366f1")}>Modifier</button>
                      <button onClick={() => suspendre(u.id)} style={btnStyle("#f59e0b")}>
                        {u.statut === "ACTIF" ? "Suspendre" : "Réactiver"}
                      </button>
                      <button onClick={() => supprimer(u.id)} style={btnStyle("#ef4444")}>Supprimer</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{ display: "flex", gap: 6, marginTop: 16, justifyContent: "center" }}>
          {[1, 2, 3, 4, 5].map(p => (
            <button
              key={p}
              onClick={() => setPage(p)}
              style={{
                width: 32, height: 32, borderRadius: 8, border: "none", cursor: "pointer",
                background: page === p ? "#7c3aed" : "#f3f4f6",
                color: page === p ? "#fff" : "#555", fontWeight: 700, fontSize: 13
              }}
            >{p}</button>
          ))}
          <button style={{
            padding: "0 14px", height: 32, borderRadius: 8, border: "none",
            background: "#7c3aed", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer"
          }}>
            Suivant
          </button>
        </div>

      </div>
    </div>
  );
}