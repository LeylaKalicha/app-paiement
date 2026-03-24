import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import api from "../services/api";

const COUNTRIES = [
  { code: "+237", flag: "🇨🇲", name: "Cameroun" },
  { code: "+236", flag: "🇨🇫", name: "Centrafrique" },
  { code: "+235", flag: "🇹🇩", name: "Tchad" },
  { code: "+242", flag: "🇨🇬", name: "Congo" },
  { code: "+243", flag: "🇨🇩", name: "RD Congo" },
  { code: "+240", flag: "🇬🇶", name: "Guinée Éq." },
  { code: "+241", flag: "🇬🇦", name: "Gabon" },
  { code: "+239", flag: "🇸🇹", name: "São Tomé" },
  { code: "+257", flag: "🇧🇮", name: "Burundi" },
  { code: "+250", flag: "🇷🇼", name: "Rwanda" },
];

export default function PayVirtualRegister() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nom:        "",
    telephone:  "",
    email:      "",
    motDePasse: "",
  });
  const [indicatif, setIndicatif]       = useState("+237");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [erreur, setErreur]             = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    setErreur("");

    // ── Validations ──
    if (!formData.nom)        return setErreur("Veuillez entrer votre nom.");
    if (!formData.telephone)  return setErreur("Veuillez entrer votre numéro.");
    if (!formData.email)      return setErreur("Veuillez entrer votre email.");
    if (!formData.motDePasse) return setErreur("Veuillez entrer un mot de passe.");
    if (formData.motDePasse.length < 6) return setErreur("Le mot de passe doit contenir au moins 6 caractères.");

    try {
      setLoading(true);

      // ── Appel API inscription ──
      const response = await api.post("/auth/register", {
        nom:        formData.nom,
        email:      formData.email,
        motDePasse: formData.motDePasse,
        telephone:  `${indicatif}${formData.telephone}`,
      });

      // ── Après inscription : connexion automatique ──
      const loginResponse = await api.post("/auth/login", {
        email:      formData.email,
        motDePasse: formData.motDePasse,
      });

      // ── Sauvegarder le token et l'utilisateur ──
      localStorage.setItem("token", loginResponse.data.token);
      localStorage.setItem("user",  JSON.stringify(loginResponse.data.user));

      // ── Redirection selon le type ──
      if (loginResponse.data.user.type === "ADMIN") {
        navigate("/AdminDashboard");
      } else {
        navigate("/Dashboard");
      }

    } catch (error) {
      if (error.response) {
        setErreur(error.response.data.message || "Erreur lors de l'inscription.");
      } else {
        setErreur("Erreur serveur. Vérifiez votre connexion.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      fontFamily: "Segoe UI, sans-serif",
      background: "linear-gradient(135deg, #7a6ff0 0%, #a78bfa 50%, #c4b5fd 100%)",
      position: "relative",
      overflow: "hidden",
    }}>

      {/* Filigrane */}
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 0, userSelect: "none", pointerEvents: "none" }}>
        <span style={{ fontSize: "clamp(80px, 18vw, 220px)", fontWeight: "900", fontStyle: "italic", color: "rgba(30, 24, 75, 0.15)", letterSpacing: "-4px", whiteSpace: "nowrap", fontFamily: "'Georgia', serif" }}>
          PayVirtual
        </span>
      </div>

      {/* Arrière-plan décoratif */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", zIndex: 0 }}>
        <div style={{ position: "absolute", width: "400px", height: "400px", borderRadius: "50%", background: "rgba(122,111,240,0.1)", top: "-100px", left: "-100px" }} />
        <div style={{ position: "absolute", width: "300px", height: "300px", borderRadius: "50%", background: "rgba(167,139,250,0.08)", bottom: "-80px", right: "-80px" }} />
      </div>

      <Navbar />

      <div style={{ display: "flex", justifyContent: "center", paddingTop: "100px", zIndex: 1, position: "relative" }}>
        <div style={{ background: "#fff", padding: "40px", borderRadius: "20px", boxShadow: "0 20px 40px rgba(0,0,0,0.1)", width: "420px", position: "relative" }}>

          <h2 style={{ color: "#222", fontSize: "28px", fontWeight: 700, marginBottom: "25px", textAlign: "center" }}>
            S'inscrire
          </h2>

          {/* Message d'erreur */}
          {erreur && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", padding: "10px 14px", borderRadius: "10px", fontSize: "13px", marginBottom: "16px", fontWeight: 600 }}>
              ⚠️ {erreur}
            </div>
          )}

          <form onSubmit={handleRegister}>

            {/* Nom */}
            <div style={inputWrapStyle}>
              <span style={iconStyle}>👤</span>
              <input
                type="text"
                placeholder="Nom d'utilisateur"
                value={formData.nom}
                onChange={e => setFormData({ ...formData, nom: e.target.value })}
                style={inputStyle}
              />
            </div>

            {/* Téléphone + indicatif */}
            <div style={inputWrapStyle}>
              <select
                value={indicatif}
                onChange={e => setIndicatif(e.target.value)}
                style={{ padding: "12px 8px", border: "none", background: "transparent", fontSize: "13px", cursor: "pointer", outline: "none", borderRight: "1px solid #e5e7eb" }}
              >
                {COUNTRIES.map(c => (
                  <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                ))}
              </select>
              <input
                type="tel"
                placeholder="Numéro de téléphone"
                value={formData.telephone}
                onChange={e => setFormData({ ...formData, telephone: e.target.value })}
                style={inputStyle}
              />
            </div>

            {/* Email */}
            <div style={inputWrapStyle}>
              <span style={iconStyle}>✉️</span>
              <input
                type="email"
                placeholder="Adresse email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                style={inputStyle}
              />
            </div>

            {/* Mot de passe */}
            <div style={inputWrapStyle}>
              <span style={iconStyle}>🔒</span>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Mot de passe"
                value={formData.motDePasse}
                onChange={e => setFormData({ ...formData, motDePasse: e.target.value })}
                style={inputStyle}
              />
              <span onClick={() => setShowPassword(!showPassword)} style={{ cursor: "pointer", padding: "0 12px" }}>
                {showPassword ? "👁" : "👁"}
              </span>
            </div>

            {/* Bouton S'inscrire */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%", background: loading ? "#a78bfa" : "#7a6ff0",
                color: "#fff", border: "none", padding: "12px", borderRadius: "12px",
                fontWeight: "700", fontSize: "15px", marginTop: "20px",
                cursor: loading ? "not-allowed" : "pointer", transition: "all 0.2s",
              }}
              onMouseEnter={e => { if (!loading) e.target.style.background = "#6a5fe0"; }}
              onMouseLeave={e => { if (!loading) e.target.style.background = "#7a6ff0"; }}
            >
              {loading ? "Inscription en cours..." : "S'INSCRIRE"}
            </button>
          </form>

          {/* Lien Se connecter */}
          <div style={{ marginTop: "15px", textAlign: "center", fontSize: "14px" }}>
            Vous avez déjà un compte ?{" "}
            <button
              onClick={() => navigate("/login")}
              style={{ background: "transparent", border: "none", color: "#7a6ff0", fontWeight: "600", cursor: "pointer" }}
            >
              Se connecter
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

const inputWrapStyle = {
  display: "flex", alignItems: "center",
  border: "1.5px solid #e5e7eb", borderRadius: "10px",
  marginBottom: "12px", background: "#fafafa", overflow: "hidden",
};
const iconStyle = { padding: "0 12px", fontSize: "16px", color: "#9ca3af" };
const inputStyle = { flex: 1, border: "none", background: "transparent", padding: "12px", fontSize: "14px", outline: "none" };