import { useState } from "react";

const Toggle = ({ actif, onChange }) => (
  <div onClick={onChange} style={{
    width: 44, height: 24, borderRadius: 20, cursor: "pointer", position: "relative",
    background: actif ? "#7c3aed" : "#e5e7eb", transition: "background 0.25s", flexShrink: 0
  }}>
    <div style={{
      position: "absolute", top: 3, left: actif ? 22 : 3,
      width: 18, height: 18, borderRadius: "50%", background: "#fff",
      boxShadow: "0 1px 4px #0003", transition: "left 0.25s"
    }} />
  </div>
);

const niveaux = [
  { id: "standard", label: "Standard",  description: "Vérification basique par mot de passe",                      features: ["Mot de passe requis", "Session 24h"] },
  { id: "elevated", label: "Élevé",     description: "Double vérification pour les grosses transactions",           features: ["PIN 6 chiffres", "Limite 100 000 XAF", "Session 8h"] },
  { id: "critical", label: "Critique",  description: "Sécurité maximale — recommandé pour toutes les transactions", features: ["2FA obligatoire", "OTP SMS/Email", "Limite 500 000 XAF", "Session 2h"] },
];

const journalInitial = [
  { id: 1, action: "Connexion réussie",              utilisateur: "Admin",      ip: "192.168.1.1",  date: "2025-03-06 09:14", statut: "succès" },
  { id: 2, action: "Tentative de connexion échouée", utilisateur: "Inconnu",    ip: "41.202.31.55", date: "2025-03-06 08:52", statut: "échec"  },
  { id: 3, action: "Transaction validée (2FA)",      utilisateur: "Christabel", ip: "192.168.1.4",  date: "2025-03-05 17:33", statut: "succès" },
  { id: 4, action: "Changement de mot de passe",     utilisateur: "Kevin",      ip: "192.168.1.2",  date: "2025-03-05 14:20", statut: "succès" },
  { id: 5, action: "IP bloquée automatiquement",     utilisateur: "Système",    ip: "41.202.31.55", date: "2025-03-05 08:52", statut: "alerte" },
];

