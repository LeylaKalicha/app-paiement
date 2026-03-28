import { useState, useEffect } from "react";
import api from "../../services/api";

const Toggle = ({ actif, onChange }) => (
  <div onClick={onChange} style={{ width: 44, height: 24, borderRadius: 20, cursor: "pointer", position: "relative", background: actif ? "#7c3aed" : "#e5e7eb", transition: "background 0.25s", flexShrink: 0 }}>
    <div style={{ position: "absolute", top: 3, left: actif ? 22 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.2)", transition: "left 0.25s" }} />
  </div>
);

const niveaux = [
  { id: "standard", label: "Standard",  features: ["Mot de passe requis", "Session 24h"] },
  { id: "elevated", label: "Élevé",     features: ["PIN 6 chiffres", "Limite 100 000 XAF", "Session 8h"] },
  { id: "critical", label: "Critique",  features: ["2FA obligatoire", "OTP SMS/Email", "Session 2h"] },
];

export default function GestionSecurite({ allerVers }) {
  const [stats, setStats]         = useState(null);
  const [loading, setLoading]     = useState(true);
  const [niveauActif, setNiveau]  = useState("critical");
  const [ipBloquees, setIp]       = useState(["41.202.31.55"]);
  const [nouvelleIp, setNouvelleIp] = useState("");
  const [params, setParams]       = useState({
    deuxFacteurs: true, otpSms: true, otpEmail: true, biometrique: false,
    blocageAuto: true, alerteConnexion: true, sessionExp: true,
    chiffrement: true, limiteTransaction: true, journalisation: true,
  });

  const token   = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    const charger = async () => {
      try {
        const res = await api.get("/admin/securite", { headers });
        setStats(res.data);
      } catch { }
      finally { setLoading(false); }
    };
    charger();
  }, []);

  const toggle   = (k) => setParams(p => ({ ...p, [k]: !p[k] }));
  const ajouterIp = () => {
    if (!nouvelleIp.trim() || ipBloquees.includes(nouvelleIp)) return;
    setIp([...ipBloquees, nouvelleIp]);
    setNouvelleIp("");
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Chargement...</div>;

  const cards = stats ? [
    { label: "Comptes actifs",            val: stats.totalActifs,            color: "#16a34a", bg: "#dcfce7" },
    { label: "Comptes suspendus",          val: stats.totalSuspendus,         color: "#dc2626", bg: "#fee2e2" },
    { label: "Comptes inactifs",           val: stats.totalInactifs,          color: "#d97706", bg: "#fef3c7" },
    { label: "Transactions annulées",      val: stats.transactionsAnnulees,   color: "#dc2626", bg: "#fee2e2" },
    { label: "Transactions en attente",    val: stats.transactionsEnAttente,  color: "#d97706", bg: "#fef3c7" },
    { label: "Cartes bloquées",            val: stats.cartesBloquees,         color: "#7c3aed", bg: "#f5f3ff" },
  ] : [];

  return (
    <div style={{ color: "#1e1e2e" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Sécurité</h2>
          <p style={{ color: "#9ca3af", fontSize: 13, marginTop: 4 }}>Statistiques et paramètres de sécurité — données en temps réel</p>
        </div>
        <button onClick={() => allerVers && allerVers("dashboard")} style={{ background: "none", border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#6b7280" }}>← Retour</button>
      </div>

      {/* Stats depuis BDD */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 20 }}>
        {cards.map(c => (
          <div key={c.label} style={{ background: "#fff", borderRadius: 12, padding: "18px 22px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: c.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, color: c.color, flexShrink: 0 }}>
              {c.val}
            </div>
            <div>
              <p style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, margin: 0 }}>{c.label}</p>
              <p style={{ fontSize: 24, fontWeight: 800, color: c.color, margin: "2px 0 0" }}>{c.val}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>

        {/* Niveau de sécurité */}
        <div style={{ background: "#fff", borderRadius: 12, padding: 24, border: "1px solid #e2e8f0" }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>Niveau de sécurité</div>
          {niveaux.map(n => {
            const actif = niveauActif === n.id;
            return (
              <div key={n.id} onClick={() => setNiveau(n.id)} style={{ border: `1.5px solid ${actif ? "#7c3aed" : "#e5e7eb"}`, borderRadius: 10, padding: "12px 16px", cursor: "pointer", background: actif ? "#f5f3ff" : "#fafafa", marginBottom: 10, transition: "all 0.2s" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: actif ? "#7c3aed" : "#374151" }}>{n.label}</span>
                  <div style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${actif ? "#7c3aed" : "#d1d5db"}`, background: actif ? "#7c3aed" : "transparent" }} />
                </div>
                {actif && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                    {n.features.map(f => (
                      <span key={f} style={{ background: "#ede9fe", color: "#7c3aed", padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{f}</span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Paramètres */}
        <div style={{ background: "#fff", borderRadius: 12, padding: 24, border: "1px solid #e2e8f0" }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>Paramètres de sécurité</div>
          {[
            { k: "deuxFacteurs",     label: "Authentification 2FA",        critique: true  },
            { k: "otpSms",           label: "OTP par SMS",                  critique: false },
            { k: "otpEmail",         label: "OTP par Email",                critique: false },
            { k: "blocageAuto",      label: "Blocage après 5 tentatives",   critique: true  },
            { k: "chiffrement",      label: "Chiffrement AES-256",          critique: true  },
            { k: "limiteTransaction",label: "Limite de transaction",         critique: false },
            { k: "journalisation",   label: "Journalisation des actions",   critique: false },
          ].map((p, i, arr) => (
            <div key={p.k} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 0", borderBottom: i < arr.length - 1 ? "1px solid #f3f4f6" : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13, color: "#374151" }}>{p.label}</span>
                {p.critique && <span style={{ background: "#fef3c7", color: "#92400e", fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 20 }}>CRITIQUE</span>}
              </div>
              <Toggle actif={params[p.k]} onChange={() => toggle(p.k)} />
            </div>
          ))}
        </div>
      </div>

      {/* IP bloquées */}
      <div style={{ background: "#fff", borderRadius: 12, padding: 24, border: "1px solid #e2e8f0" }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Adresses IP bloquées</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <input value={nouvelleIp} onChange={e => setNouvelleIp(e.target.value)} onKeyDown={e => e.key === "Enter" && ajouterIp()}
            placeholder="ex: 192.168.1.100"
            style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, outline: "none" }} />
          <button onClick={ajouterIp} style={{ background: "#7c3aed", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Bloquer</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {ipBloquees.map(ip => (
            <div key={ip} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 14px" }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#374151", fontFamily: "monospace" }}>{ip}</span>
              <button onClick={() => setIp(i => i.filter(x => x !== ip))} style={{ background: "none", border: "1px solid #e5e7eb", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer", color: "#6b7280" }}>Débloquer</button>
            </div>
          ))}
          {ipBloquees.length === 0 && <p style={{ textAlign: "center", color: "#9ca3af", fontSize: 13 }}>Aucune IP bloquée</p>}
        </div>

        {/* Recommandations basées sur les stats réelles */}
        <div style={{ marginTop: 20, borderTop: "1px solid #f1f5f9", paddingTop: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>🛡️ Recommandations</div>
          {[
            { ok: (stats?.totalSuspendus   || 0) === 0, msg: stats?.totalSuspendus    ? `${stats.totalSuspendus} compte(s) suspendu(s) à surveiller`    : "Aucun compte suspendu" },
            { ok: (stats?.transactionsEnAttente || 0) < 5, msg: stats?.transactionsEnAttente >= 5 ? `${stats.transactionsEnAttente} transactions en attente !` : "Transactions en attente sous contrôle" },
            { ok: (stats?.cartesBloquees   || 0) === 0, msg: stats?.cartesBloquees    ? `${stats.cartesBloquees} carte(s) bloquée(s)`                      : "Aucune carte bloquée" },
          ].map((r, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
              <span style={{ fontSize: 16 }}>{r.ok ? "✅" : "⚠️"}</span>
              <span style={{ fontSize: 13, color: r.ok ? "#16a34a" : "#d97706", fontWeight: 600 }}>{r.msg}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}