import React, { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import api from "../services/api";

export default function PayVirtualLogin() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    motDePasse: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await api.post("/auth/login", formData);
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      if (response.data.user.type === "ADMIN") navigate("/AdminDashboard");
      else navigate("/Dashboard");
    } catch (error) {
      if (error.response) alert(error.response.data.message);
      else alert("Erreur serveur");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        fontFamily: "Segoe UI, sans-serif",
        background: "linear-gradient(135deg, #7a6ff0 0%, #a78bfa 50%, #c4b5fd 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Filigrane */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 0,
          userSelect: "none",
          pointerEvents: "none",
        }}
      >
        <span
          style={{
            fontSize: "clamp(80px, 18vw, 220px)",
            fontWeight: "900",
            fontStyle: "italic",
            color: "rgba(30, 24, 75, 0.15)",
            letterSpacing: "-4px",
            whiteSpace: "nowrap",
            fontFamily: "'Georgia', serif",
          }}
        >
          PayVirtual
        </span>
      </div>

      {/* Arrière-plan décoratif */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", zIndex: 0 }}>
        <div
          style={{
            position: "absolute",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: "rgba(122,111,240,0.1)",
            top: "-100px",
            left: "-100px",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: "300px",
            height: "300px",
            borderRadius: "50%",
            background: "rgba(167,139,250,0.08)",
            bottom: "-80px",
            right: "-80px",
          }}
        />
      </div>

      <Navbar />

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          paddingTop: "100px",
          zIndex: 1,
          position: "relative",
          minHeight: "calc(100vh - 80px)",
        }}
      >
        {/* Formulaire */}
        <div
          style={{
            background: "#fff",
            padding: "40px",
            borderRadius: "20px",
            boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
            width: "420px",
            position: "relative",
          }}
        >
          <button
            onClick={() => navigate("/")}
            style={{
              position: "absolute",
              top: "16px",
              left: "16px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "white",
              border: "none",
              padding: "6px 12px",
              borderRadius: "12px",
              cursor: "pointer",
              boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
              zIndex: 2,
            }}
          >
            <ArrowLeft size={18} /> Retour
          </button>

          <h2 style={{ fontSize: "28px", fontWeight: 700, color: "#222", marginBottom: "25px", textAlign: "center" }}>
            Se connecter
          </h2>

          <form onSubmit={handleLogin}>
            <div style={inputWrapStyle}>
              <span style={iconStyle}>✉️</span>
              <input
                type="email"
                required
                placeholder="Adresse email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                style={inputStyle}
              />
            </div>

            <div style={inputWrapStyle}>
              <span style={iconStyle}>🔒</span>
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="Mot de passe"
                value={formData.motDePasse}
                onChange={(e) => setFormData({ ...formData, motDePasse: e.target.value })}
                style={inputStyle}
              />
              <span
                onClick={() => setShowPassword(!showPassword)}
                style={{ cursor: "pointer", padding: "0 12px" }}
              >
                {showPassword ? "👁" : "👁"}
              </span>
            </div>

            <div style={{ textAlign: "right", marginBottom: "20px" }}>
              <button
                type="button"
                onClick={() => navigate("/forgot-password")}
                style={{ fontSize: "14px", color: "#7a6ff0", background: "transparent", border: "none", cursor: "pointer" }}
              >
                Mot de passe oublié ?
              </button>
            </div>

            <button
              type="submit"
              style={{
                width: "100%",
                background: "#7a6ff0",
                color: "#fff",
                border: "none",
                padding: "12px",
                borderRadius: "12px",
                fontWeight: "700",
                fontSize: "15px",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => (e.target.style.background = "#6a5fe0")}
              onMouseLeave={(e) => (e.target.style.background = "#7a6ff0")}
            >
              Se connecter
            </button>
          </form>

          <div style={{ marginTop: "20px", textAlign: "center", fontSize: "14px" }}>
            Pas encore membre ?{" "}
            <button
              onClick={() => navigate("/register")}
              style={{
                background: "transparent",
                border: "none",
                color: "#7a6ff0",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              Inscrivez-vous
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const inputWrapStyle = {
  display: "flex",
  alignItems: "center",
  border: "1.5px solid #e5e7eb",
  borderRadius: "10px",
  marginBottom: "12px",
  background: "#fafafa",
  overflow: "hidden",
};

const iconStyle = {
  padding: "0 12px",
  fontSize: "16px",
  color: "#9ca3af",
};

const inputStyle = {
  flex: 1,
  border: "none",
  background: "transparent",
  padding: "12px",
  fontSize: "14px",
  outline: "none",
};
