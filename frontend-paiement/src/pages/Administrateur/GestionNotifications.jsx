import { useState } from "react";

// ── Données initiales ─────────────────────────────────────────────────────
const notificationsInitiales = [
  { id: 1, titre: "Notification de test", type: "INFO", date: "2025-03-06" },
];

// ── Styles locaux ─────────────────────────────────────────────────────────
const inputStyle = {
  width: "100%", padding: "9px 12px", borderRadius: 8,
  border: "1px solid #e5e7eb", fontSize: 13, marginBottom: 14,
  boxSizing: "border-box", outline: "none", background: "#fafafa"
};

const labelStyle = {
  display: "block", fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 4
};

// ── Page principale ───────────────────────────────────────────────────────
export default function GestionNotifications() {
  const [titre, setTitre]               = useState("");
  const [message, setMessage]           = useState("");
  const [destinataire, setDestinataire] = useState("Tous les utilisateurs");
  const [urgent, setUrgent]             = useState(false);
  const [notifications, setNotifications] = useState(notificationsInitiales);
  const [filtre, setFiltre]             = useState("Tous");

  const envoyer = () => {
    if (!titre.trim()) return;
    const nouvelle = {
      id: Date.now(),
      titre,
      type: urgent ? "URGENT" : "INFO",
      date: new Date().toISOString().split("T")[0],
    };
    setNotifications([nouvelle, ...notifications]);
    setTitre("");
    setMessage("");
    setUrgent(false);
  };

  const notificationsFiltrees = notifications.filter(
    n => filtre === "Tous" || n.type === filtre
  );

  const totalUrgent = notifications.filter(n => n.type === "URGENT").length;
  const totalInfo   = notifications.filter(n => n.type === "INFO").length;

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1e1e2e", marginBottom: 16 }}>
        Gestion des notifications
      </h2>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

        {/* ── Formulaire d'envoi ── */}
        <div style={{ background: "#fff", borderRadius: 14, padding: 24, boxShadow: "0 2px 12px #6c3fc311" }}>

          {/* Bandeau rouge */}
          <div style={{
            background: "linear-gradient(90deg, #ef4444, #f87171)",
            color: "#fff", borderRadius: 10, padding: "10px 16px",
            fontWeight: 700, marginBottom: 20
          }}>
            🔔 Gestion des notifications
          </div>

          <div style={{ fontWeight: 700, color: "#1e1e2e", marginBottom: 16 }}>
            Envoyer une nouvelle notification
          </div>

          <label style={labelStyle}>Titre de la notification</label>
          <input
            value={titre}
            onChange={e => setTitre(e.target.value)}
            style={inputStyle}
            placeholder="Titre..."
          />

          <label style={labelStyle}>Message de la notification</label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            style={{ ...inputStyle, height: 90, resize: "vertical" }}
            placeholder="Message..."
          />

          <label style={labelStyle}>Type de destinataire</label>
          <select
            value={destinataire}
            onChange={e => setDestinataire(e.target.value)}
            style={inputStyle}
          >
            <option>Tous les utilisateurs</option>
            <option>Utilisateurs actifs</option>
            <option>Administrateurs</option>
          </select>

          <label style={{
            display: "flex", alignItems: "center", gap: 8,
            margin: "12px 0", fontSize: 13, cursor: "pointer"
          }}>
            <input
              type="checkbox"
              checked={urgent}
              onChange={e => setUrgent(e.target.checked)}
            />
            <span style={{ fontWeight: 600 }}>Marquer comme urgent</span>
          </label>

          <button
            onClick={envoyer}
            style={{
              background: "linear-gradient(90deg, #ef4444, #f87171)",
              color: "#fff", border: "none", borderRadius: 8,
              padding: "10px 22px", fontWeight: 700, cursor: "pointer",
              fontSize: 14, width: "100%"
            }}
          >
            📤 Envoyer la notification
          </button>
        </div>

        {/* ── Notifications récentes ── */}
        <div style={{ background: "#fff", borderRadius: 14, padding: 24, boxShadow: "0 2px 12px #6c3fc311" }}>

          {/* En-tête + filtre */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontWeight: 700, color: "#1e1e2e" }}>Notifications récentes</div>
            <select
              value={filtre}
              onChange={e => setFiltre(e.target.value)}
              style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, background: "#fff" }}
            >
              <option>Tous</option>
              <option>INFO</option>
              <option>URGENT</option>
            </select>
          </div>

          {/* Liste */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {notificationsFiltrees.map(n => (
              <div
                key={n.id}
                style={{
                  background: n.type === "URGENT" ? "#fef2f2" : "#eff6ff",
                  borderLeft: `4px solid ${n.type === "URGENT" ? "#ef4444" : "#3b82f6"}`,
                  borderRadius: 8, padding: "12px 16px"
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 13, color: "#1e1e2e" }}>{n.titre}</div>
                <div style={{ fontSize: 11, color: "#aaa", marginTop: 4 }}>{n.type} • {n.date}</div>
              </div>
            ))}
            {notificationsFiltrees.length === 0 && (
              <div style={{ color: "#aaa", fontSize: 13, textAlign: "center", padding: 40 }}>
                Aucune notification
              </div>
            )}
          </div>

          {/* Statistiques */}
          <div style={{ marginTop: 24, borderTop: "1px solid #f3f4f6", paddingTop: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Statistiques des notifications</div>
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1, background: "#f8f5ff", borderRadius: 8, padding: "10px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#7c3aed" }}>{notifications.length}</div>
                <div style={{ fontSize: 11, color: "#888" }}>Total</div>
              </div>
              <div style={{ flex: 1, background: "#fef2f2", borderRadius: 8, padding: "10px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#ef4444" }}>{totalUrgent}</div>
                <div style={{ fontSize: 11, color: "#888" }}>Urgents</div>
              </div>
              <div style={{ flex: 1, background: "#eff6ff", borderRadius: 8, padding: "10px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#3b82f6" }}>{totalInfo}</div>
                <div style={{ fontSize: 11, color: "#888" }}>Info</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}