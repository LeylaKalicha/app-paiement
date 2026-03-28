import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Line } from "react-chartjs-2";
import api from "../../services/api";
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, Tooltip, Filler,
} from "chart.js";
import {
  FiRepeat, FiCreditCard, FiSend, FiUsers,
  FiUser, FiLogOut, FiSearch,
  FiHome, FiGift, FiBell,
} from "react-icons/fi";

// ── Imports des pages ──
import EnvoyerArgent      from "./EnvoyerArgent";
import MesTransactions    from "./MesTransactions";
import MesCartes          from "./MesCartes";
import InviterAmis        from "./InviterAmis";
import MesNotifications   from "./MesNotifications";
import ProfilUtilisateur  from "./ProfilUtilisateur";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

export default function Dashboard() {
  const navigate                = useNavigate();
  const [dashData,  setDashData]  = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [devise,    setDevise]    = useState("XAF");
  const [page,      setPage]      = useState("dashboard");
  const [nbNotifs,  setNbNotifs]  = useState(0);
  const [showConfirm, setShowConfirm] = useState(false); // ← modal déconnexion

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) { navigate("/login"); return; }
        const res = await api.get("/dashboard", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setDashData(res.data);
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  // Badge notifications
  useEffect(() => {
    const chargerNbNotifs = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await api.get("/notifications/mes-notifs", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setNbNotifs((res.data.data || []).length);
      } catch { }
    };
    chargerNbNotifs();
  }, []);

  // ── Déconnexion réelle (appelée après confirmation) ──
  const deconnecter = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const menuPrincipal = [
    { id: "dashboard",    icon: <FiHome size={14}/>,       label: "Tableau de bord" },
    { id: "transactions", icon: <FiRepeat size={14}/>,     label: "Transactions" },
    { id: "envoyer",      icon: <FiSend size={14}/>,       label: "Envoyer de l'argent" },
    { id: "cartes",       icon: <FiCreditCard size={14}/>, label: "Carte virtuelle" },
  ];
  const menuAutres = [
    { id: "notifications", icon: <FiBell size={14}/>,  label: "Notifications", badge: nbNotifs },
    { id: "inviter",       icon: <FiGift size={14}/>,  label: "Inviter & Gagner" },
    { id: "profil",        icon: <FiUser size={14}/>,  label: "Mon profil" },
  ];

  const renderPage = () => {
    switch (page) {
      case "envoyer":       return <EnvoyerArgent      retour={() => setPage("dashboard")} dashData={dashData} />;
      case "transactions":  return <MesTransactions    retour={() => setPage("dashboard")} dashData={dashData} />;
      case "cartes":        return <MesCartes          retour={() => setPage("dashboard")} dashData={dashData} />;
      case "inviter":       return <InviterAmis        retour={() => setPage("dashboard")} dashData={dashData} />;
      case "notifications": return <MesNotifications   retour={() => setPage("dashboard")} />;
      case "profil":        return <ProfilUtilisateur  retour={() => setPage("dashboard")} dashData={dashData} />;
      default:              return <ContenuDashboard   dashData={dashData} devise={devise} setDevise={setDevise} allerVers={setPage} />;
    }
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
      <p style={{ fontWeight: 600, color: "#64748b" }}>Chargement...</p>
    </div>
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif", background: "#f8fafc" }}>

      {/* ── SIDEBAR ── */}
      <aside style={{ width: 210, background: "#2e1065", flexShrink: 0, display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh" }}>

        {/* Logo */}
        <div style={{ padding: "22px 18px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, background: "#a78bfa", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 900, fontSize: 13 }}>P</div>
            <span style={{ color: "#fff", fontWeight: 800, fontSize: 15 }}>PayVirtual</span>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: "14px 8px", overflowY: "auto" }}>
          <p style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", padding: "0 10px", marginBottom: 6 }}>Menu</p>
          {menuPrincipal.map(item => {
            const actif = page === item.id;
            return (
              <div key={item.id} onClick={() => setPage(item.id)} style={{
                display: "flex", alignItems: "center", gap: 9, padding: "8px 10px",
                borderRadius: 7, marginBottom: 1, cursor: "pointer",
                background: actif ? "#7c3aed" : "transparent",
                color: actif ? "#fff" : "rgba(255,255,255,0.5)",
                fontSize: 12, fontWeight: actif ? 600 : 400, transition: "all 0.12s"
              }}
                onMouseEnter={e => { if (!actif) { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "#fff"; } }}
                onMouseLeave={e => { if (!actif) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.5)"; } }}
              >
                {item.icon} {item.label}
              </div>
            );
          })}

          <p style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", padding: "14px 10px 6px" }}>Autres</p>
          {menuAutres.map(item => {
            const actif = page === item.id;
            return (
              <div key={item.id} onClick={() => setPage(item.id)} style={{
                display: "flex", alignItems: "center", gap: 9, padding: "8px 10px",
                borderRadius: 7, marginBottom: 1, cursor: "pointer",
                background: actif ? "#7c3aed" : "transparent",
                color: actif ? "#fff" : "rgba(255,255,255,0.5)",
                fontSize: 12, fontWeight: actif ? 600 : 400, transition: "all 0.12s",
                justifyContent: "space-between"
              }}
                onMouseEnter={e => { if (!actif) { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "#fff"; } }}
                onMouseLeave={e => { if (!actif) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.5)"; } }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 9 }}>{item.icon} {item.label}</span>
                {item.badge > 0 && (
                  <span style={{ background: "#ef4444", color: "#fff", fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 20, minWidth: 16, textAlign: "center" }}>
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </div>
            );
          })}
        </nav>

        {/* ── Bouton Déconnexion → ouvre le modal ── */}
        <div style={{ padding: "12px 8px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <button
            onClick={() => setShowConfirm(true)}
            style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 10px", borderRadius: 7, width: "100%", background: "none", border: "none", color: "rgba(255,255,255,0.5)", fontSize: 12, cursor: "pointer", transition: "all 0.12s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.12)"; e.currentTarget.style.color = "#fca5a5"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.5)"; }}
          >
            <FiLogOut size={14} /> Déconnexion
          </button>
        </div>
      </aside>

      {/* ── CONTENU ── */}
      <main style={{ flex: 1, padding: "28px 30px", overflowY: "auto" }}>
        {renderPage()}
      </main>

      {/* ── MODAL DE CONFIRMATION DÉCONNEXION ── */}
      {showConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#ffffff", borderRadius: 14, padding: 28, width: 340, boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", color: "#ef4444" }}>
                <FiLogOut size={18} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>Se déconnecter</div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Cette action fermera votre session</div>
              </div>
            </div>
            <p style={{ fontSize: 13, color: "#64748b", marginBottom: 20, lineHeight: 1.6 }}>
              Êtes-vous sûr de vouloir vous déconnecter de PayVirtual ?
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setShowConfirm(false)}
                style={{ flex: 1, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "9px 0", fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#64748b" }}
              >
                Annuler
              </button>
              <button
                onClick={deconnecter}
                style={{ flex: 1, background: "#ef4444", color: "#fff", border: "none", borderRadius: 8, padding: "9px 0", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
              >
                Se déconnecter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  CONTENU PRINCIPAL DU DASHBOARD
// ═══════════════════════════════════════════════════════════════
function ContenuDashboard({ dashData, devise, setDevise, allerVers }) {
  const solde    = Number(dashData?.solde    || 0);
  const revenus  = Number(dashData?.revenus  || 0);
  const depenses = Number(dashData?.depenses || 0);
  const epargne  = Number(dashData?.epargne  || 0);
  const nom      = dashData?.user?.nom || "Utilisateur";

  const weeklyChart = {
    labels: ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"],
    datasets: [{
      data: [40, 55, 45, 62, 50, 30, 20],
      borderColor: "#7c3aed",
      backgroundColor: "rgba(124,58,237,0.07)",
      tension: 0.45, fill: true,
      pointBackgroundColor: "#7c3aed",
      pointRadius: 4, pointHoverRadius: 6,
    }]
  };
  const chartOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 }, color: "#94a3b8" } },
      y: { grid: { color: "#f1f5f9" }, ticks: { font: { size: 11 }, color: "#94a3b8" }, beginAtZero: true }
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 22 }}>
        <div>
          <p style={{ fontSize: 11, color: "#94a3b8", marginBottom: 6 }}>Accueil › Tableau de bord</p>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", margin: 0 }}>
            Bienvenue, <span style={{ color: "#7c3aed", fontStyle: "italic" }}>{nom} !</span>
          </h1>
          <p style={{ fontSize: 12, color: "#64748b", marginTop: 5 }}>
            Voici votre aperçu financier du {new Date().toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" })}.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 20, padding: "7px 14px" }}>
          <FiSearch size={13} color="#94a3b8" />
          <input placeholder="Rechercher..." style={{ border: "none", background: "transparent", fontSize: 12, outline: "none", color: "#0f172a", width: 120 }} />
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: "flex", gap: 36, marginBottom: 26 }}>
        {[
          { icon: <FiSend size={18} color="#64748b"/>,       label: "Envoyer",       id: "envoyer" },
          { icon: <FiRepeat size={18} color="#64748b"/>,     label: "Transactions",  id: "transactions" },
          { icon: <FiCreditCard size={18} color="#64748b"/>, label: "Mes cartes",    id: "cartes" },
          { icon: <FiBell size={18} color="#64748b"/>,       label: "Notifications", id: "notifications" },
          { icon: <FiUsers size={18} color="#64748b"/>,      label: "Inviter",       id: "inviter" },
        ].map(a => (
          <div key={a.id} onClick={() => allerVers(a.id)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 7, cursor: "pointer" }}>
            <div style={{ width: 50, height: 50, borderRadius: "50%", background: "#fff", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.05)", transition: "all 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#7c3aed"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.1)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.05)"; }}
            >{a.icon}</div>
            <span style={{ fontSize: 11, color: "#64748b", fontWeight: 500 }}>{a.label}</span>
          </div>
        ))}
      </div>

      {/* Balance + Graphique */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 18, marginBottom: 18 }}>
        <div style={{ background: "#fff", borderRadius: 14, padding: "22px 24px", border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <p style={{ fontSize: 12, color: "#64748b", fontWeight: 500, marginBottom: 12 }}>Solde du compte</p>
          <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
            {["USD", "XAF"].map(d => (
              <button key={d} onClick={() => setDevise(d)} style={{ padding: "3px 12px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 700, background: devise === d ? "#7c3aed" : "#f1f5f9", color: devise === d ? "#fff" : "#64748b", transition: "all 0.15s" }}>{d}</button>
            ))}
          </div>
          <p style={{ fontSize: 34, fontWeight: 900, color: "#0f172a", margin: "0 0 20px" }}>
            {solde.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} {devise}
          </p>
          <div style={{ display: "flex", gap: 20 }}>
            <div>
              <p style={{ fontSize: 10, color: "#94a3b8", marginBottom: 3 }}>Revenus totaux</p>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#16a34a", margin: 0 }}>{revenus.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} XAF</p>
            </div>
            <div>
              <p style={{ fontSize: 10, color: "#94a3b8", marginBottom: 3 }}>Dépenses totales</p>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#dc2626", margin: 0 }}>{depenses.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} XAF</p>
            </div>
            <div>
              <p style={{ fontSize: 10, color: "#94a3b8", marginBottom: 3 }}>Épargne</p>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#7c3aed", margin: 0 }}>{epargne.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} XAF</p>
            </div>
          </div>
        </div>

        <div style={{ background: "#fff", borderRadius: 14, padding: "22px 24px", border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", margin: "0 0 4px" }}>Dépenses hebdomadaires</p>
          <p style={{ fontSize: 11, color: "#64748b", marginBottom: 14 }}>Vous avez dépensé <strong style={{ color: "#7c3aed" }}>320 XAF</strong> cette semaine</p>
          <Line data={weeklyChart} options={chartOptions} height={85} />
        </div>
      </div>

      {/* Cartes virtuelles */}
      <div style={{ background: "#fff", borderRadius: 14, padding: "20px 24px", border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", margin: 0 }}>Vos cartes virtuelles</p>
          <button onClick={() => allerVers("cartes")} style={{ fontSize: 11, color: "#7c3aed", fontWeight: 700, border: "1px solid #ddd6fe", padding: "5px 12px", borderRadius: 20, background: "#faf5ff", cursor: "pointer" }}>+ Ajouter une carte</button>
        </div>
        {dashData?.cartesActives > 0 ? (
          <div style={{ width: 190, height: 110, borderRadius: 12, background: "linear-gradient(135deg,#7c3aed,#a78bfa)", padding: "14px 16px", color: "#fff" }}>
            <p style={{ fontSize: 9, opacity: 0.7, margin: "0 0 16px" }}>Carte Virtuelle</p>
            <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, margin: "0 0 10px" }}>•••• •••• •••• 4242</p>
            <p style={{ fontSize: 9, opacity: 0.7, margin: 0 }}>Expire 12/27</p>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "16px 0", color: "#94a3b8" }}>
            <FiCreditCard size={26} style={{ marginBottom: 8, opacity: 0.3 }} />
            <p style={{ fontSize: 12, margin: 0 }}>Aucune carte. <span onClick={() => allerVers("cartes")} style={{ color: "#7c3aed", fontWeight: 600, cursor: "pointer" }}>Créer une carte →</span></p>
          </div>
        )}
      </div>

      {/* Activité récente */}
      <div style={{ background: "#fff", borderRadius: 14, padding: "20px 24px", border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", margin: 0 }}>Activité récente</p>
          <button onClick={() => allerVers("transactions")} style={{ fontSize: 11, color: "#7c3aed", fontWeight: 700, border: "1px solid #ddd6fe", padding: "5px 14px", borderRadius: 20, background: "#faf5ff", cursor: "pointer" }}>Voir tout</button>
        </div>
        {dashData?.transactionsRecentes?.length > 0 ? (
          dashData.transactionsRecentes.map((tx, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < dashData.transactionsRecentes.length - 1 ? "1px solid #f1f5f9" : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#f5f3ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#7c3aed" }}><FiRepeat size={14} /></div>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: "#0f172a", margin: 0 }}>Transaction #{tx.id}</p>
                  <p style={{ fontSize: 10, color: "#94a3b8", margin: 0 }}>{tx.dateTransaction?.split("T")[0]}</p>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: tx.montant > 0 ? "#16a34a" : "#dc2626", margin: 0 }}>{tx.montant > 0 ? "+" : ""}{Number(tx.montant).toLocaleString("fr-FR")} XAF</p>
                <p style={{ fontSize: 10, color: "#94a3b8", margin: 0 }}>{tx.statut}</p>
              </div>
            </div>
          ))
        ) : (
          <div style={{ textAlign: "center", padding: "20px 0", color: "#94a3b8" }}>
            <FiRepeat size={26} style={{ marginBottom: 8, opacity: 0.3 }} />
            <p style={{ fontSize: 12, margin: 0 }}>Aucune transaction récente</p>
          </div>
        )}
      </div>
    </div>
  );
}