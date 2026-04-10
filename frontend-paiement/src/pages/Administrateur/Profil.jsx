import { useState, useRef } from "react";

const onglets = ["Informations", "Sécurité"];

export default function Profil({ allerVers }) {
  const [onglet, setOnglet] = useState("Informations");
  const [photo, setPhoto] = useState(null);
  const [profil, setProfil] = useState({
    nom: "Administrateur",
    prenom: "Manager",
    email: "admin@managerboard.cm",
    telephone: "(+237) 699 000 000",
    role: "Super Administrateur",
    localisation: "Douala, Cameroun",
  });
  const [editMode, setEditMode] = useState(false);
  const [formProfil, setFormProfil] = useState({ ...profil });
  const [mdp, setMdp] = useState({ actuel: "", nouveau: "", confirmer: "" });
  const [mdpMsg, setMdpMsg] = useState(null);
  const inputPhoto = useRef();

  const sauvegarderProfil = () => {
    setProfil({ ...formProfil });
    setEditMode(false);
  };

  const changerPhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPhoto(ev.target.result);
    reader.readAsDataURL(file);
  };

  const changerMdp = () => {
    if (!mdp.actuel || !mdp.nouveau || !mdp.confirmer) {
      setMdpMsg({ type: "error", text: "Veuillez remplir tous les champs." }); return;
    }
    if (mdp.nouveau !== mdp.confirmer) {
      setMdpMsg({ type: "error", text: "Les mots de passe ne correspondent pas." }); return;
    }
    if (mdp.nouveau.length < 8) {
      setMdpMsg({ type: "error", text: "Le mot de passe doit contenir au moins 8 caractères." }); return;
    }
    setMdpMsg({ type: "success", text: "Mot de passe modifié avec succès." });
    setMdp({ actuel: "", nouveau: "", confirmer: "" });
  };

  return (
    <div style={{ color: "#1e1e2e" }}>
      {/* En-tête */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Profil</h2>
          <p style={{ color: "#9ca3af", fontSize: 13, marginTop: 4 }}>Gérez vos informations personnelles et votre sécurité</p>
        </div>
        <button onClick={() => allerVers && allerVers("dashboard")}
          style={{ background: "none", border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#6b7280" }}>
          ← Retour
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 24 }}>
        {/* Colonne gauche — carte profil */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 6px #0000000d", textAlign: "center" }}>
            <div style={{ position: "relative", display: "inline-block", marginBottom: 16 }}>
              <div style={{
                width: 96, height: 96, borderRadius: "50%",
                background: photo ? "none" : "linear-gradient(135deg, #7c3aed, #4f46e5)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 36, color: "#fff", fontWeight: 800, overflow: "hidden",
                border: "3px solid #ede9fe"
              }}>
                {photo ? <img src={photo} alt="profil" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : profil.prenom[0] + profil.nom[0]}
              </div>
              <button onClick={() => inputPhoto.current.click()} style={{
                position: "absolute", bottom: 0, right: 0, width: 28, height: 28, borderRadius: "50%",
                background: "#7c3aed", border: "2px solid #fff", color: "#fff", fontSize: 13, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>✏️</button>
              <input ref={inputPhoto} type="file" accept="image/*" onChange={changerPhoto} style={{ display: "none" }} />
            </div>

            <div style={{ fontWeight: 800, fontSize: 16 }}>{profil.prenom} {profil.nom}</div>
            <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>{profil.role}</div>
            <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>📍 {profil.localisation}</div>

            <div style={{ borderTop: "1px solid #f3f4f6", marginTop: 16, paddingTop: 16 }}>
              <button onClick={() => inputPhoto.current.click()} style={{
                width: "100%", background: "#f5f3ff", border: "1px solid #ede9fe",
                borderRadius: 8, padding: "9px 0", fontSize: 13, fontWeight: 600,
                color: "#7c3aed", cursor: "pointer"
              }}>
                📷 Changer la photo
              </button>
            </div>
          </div>
        </div>

        {/* Colonne droite */}
        <div>
          {/* Onglets */}
          <div style={{ display: "flex", gap: 2, marginBottom: 20, background: "#f3f4f6", borderRadius: 10, padding: 4, width: "fit-content" }}>
            {onglets.map(o => (
              <button key={o} onClick={() => setOnglet(o)} style={{
                padding: "8px 20px", borderRadius: 8, border: "none", cursor: "pointer",
                background: onglet === o ? "#fff" : "transparent",
                color: onglet === o ? "#7c3aed" : "#6b7280",
                fontWeight: onglet === o ? 700 : 500, fontSize: 13,
                boxShadow: onglet === o ? "0 1px 4px #0000001a" : "none",
                transition: "all 0.2s"
              }}>{o}</button>
            ))}
          </div>

          {/* ONGLET INFORMATIONS */}
          {onglet === "Informations" && (
            <div style={{ background: "#fff", borderRadius: 12, padding: 28, boxShadow: "0 1px 6px #0000000d" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>Informations personnelles</div>
                  <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>Modifiez vos informations de profil</div>
                </div>
                {!editMode
                  ? <button onClick={() => { setEditMode(true); setFormProfil({ ...profil }); }} style={{ background: "#7c3aed", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>✏️ Modifier</button>
                  : <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => setEditMode(false)} style={{ background: "none", border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#6b7280" }}>Annuler</button>
                      <button onClick={sauvegarderProfil} style={{ background: "#7c3aed", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Sauvegarder</button>
                    </div>
                }
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {[
                  { label: "Prénom", key: "prenom" },
                  { label: "Nom", key: "nom" },
                  { label: "Email", key: "email" },
                  { label: "Téléphone", key: "telephone" },
                  { label: "Rôle", key: "role" },
                  { label: "Localisation", key: "localisation" },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>{f.label}</label>
                    {editMode
                      ? <input value={formProfil[f.key]} onChange={e => setFormProfil({ ...formProfil, [f.key]: e.target.value })}
                          style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #7c3aed", fontSize: 13, outline: "none", boxSizing: "border-box", background: "#fafafa" }} />
                      : <div style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #f3f4f6", background: "#f9fafb", fontSize: 13, color: "#374151" }}>{profil[f.key]}</div>
                    }
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ONGLET SÉCURITÉ */}
          {onglet === "Sécurité" && (
            <div style={{ background: "#fff", borderRadius: 12, padding: 28, boxShadow: "0 1px 6px #0000000d" }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Changer le mot de passe</div>
              <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 24 }}>Votre mot de passe doit contenir au moins 8 caractères</div>

              {mdpMsg && (
                <div style={{
                  padding: "10px 16px", borderRadius: 8, marginBottom: 20, fontSize: 13, fontWeight: 600,
                  background: mdpMsg.type === "success" ? "#f0fdf4" : "#fef2f2",
                  color: mdpMsg.type === "success" ? "#16a34a" : "#dc2626",
                  border: `1px solid ${mdpMsg.type === "success" ? "#bbf7d0" : "#fecaca"}`
                }}>{mdpMsg.text}</div>
              )}

              {["actuel", "nouveau", "confirmer"].map((f, i) => (
                <div key={f} style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                    {i === 0 ? "Mot de passe actuel" : i === 1 ? "Nouveau mot de passe" : "Confirmer le nouveau mot de passe"}
                  </label>
                  <input type="password" value={mdp[f]} onChange={e => setMdp({ ...mdp, [f]: e.target.value })}
                    placeholder="••••••••"
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, outline: "none", boxSizing: "border-box", background: "#fafafa" }} />
                </div>
              ))}

              <button onClick={changerMdp} style={{
                background: "#7c3aed", color: "#fff", border: "none", borderRadius: 8,
                padding: "10px 24px", fontSize: 13, fontWeight: 700, cursor: "pointer", marginTop: 8
              }}>Mettre à jour le mot de passe</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}