export default function GestionSecurite({ allerVers }) {
  const [niveauActif, setNiveauActif] = useState("critical");
  const [journal] = useState(journalInitial);
  const [ipBloquees, setIpBloquees] = useState(["41.202.31.55"]);
  const [nouvelleIp, setNouvelleIp] = useState("");
  const [params, setParams] = useState({
    deuxFacteurs:    true,
    otpSms:          true,
    otpEmail:        true,
    biometrique:     false,
    blocageAuto:     true,
    alerteConnexion: true,
    sessionExp:      true,
    chiffrement:     true,
    limiteTransaction: true,
    journalisation:  true,
  });

  const toggle = (k) => setParams(p => ({ ...p, [k]: !p[k] }));

  const ajouterIp = () => {
    if (!nouvelleIp.trim() || ipBloquees.includes(nouvelleIp)) return;
    setIpBloquees([...ipBloquees, nouvelleIp]);
    setNouvelleIp("");
  };

  const iconeStatut = (s) => s === "succès" ? "✓" : s === "échec" ? "✕" : "!";
  const couleurStatut = (s) => s === "succès" ? "#16a34a" : s === "échec" ? "#dc2626" : "#d97706";

  return (
    <div style={{ color: "#1e1e2e" }}>

      {/* En-tête */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Gestion de la sécurité</h2>
          <p style={{ color: "#9ca3af", fontSize: 13, marginTop: 4 }}>Configurez les protocoles de sécurité pour protéger toutes les transactions</p>
        </div>
        <button onClick={() => allerVers && allerVers("dashboard")}
          style={{ background: "none", border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#6b7280" }}>
          ← Retour
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>

        {/* Niveau de sécurité */}
        <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 6px #0000000d" }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Niveau de sécurité des transactions</div>
          <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 18 }}>Sélectionnez le niveau adapté à votre activité</div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {niveaux.map(n => {
              const actif = niveauActif === n.id;
              return (
                <div key={n.id} onClick={() => setNiveauActif(n.id)} style={{
                  border: `1.5px solid ${actif ? "#7c3aed" : "#e5e7eb"}`,
                  borderRadius: 10, padding: "14px 16px", cursor: "pointer",
                  background: actif ? "#f5f3ff" : "#fafafa", transition: "all 0.2s"
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: actif ? 8 : 0 }}>
                    <div>
                      <span style={{ fontWeight: 700, fontSize: 13, color: actif ? "#7c3aed" : "#374151" }}>{n.label}</span>
                      <span style={{ fontSize: 12, color: "#9ca3af", marginLeft: 8 }}>{n.description}</span>
                    </div>
                    <div style={{
                      width: 18, height: 18, borderRadius: "50%",
                      border: `2px solid ${actif ? "#7c3aed" : "#d1d5db"}`,
                      background: actif ? "#7c3aed" : "transparent",
                      transition: "all 0.2s", flexShrink: 0
                    }} />
                  </div>
                  {actif && (
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {n.features.map(f => (
                        <span key={f} style={{ background: "#ede9fe", color: "#7c3aed", padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                          {f}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Paramètres */}
        <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 6px #0000000d" }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Paramètres de sécurité</div>
          <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 18 }}>Activez ou désactivez les protections</div>

          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {[
              { k: "deuxFacteurs",     label: "Authentification à 2 facteurs (2FA)", critique: true  },
              { k: "otpSms",           label: "OTP par SMS",                          critique: false },
              { k: "otpEmail",         label: "OTP par Email",                        critique: false },
              { k: "biometrique",      label: "Vérification biométrique",             critique: false },
              { k: "blocageAuto",      label: "Blocage après 5 tentatives échouées",  critique: true  },
              { k: "alerteConnexion",  label: "Alerte à chaque nouvelle connexion",   critique: false },
              { k: "sessionExp",       label: "Expiration automatique de session",    critique: false },
              { k: "chiffrement",      label: "Chiffrement AES-256",                  critique: true  },
              { k: "limiteTransaction",label: "Limite de montant par transaction",    critique: false },
              { k: "journalisation",   label: "Journalisation des actions",           critique: false },
            ].map((p, i, arr) => (
              <div key={p.k} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "11px 0",
                borderBottom: i < arr.length - 1 ? "1px solid #f3f4f6" : "none"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13, color: "#374151" }}>{p.label}</span>
                  {p.critique && (
                    <span style={{ background: "#fef3c7", color: "#92400e", fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 20 }}>
                      CRITIQUE
                    </span>
                  )}
                </div>
                <Toggle actif={params[p.k]} onChange={() => toggle(p.k)} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

        {/* IP bloquées */}
        <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 6px #0000000d" }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Adresses IP bloquées</div>
          <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 16 }}>Bloquez les adresses IP suspectes manuellement</div>

          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <input value={nouvelleIp} onChange={e => setNouvelleIp(e.target.value)}
              onKeyDown={e => e.key === "Enter" && ajouterIp()}
              placeholder="ex: 192.168.1.100"
              style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, outline: "none" }} />
            <button onClick={ajouterIp} style={{
              background: "#7c3aed", color: "#fff", border: "none", borderRadius: 8,
              padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer"
            }}>Bloquer</button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {ipBloquees.map(ip => (
              <div key={ip} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 14px"
              }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#374151", fontFamily: "monospace" }}>{ip}</span>
                <button onClick={() => setIpBloquees(i => i.filter(x => x !== ip))} style={{
                  background: "none", border: "1px solid #e5e7eb", borderRadius: 6,
                  padding: "4px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer", color: "#6b7280"
                }}>Débloquer</button>
              </div>
            ))}
            {ipBloquees.length === 0 && (
              <div style={{ textAlign: "center", color: "#9ca3af", fontSize: 13, padding: "20px 0" }}>Aucune IP bloquée</div>
            )}
          </div>
        </div>

        {/* Journal */}
        <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 6px #0000000d" }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Journal de sécurité</div>
          <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 16 }}>Historique des événements de sécurité</div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 300, overflowY: "auto" }}>
            {journal.map(j => (
              <div key={j.id} style={{
                display: "flex", alignItems: "flex-start", gap: 12,
                padding: "10px 12px", background: "#f9fafb", borderRadius: 8,
                border: "1px solid #f3f4f6"
              }}>
                <div style={{
                  width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                  background: couleurStatut(j.statut) + "18",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 800, color: couleurStatut(j.statut)
                }}>{iconeStatut(j.statut)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1e1e2e" }}>{j.action}</div>
                  <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
                    {j.utilisateur} · {j.ip} · {j.date}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}