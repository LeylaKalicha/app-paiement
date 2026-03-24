import { useState } from "react";

const methodesInitiales = [
  { id: 1, nom: "Paypal", type: "Paypal", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/PayPal.svg/320px-PayPal.svg.png", statut: "ACTIF", usage: 85 },
  { id: 2, nom: "MTN",    type: "MTN",    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/New-mtn-logo.jpg/320px-New-mtn-logo.jpg", statut: "ACTIF", usage: 75 },
  { id: 3, nom: "Campay", type: "campay", image: null, statut: "ACTIF", usage: 60 },
];

const plusUtilisees = [
  { type: "PayPal",      usage: "85%" },
  { type: "Stripe",      usage: "75%" },
  { type: "Credit Card", usage: "60%" },
];

const btnStyle = (color) => ({ background: color, color: "#fff", border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" });

export default function MethodesPaiement({ allerVers }) {
  const [methodes, setMethodes] = useState(methodesInitiales);
  const [showModal, setShowModal] = useState(false);
  const [nouvelle, setNouvelle] = useState({ nom: "", type: "", image: "" });

  const ajouter = () => {
    if (!nouvelle.nom.trim()) return;
    setMethodes([...methodes, { id: Date.now(), ...nouvelle, statut: "ACTIF", usage: 0 }]);
    setNouvelle({ nom: "", type: "", image: "" });
    setShowModal(false);
  };

  const suspendre = (id) => setMethodes(m => m.map(x => x.id === id ? { ...x, statut: x.statut === "ACTIF" ? "SUSPENDU" : "ACTIF" } : x));
  const supprimer = (id) => setMethodes(m => m.filter(x => x.id !== id));

  return (
    <div>
      {/* Titre */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 900, color: "#1e1e2e", margin: 0 }}>Gestion des méthodes de paiement</h2>
          <p style={{ color: "#aaa", fontSize: 13, marginTop: 4 }}>Gérez les types, valeurs et taux de paiement par pays</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => allerVers && allerVers("dashboard")} style={{ ...btnStyle("#6b7280"), padding: "8px 16px", fontSize: 13 }}>← Retour</button>
          <button onClick={() => setShowModal(true)} style={{ ...btnStyle("#7c3aed"), padding: "8px 18px", fontSize: 13 }}>+ Ajouter</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 20 }}>

        {/* Méthodes les plus utilisées */}
        <div style={{ background: "#fff", borderRadius: 14, padding: 24, boxShadow: "0 2px 12px #6c3fc311" }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#1e1e2e", marginBottom: 20 }}>Méthodes de paiement les plus utilisées</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ background: "#f8f5ff" }}>
                <th style={{ padding: "10px 14px", textAlign: "left", color: "#7c3aed", fontWeight: 700 }}>Type de paiement</th>
                <th style={{ padding: "10px 14px", textAlign: "left", color: "#7c3aed", fontWeight: 700 }}>Utilisation</th>
              </tr>
            </thead>
            <tbody>
              {plusUtilisees.map((m, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "12px 14px", fontWeight: 600 }}>{m.type}</td>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ flex: 1, background: "#f3f4f6", borderRadius: 20, height: 8 }}>
                        <div style={{ width: m.usage, background: "#7c3aed", height: 8, borderRadius: 20, transition: "width 0.4s" }} />
                      </div>
                      <span style={{ fontWeight: 700, color: "#7c3aed", fontSize: 13 }}>{m.usage}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Méthodes disponibles */}
        <div style={{ background: "#fff", borderRadius: 14, padding: 24, boxShadow: "0 2px 12px #6c3fc311" }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#1e1e2e", marginBottom: 20 }}>Méthodes de paiement disponibles</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8f5ff" }}>
                {["#", "Type", "Actions"].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: "#7c3aed", fontWeight: 700 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {methodes.map((m, i) => (
                <tr key={m.id} style={{ borderBottom: "1px solid #f3f4f6" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#faf8ff"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "12px 14px" }}>
                    {m.image ? (
                      <img src={m.image} alt={m.nom} style={{ height: 28, objectFit: "contain" }}
                        onError={e => { e.target.style.display = "none"; e.target.nextSibling.style.display = "inline"; }} />
                    ) : null}
                    <span style={{ display: m.image ? "none" : "inline", fontSize: 12, color: "#aaa" }}>{m.nom} Image</span>
                  </td>
                  <td style={{ padding: "12px 14px", fontWeight: 600 }}>
                    {m.type}
                    {m.statut === "SUSPENDU" && (
                      <span style={{ marginLeft: 8, background: "#ef444422", color: "#ef4444", fontSize: 10, padding: "2px 7px", borderRadius: 20, fontWeight: 700 }}>SUSPENDU</span>
                    )}
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => suspendre(m.id)} style={btnStyle(m.statut === "ACTIF" ? "#f59e0b" : "#22c55e")}>
                        {m.statut === "ACTIF" ? "Suspendre" : "Réactiver"}
                      </button>
                      <button onClick={() => supprimer(m.id)} style={btnStyle("#ef4444")}>Supprimer</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal ajout */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "#00000055", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: 400, boxShadow: "0 8px 32px #0002" }}>
            <h3 style={{ fontWeight: 800, color: "#1e1e2e", marginBottom: 20 }}>Ajouter une méthode de paiement</h3>
            {[
              { label: "Nom",        key: "nom",    placeholder: "ex: Orange Money" },
              { label: "Type",       key: "type",   placeholder: "ex: Mobile Money" },
              { label: "URL Image",  key: "image",  placeholder: "https://..." },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 4 }}>{f.label}</label>
                <input value={nouvelle[f.key]} onChange={e => setNouvelle({ ...nouvelle, [f.key]: e.target.value })}
                  placeholder={f.placeholder}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
              </div>
            ))}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
              <button onClick={() => setShowModal(false)} style={{ ...btnStyle("#6b7280"), padding: "8px 18px" }}>Annuler</button>
              <button onClick={ajouter} style={{ ...btnStyle("#7c3aed"), padding: "8px 18px" }}>Ajouter</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}