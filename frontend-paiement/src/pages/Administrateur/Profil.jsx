import { useState, useRef } from "react";

const utilisateurs = [
  { id: "IUF108228", nom: "Christabel", email: "nebachristabel@gmail.com", telephone: "(+237) 631 485 955", statut: "ACTIF", parraine: true  },
  { id: "IU315610",  nom: "Cindy",      email: "sangangcindy@gmail.com",   telephone: "(+237) 675 332 947", statut: "ACTIF", parraine: false },
  { id: "IU420598",  nom: "Leyla",      email: "leylanjoya-6@gmail.com",   telephone: "+237697 833 305",    statut: "ACTIF", parraine: true  },
  { id: "IU420014",  nom: "Pearl",      email: "pearls@gmail.com",         telephone: "(+237) 659 432 581", statut: "ACTIF", parraine: false },
  { id: "IUE30671",  nom: "Mcbright",   email: "Nebamcbright@gmail.com",   telephone: "(+237) 676 134 504", statut: "ACTIF", parraine: false },
];

const onglets = ["Informations", "Sécurité", "Parrainage"];

export default function Profil({ allerVers }) {
  const [onglet, setOnglet] = useState("Informations");
  const [photo, setPhoto] = useState(null);
  const [profil, setProfil] = useState({
    nom:        "Administrateur",
    prenom:     "Manager",
    email:      "admin@managerboard.cm",
    telephone:  "(+237) 699 000 000",
    role:       "Super Administrateur",
    localisation: "Douala, Cameroun",
  });
  const [editMode, setEditMode] = useState(false);
  const [formProfil, setFormProfil] = useState({ ...profil });
  const [mdp, setMdp] = useState({ actuel: "", nouveau: "", confirmer: "" });
  const [mdpMsg, setMdpMsg] = useState(null);
  const [users, setUsers] = useState(utilisateurs);
  const [rechercheUser, setRechercheUser] = useState("");
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

  const toggleParrainage = (id) => setUsers(u => u.map(x => x.id === id ? { ...x, parraine: !x.parraine } : x));

  const filtresUsers = users.filter(u =>
    u.nom.toLowerCase().includes(rechercheUser.toLowerCase()) ||
    u.email.toLowerCase().includes(rechercheUser.toLowerCase())
  );

  const parraines = users.filter(u => u.parraine).length;

  return (
    <div style={{ color: "#1e1e2e" }}>

      {/* En-tête */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Profil</h2>
          <p style={{ color: "#9ca3af", fontSize: 13, marginTop: 4 }}>Gérez vos informations personnelles et vos préférences</p>
        </div>
        <button onClick={() => allerVers && allerVers("dashboard")}
          style={{ background: "none", border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#6b7280" }}>
          ← Retour
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 24 }}>

        {/* ── Colonne gauche — carte profil ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 6px #0000000d", textAlign: "center" }}>

            {/* Photo */}
            <div style={{ position: "relative", display: "inline-block", marginBottom: 16 }}>
              <div style={{
                width: 96, height: 96, borderRadius: "50%",
                background: photo ? "none" : "linear-gradient(135deg, #7c3aed, #4f46e5)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 36, color: "#fff", fontWeight: 800, overflow: "hidden",
                border: "3px solid #ede9fe"
              }}>
                {photo
                  ? <img src={photo} alt="profil" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : profil.prenom[0] + profil.nom[0]
                }
              </div>
              <button onClick={() => inputPhoto.current.click()} style={{
                position: "absolute", bottom: 0, right: 0,
                width: 28, height: 28, borderRadius: "50%",
                background: "#7c3aed", border: "2px solid #fff",
                color: "#fff", fontSize: 13, cursor: "pointer",
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

          {/* Stats parrainage */}
          <div style={{ background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 1px 6px #0000000d" }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 14, color: "#374151" }}>Parrainage</div>
            {[
              { label: "Utilisateurs parrainés",    val: parraines },
              { label: "Utilisateurs non parrainés", val: users.length - parraines },
              { label: "Total utilisateurs",         val: users.length },
            ].map((s, i, arr) => (
              <div key={s.label} style={{
                display: "flex", justifyContent: "space-between",
                padding: "8px 0", borderBottom: i < arr.length - 1 ? "1px solid #f3f4f6" : "none"
              }}>
                <span style={{ fontSize: 12, color: "#6b7280" }}>{s.label}</span>
                <span style={{ fontWeight: 800, fontSize: 14, color: "#7c3aed" }}>{s.val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Colonne droite ── */}
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

          {/* ── ONGLET INFORMATIONS ── */}
          {onglet === "Informations" && (
            <div style={{ background: "#fff", borderRadius: 12, padding: 28, boxShadow: "0 1px 6px #0000000d" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>Informations personnelles</div>
                  <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>Modifiez vos informations de profil</div>
                </div>
                {!editMode
                  ? <button onClick={() => { setEditMode(true); setFormProfil({ ...profil }); }} style={{
                      background: "#7c3aed", color: "#fff", border: "none", borderRadius: 8,
                      padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer"
                    }}>✏️ Modifier</button>
                  : <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => setEditMode(false)} style={{
                        background: "none", border: "1px solid #e5e7eb", borderRadius: 8,
                        padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#6b7280"
                      }}>Annuler</button>
                      <button onClick={sauvegarderProfil} style={{
                        background: "#7c3aed", color: "#fff", border: "none", borderRadius: 8,
                        padding: "8px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer"
                      }}>Sauvegarder</button>
                    </div>
                }
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {[
                  { label: "Prénom",       key: "prenom",      placeholder: "Prénom" },
                  { label: "Nom",          key: "nom",         placeholder: "Nom" },
                  { label: "Email",        key: "email",       placeholder: "Email" },
                  { label: "Téléphone",    key: "telephone",   placeholder: "Téléphone" },
                  { label: "Rôle",         key: "role",        placeholder: "Rôle" },
                  { label: "Localisation", key: "localisation",placeholder: "Ville, Pays" },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>{f.label}</label>
                    {editMode
                      ? <input value={formProfil[f.key]} onChange={e => setFormProfil({ ...formProfil, [f.key]: e.target.value })}
                          style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #7c3aed", fontSize: 13, outline: "none", boxSizing: "border-box", background: "#fafafa" }} />
                      : <div style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #f3f4f6", background: "#f9fafb", fontSize: 13, color: "#374151" }}>
                          {profil[f.key]}
                        </div>
                    }
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── ONGLET SÉCURITÉ ── */}
          {onglet === "Sécurité" && (
            <div style={{ background: "#fff", borderRadius: 12, padding: 28, boxShadow: "0 1px 6px #0000000d" }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Changer le mot de passe</div>
              <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 24 }}>Votre mot de passe doit contenir au moins 8 caractères</div>

              {mdpMsg && (
                <div style={{
                  padding: "10px 16px", borderRadius: 8, marginBottom: 20, fontSize: 13, fontWeight: 600,
                  background: mdpMsg.type === "success" ? "#f0fdf4" : "#fef2f2",
                  color:      mdpMsg.type === "success" ? "#16a34a"  : "#dc2626",
                  border:     `1px solid ${mdpMsg.type === "success" ? "#bbf7d0" : "#fecaca"}`
                }}>{mdpMsg.text}</div>
              )}

              {[
                { label: "Mot de passe actuel",   key: "actuel",    placeholder: "••••••••" },
                { label: "Nouveau mot de passe",  key: "nouveau",   placeholder: "••••••••" },
                { label: "Confirmer le mot de passe", key: "confirmer", placeholder: "••••••••" },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>{f.label}</label>
                  <input type="password" value={mdp[f.key]} onChange={e => setMdp({ ...mdp, [f.key]: e.target.value })}
                    placeholder={f.placeholder}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, outline: "none", boxSizing: "border-box", background: "#fafafa" }} />
                </div>
              ))}

              <button onClick={changerMdp} style={{
                background: "#7c3aed", color: "#fff", border: "none", borderRadius: 8,
                padding: "10px 24px", fontSize: 13, fontWeight: 700, cursor: "pointer", marginTop: 8
              }}>Mettre à jour le mot de passe</button>

              <div style={{ borderTop: "1px solid #f3f4f6", marginTop: 28, paddingTop: 24 }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Sessions actives</div>
                <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 16 }}>Appareils actuellement connectés à votre compte</div>
                {[
                  { appareil: "Chrome — Windows 11",  ip: "192.168.1.1",  date: "Aujourd'hui 09:14", actif: true },
                  { appareil: "Mobile — Android",      ip: "192.168.1.5",  date: "Hier 18:30",        actif: false },
                ].map((s, i) => (
                  <div key={i} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "12px 16px", background: "#f9fafb", borderRadius: 8,
                    border: "1px solid #f3f4f6", marginBottom: 8
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{s.appareil}</div>
                      <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{s.ip} · {s.date}</div>
                    </div>
                    <span style={{
                      background: s.actif ? "#dcfce7" : "#f3f4f6",
                      color: s.actif ? "#16a34a" : "#6b7280",
                      padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700
                    }}>{s.actif ? "Actif" : "Inactif"}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── ONGLET PARRAINAGE ── */}
          {onglet === "Parrainage" && (
            <div style={{ background: "#fff", borderRadius: 12, padding: 28, boxShadow: "0 1px 6px #0000000d" }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Parrainage des utilisateurs</div>
              <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 20 }}>
                Activez le parrainage pour chaque utilisateur de la plateforme
              </div>

              <input value={rechercheUser} onChange={e => setRechercheUser(e.target.value)}
                placeholder="Rechercher un utilisateur..."
                style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, outline: "none", boxSizing: "border-box", marginBottom: 16, background: "#fafafa" }} />

              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {filtresUsers.map((u, i, arr) => (
                  <div key={u.id} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "14px 0",
                    borderBottom: i < arr.length - 1 ? "1px solid #f3f4f6" : "none"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{
                        width: 38, height: 38, borderRadius: "50%",
                        background: u.parraine ? "linear-gradient(135deg, #7c3aed, #4f46e5)" : "#e5e7eb",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 14, color: u.parraine ? "#fff" : "#9ca3af", fontWeight: 700
                      }}>
                        {u.nom[0]}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{u.nom}</div>
                        <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>{u.email}</div>
                        <div style={{ fontSize: 10, color: "#9ca3af" }}>{u.telephone}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{
                        fontSize: 12, fontWeight: 600,
                        color: u.parraine ? "#7c3aed" : "#9ca3af"
                      }}>
                        {u.parraine ? "Parrainé" : "Non parrainé"}
                      </span>
                      <div onClick={() => toggleParrainage(u.id)} style={{
                        width: 44, height: 24, borderRadius: 20, cursor: "pointer", position: "relative",
                        background: u.parraine ? "#7c3aed" : "#e5e7eb", transition: "background 0.25s"
                      }}>
                        <div style={{
                          position: "absolute", top: 3, left: u.parraine ? 22 : 3,
                          width: 18, height: 18, borderRadius: "50%", background: "#fff",
                          boxShadow: "0 1px 4px #0003", transition: "left 0.25s"
                        }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}