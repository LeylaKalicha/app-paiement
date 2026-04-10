import { useState, useEffect } from "react";
import api from "../../services/api";
import { FiBell, FiAlertCircle, FiInfo, FiRefreshCw, FiInbox } from "react-icons/fi";

export default function MesNotifications({ retour }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [filtre, setFiltre]               = useState("Tous");
  const [rafraichi, setRafraichi]         = useState(false);

  const token   = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const charger = async () => {
    try {
      setLoading(true);
      const res = await api.get("/notifications/mes-notifs", { headers });
      setNotifications(res.data.data || []);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { charger(); }, []);

  const rafraichir = async () => {
    setRafraichi(true);
    await charger();
    setTimeout(() => setRafraichi(false), 600);
  };

  const isUrgent = (titre) => titre?.toUpperCase().includes("URGENT");

  const filtrees = notifications.filter(n =>
    filtre === "Tous"   ? true :
    filtre === "URGENT" ? isUrgent(n.titre) :
                          !isUrgent(n.titre)
  );

  const nbUrgent = notifications.filter(n => isUrgent(n.titre)).length;
  const nbInfo   = notifications.length - nbUrgent;

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })
      + " à " + d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div style={{ maxWidth: 680, margin: "0 auto" }}>

      {/* En-tête */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <p style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>Accueil › Notifications</p>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
            <FiBell size={20} color="#7c3aed" />
            Mes notifications
            {nbUrgent > 0 && (
              <span style={{ background: "#ef4444", color: "#fff", fontSize: 11, fontWeight: 800, padding: "2px 8px", borderRadius: 20 }}>
                {nbUrgent} urgent{nbUrgent > 1 ? "s" : ""}
              </span>
            )}
          </h1>
        </div>
        <button onClick={rafraichir} title="Rafraîchir" style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "7px 12px", cursor: "pointer", color: "#64748b", display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600 }}>
          <FiRefreshCw size={13} style={{ transition: "transform 0.5s", transform: rafraichi ? "rotate(360deg)" : "rotate(0deg)" }} />
          Actualiser
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total",   val: notifications.length, color: "#7c3aed", bg: "#f5f3ff", border: "#ede9fe" },
          { label: "Urgents", val: nbUrgent,              color: "#ef4444", bg: "#fef2f2", border: "#fecaca" },
          { label: "Info",    val: nbInfo,                color: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe" },
        ].map(s => (
          <div key={s.label} style={{ flex: 1, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10, padding: "12px 16px", textAlign: "center" }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 500, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {["Tous", "URGENT", "INFO"].map(f => (
          <button key={f} onClick={() => setFiltre(f)} style={{
            padding: "6px 16px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700,
            background: filtre === f ? "#7c3aed" : "#f1f5f9",
            color: filtre === f ? "#fff" : "#64748b",
            transition: "all 0.15s"
          }}>
            {f === "URGENT" ? "🔴 " : f === "INFO" ? "🔵 " : "📋 "}{f}
          </button>
        ))}
      </div>

      {/* Liste */}
      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>
            <FiBell size={28} style={{ marginBottom: 10, opacity: 0.3 }} />
            <p style={{ fontSize: 13, margin: 0 }}>Chargement...</p>
          </div>
        ) : filtrees.length === 0 ? (
          <div style={{ padding: 50, textAlign: "center", color: "#94a3b8" }}>
            <FiInbox size={32} style={{ marginBottom: 12, opacity: 0.25 }} />
            <p style={{ fontSize: 14, fontWeight: 600, color: "#cbd5e1", margin: "0 0 4px" }}>Aucune notification</p>
            <p style={{ fontSize: 12, margin: 0 }}>Vous n'avez pas encore de notification dans cette catégorie.</p>
          </div>
        ) : filtrees.map((n, i) => {
          const urgent = isUrgent(n.titre);
          return (
            <div key={n.id} style={{
              display: "flex", alignItems: "flex-start", gap: 14,
              padding: "16px 20px",
              borderBottom: i < filtrees.length - 1 ? "1px solid #f1f5f9" : "none",
              background: urgent ? "#fffbfb" : "#fff",
              transition: "background 0.15s"
            }}
              onMouseEnter={e => e.currentTarget.style.background = urgent ? "#fef2f2" : "#f8fafc"}
              onMouseLeave={e => e.currentTarget.style.background = urgent ? "#fffbfb" : "#fff"}
            >
              {/* Icône */}
              <div style={{
                width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
                background: urgent ? "#fef2f2" : "#eff6ff",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                {urgent
                  ? <FiAlertCircle size={17} color="#ef4444" />
                  : <FiInfo size={17} color="#3b82f6" />
                }
              </div>

              {/* Contenu */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: "#0f172a" }}>{n.titre}</span>
                  {urgent && (
                    <span style={{ background: "#ef4444", color: "#fff", fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 20, letterSpacing: 0.5 }}>
                      URGENT
                    </span>
                  )}
                </div>
                {n.message && (
                  <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 6px", lineHeight: 1.5 }}>{n.message}</p>
                )}
                <span style={{ fontSize: 11, color: "#94a3b8" }}>{formatDate(n.dateEnvoi)}</span>
              </div>

              {/* Pastille type */}
              <span style={{
                flexShrink: 0, fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
                background: urgent ? "#fecaca" : "#bfdbfe",
                color: urgent ? "#ef4444" : "#3b82f6",
              }}>
                {urgent ? "URGENT" : "INFO"}
              </span>
            </div>
          );
        })}
      </div>

      {filtrees.length > 0 && (
        <p style={{ fontSize: 11, color: "#94a3b8", textAlign: "center", marginTop: 12 }}>
          {filtrees.length} notification{filtrees.length > 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
