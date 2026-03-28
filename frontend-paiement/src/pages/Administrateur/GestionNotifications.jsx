import { useState, useEffect } from "react";
import api from "../../services/api";

const inputStyle = { width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, marginBottom: 14, boxSizing: "border-box", outline: "none", background: "#fafafa" };
const labelStyle = { display: "block", fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 4 };

export default function GestionNotifications({ allerVers }) {
  const [notifications, setNotifications] = useState([]);
  const [utilisateurs, setUtilisateurs]   = useState([]);
  const [stats, setStats]                 = useState({ total: 0, urgentes: 0 });
  const [loading, setLoading]             = useState(true);
  const [envoi, setEnvoi]                 = useState(false);
  const [filtre, setFiltre]               = useState("Tous");
  const [msg, setMsg]                     = useState(null);

  const [form, setForm] = useState({ titre: "", message: "", utilisateur_id: "tous", urgent: false });

  const token   = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const charger = async () => {
    try {
      setLoading(true);
      const [resNotifs, resUsers] = await Promise.all([
        api.get("/admin/notifications", { headers }),
        api.get("/admin/utilisateurs",  { headers }),
      ]);
      setNotifications(resNotifs.data.notifications || []);
      setStats({ total: resNotifs.data.total || 0, urgentes: resNotifs.data.urgentes || 0 });
      setUtilisateurs((resUsers.data.utilisateurs || []).filter(u => u.type === "USER"));
    } catch { }
    finally { setLoading(false); }
  };

  useEffect(() => { charger(); }, []);

  const envoyer = async () => {
    if (!form.titre.trim() || !form.message.trim()) {
      setMsg({ type: "error", text: "Titre et message obligatoires." });
      return;
    }
    try {
      setEnvoi(true);
      const res = await api.post("/admin/notifications/envoyer", {
        titre:          form.titre,
        message:        form.message,
        utilisateur_id: form.utilisateur_id,
        urgent:         form.urgent,
      }, { headers });
      setMsg({ type: "success", text: res.data.message });
      setForm({ titre: "", message: "", utilisateur_id: "tous", urgent: false });
      charger();
    } catch (e) {
      setMsg({ type: "error", text: e.response?.data?.message || "Erreur." });
    } finally { setEnvoi(false); }
  };

  const notifFiltrees = notifications.filter(n =>
    filtre === "Tous" ||
    (filtre === "URGENT" && n.titre?.includes("URGENT")) ||
    (filtre === "INFO"   && !n.titre?.includes("URGENT"))
  );

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1e1e2e", marginBottom: 16 }}>Gestion des notifications</h2>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

        {/* Formulaire d'envoi */}
        <div style={{ background: "#fff", borderRadius: 14, padding: 24, boxShadow: "0 2px 12px rgba(108,63,195,0.07)" }}>
          <div style={{ background: "linear-gradient(90deg, #ef4444, #f87171)", color: "#fff", borderRadius: 10, padding: "10px 16px", fontWeight: 700, marginBottom: 20 }}>
            🔔 Envoyer une notification
          </div>

          {msg && (
            <div style={{ padding: "10px 14px", borderRadius: 8, marginBottom: 14, fontSize: 13, fontWeight: 600, background: msg.type === "success" ? "#f0fdf4" : "#fef2f2", color: msg.type === "success" ? "#16a34a" : "#dc2626", border: `1px solid ${msg.type === "success" ? "#bbf7d0" : "#fecaca"}` }}>
              {msg.text}
            </div>
          )}

          <label style={labelStyle}>Destinataire</label>
          <select value={form.utilisateur_id} onChange={e => setForm({ ...form, utilisateur_id: e.target.value })} style={inputStyle}>
            <option value="tous">📢 Tous les utilisateurs actifs</option>
            {utilisateurs.map(u => (
              <option key={u.id} value={u.id}>{u.nom} ({u.email})</option>
            ))}
          </select>

          <label style={labelStyle}>Titre de la notification</label>
          <input value={form.titre} onChange={e => setForm({ ...form, titre: e.target.value })} style={inputStyle} placeholder="Titre..." />

          <label style={labelStyle}>Message</label>
          <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
            style={{ ...inputStyle, height: 90, resize: "vertical" }} placeholder="Message..." />

          <label style={{ display: "flex", alignItems: "center", gap: 8, margin: "4px 0 16px", fontSize: 13, cursor: "pointer" }}>
            <input type="checkbox" checked={form.urgent} onChange={e => setForm({ ...form, urgent: e.target.checked })} />
            <span style={{ fontWeight: 600 }}>Marquer comme URGENT</span>
          </label>

          <button onClick={envoyer} disabled={envoi} style={{ background: "linear-gradient(90deg, #ef4444, #f87171)", color: "#fff", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, cursor: "pointer", fontSize: 14, width: "100%", opacity: envoi ? 0.7 : 1 }}>
            {envoi ? "Envoi en cours..." : "📤 Envoyer la notification"}
          </button>
        </div>

        {/* Historique depuis BDD */}
        <div style={{ background: "#fff", borderRadius: 14, padding: 24, boxShadow: "0 2px 12px rgba(108,63,195,0.07)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontWeight: 700, color: "#1e1e2e" }}>Notifications récentes ({notifications.length})</div>
            <select value={filtre} onChange={e => setFiltre(e.target.value)}
              style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, background: "#fff" }}>
              <option value="Tous">Tous</option>
              <option value="INFO">INFO</option>
              <option value="URGENT">URGENT</option>
            </select>
          </div>

          {loading ? (
            <p style={{ color: "#94a3b8", fontSize: 13 }}>Chargement...</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 320, overflowY: "auto" }}>
              {notifFiltrees.length === 0 ? (
                <div style={{ color: "#aaa", fontSize: 13, textAlign: "center", padding: 30 }}>Aucune notification</div>
              ) : notifFiltrees.map(n => {
                const urgent = n.titre?.includes("URGENT");
                return (
                  <div key={n.id} style={{ background: urgent ? "#fef2f2" : "#eff6ff", borderLeft: `4px solid ${urgent ? "#ef4444" : "#3b82f6"}`, borderRadius: 8, padding: "12px 16px" }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "#1e1e2e" }}>{n.titre}</div>
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 4, lineHeight: 1.4 }}>{n.message}</div>
                    <div style={{ fontSize: 11, color: "#aaa", marginTop: 4 }}>
                      {urgent ? "URGENT" : "INFO"} · {n.dateEnvoi?.split("T")[0]} · → {n.nomUtilisateur || "Tous"}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Statistiques depuis BDD */}
          <div style={{ marginTop: 20, borderTop: "1px solid #f3f4f6", paddingTop: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Statistiques</div>
            <div style={{ display: "flex", gap: 12 }}>
              {[
                { label: "Total",    val: stats.total,    color: "#7c3aed", bg: "#f8f5ff" },
                { label: "Urgents",  val: stats.urgentes, color: "#ef4444", bg: "#fef2f2" },
                { label: "Info",     val: stats.total - stats.urgentes, color: "#3b82f6", bg: "#eff6ff" },
              ].map(s => (
                <div key={s.label} style={{ flex: 1, background: s.bg, borderRadius: 8, padding: "10px 14px", textAlign: "center" }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.val}</div>
                  <div style={{ fontSize: 11, color: "#888" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}