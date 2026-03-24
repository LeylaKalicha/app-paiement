import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

const donneesStatut = [
  { name: "En attente", value: 0, fill: "#f59e0b" },
  { name: "Résolu",     value: 0, fill: "#22c55e" },
  { name: "Rejeté",     value: 0, fill: "#6b7280" },
];

const donneesSeverite = [
  { severite: "Élevé",  nb: 0 },
  { severite: "Moyen",  nb: 0 },
  { severite: "Faible", nb: 0 },
];

const StatCard = ({ label, valeur, sous, color }) => (
  <div style={{ background: "#fff", borderRadius: 14, padding: "20px 24px", flex: 1, minWidth: 160, boxShadow: "0 2px 12px #6c3fc311", borderTop: `4px solid ${color}` }}>
    <div style={{ fontSize: 13, color: "#888", fontWeight: 600, marginBottom: 8 }}>{label}</div>
    <div style={{ fontSize: 32, fontWeight: 900, color: color }}>{valeur}</div>
    <div style={{ fontSize: 12, color: "#aaa", marginTop: 4 }}>{sous}</div>
  </div>
);

const btnStyle = (color) => ({ background: color, color: "#fff", border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" });

export default function GestionFraude({ allerVers }) {
  const [alertes, setAlertes] = useState([]);
  const [filtreStatut, setFiltreStatut] = useState("Tous les statuts");
  const [filtreSeverite, setFiltreSeverite] = useState("Toutes les sévérités");
  const [recherche, setRecherche] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [nouvelleAlerte, setNouvelleAlerte] = useState({ transactionId: "", utilisateur: "", montant: "", raison: "", severite: "Élevé" });

  const ajouterAlerte = () => {
    if (!nouvelleAlerte.transactionId.trim()) return;
    setAlertes([...alertes, {
      ...nouvelleAlerte,
      id: `ALT${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      statut: "En attente",
    }]);
    setNouvelleAlerte({ transactionId: "", utilisateur: "", montant: "", raison: "", severite: "Élevé" });
    setShowModal(false);
  };

  const changerStatut = (id, statut) => setAlertes(a => a.map(x => x.id === id ? { ...x, statut } : x));

  const filtrees = alertes.filter(a =>
    (filtreStatut === "Tous les statuts" || a.statut === filtreStatut) &&
    (filtreSeverite === "Toutes les sévérités" || a.severite === filtreSeverite) &&
    (a.transactionId.toLowerCase().includes(recherche.toLowerCase()) || a.utilisateur.toLowerCase().includes(recherche.toLowerCase()) || a.raison.toLowerCase().includes(recherche.toLowerCase()))
  );

  const couleurSeverite = (s) => s === "Élevé" ? "#ef4444" : s === "Moyen" ? "#f59e0b" : "#22c55e";
  const couleurStatut = (s) => s === "En attente" ? "#f59e0b" : s === "Résolu" ? "#22c55e" : "#6b7280";

  const total    = alertes.length;
  const resolus  = alertes.filter(a => a.statut === "Résolu").length;
  const attente  = alertes.filter(a => a.statut === "En attente").length;
  const hautRisque = alertes.filter(a => a.severite === "Élevé").length;

  return (
    <div>
      {/* Titre */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: "#7c3aed", margin: 0 }}>Tableau de bord de gestion des fraudes</h2>
            <p style={{ color: "#aaa", fontSize: 13, marginTop: 4 }}>Identifier, investiguer et résoudre les activités suspectes</p>
          </div>
          <button onClick={() => allerVers && allerVers("dashboard")} style={{ ...btnStyle("#7c3aed"), padding: "8px 16px", fontSize: 13 }}>← Retour</button>
        </div>
      </div>

      {/* Cartes stats */}
      <div style={{ display: "flex", gap: 16, marginBottom: 28, flexWrap: "wrap" }}>
        <StatCard label="Total des cas de fraude"  valeur={total}      sous="Toutes les activités suspectes signalées" color="#7c3aed" />
        <StatCard label="Cas résolus"              valeur={resolus}    sous="Cas résolus avec succès"                  color="#22c55e" />
        <StatCard label="Cas en attente"           valeur={attente}    sous="Cas en attente d'investigation"           color="#f59e0b" />
        <StatCard label="Haut Risque"              valeur={hautRisque} sous="Cas de sévérité critique"                 color="#ef4444" />
      </div>

      {/* Graphiques */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 28 }}>
        <div style={{ background: "#fff", borderRadius: 14, padding: 20, boxShadow: "0 2px 12px #6c3fc311" }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#1e1e2e", marginBottom: 16 }}>Cas de fraude par statut</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={[
              { name: "En attente", nb: attente },
              { name: "Résolu",     nb: resolus },
              { name: "Rejeté",     nb: alertes.filter(a => a.statut === "Rejeté").length },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="nb" radius={[6, 6, 0, 0]}>
                {[{ fill: "#f59e0b" }, { fill: "#22c55e" }, { fill: "#6b7280" }].map((entry, i) => (
                  <rect key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", gap: 16, marginTop: 8, justifyContent: "center" }}>
            {[{ label: "En attente", color: "#f59e0b" }, { label: "Résolu", color: "#22c55e" }, { label: "Rejeté", color: "#6b7280" }].map(l => (
              <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: l.color }} />
                {l.label}
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: "#fff", borderRadius: 14, padding: 20, boxShadow: "0 2px 12px #6c3fc311" }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#1e1e2e", marginBottom: 16 }}>Cas de fraude par sévérité</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={[
              { name: "Élevé",  nb: alertes.filter(a => a.severite === "Élevé").length },
              { name: "Moyen",  nb: alertes.filter(a => a.severite === "Moyen").length },
              { name: "Faible", nb: alertes.filter(a => a.severite === "Faible").length },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="nb" radius={[6, 6, 0, 0]} fill="#7c3aed" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tableau */}
      <div style={{ background: "#fff", borderRadius: 14, padding: 20, boxShadow: "0 2px 12px #6c3fc311" }}>
        {/* Filtres */}
        <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
          <select value={filtreStatut} onChange={e => setFiltreStatut(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, background: "#fff" }}>
            <option>Tous les statuts</option>
            <option>En attente</option>
            <option>Résolu</option>
            <option>Rejeté</option>
          </select>
          <select value={filtreSeverite} onChange={e => setFiltreSeverite(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, background: "#fff" }}>
            <option>Toutes les sévérités</option>
            <option>Élevé</option>
            <option>Moyen</option>
            <option>Faible</option>
          </select>
          <input value={recherche} onChange={e => setRecherche(e.target.value)}
            placeholder="Rechercher par transaction, utilisateur ou raison"
            style={{ flex: 1, minWidth: 200, padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, outline: "none" }} />
          <button onClick={() => {/* export */}} style={btnStyle("#ef4444")}>📤 Exporter les données</button>
          <button onClick={() => setShowModal(true)} style={btnStyle("#7c3aed")}>+ Ajouter une alerte manuelle</button>
        </div>

        <div style={{ fontWeight: 700, fontSize: 14, color: "#1e1e2e", marginBottom: 12 }}>Liste des activités frauduleuses</div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8f5ff" }}>
                {["Alerte ID", "Transaction ID", "Utilisateur", "Montant", "Raison", "Date signalée", "Sévérité", "Statut", "Actions"].map(h => (
                  <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: "#7c3aed", fontWeight: 700, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrees.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: "center", padding: 40, color: "#aaa" }}>Aucune donnée disponible dans le tableau</td></tr>
              ) : filtrees.map(a => (
                <tr key={a.id} style={{ borderBottom: "1px solid #f3f4f6" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#faf8ff"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "10px 12px", color: "#6366f1", fontWeight: 600 }}>{a.id}</td>
                  <td style={{ padding: "10px 12px" }}>{a.transactionId}</td>
                  <td style={{ padding: "10px 12px", fontWeight: 600 }}>{a.utilisateur}</td>
                  <td style={{ padding: "10px 12px", color: "#ef4444", fontWeight: 700 }}>{a.montant} XAF</td>
                  <td style={{ padding: "10px 12px", color: "#555" }}>{a.raison}</td>
                  <td style={{ padding: "10px 12px", color: "#aaa", fontSize: 12 }}>{a.date}</td>
                  <td style={{ padding: "10px 12px" }}>
                    <span style={{ background: couleurSeverite(a.severite) + "22", color: couleurSeverite(a.severite), padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{a.severite}</span>
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <span style={{ background: couleurStatut(a.statut) + "22", color: couleurStatut(a.statut), padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{a.statut}</span>
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button onClick={() => changerStatut(a.id, "Résolu")} style={btnStyle("#22c55e")}>Résoudre</button>
                      <button onClick={() => changerStatut(a.id, "Rejeté")} style={btnStyle("#6b7280")}>Rejeter</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ fontSize: 12, color: "#aaa", marginTop: 12 }}>Affichage de {filtrees.length} sur {alertes.length} entrées</div>
      </div>

      {/* Modal ajout alerte */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "#00000055", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: 440, boxShadow: "0 8px 32px #0002" }}>
            <h3 style={{ fontWeight: 800, color: "#1e1e2e", marginBottom: 20 }}>Ajouter une alerte manuelle</h3>
            {[
              { label: "ID Transaction", key: "transactionId", placeholder: "ex: TX123456" },
              { label: "Utilisateur",    key: "utilisateur",   placeholder: "Nom de l'utilisateur" },
              { label: "Montant (XAF)", key: "montant",       placeholder: "ex: 50000" },
              { label: "Raison",         key: "raison",        placeholder: "Décrivez l'activité suspecte" },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 4 }}>{f.label}</label>
                <input value={nouvelleAlerte[f.key]} onChange={e => setNouvelleAlerte({ ...nouvelleAlerte, [f.key]: e.target.value })}
                  placeholder={f.placeholder}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
              </div>
            ))}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 4 }}>Sévérité</label>
              <select value={nouvelleAlerte.severite} onChange={e => setNouvelleAlerte({ ...nouvelleAlerte, severite: e.target.value })}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, background: "#fff" }}>
                <option>Élevé</option>
                <option>Moyen</option>
                <option>Faible</option>
              </select>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setShowModal(false)} style={{ ...btnStyle("#6b7280"), padding: "8px 18px" }}>Annuler</button>
              <button onClick={ajouterAlerte} style={{ ...btnStyle("#7c3aed"), padding: "8px 18px" }}>Ajouter</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}