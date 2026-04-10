import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Line } from "react-chartjs-2";
import api from "../../services/api";
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, Tooltip, Filler,
} from "chart.js";
import {
  FiRepeat, FiCreditCard, FiSend, FiLogOut,
  FiHome, FiBell, FiSettings,
  FiEye, FiEyeOff, FiArrowUpRight, FiArrowDownLeft,
  FiPlus, FiCheckCircle, FiX,
  FiAlertCircle, FiDollarSign, FiSmartphone, FiLoader,
} from "react-icons/fi";
import { MdOutlineAccountBalanceWallet } from "react-icons/md";

import EnvoyerArgent     from "./EnvoyerArgent";
import MesTransactions   from "./MesTransactions";
import MesNotifications  from "./MesNotifications";
import ProfilUtilisateur from "./ProfilUtilisateur";
import PageCartes        from "./PageCartes";
import PageParametres    from "./Pageparametres";
import RetirerArgent     from "./Retirerargent";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

const C = {
  primary: "#6d28d9", primary2: "#7c3aed", primary3: "#8b5cf6",
  dark: "#2e1065", bg: "#f5f3ff", border: "#ede9fe",
  text: "#1e1b4b", muted: "#6b7280", green: "#16a34a", red: "#dc2626",
};

// ═══════════════════════════════════════════════════════════════
//  MODAL DÉPÔT UNIQUEMENT (Mobile Money)
// ═══════════════════════════════════════════════════════════════
function ModalDepot({ onClose, onSuccess }) {
  const [etape, setEtape]       = useState("choix");
  const [gateway, setGateway]   = useState(null);
  const [montant, setMontant]   = useState("");
  const [telephone, setTelephone] = useState("");
  const [reference, setReference] = useState(null);
  const [ussdCode, setUssdCode] = useState(null);
  const [erreur, setErreur]     = useState("");
  const [loading, setLoading]   = useState(false);

  const MONTANT_MIN = 25;

  const gateways = [
    { id: "mtn",    label: "MTN Mobile Money",  couleur: "#FFCC00", textCouleur: "#1a1a1a", logo: "📱", prefixe: "67, 68, 650-659" },
    { id: "orange", label: "Orange Money",       couleur: "#FF6600", textCouleur: "#fff",    logo: "📲", prefixe: "69, 655-659" },
  ];
  const gw = gateways.find(g => g.id === gateway);

  const valider = async () => {
    setErreur("");
    if (!montant || Number(montant) < MONTANT_MIN) {
      setErreur(`Montant minimum : ${MONTANT_MIN} XAF`); return;
    }
    if (!telephone || telephone.replace(/\D/g, "").length < 9) {
      setErreur("Numéro de téléphone invalide (9 chiffres)"); return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await api.post(
        "/transactions/topup",
        { montant: Number(montant), telephone: `237${telephone.replace(/\D/g, "")}` },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReference(res.data.reference);
      setUssdCode(res.data.ussd_code || null);
      setEtape("attente");
      demarrerPolling(res.data.reference);
    } catch (e) {
      setErreur(e.response?.data?.message || "Erreur lors de la demande.");
    } finally { setLoading(false); }
  };

  const demarrerPolling = (ref) => {
    let tentatives = 0;
    const interval = setInterval(async () => {
      tentatives++;
      try {
        const token = localStorage.getItem("token");
        const res = await api.get(`/transactions/campay/verifier/${ref}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const statut = res.data?.status || res.data?.statut;
        if (statut === "SUCCESSFUL" || statut === "VALIDEE") {
          clearInterval(interval);
          setEtape("succes");
          if (onSuccess) onSuccess(Number(montant));
        } else if (statut === "FAILED" || statut === "ANNULEE") {
          clearInterval(interval);
          setEtape("erreur");
          setErreur("Le paiement a échoué ou a été annulé.");
        }
      } catch {}
      if (tentatives >= 20) {
        clearInterval(interval);
        setEtape("erreur");
        setErreur("Délai dépassé. Vérifiez votre téléphone et réessayez.");
      }
    }, 6000);
  };

  const montantsRapides = [500, 1000, 2000, 5000, 10000, 25000];

  const sousTitre = {
    choix:   "Choisissez votre méthode",
    montant: `Via ${gw?.label}`,
    attente: "En attente de confirmation",
    succes:  "Dépôt réussi !",
    erreur:  "Échec de la transaction",
  }[etape];

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:16 }}>
      <div style={{ background:"#fff", borderRadius:20, width:"100%", maxWidth:460, boxShadow:"0 32px 80px rgba(0,0,0,0.22)", overflow:"hidden" }}>
        {/* En-tête */}
        <div style={{ background:`linear-gradient(135deg,${C.dark},${C.primary2})`, padding:"20px 24px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:"rgba(255,255,255,0.15)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <MdOutlineAccountBalanceWallet size={18} color="#fff"/>
            </div>
            <div>
              <div style={{ color:"#fff", fontWeight:700, fontSize:15 }}>Ajouter un compte de paiement</div>
              <div style={{ color:"rgba(255,255,255,0.6)", fontSize:11 }}>{sousTitre}</div>
            </div>
          </div>
          {(etape === "choix" || etape === "succes" || etape === "erreur") && (
            <button onClick={onClose} style={{ background:"rgba(255,255,255,0.12)", border:"none", borderRadius:8, width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"#fff" }}>
              <FiX size={16}/>
            </button>
          )}
        </div>

        <div style={{ padding:24 }}>

          {/* ── CHOIX GATEWAY ── */}
          {etape === "choix" && (
            <div>
              <p style={{ fontSize:13, color:C.muted, margin:"0 0 16px" }}>
                Sélectionnez le mode de paiement pour recharger votre portefeuille
              </p>
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {gateways.map(g => (
                  <button key={g.id} onClick={() => { setGateway(g.id); setEtape("montant"); }}
                    style={{ display:"flex", alignItems:"center", gap:14, padding:"16px 18px", borderRadius:14, border:`2px solid ${C.border}`, background:"#fafafa", cursor:"pointer", transition:"all 0.15s", textAlign:"left" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor=C.primary2; e.currentTarget.style.background="#f5f3ff"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor=C.border; e.currentTarget.style.background="#fafafa"; }}>
                    <div style={{ width:44, height:44, borderRadius:12, background:g.couleur, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>{g.logo}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:700, fontSize:14, color:C.text }}>{g.label}</div>
                      <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>Cameroun · Numéros {g.prefixe}</div>
                    </div>
                    <div style={{ color:C.primary3, fontSize:18 }}>›</div>
                  </button>
                ))}
              </div>
              <div style={{ marginTop:16, padding:"12px 14px", background:"#f0fdf4", borderRadius:10, border:"1px solid #bbf7d0", display:"flex", alignItems:"flex-start", gap:8 }}>
                <FiCheckCircle size={14} color="#16a34a" style={{ marginTop:1, flexShrink:0 }}/>
                <p style={{ fontSize:11, color:"#15803d", margin:0, lineHeight:1.5 }}>Crédité immédiatement après confirmation. Frais : 0 XAF.</p>
              </div>
            </div>
          )}

          {/* ── SAISIE MONTANT ── */}
          {etape === "montant" && gw && (
            <div>
              <button onClick={() => setEtape("choix")} style={{ background:"none", border:"none", color:C.primary2, fontSize:12, fontWeight:600, cursor:"pointer", padding:"0 0 14px", display:"flex", alignItems:"center", gap:4 }}>
                ← Changer de méthode
              </button>
              <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", background:"#f5f3ff", borderRadius:10, border:`1px solid ${C.border}`, marginBottom:20 }}>
                <div style={{ width:32, height:32, borderRadius:8, background:gw.couleur, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>{gw.logo}</div>
                <span style={{ fontWeight:600, fontSize:13, color:C.text }}>{gw.label}</span>
              </div>

              <div style={{ marginBottom:16 }}>
                <label style={{ fontSize:12, fontWeight:600, color:C.text, display:"block", marginBottom:6 }}>
                  Numéro de téléphone <span style={{ color:C.red }}>*</span>
                </label>
                <div style={{ display:"flex", gap:8 }}>
                  <div style={{ padding:"10px 12px", background:"#f8fafc", border:`1px solid ${C.border}`, borderRadius:10, fontSize:13, fontWeight:600, color:C.muted, whiteSpace:"nowrap" }}>🇨🇲 +237</div>
                  <input value={telephone} onChange={e => setTelephone(e.target.value.replace(/\D/g,"").slice(0,9))} placeholder="6XXXXXXXX"
                    style={{ flex:1, padding:"10px 14px", border:`1px solid ${C.border}`, borderRadius:10, fontSize:13, color:C.text, outline:"none", fontFamily:"inherit" }}/>
                </div>
              </div>

              <div style={{ marginBottom:14 }}>
                <label style={{ fontSize:12, fontWeight:600, color:C.text, display:"block", marginBottom:6 }}>
                  Montant (XAF) <span style={{ color:C.red }}>*</span>
                </label>
                <input type="number" value={montant} onChange={e => setMontant(e.target.value)} placeholder="Ex: 5000" min={MONTANT_MIN}
                  style={{ width:"100%", padding:"11px 14px", border:`1px solid ${C.border}`, borderRadius:10, fontSize:15, fontWeight:700, color:C.text, outline:"none", fontFamily:"inherit", boxSizing:"border-box" }}/>
                <p style={{ fontSize:10, color:C.muted, margin:"4px 0 0" }}>Minimum : {MONTANT_MIN} XAF</p>
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:18 }}>
                {montantsRapides.map(m => (
                  <button key={m} onClick={() => setMontant(String(m))} style={{ padding:"8px 0", borderRadius:8, fontSize:12, fontWeight:600, border:`1px solid ${montant==m?C.primary2:C.border}`, background:montant==m?"#f5f3ff":"#fff", color:montant==m?C.primary2:C.muted, cursor:"pointer" }}>
                    {m.toLocaleString("fr-FR")}
                  </button>
                ))}
              </div>

              {erreur && (
                <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 12px", background:"#fef2f2", borderRadius:10, marginBottom:14 }}>
                  <FiAlertCircle size={14} color={C.red}/>
                  <span style={{ fontSize:12, color:C.red }}>{erreur}</span>
                </div>
              )}

              {montant && Number(montant) >= MONTANT_MIN && (
                <div style={{ padding:"12px 14px", background:"#f5f3ff", borderRadius:10, marginBottom:16, border:`1px solid ${C.border}` }}>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:C.muted, marginBottom:4 }}>
                    <span>Montant</span><span style={{ fontWeight:700, color:C.text }}>{Number(montant).toLocaleString("fr-FR")} XAF</span>
                  </div>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:C.muted, marginBottom:4 }}>
                    <span>Frais</span><span style={{ fontWeight:600, color:"#16a34a" }}>0 XAF</span>
                  </div>
                  <div style={{ height:1, background:C.border, margin:"8px 0" }}/>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, fontWeight:700 }}>
                    <span style={{ color:C.text }}>Total crédité</span>
                    <span style={{ color:C.primary2 }}>{Number(montant).toLocaleString("fr-FR")} XAF</span>
                  </div>
                </div>
              )}

              <button onClick={valider} disabled={loading} style={{ width:"100%", padding:"13px 0", background:loading?"#c4b5fd":`linear-gradient(135deg,${C.dark},${C.primary2})`, color:"#fff", border:"none", borderRadius:12, fontSize:14, fontWeight:700, cursor:loading?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                {loading
                  ? <><span style={{ display:"inline-block", animation:"spin 1s linear infinite" }}>⟳</span> En cours...</>
                  : <><FiSmartphone size={14}/> Confirmer via téléphone</>}
              </button>
              <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
            </div>
          )}

          {/* ── ATTENTE ── */}
          {etape === "attente" && (
            <div style={{ textAlign:"center", padding:"10px 0" }}>
              <div style={{ width:72, height:72, borderRadius:"50%", background:"linear-gradient(135deg,#fef3c7,#fde68a)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px", fontSize:32, animation:"pulse 2s ease-in-out infinite" }}>📱</div>
              <style>{`@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}`}</style>
              <h3 style={{ fontSize:16, fontWeight:700, color:C.text, margin:"0 0 8px" }}>Confirmez sur votre téléphone</h3>
              <p style={{ fontSize:13, color:C.muted, margin:"0 0 16px", lineHeight:1.6 }}>
                Demande envoyée au <strong>+237 {telephone}</strong>.<br/>
                Confirmez le paiement de <strong>{Number(montant).toLocaleString("fr-FR")} XAF</strong>.
              </p>
              {ussdCode && (
                <div style={{ padding:"12px 14px", background:"#f5f3ff", borderRadius:10, marginBottom:16, border:`1px solid ${C.border}` }}>
                  <p style={{ fontSize:11, color:C.muted, margin:"0 0 4px" }}>Ou composez le code USSD :</p>
                  <p style={{ fontSize:18, fontWeight:900, color:C.primary2, margin:0, letterSpacing:1 }}>{ussdCode}</p>
                </div>
              )}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, color:C.muted, fontSize:12 }}>
                <div style={{ width:8, height:8, borderRadius:"50%", background:"#f59e0b", animation:"blink 1s infinite" }}/>
                <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
                Vérification en cours...
              </div>
            </div>
          )}

          {/* ── SUCCÈS ── */}
          {etape === "succes" && (
            <div style={{ textAlign:"center", padding:"10px 0" }}>
              <div style={{ width:72, height:72, borderRadius:"50%", background:"#f0fdf4", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
                <FiCheckCircle size={36} color="#16a34a"/>
              </div>
              <h3 style={{ fontSize:16, fontWeight:700, color:C.text, margin:"0 0 8px" }}>Dépôt réussi !</h3>
              <p style={{ fontSize:13, color:C.muted, margin:"0 0 6px", lineHeight:1.6 }}>
                <strong style={{ color:C.green }}>{Number(montant).toLocaleString("fr-FR")} XAF</strong> ont été crédités sur votre portefeuille.
              </p>
              <button onClick={onClose} style={{ width:"100%", padding:"13px 0", background:`linear-gradient(135deg,#15803d,#16a34a)`, color:"#fff", border:"none", borderRadius:12, fontSize:14, fontWeight:700, cursor:"pointer", marginTop:16 }}>
                Voir mon solde
              </button>
            </div>
          )}

          {/* ── ERREUR ── */}
          {etape === "erreur" && (
            <div style={{ textAlign:"center", padding:"10px 0" }}>
              <div style={{ width:72, height:72, borderRadius:"50%", background:"#fef2f2", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
                <FiAlertCircle size={36} color={C.red}/>
              </div>
              <h3 style={{ fontSize:16, fontWeight:700, color:C.text, margin:"0 0 8px" }}>Échec</h3>
              <p style={{ fontSize:13, color:C.muted, margin:"0 0 20px", lineHeight:1.6 }}>{erreur}</p>
              <div style={{ display:"flex", gap:10 }}>
                <button onClick={onClose} style={{ flex:1, padding:"11px 0", background:"#f8fafc", border:`1px solid ${C.border}`, borderRadius:10, fontSize:13, fontWeight:600, cursor:"pointer", color:C.muted }}>Fermer</button>
                <button onClick={() => { setEtape("montant"); setErreur(""); }} style={{ flex:1, padding:"11px 0", background:C.primary2, border:"none", borderRadius:10, fontSize:13, fontWeight:700, cursor:"pointer", color:"#fff" }}>Réessayer</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  DASHBOARD PRINCIPAL
// ═══════════════════════════════════════════════════════════════
export default function Dashboard() {
  const navigate = useNavigate();
  const [dashData,       setDashData]       = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [page,           setPage]           = useState("dashboard");
  const [nbNotifs,       setNbNotifs]       = useState(0);
  const [showConfirm,    setShowConfirm]    = useState(false);
  // ── Solde masqué par défaut — l'utilisateur démasque manuellement ──
  const [showBalance,    setShowBalance]    = useState(false);
  const [modalDepot,     setModalDepot]     = useState(false);
  const [welcomeVisible, setWelcomeVisible] = useState(true);

  const chargerDashboard = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) { navigate("/login"); return; }
      const res = await api.get("/dashboard", { headers: { Authorization: `Bearer ${token}` } });
      setDashData(res.data);
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/login");
    } finally { setLoading(false); }
  };

  useEffect(() => { chargerDashboard(); }, [navigate]);

  // Auto-masquer la bannière de bienvenue après 5s
  useEffect(() => {
    const t = setTimeout(() => setWelcomeVisible(false), 5000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const chargerNbNotifs = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await api.get("/notifications/mes-notifs", { headers: { Authorization: `Bearer ${token}` } });
        setNbNotifs((res.data.data || []).length);
      } catch {}
    };
    chargerNbNotifs();
  }, []);

  const deconnecter = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const apresDepot = () => {
    setModalDepot(false);
    chargerDashboard();
  };

  const apresRetrait = () => {
    setPage("dashboard");
    chargerDashboard();
  };

  const nom    = dashData?.user?.nom    || "Utilisateur";
  const prenom = dashData?.user?.prenom || "";
  const initiales = ((prenom?.[0] || "") + (nom?.[0] || "")).toUpperCase() || "U";
  const solde = Number(dashData?.solde || 0);

  const navItems = [
    { id:"dashboard",     icon:<FiHome size={16}/>,       label:"Maison" },
    { id:"cartes",        icon:<FiCreditCard size={16}/>, label:"Cartes" },
    { id:"envoyer",       icon:<FiSend size={16}/>,       label:"Transfert" },
    { id:"transactions",  icon:<FiRepeat size={16}/>,     label:"Transactions" },
    { id:"notifications", icon:<FiBell size={16}/>,       label:"Notifications", badge:nbNotifs },
    { id:"parametres",    icon:<FiSettings size={16}/>,   label:"Paramètres" },
  ];

  const renderPage = () => {
    switch (page) {
      case "envoyer":
        return <EnvoyerArgent retour={() => setPage("dashboard")} dashData={dashData}/>;
      case "transactions":
        return <MesTransactions retour={() => setPage("dashboard")} dashData={dashData}/>;
      case "cartes":
        return <PageCartes dashData={dashData} ouvrirDepot={() => setModalDepot(true)}/>;
      case "notifications":
        return <MesNotifications retour={() => setPage("dashboard")}/>;
      case "profil":
        return <ProfilUtilisateur retour={() => setPage("dashboard")} dashData={dashData}/>;
      case "parametres":
        return <PageParametres dashData={dashData}/>;
      // ── PAGE RETRAIT → composant complet RetirerArgent ──
      case "retirer":
        return (
          <RetirerArgent
            retour={() => setPage("dashboard")}
            dashData={dashData}
            onRetraitReussi={apresRetrait}
          />
        );
      default:
        return (
          <ContenuDashboard
            dashData={dashData}
            allerVers={setPage}
            showBalance={showBalance}
            setShowBalance={setShowBalance}
            ouvrirDepot={() => setModalDepot(true)}
            ouvrirRetrait={() => setPage("retirer")}
            welcomeVisible={welcomeVisible}
            setWelcomeVisible={setWelcomeVisible}
          />
        );
    }
  };

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", background:C.bg }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ width:48, height:48, borderRadius:12, background:`linear-gradient(135deg,${C.primary},${C.primary3})`, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:900, fontSize:20, margin:"0 auto 16px" }}>P</div>
        <p style={{ color:C.muted, fontWeight:600 }}>Chargement...</p>
      </div>
    </div>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", minHeight:"100vh", fontFamily:"'Segoe UI',system-ui,sans-serif", background:C.bg }}>

      {/* ══ TOP NAVBAR ══ */}
      <header style={{ background:C.dark, position:"sticky", top:0, zIndex:100, boxShadow:"0 2px 12px rgba(0,0,0,0.2)" }}>
        <div style={{ display:"flex", alignItems:"center", padding:"0 28px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, padding:"14px 0", marginRight:32 }}>
            <div style={{ width:30, height:30, background:"linear-gradient(135deg,#a78bfa,#7c3aed)", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:900, fontSize:14 }}>P</div>
            <span style={{ color:"#fff", fontWeight:800, fontSize:16, letterSpacing:"-0.3px" }}>PayVirtual</span>
          </div>
          <div style={{ flex:1 }}/>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ position:"relative" }}>
              <button onClick={() => setPage("notifications")} style={{ background:"none", border:"none", cursor:"pointer", color:"rgba(255,255,255,0.7)", padding:6 }}>
                <FiBell size={18}/>
              </button>
              {nbNotifs > 0 && <span style={{ position:"absolute", top:2, right:2, width:8, height:8, background:"#ef4444", borderRadius:"50%" }}/>}
            </div>
            <div onClick={() => setPage("parametres")} style={{ width:34, height:34, borderRadius:"50%", background:"linear-gradient(135deg,#a78bfa,#6d28d9)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer", border:"2px solid rgba(255,255,255,0.2)" }}>
              {initiales}
            </div>
          </div>
        </div>

        <nav style={{ display:"flex", alignItems:"center", padding:"0 28px", gap:4 }}>
          {navItems.map(item => {
            const actif = page === item.id;
            return (
              <button key={item.id} onClick={() => setPage(item.id)} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4, padding:"10px 18px", background:"none", border:"none", cursor:"pointer", color:actif?"#fff":"rgba(255,255,255,0.5)", borderBottom:actif?"2px solid #a78bfa":"2px solid transparent", transition:"all 0.12s", position:"relative" }}>
                {item.icon}
                <span style={{ fontSize:11, fontWeight:actif?700:500 }}>{item.label}</span>
                {item.badge > 0 && (
                  <span style={{ position:"absolute", top:6, right:10, background:"#ef4444", color:"#fff", fontSize:9, fontWeight:800, padding:"1px 5px", borderRadius:20, minWidth:14, textAlign:"center" }}>
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </button>
            );
          })}
          <div style={{ flex:1 }}/>
          <button onClick={() => setShowConfirm(true)} style={{ display:"flex", alignItems:"center", gap:6, background:"none", border:"none", color:"rgba(255,255,255,0.4)", fontSize:12, cursor:"pointer", padding:"8px 12px", borderRadius:7 }}
            onMouseEnter={e => { e.currentTarget.style.color="#fca5a5"; e.currentTarget.style.background="rgba(239,68,68,0.1)"; }}
            onMouseLeave={e => { e.currentTarget.style.color="rgba(255,255,255,0.4)"; e.currentTarget.style.background="none"; }}>
            <FiLogOut size={14}/> Déconnexion
          </button>
        </nav>
      </header>

      <main style={{ flex:1, padding:"28px 32px", maxWidth:1200, width:"100%", margin:"0 auto", boxSizing:"border-box" }}>
        {renderPage()}
      </main>

      {/* ══ MODAL DÉCONNEXION ══ */}
      {showConfirm && (
        <div style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.55)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 }}>
          <div style={{ background:"#fff", borderRadius:16, padding:28, width:340, boxShadow:"0 24px 64px rgba(0,0,0,0.18)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
              <div style={{ width:42, height:42, borderRadius:11, background:"#fef2f2", display:"flex", alignItems:"center", justifyContent:"center", color:"#ef4444" }}><FiLogOut size={18}/></div>
              <div>
                <div style={{ fontWeight:700, fontSize:15, color:C.text }}>Se déconnecter</div>
                <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>Cette action fermera votre session</div>
              </div>
            </div>
            <p style={{ fontSize:13, color:C.muted, marginBottom:20, lineHeight:1.6 }}>Êtes-vous sûr de vouloir vous déconnecter de PayVirtual ?</p>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => setShowConfirm(false)} style={{ flex:1, background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:8, padding:"9px 0", fontSize:13, fontWeight:600, cursor:"pointer", color:C.muted }}>Annuler</button>
              <button onClick={deconnecter} style={{ flex:1, background:"#ef4444", color:"#fff", border:"none", borderRadius:8, padding:"9px 0", fontSize:13, fontWeight:700, cursor:"pointer" }}>Se déconnecter</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL DÉPÔT UNIQUEMENT ══ */}
      {modalDepot && (
        <ModalDepot
          onClose={() => setModalDepot(false)}
          onSuccess={apresDepot}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  PAGE ACCUEIL — MAISON
// ═══════════════════════════════════════════════════════════════
function ContenuDashboard({ dashData, allerVers, showBalance, setShowBalance, ouvrirDepot, ouvrirRetrait, welcomeVisible, setWelcomeVisible }) {
  const solde  = Number(dashData?.solde || 0);
  const nom    = dashData?.user?.nom    || "Utilisateur";
  const prenom = dashData?.user?.prenom || "";
  const txs    = dashData?.transactionsRecentes || [];

  const today = new Date();
  const labels = Array.from({ length:7 }, (_, i) => {
    const d = new Date(today); d.setDate(today.getDate() - (6 - i));
    return d.toLocaleDateString("fr-FR", { day:"2-digit", month:"short" });
  });
  const donneesGraphe = Array.from({ length:7 }, (_, i) => {
    const d = new Date(today); d.setDate(today.getDate() - (6 - i));
    const dateStr = d.toISOString().split("T")[0];
    const txJour = txs.filter(t => t.dateTransaction?.split("T")[0] === dateStr);
    return txJour.reduce((acc, t) => acc + Number(t.montant || 0), 0);
  });
  let cumulatif = solde;
  const soldeCumulatif = [...donneesGraphe].reverse().map(v => { cumulatif -= v; return cumulatif; }).reverse();

  const chartData = {
    labels,
    datasets: [{ data:soldeCumulatif.map(v => Math.max(0,v)), borderColor:"#7c3aed", backgroundColor:"rgba(124,58,237,0.08)", tension:0.45, fill:true, pointBackgroundColor:"#7c3aed", pointRadius:4, pointHoverRadius:6 }]
  };
  const chartOptions = {
    responsive:true,
    plugins:{ legend:{ display:false } },
    scales:{
      x:{ grid:{ display:false }, ticks:{ font:{ size:10 }, color:"#94a3b8" } },
      y:{ grid:{ color:"#f1f5f9" }, ticks:{ font:{ size:10 }, color:"#94a3b8" }, beginAtZero:true }
    }
  };

  const liensRapides = [
    { icon:<FiSend size={20}/>,       label:"Envoyer",       id:"envoyer",       couleur:"#ede9fe", iconColor:"#7c3aed" },
    { icon:<FiCreditCard size={20}/>, label:"Mes cartes",    id:"cartes",        couleur:"#dbeafe", iconColor:"#2563eb" },
    { icon:<FiRepeat size={20}/>,     label:"Transactions",  id:"transactions",  couleur:"#fce7f3", iconColor:"#db2777" },
    { icon:<FiBell size={20}/>,       label:"Notifications", id:"notifications", couleur:"#fef3c7", iconColor:"#d97706" },
    { icon:<FiSettings size={20}/>,   label:"Paramètres",    id:"parametres",    couleur:"#f0fdf4", iconColor:"#16a34a" },
    { icon:<FiDollarSign size={20}/>, label:"Retirer",       id:"retirer",       couleur:"#fff1f2", iconColor:"#e11d48" },
  ];

  // Tous les liens passent simplement par allerVers
  const handleLienRapide = (id) => allerVers(id);

  const heure = new Date().getHours();
  const salutation = heure < 12 ? "Bonjour" : heure < 18 ? "Bon après-midi" : "Bonsoir";

  return (
    <div>
      {/* ══ BANNIÈRE BIENVENUE ══ */}
      {welcomeVisible && (
        <div style={{
          background:"linear-gradient(135deg,#2e1065,#7c3aed)",
          borderRadius:14, padding:"16px 22px", marginBottom:20,
          display:"flex", alignItems:"center", justifyContent:"space-between",
          boxShadow:"0 4px 20px rgba(124,58,237,0.25)",
          animation:"slideDown 0.4s ease",
        }}>
          <style>{`@keyframes slideDown{from{opacity:0;transform:translateY(-12px)}to{opacity:1;transform:translateY(0)}}`}</style>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <div style={{ width:44, height:44, borderRadius:12, background:"rgba(255,255,255,0.15)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>👋</div>
            <div>
              <p style={{ color:"#fff", fontWeight:800, fontSize:16, margin:0 }}>
                {salutation}, {prenom || nom} !
              </p>
              <p style={{ color:"rgba(255,255,255,0.7)", fontSize:12, margin:"2px 0 0" }}>
                Bienvenue sur PayVirtual · Appuyez sur l'icône œil pour voir votre solde
              </p>
            </div>
          </div>
          <button onClick={() => setWelcomeVisible(false)} style={{ background:"rgba(255,255,255,0.12)", border:"none", borderRadius:8, width:30, height:30, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"#fff" }}>
            <FiX size={14}/>
          </button>
        </div>
      )}

      {/* Grille principale */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1.4fr", gap:20, marginBottom:20 }}>

        {/* ── Carte Portefeuille ── */}
        <div style={{ background:`linear-gradient(145deg,#2e1065,#7c3aed)`, borderRadius:16, padding:"24px 22px", color:"#fff", position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:-20, right:-20, width:120, height:120, borderRadius:"50%", background:"rgba(255,255,255,0.05)" }}/>
          <div style={{ position:"absolute", bottom:-30, left:-10, width:100, height:100, borderRadius:"50%", background:"rgba(255,255,255,0.04)" }}/>

          {/* Label solde */}
          <div style={{ fontSize:10, opacity:0.6, letterSpacing:1.5, textTransform:"uppercase", marginBottom:6 }}>Solde du portefeuille · XAF</div>

          {/* Montant + bouton œil */}
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:8 }}>
            <div style={{ fontSize:34, fontWeight:900, letterSpacing:"-1px", transition:"all 0.3s" }}>
              {showBalance
                ? solde.toLocaleString("fr-FR", { minimumFractionDigits:2 })
                : "••••••••"}
            </div>
            <button
              onClick={() => setShowBalance(!showBalance)}
              title={showBalance ? "Masquer le solde" : "Afficher le solde"}
              style={{ background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.2)", borderRadius:7, padding:7, cursor:"pointer", color:"#fff", display:"flex", alignItems:"center", transition:"background 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,0.25)"}
              onMouseLeave={e => e.currentTarget.style.background="rgba(255,255,255,0.12)"}
            >
              {showBalance ? <FiEyeOff size={14}/> : <FiEye size={14}/>}
            </button>
          </div>

          {/* Sous-ligne disponible / en attente */}
          <div style={{ fontSize:11, opacity:0.65, marginBottom:20 }}>
            Disponible :{" "}
            <b>{showBalance ? solde.toLocaleString("fr-FR", { minimumFractionDigits:2 }) : "••••"} XAF</b>
            {" "}· En attente : <b>0,00 XAF</b>
          </div>

          {/* Boutons Dépôt / Retirer */}
          <div style={{ display:"flex", gap:10 }}>
            <button onClick={ouvrirDepot}
              style={{ flex:1, background:"rgba(255,255,255,0.15)", border:"1px solid rgba(255,255,255,0.2)", color:"#fff", borderRadius:10, padding:"10px 0", fontSize:12, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}
              onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,0.25)"}
              onMouseLeave={e => e.currentTarget.style.background="rgba(255,255,255,0.15)"}>
              <FiArrowDownLeft size={14}/> Dépôt
            </button>
            <button onClick={ouvrirRetrait}
              style={{ flex:1, background:"rgba(255,255,255,0.15)", border:"1px solid rgba(255,255,255,0.2)", color:"#fff", borderRadius:10, padding:"10px 0", fontSize:12, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}
              onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,0.25)"}
              onMouseLeave={e => e.currentTarget.style.background="rgba(255,255,255,0.15)"}>
              <FiArrowUpRight size={14}/> Retirer
            </button>
          </div>
        </div>

        {/* ── Liens rapides ── */}
        <div style={{ background:"#fff", borderRadius:16, padding:"22px 20px", border:"1px solid #ede9fe" }}>
          <p style={{ fontSize:14, fontWeight:700, color:"#1e1b4b", margin:"0 0 16px" }}>Liens rapides</p>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
            {liensRapides.map((l, i) => (
              <button key={i} onClick={() => handleLienRapide(l.id)} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8, cursor:"pointer", background:"none", border:"none", padding:0 }}>
                <div style={{ width:52, height:52, borderRadius:14, background:l.couleur, display:"flex", alignItems:"center", justifyContent:"center", color:l.iconColor, transition:"all 0.15s" }}
                  onMouseEnter={e => { e.currentTarget.style.transform="scale(1.08)"; e.currentTarget.style.filter="brightness(0.94)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform="scale(1)"; e.currentTarget.style.filter="none"; }}>
                  {l.icon}
                </div>
                <span style={{ fontSize:10, color:"#6b7280", textAlign:"center", fontWeight:600, lineHeight:1.3 }}>{l.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ══ Historique solde ══ */}
      <div style={{ background:"#fff", borderRadius:16, padding:"20px 22px", border:"1px solid #ede9fe", marginBottom:20 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          <div>
            <p style={{ fontSize:13, fontWeight:700, color:"#1e1b4b", margin:0 }}>Historique du solde</p>
            <p style={{ fontSize:11, color:"#6b7280", margin:"2px 0 0" }}>Évolution sur les 7 derniers jours</p>
          </div>
          <span style={{ fontSize:11, color:"#6b7280", background:"#f5f3ff", border:"1px solid #ede9fe", borderRadius:20, padding:"4px 12px" }}>7 derniers jours</span>
        </div>
        <Line data={chartData} options={chartOptions} height={65}/>
      </div>

      {/* ══ Activité récente + Cartes ══ */}
      <div style={{ display:"grid", gridTemplateColumns:"1.4fr 1fr", gap:20 }}>

        {/* Activité récente */}
        <div style={{ background:"#fff", borderRadius:16, padding:"20px 22px", border:"1px solid #ede9fe" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <p style={{ fontSize:13, fontWeight:700, color:"#1e1b4b", margin:0 }}>Activité récente</p>
            <button onClick={() => allerVers("transactions")} style={{ fontSize:11, color:"#7c3aed", fontWeight:700, border:"1px solid #ede9fe", padding:"4px 12px", borderRadius:20, background:"#faf5ff", cursor:"pointer" }}>Afficher tout</button>
          </div>
          {txs.length > 0 ? txs.map((tx, i) => (
            <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:i<txs.length-1?"1px solid #f8fafc":"none" }}>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ width:36, height:36, borderRadius:"50%", background:tx.montant>0?"#f0fdf4":"#fef2f2", display:"flex", alignItems:"center", justifyContent:"center", color:tx.montant>0?"#16a34a":"#dc2626" }}>
                  {tx.montant > 0 ? <FiArrowDownLeft size={14}/> : <FiArrowUpRight size={14}/>}
                </div>
                <div>
                  <p style={{ fontSize:12, fontWeight:600, color:"#1e1b4b", margin:0 }}>Transaction #{tx.id}</p>
                  <p style={{ fontSize:10, color:"#94a3b8", margin:0 }}>{tx.dateTransaction?.split("T")[0]}</p>
                </div>
              </div>
              <div style={{ textAlign:"right" }}>
                <p style={{ fontSize:12, fontWeight:700, color:tx.montant>0?"#16a34a":"#dc2626", margin:0 }}>
                  {tx.montant>0?"+":""}{Number(tx.montant).toLocaleString("fr-FR")} XAF
                </p>
                <p style={{ fontSize:10, color:"#94a3b8", margin:0 }}>{tx.statut}</p>
              </div>
            </div>
          )) : (
            <div style={{ textAlign:"center", padding:"28px 0" }}>
              <div style={{ width:56, height:56, borderRadius:"50%", background:"#f5f3ff", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 12px", opacity:0.6 }}><FiRepeat size={22} color="#7c3aed"/></div>
              <p style={{ fontSize:13, fontWeight:600, color:"#1e1b4b", margin:"0 0 4px" }}>Aucune transaction pour le moment</p>
              <p style={{ fontSize:11, color:"#6b7280", margin:"0 0 14px" }}>Commencez par effectuer votre premier dépôt</p>
              <button onClick={ouvrirDepot} style={{ background:"#7c3aed", color:"#fff", border:"none", borderRadius:10, padding:"9px 18px", fontSize:12, fontWeight:700, cursor:"pointer" }}>+ Effectuer un dépôt</button>
            </div>
          )}
        </div>

        {/* Cartes virtuelles */}
        <div style={{ background:"#fff", borderRadius:16, padding:"20px 22px", border:"1px solid #ede9fe" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <p style={{ fontSize:13, fontWeight:700, color:"#1e1b4b", margin:0 }}>Cartes virtuelles</p>
            <button onClick={() => allerVers("cartes")} style={{ fontSize:11, color:"#7c3aed", fontWeight:700, border:"1px solid #ede9fe", padding:"4px 12px", borderRadius:20, background:"#faf5ff", cursor:"pointer" }}>Gérer</button>
          </div>
          {dashData?.cartesActives > 0 ? (
            <div style={{ width:"100%", height:130, borderRadius:14, background:"linear-gradient(135deg,#2e1065,#7c3aed)", padding:"18px 20px", color:"#fff", boxSizing:"border-box", position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", top:-10, right:-10, width:70, height:70, borderRadius:"50%", background:"rgba(255,255,255,0.07)" }}/>
              <p style={{ fontSize:9, opacity:0.6, margin:"0 0 14px", letterSpacing:1.5 }}>CARTE VIRTUELLE</p>
              <p style={{ fontSize:13, fontWeight:700, letterSpacing:2.5, margin:"0 0 14px" }}>•••• •••• •••• ••••</p>
              <div style={{ display:"flex", justifyContent:"space-between" }}>
                <div><p style={{ fontSize:9, opacity:0.6, margin:"0 0 2px" }}>EXPIRE</p><p style={{ fontSize:11, margin:0 }}>12/27</p></div>
                <div style={{ width:28, height:28, borderRadius:"50%", background:"rgba(255,170,0,0.8)" }}/>
              </div>
            </div>
          ) : (
            <div style={{ textAlign:"center", padding:"24px 0" }}>
              <div style={{ width:60, height:60, borderRadius:"50%", background:"#f5f3ff", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 12px", opacity:0.6 }}><FiCreditCard size={24} color="#7c3aed"/></div>
              <p style={{ fontSize:13, fontWeight:600, color:"#1e1b4b", margin:"0 0 4px" }}>Aucune carte pour le moment</p>
              <p style={{ fontSize:11, color:"#6b7280", margin:"0 0 14px" }}>Créez votre première carte virtuelle</p>
              <button onClick={() => allerVers("cartes")} style={{ background:"#7c3aed", color:"#fff", border:"none", borderRadius:10, padding:"9px 18px", fontSize:12, fontWeight:700, cursor:"pointer", display:"inline-flex", alignItems:"center", gap:6 }}>
                <FiPlus size={14}/> Créer une carte
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}