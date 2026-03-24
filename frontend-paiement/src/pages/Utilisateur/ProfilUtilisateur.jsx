import { useState, useRef } from "react";
import { FiArrowLeft, FiUser, FiMessageCircle, FiSettings, FiEdit2, FiSave, FiX, FiCamera } from "react-icons/fi";
import api from "../../services/api";

const Toggle = ({ actif, onChange }) => (
  <div onClick={onChange} style={{ width: 40, height: 22, borderRadius: 20, cursor: "pointer", position: "relative", background: actif ? "#7c3aed" : "#e2e8f0", transition: "background 0.25s", flexShrink: 0 }}>
    <div style={{ position: "absolute", top: 3, left: actif ? 20 : 3, width: 16, height: 16, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.2)", transition: "left 0.25s" }} />
  </div>
);

export default function ProfilUtilisateur({ retour, dashData }) {
  const user     = dashData?.user || {};
  const [onglet, setOnglet] = useState("app");
  const [photo, setPhoto]   = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [msg, setMsg]       = useState(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef();

  const [form, setForm] = useState({
    prenom: user.nom?.split(" ")[0] || "",
    nom:    user.nom?.split(" ")[1] || "",
    email:  user.email || "",
    telephone: user.telephone || "",
    mdpActuel: "", mdpNouv: "", mdpConf: ""
  });

  const [notifs, setNotifs] = useState({
    notifSilencieuses: false, miseAJourDesign: false, mentionsEmail: false,
    nouveauxLancements: false, miseAJourProduit: false, newsletter: false,
  });

  const [messages] = useState([
    { id: 1, avatar: "👤", msg: "Bonjour ! J'ai besoin de plus d'informations...", reply: "r", time: "il y a 2h" }
  ]);

  const changerPhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setPhoto(ev.target.result);
    reader.readAsDataURL(file);
    setShowPhotoModal(false);
  };

  const sauvegarder = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      await api.put("/auth/profil", { nom: `${form.prenom} ${form.nom}`, telephone: form.telephone }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMsg({ type: "success", text: "Profil mis à jour !" });
      setShowEditModal(false);
    } catch (e) {
      setMsg({ type: "error", text: e.response?.data?.message || "Erreur." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button onClick={retour} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, padding: "7px 10px", cursor: "pointer", display: "flex", color: "#64748b" }}>
          <FiArrowLeft size={16} />
        </button>
        <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>Accueil › Profil</p>
      </div>

      {msg && (
        <div style={{ padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 13, fontWeight: 600, background: msg.type === "success" ? "#f0fdf4" : "#fef2f2", color: msg.type === "success" ? "#16a34a" : "#dc2626", border: `1px solid ${msg.type === "success" ? "#bbf7d0" : "#fecaca"}` }}>
          {msg.text}
        </div>
      )}

      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", overflow: "hidden" }}>

        {/* Photo profil */}
        <div style={{ padding: "24px 28px", borderBottom: "1px solid #f1f5f9" }}>
          <div style={{ position: "relative", width: 64, height: 64, marginBottom: 12 }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: photo ? "none" : "#f1f5f9", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #e2e8f0" }}>
              {photo
                ? <img src={photo} alt="profil" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <FiUser size={28} color="#94a3b8" />
              }
            </div>
            <button onClick={() => setShowPhotoModal(true)} style={{ position: "absolute", bottom: 0, right: 0, width: 22, height: 22, borderRadius: "50%", background: "#7c3aed", border: "2px solid #fff", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 10 }}>
              <FiCamera size={10} />
            </button>
          </div>
          <button onClick={() => setShowEditModal(true)} style={{ display: "flex", alignItems: "center", gap: 6, background: "#7c3aed", color: "#fff", border: "none", borderRadius: 8, padding: "7px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            <FiEdit2 size={12} /> Modifier le profil
          </button>
        </div>

        {/* Onglets */}
        <div style={{ display: "flex", borderBottom: "1px solid #f1f5f9" }}>
          {[
            { id: "app",      label: "App",      icon: <FiUser size={13}/> },
            { id: "messages", label: "Messages", icon: <FiMessageCircle size={13}/> },
            { id: "settings", label: "Paramètres",icon: <FiSettings size={13}/> },
          ].map(o => (
            <button key={o.id} onClick={() => setOnglet(o.id)} style={{
              display: "flex", alignItems: "center", gap: 6, padding: "12px 24px",
              border: "none", background: onglet === o.id ? "#f5f3ff" : "transparent",
              color: onglet === o.id ? "#7c3aed" : "#94a3b8",
              fontWeight: onglet === o.id ? 700 : 400, fontSize: 13, cursor: "pointer",
              borderBottom: onglet === o.id ? "2px solid #7c3aed" : "2px solid transparent",
            }}>{o.icon} {o.label}</button>
          ))}
        </div>

        <div style={{ padding: "24px 28px" }}>

          {/* ── APP ── */}
          {onglet === "app" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              <div>
                <p style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, marginBottom: 14, textTransform: "uppercase", letterSpacing: 0.5 }}>Compte</p>
                {[
                  { label: "Notifications silencieuses", key: "notifSilencieuses" },
                  { label: "Mises à jour du design de carte", key: "miseAJourDesign" },
                  { label: "M'envoyer un email quand on me mentionne", key: "mentionsEmail" },
                ].map(n => (
                  <div key={n.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <span style={{ fontSize: 13, color: "#374151" }}>{n.label}</span>
                    <Toggle actif={notifs[n.key]} onChange={() => setNotifs(p => ({ ...p, [n.key]: !p[n.key] }))} />
                  </div>
                ))}
              </div>
              <div>
                <p style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, marginBottom: 14, textTransform: "uppercase", letterSpacing: 0.5 }}>Application</p>
                {[
                  { label: "Nouveaux lancements et projets", key: "nouveauxLancements" },
                  { label: "Mises à jour mensuelles du produit", key: "miseAJourProduit" },
                  { label: "S'abonner à la newsletter", key: "newsletter" },
                ].map(n => (
                  <div key={n.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <span style={{ fontSize: 13, color: "#374151" }}>{n.label}</span>
                    <Toggle actif={notifs[n.key]} onChange={() => setNotifs(p => ({ ...p, [n.key]: !p[n.key] }))} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── MESSAGES ── */}
          {onglet === "messages" && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <input placeholder="Rechercher..." style={{ flex: 1, padding: "8px 14px", border: "1px solid #e2e8f0", borderRadius: 20, fontSize: 13, outline: "none", background: "#f8fafc" }} />
              </div>
              {messages.map(m => (
                <div key={m.id} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 0", borderBottom: "1px solid #f1f5f9" }}>
                  <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#f5f3ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{m.avatar}</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, color: "#374151", margin: 0 }}>{m.msg}</p>
                    <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>{m.time}</p>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button style={{ padding: "4px 10px", background: "#7c3aed", color: "#fff", border: "none", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Répondre</button>
                    <span style={{ fontSize: 11, color: "#94a3b8", padding: "4px" }}>y</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── PARAMÈTRES ── */}
          {onglet === "settings" && (
            <div>
              <p style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, marginBottom: 14, textTransform: "uppercase", letterSpacing: 0.5 }}>Paramètres généraux</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {[
                  { label: "Notifications silencieuses", key: "notifSilencieuses" },
                  { label: "Design de carte", key: "miseAJourDesign" },
                  { label: "Email mentions", key: "mentionsEmail" },
                  { label: "Nouveaux lancements", key: "nouveauxLancements" },
                  { label: "Mises à jour produit", key: "miseAJourProduit" },
                  { label: "Newsletter", key: "newsletter" },
                ].map(n => (
                  <div key={n.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#f8fafc", borderRadius: 8, border: "1px solid #f1f5f9" }}>
                    <span style={{ fontSize: 12, color: "#374151" }}>{n.label}</span>
                    <Toggle actif={notifs[n.key]} onChange={() => setNotifs(p => ({ ...p, [n.key]: !p[n.key] }))} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Modal Modifier profil (photo 11) ── */}
      {showEditModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", borderRadius: 16, width: 480, boxShadow: "0 20px 60px rgba(0,0,0,0.15)", overflow: "hidden" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid #f1f5f9" }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Modifier le profil</span>
              <button onClick={() => setShowEditModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}><FiX size={16} /></button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, padding: "20px" }}>
              {[
                { label: "Prénom", key: "prenom", placeholder: "Prénom" },
                { label: "Nom",    key: "nom",    placeholder: "Nom" },
                { label: "Email",  key: "email",  placeholder: "Email", disabled: true },
                { label: "Téléphone", key: "telephone", placeholder: "+237 6XX XXX XXX" },
                { label: "Nouveau mot de passe", key: "mdpNouv", placeholder: "Laisser vide pour garder" },
                { label: "Confirmer mot de passe", key: "mdpConf", placeholder: "Confirmer" },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 5 }}>{f.label}</label>
                  <input type={f.key.includes("mdp") ? "password" : "text"} value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                    placeholder={f.placeholder} disabled={f.disabled}
                    style={{ width: "100%", padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 12, outline: "none", boxSizing: "border-box", background: f.disabled ? "#f8fafc" : "#fff" }} />
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10, padding: "0 20px 20px" }}>
              <button onClick={() => setShowEditModal(false)} style={{ flex: 1, padding: "10px", background: "#f1f5f9", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#64748b" }}>Fermer</button>
              <button onClick={sauvegarder} disabled={loading} style={{ flex: 1, padding: "10px", background: "#7c3aed", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                {loading ? "Sauvegarde..." : "Sauvegarder les modifications"}
              </button>
            </div>

            {/* Changer photo - dans le modal */}
            <div style={{ borderTop: "1px solid #f1f5f9", padding: "16px 20px" }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", marginBottom: 12, textAlign: "center" }}>Changer la photo de profil</p>
              <div style={{ textAlign: "center" }}>
                <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px", overflow: "hidden", border: "2px solid #e2e8f0" }}>
                  {photo ? <img src={photo} alt="profil" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <FiUser size={30} color="#94a3b8" />}
                </div>
                <p style={{ fontSize: 11, color: "#94a3b8", marginBottom: 8 }}>Choisir une nouvelle photo de profil</p>
                <button onClick={() => inputRef.current.click()} style={{ padding: "7px 18px", background: "#f5f3ff", border: "1px solid #ede9fe", color: "#7c3aed", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  Choisir un fichier
                </button>
                <input ref={inputRef} type="file" accept="image/*" onChange={changerPhoto} style={{ display: "none" }} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}