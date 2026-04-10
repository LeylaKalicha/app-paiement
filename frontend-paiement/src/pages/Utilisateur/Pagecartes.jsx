import { useState, useEffect } from "react";
import {
  FiCreditCard, FiPlus, FiSearch, FiX, FiCheck, FiLock, FiUnlock,
  FiTrash2, FiAlertTriangle, FiDollarSign, FiArrowRight,
  FiCheckCircle, FiAlertCircle, FiEye, FiEyeOff, FiCopy,
} from "react-icons/fi";
import { MdOutlineAccountBalanceWallet } from "react-icons/md";
import api from "../../services/api";

// ─── Palette ────────────────────────────────────────────────────
const C = {
  primary:  "#6d28d9",
  primary2: "#7c3aed",
  dark:     "#2e1065",
  border:   "#ede9fe",
  text:     "#1e1b4b",
  muted:    "#6b7280",
};

const designs = [
  { id:"violet", label:"Violet",  gradient:"linear-gradient(135deg,#2e1065,#7c3aed)" },
  { id:"blue",   label:"Bleu",    gradient:"linear-gradient(135deg,#1d4ed8,#3b82f6)" },
  { id:"orange", label:"Orange",  gradient:"linear-gradient(135deg,#ea580c,#fb923c)" },
  { id:"vert",   label:"Vert",    gradient:"linear-gradient(135deg,#065f46,#10b981)" },
];

const typesCarte = [
  { id:"prepayee", badge:"CARTE PRÉPAYÉE",  logo:"🔴🟠", nom:"Mastercard Argent", desc:"Carte prépayée pour publicités (Meta, Google, TikTok)" },
  { id:"debit",    badge:"CARTE DE DÉBIT",  logo:"🔴🟠", nom:"Mastercard World",  desc:"Carte de débit. Apple Pay & Google Pay. Publicités, Abonnements" },
  { id:"credit",   badge:"CARTE DE CRÉDIT", logo:"VISA", nom:"VISA Platinum",     desc:"Carte de crédit. Apple Pay & Google Pay. Crypto, POS & tous marchands" },
];

const formatNumero = (n = "") => {
  const clean = n.replace(/\s/g, "");
  return clean.match(/.{1,4}/g)?.join(" ") || clean;
};

const copierPressePapier = (texte, cb) => {
  navigator.clipboard.writeText(texte).then(() => cb && cb());
};

// ═══════════════════════════════════════════════════════════════
//  Carte visuelle
// ═══════════════════════════════════════════════════════════════
function CarteVisuelle({ carte, design, bloquee, visible, style = {} }) {
  const numero = formatNumero(carte.numero || "");
  return (
    <div style={{
      width:220, height:130, borderRadius:14,
      background: bloquee ? "#94a3b8" : design.gradient,
      padding:"14px 16px", color:"#fff", flexShrink:0,
      display:"flex", flexDirection:"column", justifyContent:"space-between",
      opacity: bloquee ? 0.75 : 1, position:"relative", overflow:"hidden",
      boxShadow:"0 8px 24px rgba(0,0,0,0.18)", transition:"all .3s",
      ...style,
    }}>
      <div style={{ position:"absolute",top:-20,right:-20,width:80,height:80,borderRadius:"50%",background:"rgba(255,255,255,0.07)" }}/>
      <div style={{ position:"absolute",bottom:-15,left:-10,width:60,height:60,borderRadius:"50%",background:"rgba(255,255,255,0.05)" }}/>
      {bloquee && (
        <div style={{ position:"absolute",inset:0,borderRadius:14,background:"rgba(0,0,0,0.28)",display:"flex",alignItems:"center",justifyContent:"center" }}>
          <FiLock size={28} color="#fff"/>
        </div>
      )}
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start" }}>
        <span style={{ fontSize:8,opacity:0.65,letterSpacing:1.5 }}>PayVirtual</span>
        <span style={{ fontSize:9,opacity:0.7,fontWeight:700 }}>{carte.type || "Mastercard"}</span>
      </div>
      <div>
        <p style={{ fontSize:13,fontWeight:700,letterSpacing:2.5,margin:"0 0 5px",fontFamily:"monospace" }}>
          {visible ? numero : `•••• •••• •••• ${(carte.numero||"").slice(-4)||"••••"}`}
        </p>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
          <div>
            <p style={{ fontSize:7,opacity:0.6,margin:"0 0 1px" }}>EXPIRE</p>
            <p style={{ fontSize:9,fontWeight:700,margin:0 }}>{visible ? (carte.dateExpiration||"—") : "••/••"}</p>
          </div>
          <div style={{ textAlign:"right" }}>
            <p style={{ fontSize:7,opacity:0.6,margin:"0 0 1px" }}>CVV</p>
            <p style={{ fontSize:9,fontWeight:700,margin:0 }}>{visible ? (carte.cvv||"•••") : "•••"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  Ligne info copiable
// ═══════════════════════════════════════════════════════════════
function LigneInfo({ label, valeur, masquee, visible, onCopier, copie }) {
  return (
    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:`1px solid ${C.border}` }}>
      <span style={{ fontSize:11,color:C.muted,fontWeight:600 }}>{label}</span>
      <div style={{ display:"flex",alignItems:"center",gap:8 }}>
        <span style={{ fontSize:12,fontWeight:700,color:C.text,fontFamily:"monospace" }}>
          {masquee && !visible ? "•••• •••• •••• ••••" : valeur}
        </span>
        {visible && (
          <button onClick={() => onCopier(valeur)} title="Copier"
            style={{ background:"none",border:"none",cursor:"pointer",color:copie?"#16a34a":C.muted,padding:2 }}>
            {copie ? <FiCheck size={13}/> : <FiCopy size={13}/>}
          </button>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  Modal Recharge
// ═══════════════════════════════════════════════════════════════
function ModalRechargeCarte({ carte, soldeWallet, onClose, onSuccess }) {
  const [etape,   setEtape]   = useState("montant");
  const [montant, setMontant] = useState("");
  const [erreur,  setErreur]  = useState("");
  const montantsRapides = [1000,2000,5000,10000,25000,50000];
  const design = designs.find(d => d.id === (carte.design||"violet")) || designs[0];

  const recharger = async () => {
    setErreur("");
    if (!montant || Number(montant) < 10) { setErreur("Montant minimum : 10 XAF"); return; }
    if (Number(montant) > soldeWallet) { setErreur(`Solde insuffisant. Disponible : ${soldeWallet.toLocaleString("fr-FR")} XAF`); return; }
    setEtape("loading");
    try {
      const token = localStorage.getItem("token");
      await api.post(`/cartes/${carte.id}/recharger`, { montant: Number(montant) }, { headers: { Authorization:`Bearer ${token}` } });
      setEtape("succes");
      if (onSuccess) onSuccess(Number(montant));
    } catch (e) {
      setErreur(e.response?.data?.message || "Erreur lors de la recharge.");
      setEtape("erreur");
    }
  };

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(15,23,42,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1100,padding:16 }}>
      <div style={{ background:"#fff",borderRadius:20,width:"100%",maxWidth:420,boxShadow:"0 32px 80px rgba(0,0,0,0.22)",overflow:"hidden" }}>
        <div style={{ background:`linear-gradient(135deg,${C.dark},${C.primary2})`,padding:"20px 24px",display:"flex",alignItems:"center",justifyContent:"space-between" }}>
          <div style={{ display:"flex",alignItems:"center",gap:10 }}>
            <div style={{ width:36,height:36,borderRadius:10,background:"rgba(255,255,255,0.15)",display:"flex",alignItems:"center",justifyContent:"center" }}>
              <FiDollarSign size={18} color="#fff"/>
            </div>
            <div>
              <div style={{ color:"#fff",fontWeight:700,fontSize:15 }}>Recharger la carte</div>
              <div style={{ color:"rgba(255,255,255,0.6)",fontSize:11 }}>Wallet → Carte virtuelle</div>
            </div>
          </div>
          {etape !== "loading" && (
            <button onClick={onClose} style={{ background:"rgba(255,255,255,0.12)",border:"none",borderRadius:8,width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"#fff" }}>
              <FiX size={16}/>
            </button>
          )}
        </div>
        <div style={{ padding:24 }}>
          {etape === "montant" && (
            <>
              <div style={{ display:"flex",justifyContent:"center",marginBottom:18 }}>
                <div style={{ width:200,height:118,borderRadius:12,background:design.gradient,padding:"12px 14px",color:"#fff",boxSizing:"border-box",position:"relative",overflow:"hidden" }}>
                  <div style={{ position:"absolute",top:-10,right:-10,width:60,height:60,borderRadius:"50%",background:"rgba(255,255,255,0.07)" }}/>
                  <p style={{ fontSize:7,opacity:0.6,margin:"0 0 12px",letterSpacing:1.5 }}>CARTE VIRTUELLE</p>
                  <p style={{ fontSize:11,fontWeight:700,letterSpacing:2.5,margin:"0 0 8px",fontFamily:"monospace" }}>•••• •••• •••• {carte.numero?.slice(-4)||"0000"}</p>
                  <p style={{ fontSize:8,opacity:0.7,margin:0 }}>Exp. {carte.dateExpiration||"••/••"}</p>
                </div>
              </div>
              <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:20,padding:"10px 14px",background:"#f5f3ff",borderRadius:10,border:`1px solid ${C.border}` }}>
                <div style={{ display:"flex",alignItems:"center",gap:6 }}>
                  <MdOutlineAccountBalanceWallet size={16} color={C.primary2}/>
                  <div>
                    <p style={{ fontSize:10,color:C.muted,margin:0 }}>Wallet</p>
                    <p style={{ fontSize:12,fontWeight:700,color:C.text,margin:0 }}>{soldeWallet.toLocaleString("fr-FR")} XAF</p>
                  </div>
                </div>
                <FiArrowRight size={16} color={C.muted} style={{ flexShrink:0 }}/>
                <div style={{ display:"flex",alignItems:"center",gap:6 }}>
                  <FiCreditCard size={16} color={C.primary2}/>
                  <div>
                    <p style={{ fontSize:10,color:C.muted,margin:0 }}>Carte</p>
                    <p style={{ fontSize:12,fontWeight:700,color:C.text,margin:0 }}>•••• {carte.numero?.slice(-4)||"0000"}</p>
                  </div>
                </div>
              </div>
              <div style={{ marginBottom:14 }}>
                <label style={lbl}>Montant à recharger (XAF) <span style={{ color:"#dc2626" }}>*</span></label>
                <input type="number" value={montant} onChange={e=>setMontant(e.target.value)} placeholder="Ex: 5000" min={100}
                  style={{ width:"100%",padding:"12px 14px",border:`1px solid ${C.border}`,borderRadius:10,fontSize:16,fontWeight:700,color:C.text,outline:"none",fontFamily:"inherit",boxSizing:"border-box" }}/>
                <p style={{ fontSize:10,color:C.muted,margin:"4px 0 0" }}>Minimum : 100 XAF · Disponible : {soldeWallet.toLocaleString("fr-FR")} XAF</p>
              </div>
              <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:18 }}>
                {montantsRapides.map(m => (
                  <button key={m} onClick={()=>setMontant(String(m))}
                    style={{ padding:"8px 0",borderRadius:8,fontSize:12,fontWeight:600,border:`1px solid ${montant==m?C.primary2:C.border}`,background:montant==m?"#f5f3ff":"#fff",color:montant==m?C.primary2:C.muted,cursor:"pointer" }}>
                    {m.toLocaleString("fr-FR")}
                  </button>
                ))}
              </div>
              {erreur && (
                <div style={{ display:"flex",alignItems:"center",gap:8,padding:"10px 12px",background:"#fef2f2",borderRadius:10,marginBottom:14 }}>
                  <FiAlertCircle size={14} color="#dc2626"/>
                  <span style={{ fontSize:12,color:"#dc2626" }}>{erreur}</span>
                </div>
              )}
              {montant && Number(montant) >= 100 && (
                <div style={{ padding:"12px 14px",background:"#f5f3ff",borderRadius:10,marginBottom:16,border:`1px solid ${C.border}` }}>
                  <div style={{ display:"flex",justifyContent:"space-between",fontSize:12,color:C.muted,marginBottom:4 }}>
                    <span>Montant rechargé</span><span style={{ fontWeight:700,color:C.text }}>{Number(montant).toLocaleString("fr-FR")} XAF</span>
                  </div>
                  <div style={{ display:"flex",justifyContent:"space-between",fontSize:12,color:C.muted,marginBottom:4 }}>
                    <span>Frais</span><span style={{ fontWeight:600,color:"#16a34a" }}>0 XAF</span>
                  </div>
                  <div style={{ height:1,background:C.border,margin:"8px 0" }}/>
                  <div style={{ display:"flex",justifyContent:"space-between",fontSize:13,fontWeight:700 }}>
                    <span style={{ color:C.text }}>Nouveau solde wallet</span>
                    <span style={{ color:C.primary2 }}>{(soldeWallet-Number(montant)).toLocaleString("fr-FR")} XAF</span>
                  </div>
                </div>
              )}
              <button onClick={recharger}
                style={{ width:"100%",padding:"13px 0",background:`linear-gradient(135deg,${C.dark},${C.primary2})`,color:"#fff",border:"none",borderRadius:12,fontSize:14,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8 }}>
                <FiCheck size={14}/> Confirmer la recharge
              </button>
            </>
          )}
          {etape === "loading" && (
            <div style={{ textAlign:"center",padding:"32px 0" }}>
              <div style={{ width:56,height:56,border:`4px solid ${C.border}`,borderTop:`4px solid ${C.primary}`,borderRadius:"50%",margin:"0 auto 16px",animation:"spin 1s linear infinite" }}/>
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              <p style={{ fontSize:13,color:C.muted }}>Transfert en cours...</p>
            </div>
          )}
          {etape === "succes" && (
            <div style={{ textAlign:"center",padding:"10px 0" }}>
              <div style={{ width:72,height:72,borderRadius:"50%",background:"#f0fdf4",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px" }}>
                <FiCheckCircle size={36} color="#16a34a"/>
              </div>
              <h3 style={{ fontSize:16,fontWeight:700,color:C.text,margin:"0 0 8px" }}>Carte rechargée !</h3>
              <p style={{ fontSize:13,color:C.muted,margin:"0 0 20px",lineHeight:1.6 }}>
                <strong style={{ color:"#16a34a" }}>{Number(montant).toLocaleString("fr-FR")} XAF</strong> transférés vers la carte <strong>•••• {carte.numero?.slice(-4)||"0000"}</strong>.
              </p>
              <button onClick={onClose} style={{ width:"100%",padding:"13px 0",background:"linear-gradient(135deg,#15803d,#16a34a)",color:"#fff",border:"none",borderRadius:12,fontSize:14,fontWeight:700,cursor:"pointer" }}>
                Retour aux cartes
              </button>
            </div>
          )}
          {etape === "erreur" && (
            <div style={{ textAlign:"center",padding:"10px 0" }}>
              <div style={{ width:72,height:72,borderRadius:"50%",background:"#fef2f2",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px" }}>
                <FiAlertCircle size={36} color="#dc2626"/>
              </div>
              <h3 style={{ fontSize:16,fontWeight:700,color:C.text,margin:"0 0 8px" }}>Échec de la recharge</h3>
              <p style={{ fontSize:13,color:C.muted,margin:"0 0 20px",lineHeight:1.6 }}>{erreur}</p>
              <div style={{ display:"flex",gap:10 }}>
                <button onClick={onClose} style={{ flex:1,padding:"11px 0",background:"#f8fafc",border:`1px solid ${C.border}`,borderRadius:10,fontSize:13,fontWeight:600,cursor:"pointer",color:C.muted }}>Fermer</button>
                <button onClick={()=>{setEtape("montant");setErreur("");}} style={{ flex:1,padding:"11px 0",background:C.primary2,border:"none",borderRadius:10,fontSize:13,fontWeight:700,cursor:"pointer",color:"#fff" }}>Réessayer</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  PAGE PRINCIPALE
// ═══════════════════════════════════════════════════════════════
export default function PageCartes({ dashData }) {
  const [cartes,          setCartes]          = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [msg,             setMsg]             = useState(null);
  const [searchCarte,     setSearchCarte]     = useState("");
  const [filtreStatut,    setFiltreStatut]    = useState("Tous");
  const [showModal,       setShowModal]       = useState(false);
  const [typeChoisi,      setTypeChoisi]      = useState(null);
  const [nomCarte,        setNomCarte]        = useState("");
  const [soldeInit,       setSoldeInit]       = useState("");
  const [designChoisi,    setDesignChoisi]    = useState("violet");
  const [pin,             setPin]             = useState(["","","",""]);
  const [erreurModal,     setErreurModal]     = useState("");
  const [etapeModal,      setEtapeModal]      = useState("liste");
  const [actionId,        setActionId]        = useState(null);
  const [confirmSuppr,    setConfirmSuppr]    = useState(null);
  const [carteARecharger, setCarteARecharger] = useState(null);
  // { [carteId]: boolean } — true = infos sensibles visibles
  const [cartesVisibles,  setCartesVisibles]  = useState({});
  // { [clé]: boolean } — true = "Copié !" affiché
  const [copieStates,     setCopieStates]     = useState({});

  const token       = localStorage.getItem("token");
  const headers     = { Authorization: `Bearer ${token}` };
  const soldeWallet = Number(dashData?.solde || 0);

  const chargerCartes = async () => {
    try {
      setLoading(true);
      const res = await api.get("/cartes/mes-cartes", { headers });
      setCartes(res.data.cartes || []);
    } catch { setCartes([]); } finally { setLoading(false); }
  };

  useEffect(() => { chargerCartes(); }, []);

  const afficherMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3500);
  };

  // ══ Toggle infos sensibles d'une carte ══════════════════════
  const toggleVisible = (id) =>
    setCartesVisibles(prev => ({ ...prev, [id]: !prev[id] }));

  // ══ Copier avec feedback visuel ═════════════════════════════
  const handleCopier = (cle, valeur) => {
    copierPressePapier(valeur, () => {
      setCopieStates(prev => ({ ...prev, [cle]: true }));
      setTimeout(() => setCopieStates(prev => ({ ...prev, [cle]: false })), 2000);
    });
  };

  // ══ Ouvrir modal création ════════════════════════════════════
  const ouvrirModal = (type) => {
    setTypeChoisi(type);
    setNomCarte(dashData?.user?.nom?.toUpperCase() || "");
    setSoldeInit("");
    setPin(["","","",""]);
    setErreurModal("");
    setDesignChoisi("violet");
    setEtapeModal("form");
    setShowModal(true);
  };

  // ══ VALIDATION + CRÉATION ════════════════════════════════════
  const creerCarte = async () => {
    setErreurModal("");

    // 1. Nom obligatoire (4–23 caractères)
    if (!nomCarte || nomCarte.trim().length < 4) {
      setErreurModal("Le nom sur la carte est obligatoire (minimum 4 caractères).");
      return;
    }

    // 2. Solde initial OBLIGATOIRE — minimum 1 XAF
    const soldeInitNum = Number(soldeInit);
    if (!soldeInit || isNaN(soldeInitNum) || soldeInitNum < 1) {
      setErreurModal("Le solde initial est obligatoire (minimum 1 XAF).");
      return;
    }

    // 3. PIN — les 4 cases doivent contenir un chiffre
    const pinComplet = pin.length === 4 && pin.every(d => /^\d$/.test(d));
    if (!pinComplet) {
      setErreurModal("Veuillez saisir les 4 chiffres de votre code PIN.");
      return;
    }

    // 4. Solde wallet suffisant
    if (soldeInitNum > soldeWallet) {
      setErreurModal(`Solde insuffisant. Wallet : ${soldeWallet.toLocaleString("fr-FR")} XAF, requis : ${soldeInitNum.toLocaleString("fr-FR")} XAF.`);
      return;
    }

    setEtapeModal("loading");
    try {
      await api.post(
        "/cartes/creer",
        { type: typeChoisi?.nom, devise:"XAF", design: designChoisi, soldeInitial: soldeInitNum },
        { headers }
      );
      chargerCartes();
      setEtapeModal("success");
    } catch (e) {
      setErreurModal(e.response?.data?.message || "Erreur lors de la création.");
      setEtapeModal("form");
    }
  };

  const bloquerCarte   = async (id) => { try { setActionId(id); await api.put(`/cartes/${id}/bloquer`,{},{headers}); afficherMsg("success","Carte bloquée."); chargerCartes(); } catch(e){ afficherMsg("error",e.response?.data?.message||"Erreur."); } finally{ setActionId(null); } };
  const debloquerCarte = async (id) => { try { setActionId(id); await api.put(`/cartes/${id}/debloquer`,{},{headers}); afficherMsg("success","Carte débloquée."); chargerCartes(); } catch(e){ afficherMsg("error",e.response?.data?.message||"Erreur."); } finally{ setActionId(null); } };
  const supprimerCarte = async (id) => { try { setActionId(id); await api.delete(`/cartes/${id}`,{headers}); afficherMsg("success","Carte supprimée."); setConfirmSuppr(null); chargerCartes(); } catch(e){ afficherMsg("error",e.response?.data?.message||"Erreur."); } finally{ setActionId(null); } };

  const cartesFiltrees = cartes.filter(c => {
    const matchStatut = filtreStatut==="Tous" || c.statut===filtreStatut;
    const matchSearch = !searchCarte || c.numero?.includes(searchCarte);
    return matchStatut && matchSearch;
  });

  const nbActives   = cartes.filter(c=>c.statut==="ACTIVE").length;
  const nbBloquees  = cartes.filter(c=>c.statut==="BLOQUEE").length;
  const soldeInitNum = Math.max(0, Number(soldeInit)||0);

  return (
    <div>
      {/* ── En-tête ── */}
      <div style={{ background:"linear-gradient(135deg,#2e1065,#7c3aed)",borderRadius:16,padding:"22px 26px",color:"#fff",marginBottom:20,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
        <div>
          <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:4 }}>
            <FiCreditCard size={18}/>
            <span style={{ fontSize:18,fontWeight:800 }}>Mes cartes</span>
          </div>
          <p style={{ fontSize:12,opacity:0.7,margin:0 }}>Gérez vos cartes virtuelles PayVirtual</p>
        </div>
        <button onClick={()=>{ setTypeChoisi(null); setEtapeModal("liste"); setShowModal(true); }}
          style={{ background:"rgba(255,255,255,0.15)",border:"1px solid rgba(255,255,255,0.25)",color:"#fff",borderRadius:10,padding:"10px 18px",fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:6 }}>
          <FiPlus size={14}/> Créer une nouvelle carte
        </button>
      </div>

      {/* ── Stats ── */}
      <div style={{ display:"flex",gap:12,marginBottom:20 }}>
        {[
          { label:"Total",    val:cartes.length, color:C.primary2, bg:"#f5f3ff", border:C.border },
          { label:"Actives",  val:nbActives,     color:"#16a34a",  bg:"#f0fdf4", border:"#bbf7d0" },
          { label:"Bloquées", val:nbBloquees,    color:"#ef4444",  bg:"#fef2f2", border:"#fecaca" },
        ].map(s => (
          <div key={s.label} style={{ flex:1,background:s.bg,border:`1px solid ${s.border}`,borderRadius:12,padding:"14px 18px",textAlign:"center" }}>
            <div style={{ fontSize:26,fontWeight:900,color:s.color }}>{s.val}</div>
            <div style={{ fontSize:11,color:"#64748b",fontWeight:500,marginTop:2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Message flash ── */}
      {msg && (
        <div style={{ padding:"10px 14px",borderRadius:8,marginBottom:16,fontSize:13,fontWeight:600,background:msg.type==="success"?"#f0fdf4":"#fef2f2",color:msg.type==="success"?"#16a34a":"#dc2626",border:`1px solid ${msg.type==="success"?"#bbf7d0":"#fecaca"}` }}>
          {msg.text}
        </div>
      )}

      {/* ── Liste cartes ── */}
      <div style={{ background:"#fff",borderRadius:16,padding:"20px 22px",border:`1px solid ${C.border}`,marginBottom:20 }}>
        <div style={{ display:"flex",gap:12,marginBottom:18 }}>
          <div style={{ flex:1,display:"flex",alignItems:"center",gap:8,background:"#f8fafc",borderRadius:10,padding:"8px 14px",border:`1px solid ${C.border}` }}>
            <FiSearch size={13} color={C.muted}/>
            <input value={searchCarte} onChange={e=>setSearchCarte(e.target.value)} placeholder="Rechercher par numéro..."
              style={{ border:"none",background:"transparent",fontSize:12,outline:"none",color:C.text,flex:1 }}/>
          </div>
          <select value={filtreStatut} onChange={e=>setFiltreStatut(e.target.value)}
            style={{ padding:"8px 14px",borderRadius:10,border:`1px solid ${C.border}`,fontSize:12,color:C.muted,background:"#f8fafc",cursor:"pointer" }}>
            <option value="Tous">Tous les statuts</option>
            <option value="ACTIVE">Active</option>
            <option value="BLOQUEE">Bloquée</option>
          </select>
        </div>

        {loading ? (
          <p style={{ textAlign:"center",color:C.muted,padding:30 }}>Chargement...</p>
        ) : cartesFiltrees.length === 0 ? (
          <div style={{ textAlign:"center",padding:"40px 0" }}>
            <div style={{ width:72,height:72,borderRadius:"50%",background:"#f5f3ff",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",opacity:0.6 }}>
              <FiCreditCard size={30} color={C.primary}/>
            </div>
            <p style={{ fontSize:14,fontWeight:700,color:C.text,margin:"0 0 6px" }}>Aucune carte trouvée</p>
            <p style={{ fontSize:12,color:C.muted,margin:0 }}>Modifiez vos filtres ou créez une nouvelle carte.</p>
          </div>
        ) : (
          <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
            {cartesFiltrees.map((c,i) => {
              const design   = designs.find(d=>d.id===(c.design||"violet")) || designs[i%designs.length];
              const bloquee  = c.statut==="BLOQUEE";
              const enAction = actionId===c.id;
              const visible  = !!cartesVisibles[c.id];
              const numFormat = formatNumero(c.numero||"");

              return (
                <div key={c.id} style={{ background:"#f8fafc",borderRadius:16,border:`1px solid ${C.border}`,overflow:"hidden" }}>
                  <div style={{ display:"flex",gap:20,padding:"18px 20px",flexWrap:"wrap" }}>

                    {/* Carte visuelle — réagit au toggle */}
                    <CarteVisuelle carte={c} design={design} bloquee={bloquee} visible={visible}/>

                    <div style={{ flex:1,minWidth:200,display:"flex",flexDirection:"column",justifyContent:"space-between" }}>

                      {/* ══ HEADER : statut + bouton toggle infos ══ */}
                      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10,flexWrap:"wrap",gap:8 }}>
                        <span style={{ fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:20,background:bloquee?"#fef2f2":"#f0fdf4",color:bloquee?"#ef4444":"#16a34a" }}>
                          {bloquee ? "🔒 BLOQUÉE" : "✅ ACTIVE"}
                        </span>

                        {/* Bouton Voir infos / Masquer infos */}
                        <button
                          onClick={() => toggleVisible(c.id)}
                          style={{
                            display:"flex", alignItems:"center", gap:5,
                            padding:"6px 14px", borderRadius:20,
                            fontSize:11, fontWeight:700,
                            border:`1.5px solid ${visible ? C.primary2 : "#d1d5db"}`,
                            background: visible ? "#f5f3ff" : "#f9fafb",
                            color: visible ? C.primary2 : C.muted,
                            cursor:"pointer", transition:"all .2s",
                            boxShadow: visible ? "0 0 0 3px rgba(124,58,237,0.12)" : "none",
                          }}>
                          {visible
                            ? <><FiEyeOff size={13}/> Masquer infos</>
                            : <><FiEye size={13}/> Voir infos</>
                          }
                        </button>
                      </div>

                      {/* ══ DÉTAILS CARTE ══ */}
                      <div style={{ marginBottom:12 }}>
                        <LigneInfo
                          label="Numéro"
                          valeur={numFormat}
                          masquee={true}
                          visible={visible}
                          onCopier={v=>handleCopier(`${c.id}-num`,v)}
                          copie={!!copieStates[`${c.id}-num`]}
                        />
                        <LigneInfo
                          label="Expiration"
                          valeur={c.dateExpiration||"—"}
                          masquee={false}
                          visible={visible}
                          onCopier={v=>handleCopier(`${c.id}-exp`,v)}
                          copie={!!copieStates[`${c.id}-exp`]}
                        />
                        <LigneInfo
                          label="CVV"
                          valeur={c.cvv||"•••"}
                          masquee={false}
                          visible={visible}
                          onCopier={v=>handleCopier(`${c.id}-cvv`,v)}
                          copie={!!copieStates[`${c.id}-cvv`]}
                        />
                        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:7 }}>
                          <span style={{ fontSize:11,color:C.muted,fontWeight:600 }}>Solde</span>
                          <span style={{ fontSize:13,fontWeight:800,color:C.primary2 }}>
                            {Number(c.solde||0).toLocaleString("fr-FR")} XAF
                          </span>
                        </div>
                      </div>

                      {/* ══ BOUTONS ACTION ══ */}
                      <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
                        <button onClick={()=>setCarteARecharger(c)} disabled={bloquee||enAction}
                          style={{ display:"flex",alignItems:"center",gap:5,padding:"7px 12px",borderRadius:8,border:`1px solid ${C.primary2}`,background:"#f5f3ff",color:C.primary2,fontSize:11,fontWeight:700,cursor:bloquee?"not-allowed":"pointer",opacity:bloquee?0.5:1 }}>
                          <FiDollarSign size={13}/> Recharger
                        </button>
                        {bloquee ? (
                          <button onClick={()=>debloquerCarte(c.id)} disabled={enAction}
                            style={{ display:"flex",alignItems:"center",gap:5,padding:"7px 12px",borderRadius:8,border:"1px solid #16a34a",background:"#f0fdf4",color:"#16a34a",fontSize:11,fontWeight:700,cursor:"pointer",opacity:enAction?0.6:1 }}>
                            <FiUnlock size={13}/> {enAction?"...":"Débloquer"}
                          </button>
                        ) : (
                          <button onClick={()=>bloquerCarte(c.id)} disabled={enAction}
                            style={{ display:"flex",alignItems:"center",gap:5,padding:"7px 12px",borderRadius:8,border:"1px solid #f59e0b",background:"#fffbeb",color:"#d97706",fontSize:11,fontWeight:700,cursor:"pointer",opacity:enAction?0.6:1 }}>
                            <FiLock size={13}/> {enAction?"...":"Bloquer"}
                          </button>
                        )}
                        <button onClick={()=>setConfirmSuppr(c.id)} disabled={enAction}
                          style={{ display:"flex",alignItems:"center",gap:5,padding:"7px 12px",borderRadius:8,border:"1px solid #ef4444",background:"#fef2f2",color:"#ef4444",fontSize:11,fontWeight:700,cursor:"pointer",opacity:enAction?0.6:1 }}>
                          <FiTrash2 size={13}/> Supprimer
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* ══ BANDEAU INFOS VISIBLES ══ */}
                  {visible && (
                    <div style={{ background:"linear-gradient(90deg,#f5f3ff,#ede9fe)",borderTop:`1px solid ${C.border}`,padding:"8px 20px",display:"flex",alignItems:"center",justifyContent:"space-between" }}>
                      <div style={{ display:"flex",alignItems:"center",gap:6 }}>
                        <FiEye size={12} color={C.primary2}/>
                        <span style={{ fontSize:11,color:C.primary2,fontWeight:600 }}>
                          Informations sensibles visibles — pensez à les masquer
                        </span>
                      </div>
                      <button onClick={()=>toggleVisible(c.id)}
                        style={{ display:"flex",alignItems:"center",gap:4,padding:"3px 10px",borderRadius:20,border:`1px solid ${C.primary2}`,background:"#fff",color:C.primary2,fontSize:11,fontWeight:700,cursor:"pointer" }}>
                        <FiEyeOff size={11}/> Masquer
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Catalogue ── */}
      <div style={{ background:"#fff",borderRadius:16,padding:"22px",border:`1px solid ${C.border}` }}>
        <div style={{ background:"linear-gradient(135deg,#2e1065,#7c3aed)",borderRadius:12,padding:"22px 24px",marginBottom:20,color:"#fff" }}>
          <p style={{ fontSize:16,fontWeight:800,margin:"0 0 6px" }}>
            Choisissez votre carte — <span style={{ color:"#c4b5fd" }}>Émission instantanée & gratuite</span>
          </p>
          <p style={{ fontSize:11,opacity:0.7,margin:0 }}>Cartes virtuelles acceptées partout dans le monde, avec sécurité 3DS.</p>
          <div style={{ display:"flex",gap:24,marginTop:14,fontSize:11,opacity:0.8 }}>
            <span>🏪 Des marchands</span><span>🌍 20+ pays</span><span>🔒 3DS Sécurisé</span><span>🕐 24h/24</span>
          </div>
        </div>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16 }}>
          {typesCarte.map(tc => (
            <div key={tc.id} style={{ border:`1px solid ${C.border}`,borderRadius:14,padding:20,textAlign:"center" }}>
              <span style={{ fontSize:9,fontWeight:800,color:"#fff",background:tc.id==="credit"?"#92400e":tc.id==="debit"?C.primary2:"#166534",borderRadius:20,padding:"3px 10px",letterSpacing:0.8 }}>{tc.badge}</span>
              <div style={{ fontSize:28,margin:"14px 0 6px" }}>
                {tc.logo==="VISA" ? <span style={{ color:"#1a1f71",fontWeight:900,fontSize:22 }}>VISA</span> : tc.logo}
              </div>
              <p style={{ fontSize:13,fontWeight:700,color:C.text,margin:"0 0 6px" }}>{tc.nom}</p>
              <p style={{ fontSize:11,color:C.muted,margin:"0 0 14px",lineHeight:1.4 }}>{tc.desc}</p>
              <div style={{ display:"inline-flex",alignItems:"center",gap:4,background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:20,padding:"4px 12px",marginBottom:14 }}>
                <FiCheck size={11} color="#16a34a"/>
                <span style={{ fontSize:11,fontWeight:700,color:"#16a34a" }}>Émission gratuite</span>
              </div>
              <button onClick={()=>ouvrirModal(tc)}
                style={{ width:"100%",display:"block",marginTop:4,background:C.primary2,color:"#fff",border:"none",borderRadius:10,padding:"11px 0",fontSize:13,fontWeight:700,cursor:"pointer" }}>
                Créer →
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════ MODAL CRÉATION ══════════════ */}
      {showModal && (
        <div style={{ position:"fixed",inset:0,background:"rgba(15,23,42,0.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:16 }}>
          <div style={{ background:"#fff",borderRadius:16,width:460,maxHeight:"92vh",overflowY:"auto",boxShadow:"0 24px 64px rgba(0,0,0,0.18)" }}>

            {/* Header modal */}
            <div style={{ background:C.primary,padding:"16px 20px",display:"flex",justifyContent:"space-between",alignItems:"center",color:"#fff",position:"sticky",top:0,zIndex:10,borderRadius:"16px 16px 0 0" }}>
              <div style={{ display:"flex",alignItems:"center",gap:8,fontWeight:700,fontSize:14 }}>
                <FiCreditCard size={16}/> Créer une carte
              </div>
              <button onClick={()=>setShowModal(false)} style={{ background:"none",border:"none",color:"#fff",cursor:"pointer" }}>
                <FiX size={18}/>
              </button>
            </div>

            <div style={{ padding:24 }}>

              {/* ── Étape liste ── */}
              {etapeModal==="liste" && (
                <>
                  <p style={{ fontSize:13,color:C.muted,marginBottom:16 }}>Choisissez un type de carte :</p>
                  {typesCarte.map(tc => (
                    <button key={tc.id} onClick={()=>{ setTypeChoisi(tc); setEtapeModal("form"); }}
                      style={{ display:"flex",alignItems:"center",justifyContent:"space-between",width:"100%",background:"#f5f3ff",border:`1px solid ${C.border}`,borderRadius:10,padding:"12px 16px",marginBottom:8,cursor:"pointer",textAlign:"left" }}>
                      <div>
                        <div style={{ fontSize:13,fontWeight:700,color:C.text }}>{tc.nom}</div>
                        <div style={{ fontSize:11,color:C.muted,marginTop:2 }}>{tc.desc}</div>
                      </div>
                      <div style={{ display:"flex",alignItems:"center",gap:4,background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:20,padding:"3px 10px",flexShrink:0,marginLeft:10 }}>
                        <FiCheck size={10} color="#16a34a"/>
                        <span style={{ fontSize:10,fontWeight:700,color:"#16a34a" }}>Gratuit</span>
                      </div>
                    </button>
                  ))}
                </>
              )}

              {/* ── Étape form ── */}
              {etapeModal==="form" && typeChoisi && (
                <>
                  <div style={{ textAlign:"center",marginBottom:16 }}>
                    <p style={{ fontSize:15,fontWeight:700,color:C.text,margin:"0 0 2px" }}>{typeChoisi.nom}</p>
                    <p style={{ fontSize:11,color:C.muted,margin:0 }}>Devise : XAF · Émission gratuite</p>
                  </div>

                  {/* Aperçu carte */}
                  <div style={{ display:"flex",justifyContent:"center",marginBottom:14 }}>
                    <div style={{ width:220,height:130,borderRadius:14,background:designs.find(d=>d.id===designChoisi)?.gradient||designs[0].gradient,padding:"14px 16px",color:"#fff",boxSizing:"border-box",position:"relative",overflow:"hidden",boxShadow:"0 8px 24px rgba(0,0,0,0.15)" }}>
                      <div style={{ position:"absolute",top:-10,right:-10,width:60,height:60,borderRadius:"50%",background:"rgba(255,255,255,0.08)" }}/>
                      <p style={{ fontSize:7,opacity:0.6,margin:"0 0 14px",letterSpacing:1.5 }}>CARTE VIRTUELLE</p>
                      <p style={{ fontSize:12,fontWeight:700,letterSpacing:2.5,margin:"0 0 10px",fontFamily:"monospace" }}>•••• •••• •••• ••••</p>
                      <p style={{ fontSize:10,opacity:0.8,margin:0 }}>{nomCarte||"NOM TITULAIRE"}</p>
                    </div>
                  </div>

                  {/* Couleur */}
                  <p style={{ fontSize:11,fontWeight:700,color:C.muted,marginBottom:6 }}>Couleur de la carte</p>
                  <div style={{ display:"flex",gap:8,marginBottom:16 }}>
                    {designs.map(d => (
                      <div key={d.id} onClick={()=>setDesignChoisi(d.id)}
                        style={{ width:44,height:28,borderRadius:8,background:d.gradient,cursor:"pointer",border:designChoisi===d.id?"3px solid #0f172a":"3px solid transparent",transition:"border .15s" }} title={d.label}/>
                    ))}
                  </div>

                  {/* Nom sur la carte */}
                  <div style={{ marginBottom:14 }}>
                    <label style={lbl}>Nom sur la carte <span style={{ color:"#dc2626" }}>*</span></label>
                    <input
                      value={nomCarte}
                      onChange={e=>setNomCarte(e.target.value.toUpperCase())}
                      placeholder="NOM PRÉNOM"
                      maxLength={23}
                      style={{ ...inp, borderColor: nomCarte.trim().length>=4 ? "#16a34a" : C.border }}
                    />
                    <p style={{ fontSize:10,color:C.muted,margin:"3px 0 0" }}>Lettres uniquement, 4 à 23 caractères</p>
                  </div>

                  {/* Solde initial OBLIGATOIRE */}
                  <div style={{ marginBottom:14 }}>
                    <label style={lbl}>
                      Solde initial (XAF) <span style={{ color:"#dc2626" }}>*</span>
                    </label>
                    <div style={{ display:"flex",alignItems:"center",border:`1.5px solid ${soldeInit && Number(soldeInit)>=1 ? "#16a34a" : C.border}`,borderRadius:8,overflow:"hidden",transition:"border .2s" }}>
                      <span style={{ padding:"10px 12px",background:"#f8fafc",fontSize:12,color:C.muted,borderRight:`1px solid ${C.border}`,fontWeight:600 }}>XAF</span>
                      <input
                        type="number"
                        value={soldeInit}
                        onChange={e=>setSoldeInit(e.target.value)}
                        placeholder="Ex: 1000  (minimum 1 XAF)"
                        min={1}
                        style={{ flex:1,padding:"10px 12px",border:"none",fontSize:13,fontWeight:600,outline:"none",background:"#fff" }}
                      />
                    </div>
                    <p style={{ fontSize:10,color:C.muted,margin:"4px 0 0" }}>
                      Wallet disponible : <strong style={{ color:C.primary2 }}>{soldeWallet.toLocaleString("fr-FR")} XAF</strong>
                    </p>
                  </div>

                  {/* Récap */}
                  <div style={{ background:"#f8fafc",borderRadius:10,padding:"12px 14px",marginBottom:14,border:`1px solid ${C.border}` }}>
                    <div style={{ display:"flex",justifyContent:"space-between",fontSize:12,color:C.muted,marginBottom:6 }}>
                      <span>Frais d'émission</span>
                      <span style={{ fontWeight:700,color:"#16a34a",display:"flex",alignItems:"center",gap:4 }}>
                        <FiCheck size={11}/> GRATUIT
                      </span>
                    </div>
                    <div style={{ display:"flex",justifyContent:"space-between",fontSize:12,color:C.muted,marginBottom:6 }}>
                      <span>Solde initial</span>
                      <span style={{ fontWeight:700,color:C.text }}>{soldeInitNum.toLocaleString("fr-FR")} XAF</span>
                    </div>
                    <div style={{ height:1,background:C.border,margin:"8px 0" }}/>
                    <div style={{ display:"flex",justifyContent:"space-between",fontSize:13,fontWeight:700 }}>
                      <span style={{ color:C.text }}>Total débité du wallet</span>
                      <span style={{ color: soldeInitNum>soldeWallet ? "#dc2626" : C.primary2 }}>
                        {soldeInitNum.toLocaleString("fr-FR")} XAF
                      </span>
                    </div>
                    {soldeInitNum>0 && soldeInitNum>soldeWallet && (
                      <div style={{ marginTop:8,display:"flex",alignItems:"center",gap:6,padding:"6px 10px",background:"#fef2f2",borderRadius:8 }}>
                        <FiAlertCircle size={12} color="#dc2626"/>
                        <span style={{ fontSize:11,color:"#dc2626",fontWeight:600 }}>Solde wallet insuffisant</span>
                      </div>
                    )}
                  </div>

                  {/* ══ PIN 4 CHIFFRES OBLIGATOIRE ══ */}
                  <div style={{ marginBottom:18 }}>
                    <label style={{ ...lbl, marginBottom:12 }}>
                      Code PIN à 4 chiffres <span style={{ color:"#dc2626" }}>*</span>
                    </label>
                    <div style={{ display:"flex",gap:12,justifyContent:"center" }}>
                      {pin.map((p,i) => (
                        <input
                          key={i}
                          id={`pin-${i}`}
                          type="password"
                          inputMode="numeric"
                          maxLength={1}
                          value={p}
                          onChange={e => {
                            const val = e.target.value.replace(/\D/,"");
                            const np  = [...pin];
                            np[i]     = val;
                            setPin(np);
                            if (val && i < 3) {
                              setTimeout(()=>document.getElementById(`pin-${i+1}`)?.focus(), 10);
                            }
                          }}
                          onKeyDown={e => {
                            if (e.key==="Backspace" && !pin[i] && i>0) {
                              document.getElementById(`pin-${i-1}`)?.focus();
                            }
                          }}
                          style={{
                            width:56, height:56, textAlign:"center",
                            border:`2.5px solid ${p ? C.primary2 : "#d1d5db"}`,
                            borderRadius:12, fontSize:24, fontWeight:800,
                            outline:"none", color:C.primary,
                            background: p ? "#f5f3ff" : "#fff",
                            transition:"all .15s", cursor:"text",
                          }}
                        />
                      ))}
                    </div>
                    <p style={{ fontSize:10,color:C.muted,textAlign:"center",margin:"10px 0 0" }}>
                      {pin.filter(d=>/^\d$/.test(d)).length}/4 chiffres saisis
                    </p>
                  </div>

                  {/* Message d'erreur de validation */}
                  {erreurModal && (
                    <div style={{ display:"flex",alignItems:"flex-start",gap:8,padding:"10px 12px",background:"#fef2f2",borderRadius:10,marginBottom:14,border:"1px solid #fecaca" }}>
                      <FiAlertCircle size={14} color="#dc2626" style={{ flexShrink:0,marginTop:1 }}/>
                      <span style={{ fontSize:12,color:"#dc2626",fontWeight:600,lineHeight:1.4 }}>{erreurModal}</span>
                    </div>
                  )}

                  <div style={{ display:"flex",gap:10 }}>
                    <button onClick={()=>setShowModal(false)}
                      style={{ flex:1,background:"#f8fafc",border:`1px solid ${C.border}`,borderRadius:8,padding:"11px 0",fontSize:13,fontWeight:600,cursor:"pointer",color:C.muted }}>
                      Annuler
                    </button>
                    <button onClick={creerCarte}
                      style={{ flex:1.5,background:C.primary2,color:"#fff",border:"none",borderRadius:8,padding:"11px 0",fontSize:13,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6 }}>
                      <FiCheck size={14}/> Confirmer & Créer
                    </button>
                  </div>
                </>
              )}

              {/* ── Loading ── */}
              {etapeModal==="loading" && (
                <div style={{ textAlign:"center",padding:"40px 0" }}>
                  <div style={{ width:52,height:52,border:`4px solid ${C.border}`,borderTop:`4px solid ${C.primary}`,borderRadius:"50%",margin:"0 auto 16px",animation:"spin 1s linear infinite" }}/>
                  <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                  <p style={{ fontSize:13,color:C.muted,margin:0 }}>Création de votre carte...</p>
                </div>
              )}

              {/* ── Succès ── */}
              {etapeModal==="success" && (
                <div style={{ textAlign:"center",padding:"24px 0" }}>
                  <div style={{ width:64,height:64,borderRadius:"50%",background:"#dcfce7",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px",color:"#16a34a" }}>
                    <FiCheckCircle size={32}/>
                  </div>
                  <p style={{ fontSize:16,fontWeight:800,color:C.text,margin:"0 0 6px" }}>Carte créée avec succès !</p>
                  <p style={{ fontSize:12,color:C.muted,marginBottom:6 }}>{typeChoisi?.nom} est maintenant disponible.</p>
                  <p style={{ fontSize:12,color:"#16a34a",fontWeight:600,marginBottom:20 }}>
                    Solde initial : {soldeInitNum.toLocaleString("fr-FR")} XAF crédité sur la carte.
                  </p>
                  <button onClick={()=>setShowModal(false)}
                    style={{ background:C.primary2,color:"#fff",border:"none",borderRadius:10,padding:"11px 32px",fontSize:13,fontWeight:700,cursor:"pointer" }}>
                    Voir mes cartes
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ MODAL SUPPRESSION ══════════════ */}
      {confirmSuppr && (
        <div style={{ position:"fixed",inset:0,background:"rgba(15,23,42,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000 }}>
          <div style={{ background:"#fff",borderRadius:14,padding:28,width:340,boxShadow:"0 20px 60px rgba(0,0,0,0.15)" }}>
            <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:16 }}>
              <div style={{ width:40,height:40,borderRadius:10,background:"#fef2f2",display:"flex",alignItems:"center",justifyContent:"center",color:"#ef4444" }}>
                <FiAlertTriangle size={18}/>
              </div>
              <div>
                <div style={{ fontWeight:700,fontSize:15,color:C.text }}>Supprimer la carte</div>
                <div style={{ fontSize:12,color:C.muted,marginTop:2 }}>Cette action est irréversible</div>
              </div>
            </div>
            <p style={{ fontSize:13,color:C.muted,marginBottom:20,lineHeight:1.6 }}>
              Êtes-vous sûr de vouloir supprimer cette carte ? Elle ne pourra plus être utilisée.
            </p>
            <div style={{ display:"flex",gap:10 }}>
              <button onClick={()=>setConfirmSuppr(null)}
                style={{ flex:1,background:"#f8fafc",border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 0",fontSize:13,fontWeight:600,cursor:"pointer",color:C.muted }}>
                Annuler
              </button>
              <button onClick={()=>supprimerCarte(confirmSuppr)}
                style={{ flex:1,background:"#ef4444",color:"#fff",border:"none",borderRadius:8,padding:"9px 0",fontSize:13,fontWeight:700,cursor:"pointer" }}>
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ MODAL RECHARGE ══════════════ */}
      {carteARecharger && (
        <ModalRechargeCarte
          carte={carteARecharger}
          soldeWallet={soldeWallet}
          onClose={()=>setCarteARecharger(null)}
          onSuccess={()=>{ setCarteARecharger(null); chargerCartes(); }}
        />
      )}
    </div>
  );
}

// ─── Styles helpers ─────────────────────────────────────────────
const lbl = { display:"block", fontSize:11, fontWeight:600, color:"#374151", marginBottom:5 };
const inp = { width:"100%", padding:"9px 12px", border:`1px solid #ede9fe`, borderRadius:8, fontSize:12, outline:"none", background:"#fafafa", boxSizing:"border-box" };

















// import { useState, useEffect } from "react";
// import {
//   FiCreditCard, FiPlus, FiSearch, FiX, FiCheck, FiLock, FiUnlock,
//   FiTrash2, FiAlertTriangle, FiDollarSign, FiArrowRight,
//   FiCheckCircle, FiAlertCircle, FiEye, FiEyeOff, FiCopy,
// } from "react-icons/fi";
// import { MdOutlineAccountBalanceWallet } from "react-icons/md";
// import api from "../../services/api";

// // ─── Palette & constantes ───────────────────────────────────────
// const C = {
//   primary:  "#6d28d9",
//   primary2: "#7c3aed",
//   primary3: "#8b5cf6",
//   dark:     "#2e1065",
//   border:   "#ede9fe",
//   text:     "#1e1b4b",
//   muted:    "#6b7280",
// };

// const designs = [
//   { id:"violet", label:"Violet",  gradient:"linear-gradient(135deg,#2e1065,#7c3aed)" },
//   { id:"blue",   label:"Bleu",    gradient:"linear-gradient(135deg,#1d4ed8,#3b82f6)" },
//   { id:"orange", label:"Orange",  gradient:"linear-gradient(135deg,#ea580c,#fb923c)" },
//   { id:"vert",   label:"Vert",    gradient:"linear-gradient(135deg,#065f46,#10b981)" },
// ];

// const typesCarte = [
//   { id:"prepayee", badge:"CARTE PRÉPAYÉE",  logo:"🔴🟠", nom:"Mastercard Argent",  desc:"Carte prépayée pour publicités (Meta, Google, TikTok)" },
//   { id:"debit",    badge:"CARTE DE DÉBIT",  logo:"🔴🟠", nom:"Mastercard World",   desc:"Carte de débit. Apple Pay & Google Pay. Publicités, Abonnements" },
//   { id:"credit",   badge:"CARTE DE CRÉDIT", logo:"VISA",  nom:"VISA Platinum",      desc:"Carte de crédit. Apple Pay & Google Pay. Crypto, POS & tous marchands" },
// ];

// // ─── Helper : formater numéro de carte en groupes de 4 ──────────
// const formatNumero = (n = "") => {
//   const clean = n.replace(/\s/g, "");
//   return clean.match(/.{1,4}/g)?.join(" ") || clean;
// };

// // ─── Helper : copier dans le presse-papier ──────────────────────
// const copier = (texte, cb) => {
//   navigator.clipboard.writeText(texte).then(() => cb && cb());
// };

// // ═══════════════════════════════════════════════════════════════
// //  COMPOSANT : Carte visuelle
// // ═══════════════════════════════════════════════════════════════
// function CarteVisuelle({ carte, design, bloquee, visible, style = {} }) {
//   const numero = formatNumero(carte.numero || "");
//   return (
//     <div style={{
//       width: 220, height: 130, borderRadius: 14,
//       background: bloquee ? "#94a3b8" : design.gradient,
//       padding: "14px 16px", color: "#fff", flexShrink: 0,
//       display: "flex", flexDirection: "column", justifyContent: "space-between",
//       opacity: bloquee ? 0.75 : 1, position: "relative", overflow: "hidden",
//       boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
//       transition: "all .3s",
//       ...style,
//     }}>
//       <div style={{ position:"absolute", top:-20, right:-20, width:80, height:80, borderRadius:"50%", background:"rgba(255,255,255,0.07)" }}/>
//       <div style={{ position:"absolute", bottom:-15, left:-10, width:60, height:60, borderRadius:"50%", background:"rgba(255,255,255,0.05)" }}/>

//       {bloquee && (
//         <div style={{ position:"absolute", inset:0, borderRadius:14, background:"rgba(0,0,0,0.28)", display:"flex", alignItems:"center", justifyContent:"center" }}>
//           <FiLock size={28} color="#fff"/>
//         </div>
//       )}

//       <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
//         <span style={{ fontSize:8, opacity:0.65, letterSpacing:1.5 }}>PayVirtual</span>
//         <span style={{ fontSize:9, opacity:0.7, fontWeight:700 }}>{carte.type || "Mastercard"}</span>
//       </div>

//       <div>
//         <p style={{ fontSize:13, fontWeight:700, letterSpacing:2.5, margin:"0 0 5px", fontFamily:"monospace" }}>
//           {visible
//             ? numero
//             : `•••• •••• •••• ${(carte.numero || "").slice(-4) || "••••"}`
//           }
//         </p>
//         <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
//           <div>
//             <p style={{ fontSize:7, opacity:0.6, margin:"0 0 1px" }}>EXPIRE</p>
//             <p style={{ fontSize:9, fontWeight:700, margin:0 }}>
//               {visible ? (carte.dateExpiration || "—") : "••/••"}
//             </p>
//           </div>
//           <div style={{ textAlign:"right" }}>
//             <p style={{ fontSize:7, opacity:0.6, margin:"0 0 1px" }}>CVV</p>
//             <p style={{ fontSize:9, fontWeight:700, margin:0 }}>
//               {visible ? (carte.cvv || "•••") : "•••"}
//             </p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// // ═══════════════════════════════════════════════════════════════
// //  COMPOSANT : Ligne d'info copiable
// // ═══════════════════════════════════════════════════════════════
// function LigneInfo({ label, valeur, masquee, visible, onCopier, copie }) {
//   return (
//     <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"7px 0", borderBottom:`1px solid ${C.border}` }}>
//       <span style={{ fontSize:11, color:C.muted, fontWeight:600 }}>{label}</span>
//       <div style={{ display:"flex", alignItems:"center", gap:8 }}>
//         <span style={{ fontSize:12, fontWeight:700, color:C.text, fontFamily:"monospace" }}>
//           {masquee && !visible ? "•••• •••• •••• ••••" : valeur}
//         </span>
//         {visible && (
//           <button onClick={() => onCopier(valeur)}
//             title="Copier"
//             style={{ background:"none", border:"none", cursor:"pointer", color: copie ? "#16a34a" : C.muted, padding:2 }}>
//             {copie ? <FiCheck size={13}/> : <FiCopy size={13}/>}
//           </button>
//         )}
//       </div>
//     </div>
//   );
// }

// // ═══════════════════════════════════════════════════════════════
// //  MODAL : Recharge carte
// // ═══════════════════════════════════════════════════════════════
// function ModalRechargeCarte({ carte, soldeWallet, onClose, onSuccess }) {
//   const [etape,   setEtape]   = useState("montant");
//   const [montant, setMontant] = useState("");
//   const [erreur,  setErreur]  = useState("");

//   const montantsRapides = [1000, 2000, 5000, 10000, 25000, 50000];
//   const design = designs.find(d => d.id === (carte.design || "violet")) || designs[0];

//   const recharger = async () => {
//     setErreur("");
//     if (!montant || Number(montant) < 100) { setErreur("Montant minimum : 100 XAF"); return; }
//     if (Number(montant) > soldeWallet)     { setErreur(`Solde insuffisant. Disponible : ${soldeWallet.toLocaleString("fr-FR")} XAF`); return; }
//     setEtape("loading");
//     try {
//       const token = localStorage.getItem("token");
//       await api.post(`/cartes/${carte.id}/recharger`, { montant: Number(montant) }, { headers: { Authorization: `Bearer ${token}` } });
//       setEtape("succes");
//       if (onSuccess) onSuccess(Number(montant));
//     } catch (e) {
//       setErreur(e.response?.data?.message || "Erreur lors de la recharge.");
//       setEtape("erreur");
//     }
//   };

//   return (
//     <div style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1100, padding:16 }}>
//       <div style={{ background:"#fff", borderRadius:20, width:"100%", maxWidth:420, boxShadow:"0 32px 80px rgba(0,0,0,0.22)", overflow:"hidden" }}>
//         <div style={{ background:`linear-gradient(135deg,${C.dark},${C.primary2})`, padding:"20px 24px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
//           <div style={{ display:"flex", alignItems:"center", gap:10 }}>
//             <div style={{ width:36, height:36, borderRadius:10, background:"rgba(255,255,255,0.15)", display:"flex", alignItems:"center", justifyContent:"center" }}>
//               <FiDollarSign size={18} color="#fff"/>
//             </div>
//             <div>
//               <div style={{ color:"#fff", fontWeight:700, fontSize:15 }}>Recharger la carte</div>
//               <div style={{ color:"rgba(255,255,255,0.6)", fontSize:11 }}>Wallet → Carte virtuelle</div>
//             </div>
//           </div>
//           {etape !== "loading" && (
//             <button onClick={onClose} style={{ background:"rgba(255,255,255,0.12)", border:"none", borderRadius:8, width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"#fff" }}>
//               <FiX size={16}/>
//             </button>
//           )}
//         </div>

//         <div style={{ padding:24 }}>
//           {etape === "montant" && (
//             <div>
//               {/* Mini carte */}
//               <div style={{ display:"flex", justifyContent:"center", marginBottom:18 }}>
//                 <div style={{ width:200, height:118, borderRadius:12, background:design.gradient, padding:"12px 14px", color:"#fff", boxSizing:"border-box", position:"relative", overflow:"hidden" }}>
//                   <div style={{ position:"absolute", top:-10, right:-10, width:60, height:60, borderRadius:"50%", background:"rgba(255,255,255,0.07)" }}/>
//                   <p style={{ fontSize:7, opacity:0.6, margin:"0 0 12px", letterSpacing:1.5 }}>CARTE VIRTUELLE</p>
//                   <p style={{ fontSize:11, fontWeight:700, letterSpacing:2.5, margin:"0 0 8px", fontFamily:"monospace" }}>•••• •••• •••• {carte.numero?.slice(-4) || "0000"}</p>
//                   <p style={{ fontSize:8, opacity:0.7, margin:0 }}>Exp. {carte.dateExpiration || "••/••"}</p>
//                 </div>
//               </div>

//               {/* Flux wallet → carte */}
//               <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20, padding:"10px 14px", background:"#f5f3ff", borderRadius:10, border:`1px solid ${C.border}` }}>
//                 <div style={{ display:"flex", alignItems:"center", gap:6 }}>
//                   <MdOutlineAccountBalanceWallet size={16} color={C.primary2}/>
//                   <div>
//                     <p style={{ fontSize:10, color:C.muted, margin:0 }}>Wallet</p>
//                     <p style={{ fontSize:12, fontWeight:700, color:C.text, margin:0 }}>{soldeWallet.toLocaleString("fr-FR")} XAF</p>
//                   </div>
//                 </div>
//                 <FiArrowRight size={16} color={C.muted} style={{ flexShrink:0 }}/>
//                 <div style={{ display:"flex", alignItems:"center", gap:6 }}>
//                   <FiCreditCard size={16} color={C.primary2}/>
//                   <div>
//                     <p style={{ fontSize:10, color:C.muted, margin:0 }}>Carte</p>
//                     <p style={{ fontSize:12, fontWeight:700, color:C.text, margin:0 }}>•••• {carte.numero?.slice(-4) || "0000"}</p>
//                   </div>
//                 </div>
//               </div>

//               <div style={{ marginBottom:14 }}>
//                 <label style={lbl}>Montant à recharger (XAF) <span style={{ color:"#dc2626" }}>*</span></label>
//                 <input type="number" value={montant} onChange={e => setMontant(e.target.value)} placeholder="Ex: 5000" min={100}
//                   style={{ width:"100%", padding:"12px 14px", border:`1px solid ${C.border}`, borderRadius:10, fontSize:16, fontWeight:700, color:C.text, outline:"none", fontFamily:"inherit", boxSizing:"border-box" }}/>
//                 <p style={{ fontSize:10, color:C.muted, margin:"4px 0 0" }}>Minimum : 100 XAF · Disponible : {soldeWallet.toLocaleString("fr-FR")} XAF</p>
//               </div>

//               <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:18 }}>
//                 {montantsRapides.map(m => (
//                   <button key={m} onClick={() => setMontant(String(m))}
//                     style={{ padding:"8px 0", borderRadius:8, fontSize:12, fontWeight:600, border:`1px solid ${montant==m?C.primary2:C.border}`, background:montant==m?"#f5f3ff":"#fff", color:montant==m?C.primary2:C.muted, cursor:"pointer" }}>
//                     {m.toLocaleString("fr-FR")}
//                   </button>
//                 ))}
//               </div>

//               {erreur && (
//                 <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 12px", background:"#fef2f2", borderRadius:10, marginBottom:14 }}>
//                   <FiAlertCircle size={14} color="#dc2626"/>
//                   <span style={{ fontSize:12, color:"#dc2626" }}>{erreur}</span>
//                 </div>
//               )}

//               {montant && Number(montant) >= 100 && (
//                 <div style={{ padding:"12px 14px", background:"#f5f3ff", borderRadius:10, marginBottom:16, border:`1px solid ${C.border}` }}>
//                   <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:C.muted, marginBottom:4 }}>
//                     <span>Montant rechargé</span><span style={{ fontWeight:700, color:C.text }}>{Number(montant).toLocaleString("fr-FR")} XAF</span>
//                   </div>
//                   <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:C.muted, marginBottom:4 }}>
//                     <span>Frais</span><span style={{ fontWeight:600, color:"#16a34a" }}>0 XAF</span>
//                   </div>
//                   <div style={{ height:1, background:C.border, margin:"8px 0" }}/>
//                   <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, fontWeight:700 }}>
//                     <span style={{ color:C.text }}>Nouveau solde wallet</span>
//                     <span style={{ color:C.primary2 }}>{(soldeWallet - Number(montant)).toLocaleString("fr-FR")} XAF</span>
//                   </div>
//                 </div>
//               )}

//               <button onClick={recharger}
//                 style={{ width:"100%", padding:"13px 0", background:`linear-gradient(135deg,${C.dark},${C.primary2})`, color:"#fff", border:"none", borderRadius:12, fontSize:14, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
//                 <FiCheck size={14}/> Confirmer la recharge
//               </button>
//             </div>
//           )}

//           {etape === "loading" && (
//             <div style={{ textAlign:"center", padding:"32px 0" }}>
//               <div style={{ width:56, height:56, border:`4px solid ${C.border}`, borderTop:`4px solid ${C.primary}`, borderRadius:"50%", margin:"0 auto 16px", animation:"spin 1s linear infinite" }}/>
//               <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
//               <p style={{ fontSize:13, color:C.muted }}>Transfert en cours...</p>
//             </div>
//           )}

//           {etape === "succes" && (
//             <div style={{ textAlign:"center", padding:"10px 0" }}>
//               <div style={{ width:72, height:72, borderRadius:"50%", background:"#f0fdf4", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
//                 <FiCheckCircle size={36} color="#16a34a"/>
//               </div>
//               <h3 style={{ fontSize:16, fontWeight:700, color:C.text, margin:"0 0 8px" }}>Carte rechargée !</h3>
//               <p style={{ fontSize:13, color:C.muted, margin:"0 0 20px", lineHeight:1.6 }}>
//                 <strong style={{ color:"#16a34a" }}>{Number(montant).toLocaleString("fr-FR")} XAF</strong> transférés vers la carte <strong>•••• {carte.numero?.slice(-4) || "0000"}</strong>.
//               </p>
//               <button onClick={onClose} style={{ width:"100%", padding:"13px 0", background:"linear-gradient(135deg,#15803d,#16a34a)", color:"#fff", border:"none", borderRadius:12, fontSize:14, fontWeight:700, cursor:"pointer" }}>
//                 Retour aux cartes
//               </button>
//             </div>
//           )}

//           {etape === "erreur" && (
//             <div style={{ textAlign:"center", padding:"10px 0" }}>
//               <div style={{ width:72, height:72, borderRadius:"50%", background:"#fef2f2", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
//                 <FiAlertCircle size={36} color="#dc2626"/>
//               </div>
//               <h3 style={{ fontSize:16, fontWeight:700, color:C.text, margin:"0 0 8px" }}>Échec de la recharge</h3>
//               <p style={{ fontSize:13, color:C.muted, margin:"0 0 20px", lineHeight:1.6 }}>{erreur}</p>
//               <div style={{ display:"flex", gap:10 }}>
//                 <button onClick={onClose} style={{ flex:1, padding:"11px 0", background:"#f8fafc", border:`1px solid ${C.border}`, borderRadius:10, fontSize:13, fontWeight:600, cursor:"pointer", color:C.muted }}>Fermer</button>
//                 <button onClick={() => { setEtape("montant"); setErreur(""); }} style={{ flex:1, padding:"11px 0", background:C.primary2, border:"none", borderRadius:10, fontSize:13, fontWeight:700, cursor:"pointer", color:"#fff" }}>Réessayer</button>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

// // ═══════════════════════════════════════════════════════════════
// //  PAGE PRINCIPALE : Mes cartes
// // ═══════════════════════════════════════════════════════════════
// export default function PageCartes({ dashData }) {
//   const [cartes,          setCartes]          = useState([]);
//   const [loading,         setLoading]         = useState(true);
//   const [msg,             setMsg]             = useState(null);
//   const [searchCarte,     setSearchCarte]     = useState("");
//   const [filtreStatut,    setFiltreStatut]    = useState("Tous");
//   const [showModal,       setShowModal]       = useState(false);
//   const [typeChoisi,      setTypeChoisi]      = useState(null);
//   const [nomCarte,        setNomCarte]        = useState("");
//   const [soldeInit,       setSoldeInit]       = useState("");
//   const [designChoisi,    setDesignChoisi]    = useState("violet");
//   const [pin,             setPin]             = useState(["","","",""]);
//   const [etapeModal,      setEtapeModal]      = useState("liste");
//   const [actionId,        setActionId]        = useState(null);
//   const [confirmSuppr,    setConfirmSuppr]    = useState(null);
//   const [carteARecharger, setCarteARecharger] = useState(null);
//   const [cartesVisibles,  setCartesVisibles]  = useState({});
//   const [copieStates,     setCopieStates]     = useState({});

//   const token       = localStorage.getItem("token");
//   const headers     = { Authorization: `Bearer ${token}` };
//   const soldeWallet = Number(dashData?.solde || 0);

//   const chargerCartes = async () => {
//     try {
//       setLoading(true);
//       const res = await api.get("/cartes/mes-cartes", { headers });
//       setCartes(res.data.cartes || []);
//     } catch { setCartes([]); } finally { setLoading(false); }
//   };

//   useEffect(() => { chargerCartes(); }, []);

//   const afficherMsg = (type, text) => {
//     setMsg({ type, text });
//     setTimeout(() => setMsg(null), 3500);
//   };

//   const toggleVisible = (id) =>
//     setCartesVisibles(prev => ({ ...prev, [id]: !prev[id] }));

//   const handleCopier = (carteId, valeur) => {
//     copier(valeur, () => {
//       setCopieStates(prev => ({ ...prev, [carteId]: true }));
//       setTimeout(() => setCopieStates(prev => ({ ...prev, [carteId]: false })), 2000);
//     });
//   };

//   const ouvrirModal = (type) => {
//     setTypeChoisi(type);
//     setNomCarte(dashData?.user?.nom?.toUpperCase() || "");
//     setSoldeInit("");
//     setPin(["","","",""]);
//     setDesignChoisi("violet");
//     setEtapeModal("form");
//     setShowModal(true);
//   };

//   // ── Création de carte ────────────────────────────────────────
//   // Frais d'émission = 0 XAF
//   // Solde initial = libre (0 minimum), débité du wallet
//   const creerCarte = async () => {
//     const FRAIS = 0;
//     const soldeInitNum = Math.max(0, Number(soldeInit) || 0);
//     const total = FRAIS + soldeInitNum;

//     // Vérification côté front
//     if (soldeInitNum > 0 && total > soldeWallet) {
//       afficherMsg("error", `Solde wallet insuffisant. Disponible : ${soldeWallet.toLocaleString("fr-FR")} XAF. Requis : ${total.toLocaleString("fr-FR")} XAF.`);
//       return;
//     }

//     setEtapeModal("loading");
//     try {
//       await api.post(
//         "/cartes/creer",
//         {
//           type:         typeChoisi?.nom,
//           devise:       "XAF",
//           design:       designChoisi,
//           soldeInitial: soldeInitNum,
//         },
//         { headers }
//       );
//       afficherMsg("success", "Carte créée avec succès !");
//       chargerCartes();
//       setEtapeModal("success");
//     } catch (e) {
//       afficherMsg("error", e.response?.data?.message || "Erreur lors de la création.");
//       setEtapeModal("form");
//     }
//   };

//   const bloquerCarte   = async (id) => { try { setActionId(id); await api.put(`/cartes/${id}/bloquer`, {}, { headers }); afficherMsg("success","Carte bloquée."); chargerCartes(); } catch (e) { afficherMsg("error", e.response?.data?.message||"Erreur."); } finally { setActionId(null); } };
//   const debloquerCarte = async (id) => { try { setActionId(id); await api.put(`/cartes/${id}/debloquer`, {}, { headers }); afficherMsg("success","Carte débloquée."); chargerCartes(); } catch (e) { afficherMsg("error", e.response?.data?.message||"Erreur."); } finally { setActionId(null); } };
//   const supprimerCarte = async (id) => { try { setActionId(id); await api.delete(`/cartes/${id}`, { headers }); afficherMsg("success","Carte supprimée."); setConfirmSuppr(null); chargerCartes(); } catch (e) { afficherMsg("error", e.response?.data?.message||"Erreur."); } finally { setActionId(null); } };

//   const cartesFiltrees = cartes.filter(c => {
//     const matchStatut = filtreStatut === "Tous" || c.statut === filtreStatut;
//     const matchSearch = !searchCarte || c.numero?.includes(searchCarte);
//     return matchStatut && matchSearch;
//   });

//   const nbActives  = cartes.filter(c => c.statut === "ACTIVE").length;
//   const nbBloquees = cartes.filter(c => c.statut === "BLOQUEE").length;

//   // ── Calcul récap modal ───────────────────────────────────────
//   const soldeInitNum   = Math.max(0, Number(soldeInit) || 0);
//   const totalADebiter  = soldeInitNum; // frais = 0, donc total = solde initial

//   return (
//     <div>
//       {/* ── En-tête ── */}
//       <div style={{ background:"linear-gradient(135deg,#2e1065,#7c3aed)", borderRadius:16, padding:"22px 26px", color:"#fff", marginBottom:20, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
//         <div>
//           <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
//             <FiCreditCard size={18}/>
//             <span style={{ fontSize:18, fontWeight:800 }}>Mes cartes</span>
//           </div>
//           <p style={{ fontSize:12, opacity:0.7, margin:0 }}>Gérez vos cartes virtuelles PayVirtual</p>
//         </div>
//         <button onClick={() => { setTypeChoisi(null); setEtapeModal("liste"); setShowModal(true); }}
//           style={{ background:"rgba(255,255,255,0.15)", border:"1px solid rgba(255,255,255,0.25)", color:"#fff", borderRadius:10, padding:"10px 18px", fontSize:12, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
//           <FiPlus size={14}/> Créer une nouvelle carte
//         </button>
//       </div>

//       {/* ── Stats ── */}
//       <div style={{ display:"flex", gap:12, marginBottom:20 }}>
//         {[
//           { label:"Total",    val:cartes.length, color:C.primary2, bg:"#f5f3ff", border:C.border },
//           { label:"Actives",  val:nbActives,     color:"#16a34a",  bg:"#f0fdf4", border:"#bbf7d0" },
//           { label:"Bloquées", val:nbBloquees,    color:"#ef4444",  bg:"#fef2f2", border:"#fecaca" },
//         ].map(s => (
//           <div key={s.label} style={{ flex:1, background:s.bg, border:`1px solid ${s.border}`, borderRadius:12, padding:"14px 18px", textAlign:"center" }}>
//             <div style={{ fontSize:26, fontWeight:900, color:s.color }}>{s.val}</div>
//             <div style={{ fontSize:11, color:"#64748b", fontWeight:500, marginTop:2 }}>{s.label}</div>
//           </div>
//         ))}
//       </div>

//       {/* ── Message flash ── */}
//       {msg && (
//         <div style={{ padding:"10px 14px", borderRadius:8, marginBottom:16, fontSize:13, fontWeight:600, background:msg.type==="success"?"#f0fdf4":"#fef2f2", color:msg.type==="success"?"#16a34a":"#dc2626", border:`1px solid ${msg.type==="success"?"#bbf7d0":"#fecaca"}` }}>
//           {msg.text}
//         </div>
//       )}

//       {/* ── Liste cartes ── */}
//       <div style={{ background:"#fff", borderRadius:16, padding:"20px 22px", border:`1px solid ${C.border}`, marginBottom:20 }}>
//         <div style={{ display:"flex", gap:12, marginBottom:18 }}>
//           <div style={{ flex:1, display:"flex", alignItems:"center", gap:8, background:"#f8fafc", borderRadius:10, padding:"8px 14px", border:`1px solid ${C.border}` }}>
//             <FiSearch size={13} color={C.muted}/>
//             <input value={searchCarte} onChange={e => setSearchCarte(e.target.value)} placeholder="Rechercher par numéro..."
//               style={{ border:"none", background:"transparent", fontSize:12, outline:"none", color:C.text, flex:1 }}/>
//           </div>
//           <select value={filtreStatut} onChange={e => setFiltreStatut(e.target.value)}
//             style={{ padding:"8px 14px", borderRadius:10, border:`1px solid ${C.border}`, fontSize:12, color:C.muted, background:"#f8fafc", cursor:"pointer" }}>
//             <option value="Tous">Tous les statuts</option>
//             <option value="ACTIVE">Active</option>
//             <option value="BLOQUEE">Bloquée</option>
//           </select>
//         </div>

//         {loading ? (
//           <p style={{ textAlign:"center", color:C.muted, padding:30 }}>Chargement...</p>
//         ) : cartesFiltrees.length === 0 ? (
//           <div style={{ textAlign:"center", padding:"40px 0" }}>
//             <div style={{ width:72, height:72, borderRadius:"50%", background:"#f5f3ff", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px", opacity:0.6 }}>
//               <FiCreditCard size={30} color={C.primary}/>
//             </div>
//             <p style={{ fontSize:14, fontWeight:700, color:C.text, margin:"0 0 6px" }}>Aucune carte trouvée</p>
//             <p style={{ fontSize:12, color:C.muted, margin:0 }}>Modifiez vos filtres ou créez une nouvelle carte.</p>
//           </div>
//         ) : (
//           <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
//             {cartesFiltrees.map((c, i) => {
//               const design    = designs.find(d => d.id === (c.design || "violet")) || designs[i % designs.length];
//               const bloquee   = c.statut === "BLOQUEE";
//               const enAction  = actionId === c.id;
//               const visible   = !!cartesVisibles[c.id];
//               const numFormat = formatNumero(c.numero || "");

//               return (
//                 <div key={c.id} style={{ background:"#f8fafc", borderRadius:16, border:`1px solid ${C.border}`, overflow:"hidden" }}>
//                   <div style={{ display:"flex", gap:20, padding:"18px 20px", flexWrap:"wrap" }}>

//                     <CarteVisuelle carte={c} design={design} bloquee={bloquee} visible={visible}/>

//                     <div style={{ flex:1, minWidth:200, display:"flex", flexDirection:"column", justifyContent:"space-between" }}>

//                       <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
//                         <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:20, background:bloquee?"#fef2f2":"#f0fdf4", color:bloquee?"#ef4444":"#16a34a" }}>
//                           {bloquee ? "🔒 BLOQUÉE" : "✅ ACTIVE"}
//                         </span>
//                         <button
//                           onClick={() => toggleVisible(c.id)}
//                           title={visible ? "Masquer les infos" : "Afficher les infos"}
//                           style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 12px", borderRadius:8, fontSize:11, fontWeight:700, border:`1px solid ${visible ? C.primary2 : C.border}`, background: visible ? "#f5f3ff" : "#fff", color: visible ? C.primary2 : C.muted, cursor:"pointer", transition:"all .2s" }}>
//                           {visible ? <FiEyeOff size={13}/> : <FiEye size={13}/>}
//                           {visible ? "Masquer" : "Afficher"}
//                         </button>
//                       </div>

//                       <div style={{ marginBottom:12 }}>
//                         <LigneInfo label="Numéro" valeur={numFormat} masquee={true} visible={visible} onCopier={(v) => handleCopier(`${c.id}-num`, v)} copie={copieStates[`${c.id}-num`]}/>
//                         <LigneInfo label="Expiration" valeur={c.dateExpiration || "—"} masquee={false} visible={visible} onCopier={(v) => handleCopier(`${c.id}-exp`, v)} copie={copieStates[`${c.id}-exp`]}/>
//                         <LigneInfo label="CVV" valeur={c.cvv || "•••"} masquee={false} visible={visible} onCopier={(v) => handleCopier(`${c.id}-cvv`, v)} copie={copieStates[`${c.id}-cvv`]}/>
//                         <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingTop:7 }}>
//                           <span style={{ fontSize:11, color:C.muted, fontWeight:600 }}>Solde</span>
//                           <span style={{ fontSize:13, fontWeight:800, color:C.primary2 }}>
//                             {Number(c.solde || 0).toLocaleString("fr-FR")} XAF
//                           </span>
//                         </div>
//                       </div>

//                       <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
//                         <button onClick={() => setCarteARecharger(c)} disabled={bloquee || enAction}
//                           style={{ display:"flex", alignItems:"center", gap:5, padding:"7px 12px", borderRadius:8, border:`1px solid ${C.primary2}`, background:"#f5f3ff", color:C.primary2, fontSize:11, fontWeight:700, cursor:bloquee?"not-allowed":"pointer", opacity:bloquee?0.5:1 }}>
//                           <FiDollarSign size={13}/> Recharger
//                         </button>

//                         {bloquee ? (
//                           <button onClick={() => debloquerCarte(c.id)} disabled={enAction}
//                             style={{ display:"flex", alignItems:"center", gap:5, padding:"7px 12px", borderRadius:8, border:"1px solid #16a34a", background:"#f0fdf4", color:"#16a34a", fontSize:11, fontWeight:700, cursor:"pointer", opacity:enAction?0.6:1 }}>
//                             <FiUnlock size={13}/> {enAction ? "..." : "Débloquer"}
//                           </button>
//                         ) : (
//                           <button onClick={() => bloquerCarte(c.id)} disabled={enAction}
//                             style={{ display:"flex", alignItems:"center", gap:5, padding:"7px 12px", borderRadius:8, border:"1px solid #f59e0b", background:"#fffbeb", color:"#d97706", fontSize:11, fontWeight:700, cursor:"pointer", opacity:enAction?0.6:1 }}>
//                             <FiLock size={13}/> {enAction ? "..." : "Bloquer"}
//                           </button>
//                         )}

//                         <button onClick={() => setConfirmSuppr(c.id)} disabled={enAction}
//                           style={{ display:"flex", alignItems:"center", gap:5, padding:"7px 12px", borderRadius:8, border:"1px solid #ef4444", background:"#fef2f2", color:"#ef4444", fontSize:11, fontWeight:700, cursor:"pointer", opacity:enAction?0.6:1 }}>
//                           <FiTrash2 size={13}/> Supprimer
//                         </button>
//                       </div>
//                     </div>
//                   </div>

//                   {visible && (
//                     <div style={{ background:"linear-gradient(90deg,#f5f3ff,#ede9fe)", borderTop:`1px solid ${C.border}`, padding:"8px 20px", display:"flex", alignItems:"center", gap:6 }}>
//                       <FiEye size={12} color={C.primary2}/>
//                       <span style={{ fontSize:11, color:C.primary2, fontWeight:600 }}>Informations sensibles visibles — cliquez sur "Masquer" quand vous avez terminé.</span>
//                     </div>
//                   )}
//                 </div>
//               );
//             })}
//           </div>
//         )}
//       </div>

//       {/* ── Catalogue types de cartes ── */}
//       <div style={{ background:"#fff", borderRadius:16, padding:"22px", border:`1px solid ${C.border}` }}>
//         <div style={{ background:"linear-gradient(135deg,#2e1065,#7c3aed)", borderRadius:12, padding:"22px 24px", marginBottom:20, color:"#fff" }}>
//           <p style={{ fontSize:16, fontWeight:800, margin:"0 0 6px" }}>
//             Choisissez votre carte virtuelle — <span style={{ color:"#c4b5fd" }}>Émission instantanée & gratuite</span>
//           </p>
//           <p style={{ fontSize:11, opacity:0.7, margin:0 }}>Cartes virtuelles acceptées partout dans le monde, avec sécurité 3DS.</p>
//           <div style={{ display:"flex", gap:24, marginTop:14, fontSize:11, opacity:0.8 }}>
//             <span>🏪 Des marchands</span><span>🌍 20+ pays</span><span>🔒 3DS Sécurisé</span><span>🕐 24h/24</span>
//           </div>
//         </div>
//         <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16 }}>
//           {typesCarte.map(tc => (
//             <div key={tc.id} style={{ border:`1px solid ${C.border}`, borderRadius:14, padding:20, textAlign:"center" }}>
//               <span style={{ fontSize:9, fontWeight:800, color:"#fff", background:tc.id==="credit"?"#92400e":tc.id==="debit"?C.primary2:"#166534", borderRadius:20, padding:"3px 10px", letterSpacing:0.8 }}>{tc.badge}</span>
//               <div style={{ fontSize:28, margin:"14px 0 6px" }}>
//                 {tc.logo === "VISA" ? <span style={{ color:"#1a1f71", fontWeight:900, fontSize:22 }}>VISA</span> : tc.logo}
//               </div>
//               <p style={{ fontSize:13, fontWeight:700, color:C.text, margin:"0 0 6px" }}>{tc.nom}</p>
//               <p style={{ fontSize:11, color:C.muted, margin:"0 0 14px", lineHeight:1.4 }}>{tc.desc}</p>

//               {/* Badge émission gratuite */}
//               <div style={{ display:"inline-flex", alignItems:"center", gap:4, background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:20, padding:"4px 12px", marginBottom:14 }}>
//                 <FiCheck size={11} color="#16a34a"/>
//                 <span style={{ fontSize:11, fontWeight:700, color:"#16a34a" }}>Émission gratuite</span>
//               </div>

//               <button onClick={() => ouvrirModal(tc)}
//                 style={{ width:"100%", marginTop:4, background:C.primary2, color:"#fff", border:"none", borderRadius:10, padding:"11px 0", fontSize:13, fontWeight:700, cursor:"pointer" }}>
//                 Créer →
//               </button>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* ══════════════════ MODAL CRÉATION ══════════════════ */}
//       {showModal && (
//         <div style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.55)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 }}>
//           <div style={{ background:"#fff", borderRadius:16, width:460, maxHeight:"90vh", overflowY:"auto", boxShadow:"0 24px 64px rgba(0,0,0,0.18)", overflow:"hidden" }}>
//             <div style={{ background:C.primary, padding:"16px 20px", display:"flex", justifyContent:"space-between", alignItems:"center", color:"#fff" }}>
//               <div style={{ display:"flex", alignItems:"center", gap:8, fontWeight:700, fontSize:14 }}>
//                 <FiCreditCard size={16}/> Créer une carte
//               </div>
//               <button onClick={() => setShowModal(false)} style={{ background:"none", border:"none", color:"#fff", cursor:"pointer" }}>
//                 <FiX size={18}/>
//               </button>
//             </div>

//             <div style={{ padding:24 }}>
//               {/* Étape 1 : choix du type */}
//               {etapeModal === "liste" && (
//                 <>
//                   <p style={{ fontSize:13, color:C.muted, marginBottom:16 }}>Choisissez un type de carte :</p>
//                   {typesCarte.map(tc => (
//                     <button key={tc.id} onClick={() => { setTypeChoisi(tc); setEtapeModal("form"); }}
//                       style={{ display:"flex", alignItems:"center", justifyContent:"space-between", width:"100%", background:"#f5f3ff", border:`1px solid ${C.border}`, borderRadius:10, padding:"12px 16px", marginBottom:8, cursor:"pointer", textAlign:"left" }}>
//                       <div>
//                         <div style={{ fontSize:13, fontWeight:700, color:C.text }}>{tc.nom}</div>
//                         <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{tc.desc}</div>
//                       </div>
//                       <div style={{ display:"flex", alignItems:"center", gap:4, background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:20, padding:"3px 10px", flexShrink:0, marginLeft:10 }}>
//                         <FiCheck size={10} color="#16a34a"/>
//                         <span style={{ fontSize:10, fontWeight:700, color:"#16a34a" }}>Gratuit</span>
//                       </div>
//                     </button>
//                   ))}
//                 </>
//               )}

//               {/* Étape 2 : formulaire */}
//               {etapeModal === "form" && typeChoisi && (
//                 <>
//                   <div style={{ textAlign:"center", marginBottom:16 }}>
//                     <p style={{ fontSize:15, fontWeight:700, color:C.text, margin:"0 0 2px" }}>{typeChoisi.nom}</p>
//                     <p style={{ fontSize:11, color:C.muted, margin:0 }}>Devise : XAF · Émission gratuite</p>
//                   </div>

//                   {/* Aperçu carte */}
//                   <div style={{ display:"flex", justifyContent:"center", marginBottom:14 }}>
//                     <div style={{ width:220, height:130, borderRadius:14, background:designs.find(d=>d.id===designChoisi)?.gradient||designs[0].gradient, padding:"14px 16px", color:"#fff", boxSizing:"border-box", position:"relative", overflow:"hidden", boxShadow:"0 8px 24px rgba(0,0,0,0.15)" }}>
//                       <div style={{ position:"absolute", top:-10, right:-10, width:60, height:60, borderRadius:"50%", background:"rgba(255,255,255,0.08)" }}/>
//                       <p style={{ fontSize:7, opacity:0.6, margin:"0 0 14px", letterSpacing:1.5 }}>CARTE VIRTUELLE</p>
//                       <p style={{ fontSize:12, fontWeight:700, letterSpacing:2.5, margin:"0 0 10px", fontFamily:"monospace" }}>•••• •••• •••• ••••</p>
//                       <p style={{ fontSize:10, opacity:0.8, margin:0 }}>{nomCarte || "NOM TITULAIRE"}</p>
//                     </div>
//                   </div>

//                   {/* Choix couleur */}
//                   <p style={{ fontSize:11, fontWeight:700, color:C.muted, marginBottom:6 }}>Couleur de la carte</p>
//                   <div style={{ display:"flex", gap:8, marginBottom:16 }}>
//                     {designs.map(d => (
//                       <div key={d.id} onClick={() => setDesignChoisi(d.id)}
//                         style={{ width:44, height:28, borderRadius:8, background:d.gradient, cursor:"pointer", border:designChoisi===d.id?"3px solid #0f172a":"3px solid transparent", transition:"border .15s" }} title={d.label}/>
//                     ))}
//                   </div>

//                   {/* Nom sur la carte */}
//                   <div style={{ marginBottom:14 }}>
//                     <label style={lbl}>Nom sur la carte *</label>
//                     <input value={nomCarte} onChange={e => setNomCarte(e.target.value)} placeholder="NOM PRÉNOM" style={inp}/>
//                   </div>

//                   {/* Solde initial */}
//                   <div style={{ marginBottom:14 }}>
//                     <label style={lbl}>Solde initial (XAF) <span style={{ color:C.muted, fontWeight:400 }}>— optionnel</span></label>
//                     <div style={{ display:"flex", alignItems:"center", border:`1px solid ${C.border}`, borderRadius:8, overflow:"hidden" }}>
//                       <span style={{ padding:"9px 10px", background:"#f8fafc", fontSize:12, color:C.muted, borderRight:`1px solid ${C.border}` }}>XAF</span>
//                       <input
//                         type="number"
//                         value={soldeInit}
//                         onChange={e => setSoldeInit(e.target.value)}
//                         placeholder="0"
//                         min={0}
//                         style={{ flex:1, padding:"9px 10px", border:"none", fontSize:13, fontWeight:600, outline:"none", background:"#fff" }}
//                       />
//                     </div>
//                     <p style={{ fontSize:10, color:C.muted, margin:"4px 0 0" }}>
//                       Wallet disponible : <strong style={{ color:C.primary2 }}>{soldeWallet.toLocaleString("fr-FR")} XAF</strong>
//                     </p>
//                   </div>

//                   {/* Récap frais */}
//                   <div style={{ background:"#f8fafc", borderRadius:10, padding:"12px 14px", marginBottom:14, border:`1px solid ${C.border}` }}>
//                     <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:C.muted, marginBottom:6 }}>
//                       <span>Frais d'émission</span>
//                       <span style={{ fontWeight:700, color:"#16a34a", display:"flex", alignItems:"center", gap:4 }}>
//                         <FiCheck size={11}/> GRATUIT
//                       </span>
//                     </div>
//                     <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:C.muted, marginBottom:6 }}>
//                       <span>Solde initial</span>
//                       <span style={{ fontWeight:700, color:C.text }}>{soldeInitNum.toLocaleString("fr-FR")} XAF</span>
//                     </div>
//                     <div style={{ height:1, background:C.border, margin:"8px 0" }}/>
//                     <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, fontWeight:700 }}>
//                       <span style={{ color:C.text }}>Total débité du wallet</span>
//                       <span style={{ color: totalADebiter > 0 ? C.primary : "#16a34a" }}>
//                         {totalADebiter > 0 ? `${totalADebiter.toLocaleString("fr-FR")} XAF` : "0 XAF"}
//                       </span>
//                     </div>
//                     {totalADebiter > soldeWallet && (
//                       <div style={{ marginTop:8, display:"flex", alignItems:"center", gap:6, padding:"6px 10px", background:"#fef2f2", borderRadius:8 }}>
//                         <FiAlertCircle size={12} color="#dc2626"/>
//                         <span style={{ fontSize:11, color:"#dc2626" }}>Solde wallet insuffisant</span>
//                       </div>
//                     )}
//                   </div>

//                   {/* PIN */}
//                   <div style={{ marginBottom:18 }}>
//                     <label style={{ ...lbl, marginBottom:10 }}>Code PIN à 4 chiffres *</label>
//                     <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
//                       {pin.map((p, i) => (
//                         <input key={i} type="password" maxLength={1} value={p}
//                           onChange={e => { const np=[...pin]; np[i]=e.target.value; setPin(np); if(e.target.value&&i<3) document.getElementById(`pin-${i+1}`)?.focus(); }}
//                           id={`pin-${i}`}
//                           style={{ width:48, height:48, textAlign:"center", border:`2px solid ${C.border}`, borderRadius:10, fontSize:20, fontWeight:700, outline:"none", color:C.primary, transition:"border .15s" }}
//                           onFocus={e => e.target.style.borderColor = C.primary2}
//                           onBlur={e  => e.target.style.borderColor = C.border}/>
//                       ))}
//                     </div>
//                   </div>

//                   <div style={{ display:"flex", gap:10 }}>
//                     <button onClick={() => setShowModal(false)}
//                       style={{ flex:1, background:"#f8fafc", border:`1px solid ${C.border}`, borderRadius:8, padding:"10px 0", fontSize:13, fontWeight:600, cursor:"pointer", color:C.muted }}>
//                       Annuler
//                     </button>
//                     <button
//                       onClick={creerCarte}
//                       disabled={totalADebiter > soldeWallet}
//                       style={{ flex:1.5, background: totalADebiter > soldeWallet ? "#d1d5db" : C.primary2, color:"#fff", border:"none", borderRadius:8, padding:"10px 0", fontSize:13, fontWeight:700, cursor: totalADebiter > soldeWallet ? "not-allowed" : "pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6, transition:"background .2s" }}>
//                       <FiCheck size={14}/> Confirmer & Créer
//                     </button>
//                   </div>
//                 </>
//               )}

//               {etapeModal === "loading" && (
//                 <div style={{ textAlign:"center", padding:"32px 0" }}>
//                   <div style={{ width:48, height:48, border:`4px solid ${C.border}`, borderTop:`4px solid ${C.primary}`, borderRadius:"50%", margin:"0 auto 16px", animation:"spin 1s linear infinite" }}/>
//                   <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
//                   <p style={{ fontSize:13, color:C.muted }}>Création de votre carte...</p>
//                 </div>
//               )}

//               {etapeModal === "success" && (
//                 <div style={{ textAlign:"center", padding:"24px 0" }}>
//                   <div style={{ width:56, height:56, borderRadius:"50%", background:"#dcfce7", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 14px", color:"#16a34a" }}>
//                     <FiCheck size={26}/>
//                   </div>
//                   <p style={{ fontSize:16, fontWeight:800, color:C.text, margin:"0 0 6px" }}>Carte créée !</p>
//                   <p style={{ fontSize:12, color:C.muted, marginBottom:6 }}>{typeChoisi?.nom} a été créée avec succès.</p>
//                   {soldeInitNum > 0 && (
//                     <p style={{ fontSize:12, color:"#16a34a", fontWeight:600, marginBottom:20 }}>
//                       Solde initial : {soldeInitNum.toLocaleString("fr-FR")} XAF crédité sur la carte.
//                     </p>
//                   )}
//                   <button onClick={() => setShowModal(false)}
//                     style={{ background:C.primary2, color:"#fff", border:"none", borderRadius:10, padding:"10px 32px", fontSize:13, fontWeight:700, cursor:"pointer" }}>
//                     OK
//                   </button>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       )}

//       {/* ══════════════════ MODAL SUPPRESSION ══════════════════ */}
//       {confirmSuppr && (
//         <div style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 }}>
//           <div style={{ background:"#fff", borderRadius:14, padding:28, width:340, boxShadow:"0 20px 60px rgba(0,0,0,0.15)" }}>
//             <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
//               <div style={{ width:40, height:40, borderRadius:10, background:"#fef2f2", display:"flex", alignItems:"center", justifyContent:"center", color:"#ef4444" }}>
//                 <FiAlertTriangle size={18}/>
//               </div>
//               <div>
//                 <div style={{ fontWeight:700, fontSize:15, color:C.text }}>Supprimer la carte</div>
//                 <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>Cette action est irréversible</div>
//               </div>
//             </div>
//             <p style={{ fontSize:13, color:C.muted, marginBottom:20, lineHeight:1.6 }}>
//               Êtes-vous sûr de vouloir supprimer cette carte ? Elle ne pourra plus être utilisée.
//             </p>
//             <div style={{ display:"flex", gap:10 }}>
//               <button onClick={() => setConfirmSuppr(null)}
//                 style={{ flex:1, background:"#f8fafc", border:`1px solid ${C.border}`, borderRadius:8, padding:"9px 0", fontSize:13, fontWeight:600, cursor:"pointer", color:C.muted }}>
//                 Annuler
//               </button>
//               <button onClick={() => supprimerCarte(confirmSuppr)}
//                 style={{ flex:1, background:"#ef4444", color:"#fff", border:"none", borderRadius:8, padding:"9px 0", fontSize:13, fontWeight:700, cursor:"pointer" }}>
//                 Supprimer
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* ══════════════════ MODAL RECHARGE ══════════════════ */}
//       {carteARecharger && (
//         <ModalRechargeCarte
//           carte={carteARecharger}
//           soldeWallet={soldeWallet}
//           onClose={() => setCarteARecharger(null)}
//           onSuccess={() => { setCarteARecharger(null); chargerCartes(); }}
//         />
//       )}
//     </div>
//   );
// }

// // ─── Styles helpers ──────────────────────────────────────────────
// const lbl = { display:"block", fontSize:11, fontWeight:600, color:"#374151", marginBottom:5 };
// const inp = { width:"100%", padding:"9px 12px", border:"1px solid #ede9fe", borderRadius:8, fontSize:12, outline:"none", background:"#fafafa", boxSizing:"border-box" };















// import { useState, useEffect } from "react";
// import {
//   FiCreditCard, FiPlus, FiSearch, FiX, FiCheck, FiLock, FiUnlock,
//   FiTrash2, FiAlertTriangle, FiDollarSign, FiArrowRight,
//   FiCheckCircle, FiAlertCircle, FiEye, FiEyeOff, FiCopy,
// } from "react-icons/fi";
// import { MdOutlineAccountBalanceWallet } from "react-icons/md";
// import api from "../../services/api";

// // ─── Palette & constantes ───────────────────────────────────────
// const C = {
//   primary:  "#6d28d9",
//   primary2: "#7c3aed",
//   primary3: "#8b5cf6",
//   dark:     "#2e1065",
//   border:   "#ede9fe",
//   text:     "#1e1b4b",
//   muted:    "#6b7280",
// };

// const designs = [
//   { id:"violet", label:"Violet",  gradient:"linear-gradient(135deg,#2e1065,#7c3aed)" },
//   { id:"blue",   label:"Bleu",    gradient:"linear-gradient(135deg,#1d4ed8,#3b82f6)" },
//   { id:"orange", label:"Orange",  gradient:"linear-gradient(135deg,#ea580c,#fb923c)" },
//   { id:"vert",   label:"Vert",    gradient:"linear-gradient(135deg,#065f46,#10b981)" },
// ];

// const typesCarte = [
//   { id:"prepayee", badge:"CARTE PRÉPAYÉE",  logo:"🔴🟠", nom:"Mastercard Argent",  desc:"Carte prépayée pour publicités (Meta, Google, TikTok)", frais:"10.000" },
//   { id:"debit",    badge:"CARTE DE DÉBIT",  logo:"🔴🟠", nom:"Mastercard World",   desc:"Carte de débit. Apple Pay & Google Pay. Publicités, Abonnements", frais:"15.000" },
//   { id:"credit",   badge:"CARTE DE CRÉDIT", logo:"VISA",  nom:"VISA Platinum",      desc:"Carte de crédit. Apple Pay & Google Pay. Crypto, POS & tous marchands", frais:"20.000" },
// ];

// // ─── Helper : formater numéro de carte en groupes de 4 ──────────
// const formatNumero = (n = "") => {
//   const clean = n.replace(/\s/g, "");
//   return clean.match(/.{1,4}/g)?.join(" ") || clean;
// };

// // ─── Helper : copier dans le presse-papier ──────────────────────
// const copier = (texte, cb) => {
//   navigator.clipboard.writeText(texte).then(() => cb && cb());
// };

// // ═══════════════════════════════════════════════════════════════
// //  COMPOSANT : Carte visuelle avec toggle masquage
// // ═══════════════════════════════════════════════════════════════
// function CarteVisuelle({ carte, design, bloquee, visible, style = {} }) {
//   const numero = formatNumero(carte.numero || "");
//   return (
//     <div style={{
//       width: 220, height: 130, borderRadius: 14,
//       background: bloquee ? "#94a3b8" : design.gradient,
//       padding: "14px 16px", color: "#fff", flexShrink: 0,
//       display: "flex", flexDirection: "column", justifyContent: "space-between",
//       opacity: bloquee ? 0.75 : 1, position: "relative", overflow: "hidden",
//       boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
//       transition: "all .3s",
//       ...style,
//     }}>
//       {/* Cercles décoratifs */}
//       <div style={{ position:"absolute", top:-20, right:-20, width:80, height:80, borderRadius:"50%", background:"rgba(255,255,255,0.07)" }}/>
//       <div style={{ position:"absolute", bottom:-15, left:-10, width:60, height:60, borderRadius:"50%", background:"rgba(255,255,255,0.05)" }}/>

//       {bloquee && (
//         <div style={{ position:"absolute", inset:0, borderRadius:14, background:"rgba(0,0,0,0.28)", display:"flex", alignItems:"center", justifyContent:"center" }}>
//           <FiLock size={28} color="#fff"/>
//         </div>
//       )}

//       {/* Header */}
//       <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
//         <span style={{ fontSize:8, opacity:0.65, letterSpacing:1.5 }}>PayVirtual</span>
//         <span style={{ fontSize:9, opacity:0.7, fontWeight:700 }}>{carte.type || "Mastercard"}</span>
//       </div>

//       {/* Numéro */}
//       <div>
//         <p style={{ fontSize:13, fontWeight:700, letterSpacing:2.5, margin:"0 0 5px", fontFamily:"monospace" }}>
//           {visible
//             ? numero
//             : `•••• •••• •••• ${(carte.numero || "").slice(-4) || "••••"}`
//           }
//         </p>
//         <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
//           <div>
//             <p style={{ fontSize:7, opacity:0.6, margin:"0 0 1px" }}>EXPIRE</p>
//             <p style={{ fontSize:9, fontWeight:700, margin:0 }}>
//               {visible ? (carte.dateExpiration || "—") : "••/••"}
//             </p>
//           </div>
//           <div style={{ textAlign:"right" }}>
//             <p style={{ fontSize:7, opacity:0.6, margin:"0 0 1px" }}>CVV</p>
//             <p style={{ fontSize:9, fontWeight:700, margin:0 }}>
//               {visible ? (carte.cvv || "•••") : "•••"}
//             </p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// // ═══════════════════════════════════════════════════════════════
// //  COMPOSANT : Ligne d'info copiable
// // ═══════════════════════════════════════════════════════════════
// function LigneInfo({ label, valeur, masquee, visible, onCopier, copie }) {
//   return (
//     <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"7px 0", borderBottom:`1px solid ${C.border}` }}>
//       <span style={{ fontSize:11, color:C.muted, fontWeight:600 }}>{label}</span>
//       <div style={{ display:"flex", alignItems:"center", gap:8 }}>
//         <span style={{ fontSize:12, fontWeight:700, color:C.text, fontFamily:"monospace" }}>
//           {masquee && !visible ? "•••• •••• •••• ••••" : valeur}
//         </span>
//         {visible && (
//           <button onClick={() => onCopier(valeur)}
//             title="Copier"
//             style={{ background:"none", border:"none", cursor:"pointer", color: copie ? "#16a34a" : C.muted, padding:2 }}>
//             {copie ? <FiCheck size={13}/> : <FiCopy size={13}/>}
//           </button>
//         )}
//       </div>
//     </div>
//   );
// }

// // ═══════════════════════════════════════════════════════════════
// //  MODAL : Recharge carte
// // ═══════════════════════════════════════════════════════════════
// function ModalRechargeCarte({ carte, soldeWallet, onClose, onSuccess }) {
//   const [etape,   setEtape]   = useState("montant");
//   const [montant, setMontant] = useState("");
//   const [erreur,  setErreur]  = useState("");

//   const montantsRapides = [1000, 2000, 5000, 10000, 25000, 50000];
//   const design = designs.find(d => d.id === (carte.design || "violet")) || designs[0];

//   const recharger = async () => {
//     setErreur("");
//     if (!montant || Number(montant) < 100) { setErreur("Montant minimum : 100 XAF"); return; }
//     if (Number(montant) > soldeWallet)     { setErreur(`Solde insuffisant. Disponible : ${soldeWallet.toLocaleString("fr-FR")} XAF`); return; }
//     setEtape("loading");
//     try {
//       const token = localStorage.getItem("token");
//       await api.post(`/cartes/${carte.id}/recharger`, { montant: Number(montant) }, { headers: { Authorization: `Bearer ${token}` } });
//       setEtape("succes");
//       if (onSuccess) onSuccess(Number(montant));
//     } catch (e) {
//       setErreur(e.response?.data?.message || "Erreur lors de la recharge.");
//       setEtape("erreur");
//     }
//   };

//   return (
//     <div style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1100, padding:16 }}>
//       <div style={{ background:"#fff", borderRadius:20, width:"100%", maxWidth:420, boxShadow:"0 32px 80px rgba(0,0,0,0.22)", overflow:"hidden" }}>
//         <div style={{ background:`linear-gradient(135deg,${C.dark},${C.primary2})`, padding:"20px 24px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
//           <div style={{ display:"flex", alignItems:"center", gap:10 }}>
//             <div style={{ width:36, height:36, borderRadius:10, background:"rgba(255,255,255,0.15)", display:"flex", alignItems:"center", justifyContent:"center" }}>
//               <FiDollarSign size={18} color="#fff"/>
//             </div>
//             <div>
//               <div style={{ color:"#fff", fontWeight:700, fontSize:15 }}>Recharger la carte</div>
//               <div style={{ color:"rgba(255,255,255,0.6)", fontSize:11 }}>Wallet → Carte virtuelle</div>
//             </div>
//           </div>
//           {etape !== "loading" && (
//             <button onClick={onClose} style={{ background:"rgba(255,255,255,0.12)", border:"none", borderRadius:8, width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"#fff" }}>
//               <FiX size={16}/>
//             </button>
//           )}
//         </div>

//         <div style={{ padding:24 }}>
//           {etape === "montant" && (
//             <div>
//               {/* Mini carte */}
//               <div style={{ display:"flex", justifyContent:"center", marginBottom:18 }}>
//                 <div style={{ width:200, height:118, borderRadius:12, background:design.gradient, padding:"12px 14px", color:"#fff", boxSizing:"border-box", position:"relative", overflow:"hidden" }}>
//                   <div style={{ position:"absolute", top:-10, right:-10, width:60, height:60, borderRadius:"50%", background:"rgba(255,255,255,0.07)" }}/>
//                   <p style={{ fontSize:7, opacity:0.6, margin:"0 0 12px", letterSpacing:1.5 }}>CARTE VIRTUELLE</p>
//                   <p style={{ fontSize:11, fontWeight:700, letterSpacing:2.5, margin:"0 0 8px", fontFamily:"monospace" }}>•••• •••• •••• {carte.numero?.slice(-4) || "0000"}</p>
//                   <p style={{ fontSize:8, opacity:0.7, margin:0 }}>Exp. {carte.dateExpiration || "••/••"}</p>
//                 </div>
//               </div>

//               {/* Flux wallet → carte */}
//               <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20, padding:"10px 14px", background:"#f5f3ff", borderRadius:10, border:`1px solid ${C.border}` }}>
//                 <div style={{ display:"flex", alignItems:"center", gap:6 }}>
//                   <MdOutlineAccountBalanceWallet size={16} color={C.primary2}/>
//                   <div>
//                     <p style={{ fontSize:10, color:C.muted, margin:0 }}>Wallet</p>
//                     <p style={{ fontSize:12, fontWeight:700, color:C.text, margin:0 }}>{soldeWallet.toLocaleString("fr-FR")} XAF</p>
//                   </div>
//                 </div>
//                 <FiArrowRight size={16} color={C.muted} style={{ flexShrink:0 }}/>
//                 <div style={{ display:"flex", alignItems:"center", gap:6 }}>
//                   <FiCreditCard size={16} color={C.primary2}/>
//                   <div>
//                     <p style={{ fontSize:10, color:C.muted, margin:0 }}>Carte</p>
//                     <p style={{ fontSize:12, fontWeight:700, color:C.text, margin:0 }}>•••• {carte.numero?.slice(-4) || "0000"}</p>
//                   </div>
//                 </div>
//               </div>

//               <div style={{ marginBottom:14 }}>
//                 <label style={lbl}>Montant à recharger (XAF) <span style={{ color:"#dc2626" }}>*</span></label>
//                 <input type="number" value={montant} onChange={e => setMontant(e.target.value)} placeholder="Ex: 5000" min={100}
//                   style={{ width:"100%", padding:"12px 14px", border:`1px solid ${C.border}`, borderRadius:10, fontSize:16, fontWeight:700, color:C.text, outline:"none", fontFamily:"inherit", boxSizing:"border-box" }}/>
//                 <p style={{ fontSize:10, color:C.muted, margin:"4px 0 0" }}>Minimum : 100 XAF · Disponible : {soldeWallet.toLocaleString("fr-FR")} XAF</p>
//               </div>

//               <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:18 }}>
//                 {montantsRapides.map(m => (
//                   <button key={m} onClick={() => setMontant(String(m))}
//                     style={{ padding:"8px 0", borderRadius:8, fontSize:12, fontWeight:600, border:`1px solid ${montant==m?C.primary2:C.border}`, background:montant==m?"#f5f3ff":"#fff", color:montant==m?C.primary2:C.muted, cursor:"pointer" }}>
//                     {m.toLocaleString("fr-FR")}
//                   </button>
//                 ))}
//               </div>

//               {erreur && (
//                 <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 12px", background:"#fef2f2", borderRadius:10, marginBottom:14 }}>
//                   <FiAlertCircle size={14} color="#dc2626"/>
//                   <span style={{ fontSize:12, color:"#dc2626" }}>{erreur}</span>
//                 </div>
//               )}

//               {montant && Number(montant) >= 100 && (
//                 <div style={{ padding:"12px 14px", background:"#f5f3ff", borderRadius:10, marginBottom:16, border:`1px solid ${C.border}` }}>
//                   <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:C.muted, marginBottom:4 }}>
//                     <span>Montant rechargé</span><span style={{ fontWeight:700, color:C.text }}>{Number(montant).toLocaleString("fr-FR")} XAF</span>
//                   </div>
//                   <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:C.muted, marginBottom:4 }}>
//                     <span>Frais</span><span style={{ fontWeight:600, color:"#16a34a" }}>0 XAF</span>
//                   </div>
//                   <div style={{ height:1, background:C.border, margin:"8px 0" }}/>
//                   <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, fontWeight:700 }}>
//                     <span style={{ color:C.text }}>Nouveau solde wallet</span>
//                     <span style={{ color:C.primary2 }}>{(soldeWallet - Number(montant)).toLocaleString("fr-FR")} XAF</span>
//                   </div>
//                 </div>
//               )}

//               <button onClick={recharger}
//                 style={{ width:"100%", padding:"13px 0", background:`linear-gradient(135deg,${C.dark},${C.primary2})`, color:"#fff", border:"none", borderRadius:12, fontSize:14, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
//                 <FiCheck size={14}/> Confirmer la recharge
//               </button>
//             </div>
//           )}

//           {etape === "loading" && (
//             <div style={{ textAlign:"center", padding:"32px 0" }}>
//               <div style={{ width:56, height:56, border:`4px solid ${C.border}`, borderTop:`4px solid ${C.primary}`, borderRadius:"50%", margin:"0 auto 16px", animation:"spin 1s linear infinite" }}/>
//               <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
//               <p style={{ fontSize:13, color:C.muted }}>Transfert en cours...</p>
//             </div>
//           )}

//           {etape === "succes" && (
//             <div style={{ textAlign:"center", padding:"10px 0" }}>
//               <div style={{ width:72, height:72, borderRadius:"50%", background:"#f0fdf4", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
//                 <FiCheckCircle size={36} color="#16a34a"/>
//               </div>
//               <h3 style={{ fontSize:16, fontWeight:700, color:C.text, margin:"0 0 8px" }}>Carte rechargée !</h3>
//               <p style={{ fontSize:13, color:C.muted, margin:"0 0 20px", lineHeight:1.6 }}>
//                 <strong style={{ color:"#16a34a" }}>{Number(montant).toLocaleString("fr-FR")} XAF</strong> transférés vers la carte <strong>•••• {carte.numero?.slice(-4) || "0000"}</strong>.
//               </p>
//               <button onClick={onClose} style={{ width:"100%", padding:"13px 0", background:"linear-gradient(135deg,#15803d,#16a34a)", color:"#fff", border:"none", borderRadius:12, fontSize:14, fontWeight:700, cursor:"pointer" }}>
//                 Retour aux cartes
//               </button>
//             </div>
//           )}

//           {etape === "erreur" && (
//             <div style={{ textAlign:"center", padding:"10px 0" }}>
//               <div style={{ width:72, height:72, borderRadius:"50%", background:"#fef2f2", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
//                 <FiAlertCircle size={36} color="#dc2626"/>
//               </div>
//               <h3 style={{ fontSize:16, fontWeight:700, color:C.text, margin:"0 0 8px" }}>Échec de la recharge</h3>
//               <p style={{ fontSize:13, color:C.muted, margin:"0 0 20px", lineHeight:1.6 }}>{erreur}</p>
//               <div style={{ display:"flex", gap:10 }}>
//                 <button onClick={onClose} style={{ flex:1, padding:"11px 0", background:"#f8fafc", border:`1px solid ${C.border}`, borderRadius:10, fontSize:13, fontWeight:600, cursor:"pointer", color:C.muted }}>Fermer</button>
//                 <button onClick={() => { setEtape("montant"); setErreur(""); }} style={{ flex:1, padding:"11px 0", background:C.primary2, border:"none", borderRadius:10, fontSize:13, fontWeight:700, cursor:"pointer", color:"#fff" }}>Réessayer</button>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

// // ═══════════════════════════════════════════════════════════════
// //  PAGE PRINCIPALE : Mes cartes
// // ═══════════════════════════════════════════════════════════════
// export default function PageCartes({ dashData }) {
//   const [cartes,          setCartes]          = useState([]);
//   const [loading,         setLoading]         = useState(true);
//   const [msg,             setMsg]             = useState(null);
//   const [searchCarte,     setSearchCarte]     = useState("");
//   const [filtreStatut,    setFiltreStatut]    = useState("Tous");
//   const [showModal,       setShowModal]       = useState(false);
//   const [typeChoisi,      setTypeChoisi]      = useState(null);
//   const [nomCarte,        setNomCarte]        = useState("");
//   const [soldeInit,       setSoldeInit]       = useState("");
//   const [designChoisi,    setDesignChoisi]    = useState("violet");
//   const [pin,             setPin]             = useState(["","","",""]);
//   const [etapeModal,      setEtapeModal]      = useState("liste");
//   const [actionId,        setActionId]        = useState(null);
//   const [confirmSuppr,    setConfirmSuppr]    = useState(null);
//   const [carteARecharger, setCarteARecharger] = useState(null);

//   // ── État masquage/démasquage par carte ──────────────────────
//   // { [carteId]: boolean } — true = infos visibles
//   const [cartesVisibles,  setCartesVisibles]  = useState({});
//   // { [carteId]: boolean } — true = "Copié !" affiché brièvement
//   const [copieStates,     setCopieStates]     = useState({});

//   const token       = localStorage.getItem("token");
//   const headers     = { Authorization: `Bearer ${token}` };
//   const soldeWallet = Number(dashData?.solde || 0);

//   const chargerCartes = async () => {
//     try {
//       setLoading(true);
//       const res = await api.get("/cartes/mes-cartes", { headers });
//       setCartes(res.data.cartes || []);
//     } catch { setCartes([]); } finally { setLoading(false); }
//   };

//   useEffect(() => { chargerCartes(); }, []);

//   // Afficher message + l'effacer après 3s
//   const afficherMsg = (type, text) => {
//     setMsg({ type, text });
//     setTimeout(() => setMsg(null), 3000);
//   };

//   // Toggle visibilité infos d'une carte
//   const toggleVisible = (id) =>
//     setCartesVisibles(prev => ({ ...prev, [id]: !prev[id] }));

//   // Copier valeur + feedback visuel temporaire
//   const handleCopier = (carteId, valeur) => {
//     copier(valeur, () => {
//       setCopieStates(prev => ({ ...prev, [carteId]: true }));
//       setTimeout(() => setCopieStates(prev => ({ ...prev, [carteId]: false })), 2000);
//     });
//   };

//   const ouvrirModal = (type) => {
//     setTypeChoisi(type);
//     setNomCarte(dashData?.user?.nom?.toUpperCase() || "");
//     setSoldeInit(""); setPin(["","","",""]); setDesignChoisi("violet");
//     setEtapeModal("form"); setShowModal(true);
//   };

//   const creerCarte = async () => {
//     setEtapeModal("loading");
//     try {
//       await api.post("/cartes/creer", { type: typeChoisi?.nom, devise: "XAF", design: designChoisi }, { headers });
//       afficherMsg("success", "Carte créée avec succès !");
//       chargerCartes();
//       setEtapeModal("success");
//     } catch (e) {
//       afficherMsg("error", e.response?.data?.message || "Erreur lors de la création.");
//       setEtapeModal("form");
//     }
//   };

//   const bloquerCarte   = async (id) => { try { setActionId(id); await api.put(`/cartes/${id}/bloquer`, {}, { headers }); afficherMsg("success","Carte bloquée."); chargerCartes(); } catch (e) { afficherMsg("error", e.response?.data?.message||"Erreur."); } finally { setActionId(null); } };
//   const debloquerCarte = async (id) => { try { setActionId(id); await api.put(`/cartes/${id}/debloquer`, {}, { headers }); afficherMsg("success","Carte débloquée."); chargerCartes(); } catch (e) { afficherMsg("error", e.response?.data?.message||"Erreur."); } finally { setActionId(null); } };
//   const supprimerCarte = async (id) => { try { setActionId(id); await api.delete(`/cartes/${id}`, { headers }); afficherMsg("success","Carte supprimée."); setConfirmSuppr(null); chargerCartes(); } catch (e) { afficherMsg("error", e.response?.data?.message||"Erreur."); } finally { setActionId(null); } };

//   const cartesFiltrees = cartes.filter(c => {
//     const matchStatut = filtreStatut === "Tous" || c.statut === filtreStatut;
//     const matchSearch = !searchCarte || c.numero?.includes(searchCarte);
//     return matchStatut && matchSearch;
//   });

//   const nbActives  = cartes.filter(c => c.statut === "ACTIVE").length;
//   const nbBloquees = cartes.filter(c => c.statut === "BLOQUEE").length;

//   return (
//     <div>
//       {/* ── En-tête ── */}
//       <div style={{ background:"linear-gradient(135deg,#2e1065,#7c3aed)", borderRadius:16, padding:"22px 26px", color:"#fff", marginBottom:20, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
//         <div>
//           <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
//             <FiCreditCard size={18}/>
//             <span style={{ fontSize:18, fontWeight:800 }}>Mes cartes</span>
//           </div>
//           <p style={{ fontSize:12, opacity:0.7, margin:0 }}>Gérez vos cartes virtuelles PayVirtual</p>
//         </div>
//         <button onClick={() => { setTypeChoisi(null); setEtapeModal("liste"); setShowModal(true); }}
//           style={{ background:"rgba(255,255,255,0.15)", border:"1px solid rgba(255,255,255,0.25)", color:"#fff", borderRadius:10, padding:"10px 18px", fontSize:12, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
//           <FiPlus size={14}/> Créer une nouvelle carte
//         </button>
//       </div>

//       {/* ── Stats ── */}
//       <div style={{ display:"flex", gap:12, marginBottom:20 }}>
//         {[
//           { label:"Total",    val:cartes.length, color:C.primary2, bg:"#f5f3ff", border:C.border },
//           { label:"Actives",  val:nbActives,     color:"#16a34a",  bg:"#f0fdf4", border:"#bbf7d0" },
//           { label:"Bloquées", val:nbBloquees,    color:"#ef4444",  bg:"#fef2f2", border:"#fecaca" },
//         ].map(s => (
//           <div key={s.label} style={{ flex:1, background:s.bg, border:`1px solid ${s.border}`, borderRadius:12, padding:"14px 18px", textAlign:"center" }}>
//             <div style={{ fontSize:26, fontWeight:900, color:s.color }}>{s.val}</div>
//             <div style={{ fontSize:11, color:"#64748b", fontWeight:500, marginTop:2 }}>{s.label}</div>
//           </div>
//         ))}
//       </div>

//       {/* ── Message flash ── */}
//       {msg && (
//         <div style={{ padding:"10px 14px", borderRadius:8, marginBottom:16, fontSize:13, fontWeight:600, background:msg.type==="success"?"#f0fdf4":"#fef2f2", color:msg.type==="success"?"#16a34a":"#dc2626", border:`1px solid ${msg.type==="success"?"#bbf7d0":"#fecaca"}` }}>
//           {msg.text}
//         </div>
//       )}

//       {/* ── Liste cartes ── */}
//       <div style={{ background:"#fff", borderRadius:16, padding:"20px 22px", border:`1px solid ${C.border}`, marginBottom:20 }}>
//         {/* Filtres */}
//         <div style={{ display:"flex", gap:12, marginBottom:18 }}>
//           <div style={{ flex:1, display:"flex", alignItems:"center", gap:8, background:"#f8fafc", borderRadius:10, padding:"8px 14px", border:`1px solid ${C.border}` }}>
//             <FiSearch size={13} color={C.muted}/>
//             <input value={searchCarte} onChange={e => setSearchCarte(e.target.value)} placeholder="Rechercher par numéro..."
//               style={{ border:"none", background:"transparent", fontSize:12, outline:"none", color:C.text, flex:1 }}/>
//           </div>
//           <select value={filtreStatut} onChange={e => setFiltreStatut(e.target.value)}
//             style={{ padding:"8px 14px", borderRadius:10, border:`1px solid ${C.border}`, fontSize:12, color:C.muted, background:"#f8fafc", cursor:"pointer" }}>
//             <option value="Tous">Tous les statuts</option>
//             <option value="ACTIVE">Active</option>
//             <option value="BLOQUEE">Bloquée</option>
//           </select>
//         </div>

//         {loading ? (
//           <p style={{ textAlign:"center", color:C.muted, padding:30 }}>Chargement...</p>
//         ) : cartesFiltrees.length === 0 ? (
//           <div style={{ textAlign:"center", padding:"40px 0" }}>
//             <div style={{ width:72, height:72, borderRadius:"50%", background:"#f5f3ff", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px", opacity:0.6 }}>
//               <FiCreditCard size={30} color={C.primary}/>
//             </div>
//             <p style={{ fontSize:14, fontWeight:700, color:C.text, margin:"0 0 6px" }}>Aucune carte trouvée</p>
//             <p style={{ fontSize:12, color:C.muted, margin:0 }}>Modifiez vos filtres ou créez une nouvelle carte.</p>
//           </div>
//         ) : (
//           <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
//             {cartesFiltrees.map((c, i) => {
//               const design    = designs.find(d => d.id === (c.design || "violet")) || designs[i % designs.length];
//               const bloquee   = c.statut === "BLOQUEE";
//               const enAction  = actionId === c.id;
//               const visible   = !!cartesVisibles[c.id];
//               const copieOk   = !!copieStates[c.id];
//               const numFormat = formatNumero(c.numero || "");

//               return (
//                 <div key={c.id} style={{ background:"#f8fafc", borderRadius:16, border:`1px solid ${C.border}`, overflow:"hidden" }}>
//                   <div style={{ display:"flex", gap:20, padding:"18px 20px", flexWrap:"wrap" }}>

//                     {/* ── Carte visuelle ── */}
//                     <CarteVisuelle carte={c} design={design} bloquee={bloquee} visible={visible}/>

//                     {/* ── Infos + actions ── */}
//                     <div style={{ flex:1, minWidth:200, display:"flex", flexDirection:"column", justifyContent:"space-between" }}>

//                       {/* Header : statut + toggle visibilité */}
//                       <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
//                         <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:20, background:bloquee?"#fef2f2":"#f0fdf4", color:bloquee?"#ef4444":"#16a34a" }}>
//                           {bloquee ? "🔒 BLOQUÉE" : "✅ ACTIVE"}
//                         </span>

//                         {/* Bouton masquer / démasquer */}
//                         <button
//                           onClick={() => toggleVisible(c.id)}
//                           title={visible ? "Masquer les infos" : "Afficher les infos"}
//                           style={{
//                             display:"flex", alignItems:"center", gap:5,
//                             padding:"5px 12px", borderRadius:8, fontSize:11, fontWeight:700,
//                             border:`1px solid ${visible ? C.primary2 : C.border}`,
//                             background: visible ? "#f5f3ff" : "#fff",
//                             color: visible ? C.primary2 : C.muted,
//                             cursor:"pointer", transition:"all .2s",
//                           }}>
//                           {visible ? <FiEyeOff size={13}/> : <FiEye size={13}/>}
//                           {visible ? "Masquer" : "Afficher"}
//                         </button>
//                       </div>

//                       {/* Détails de la carte */}
//                       <div style={{ marginBottom:12 }}>
//                         <LigneInfo
//                           label="Numéro"
//                           valeur={numFormat}
//                           masquee={true}
//                           visible={visible}
//                           onCopier={(v) => handleCopier(`${c.id}-num`, v)}
//                           copie={copieStates[`${c.id}-num`]}
//                         />
//                         <LigneInfo
//                           label="Expiration"
//                           valeur={c.dateExpiration || "—"}
//                           masquee={false}
//                           visible={visible}
//                           onCopier={(v) => handleCopier(`${c.id}-exp`, v)}
//                           copie={copieStates[`${c.id}-exp`]}
//                         />
//                         <LigneInfo
//                           label="CVV"
//                           valeur={c.cvv || "•••"}
//                           masquee={false}
//                           visible={visible}
//                           onCopier={(v) => handleCopier(`${c.id}-cvv`, v)}
//                           copie={copieStates[`${c.id}-cvv`]}
//                         />
//                         <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingTop:7 }}>
//                           <span style={{ fontSize:11, color:C.muted, fontWeight:600 }}>Solde</span>
//                           <span style={{ fontSize:13, fontWeight:800, color:C.primary2 }}>
//                             {Number(c.solde || 0).toLocaleString("fr-FR")} XAF
//                           </span>
//                         </div>
//                       </div>

//                       {/* Boutons d'action */}
//                       <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
//                         {/* Recharger */}
//                         <button onClick={() => setCarteARecharger(c)} disabled={bloquee || enAction}
//                           style={{ display:"flex", alignItems:"center", gap:5, padding:"7px 12px", borderRadius:8, border:`1px solid ${C.primary2}`, background:"#f5f3ff", color:C.primary2, fontSize:11, fontWeight:700, cursor:bloquee?"not-allowed":"pointer", opacity:bloquee?0.5:1 }}>
//                           <FiDollarSign size={13}/> Recharger
//                         </button>

//                         {/* Bloquer / Débloquer */}
//                         {bloquee ? (
//                           <button onClick={() => debloquerCarte(c.id)} disabled={enAction}
//                             style={{ display:"flex", alignItems:"center", gap:5, padding:"7px 12px", borderRadius:8, border:"1px solid #16a34a", background:"#f0fdf4", color:"#16a34a", fontSize:11, fontWeight:700, cursor:"pointer", opacity:enAction?0.6:1 }}>
//                             <FiUnlock size={13}/> {enAction ? "..." : "Débloquer"}
//                           </button>
//                         ) : (
//                           <button onClick={() => bloquerCarte(c.id)} disabled={enAction}
//                             style={{ display:"flex", alignItems:"center", gap:5, padding:"7px 12px", borderRadius:8, border:"1px solid #f59e0b", background:"#fffbeb", color:"#d97706", fontSize:11, fontWeight:700, cursor:"pointer", opacity:enAction?0.6:1 }}>
//                             <FiLock size={13}/> {enAction ? "..." : "Bloquer"}
//                           </button>
//                         )}

//                         {/* Supprimer */}
//                         <button onClick={() => setConfirmSuppr(c.id)} disabled={enAction}
//                           style={{ display:"flex", alignItems:"center", gap:5, padding:"7px 12px", borderRadius:8, border:"1px solid #ef4444", background:"#fef2f2", color:"#ef4444", fontSize:11, fontWeight:700, cursor:"pointer", opacity:enAction?0.6:1 }}>
//                           <FiTrash2 size={13}/> Supprimer
//                         </button>
//                       </div>
//                     </div>
//                   </div>

//                   {/* ── Bandeau "infos visibles" ── */}
//                   {visible && (
//                     <div style={{ background:"linear-gradient(90deg,#f5f3ff,#ede9fe)", borderTop:`1px solid ${C.border}`, padding:"8px 20px", display:"flex", alignItems:"center", gap:6 }}>
//                       <FiEye size={12} color={C.primary2}/>
//                       <span style={{ fontSize:11, color:C.primary2, fontWeight:600 }}>Informations sensibles visibles — cliquez sur "Masquer" quand vous avez terminé.</span>
//                     </div>
//                   )}
//                 </div>
//               );
//             })}
//           </div>
//         )}
//       </div>

//       {/* ── Catalogue types de cartes ── */}
//       <div style={{ background:"#fff", borderRadius:16, padding:"22px", border:`1px solid ${C.border}` }}>
//         <div style={{ background:"linear-gradient(135deg,#2e1065,#7c3aed)", borderRadius:12, padding:"22px 24px", marginBottom:20, color:"#fff" }}>
//           <p style={{ fontSize:16, fontWeight:800, margin:"0 0 6px" }}>
//             Choisissez votre carte virtuelle — <span style={{ color:"#c4b5fd" }}>Émission instantanée</span>
//           </p>
//           <p style={{ fontSize:11, opacity:0.7, margin:0 }}>Cartes virtuelles acceptées partout dans le monde, avec sécurité 3DS.</p>
//           <div style={{ display:"flex", gap:24, marginTop:14, fontSize:11, opacity:0.8 }}>
//             <span>🏪 Des marchands</span><span>🌍 20+ pays</span><span>🔒 3DS Sécurisé</span><span>🕐 24h/24</span>
//           </div>
//         </div>
//         <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16 }}>
//           {typesCarte.map(tc => (
//             <div key={tc.id} style={{ border:`1px solid ${C.border}`, borderRadius:14, padding:20, textAlign:"center" }}>
//               <span style={{ fontSize:9, fontWeight:800, color:"#fff", background:tc.id==="credit"?"#92400e":tc.id==="debit"?C.primary2:"#166534", borderRadius:20, padding:"3px 10px", letterSpacing:0.8 }}>{tc.badge}</span>
//               <div style={{ fontSize:28, margin:"14px 0 6px" }}>
//                 {tc.logo === "VISA" ? <span style={{ color:"#1a1f71", fontWeight:900, fontSize:22 }}>VISA</span> : tc.logo}
//               </div>
//               <p style={{ fontSize:13, fontWeight:700, color:C.text, margin:"0 0 6px" }}>{tc.nom}</p>
//               <p style={{ fontSize:11, color:C.muted, margin:"0 0 14px", lineHeight:1.4 }}>{tc.desc}</p>
//               <div style={{ fontSize:26, fontWeight:900, color:C.text, margin:"0 0 4px" }}>
//                 <sup style={{ fontSize:12 }}>XAF </sup>{tc.frais}
//               </div>
//               <button onClick={() => ouvrirModal(tc)}
//                 style={{ width:"100%", marginTop:14, background:C.primary2, color:"#fff", border:"none", borderRadius:10, padding:"11px 0", fontSize:13, fontWeight:700, cursor:"pointer" }}>
//                 Créer →
//               </button>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* ══════════════════ MODAL CRÉATION ══════════════════ */}
//       {showModal && (
//         <div style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.55)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 }}>
//           <div style={{ background:"#fff", borderRadius:16, width:440, boxShadow:"0 24px 64px rgba(0,0,0,0.18)", overflow:"hidden" }}>
//             <div style={{ background:C.primary, padding:"16px 20px", display:"flex", justifyContent:"space-between", alignItems:"center", color:"#fff" }}>
//               <div style={{ display:"flex", alignItems:"center", gap:8, fontWeight:700, fontSize:14 }}>
//                 <FiCreditCard size={16}/> Créer une carte
//               </div>
//               <button onClick={() => setShowModal(false)} style={{ background:"none", border:"none", color:"#fff", cursor:"pointer" }}>
//                 <FiX size={18}/>
//               </button>
//             </div>

//             <div style={{ padding:24 }}>
//               {/* Étape 1 : choix du type */}
//               {etapeModal === "liste" && (
//                 <>
//                   <p style={{ fontSize:13, color:C.muted, marginBottom:16 }}>Choisissez un type de carte :</p>
//                   {typesCarte.map(tc => (
//                     <button key={tc.id} onClick={() => { setTypeChoisi(tc); setEtapeModal("form"); }}
//                       style={{ display:"block", width:"100%", background:"#f5f3ff", border:`1px solid ${C.border}`, borderRadius:10, padding:"12px 16px", marginBottom:8, cursor:"pointer", textAlign:"left", fontSize:13, fontWeight:600, color:C.text }}>
//                       {tc.nom} — {tc.frais} XAF
//                     </button>
//                   ))}
//                 </>
//               )}

//               {/* Étape 2 : formulaire */}
//               {etapeModal === "form" && typeChoisi && (
//                 <>
//                   <div style={{ textAlign:"center", marginBottom:16 }}>
//                     <p style={{ fontSize:15, fontWeight:700, color:C.text, margin:"0 0 4px" }}>{typeChoisi.nom}</p>
//                     <p style={{ fontSize:11, color:C.muted, margin:0 }}>Devise : XAF</p>
//                   </div>

//                   {/* Aperçu carte */}
//                   <div style={{ display:"flex", justifyContent:"center", marginBottom:14 }}>
//                     <div style={{ width:220, height:130, borderRadius:14, background:designs.find(d=>d.id===designChoisi)?.gradient||designs[0].gradient, padding:"14px 16px", color:"#fff", boxSizing:"border-box", position:"relative", overflow:"hidden", boxShadow:"0 8px 24px rgba(0,0,0,0.15)" }}>
//                       <div style={{ position:"absolute", top:-10, right:-10, width:60, height:60, borderRadius:"50%", background:"rgba(255,255,255,0.08)" }}/>
//                       <p style={{ fontSize:7, opacity:0.6, margin:"0 0 14px", letterSpacing:1.5 }}>CARTE VIRTUELLE</p>
//                       <p style={{ fontSize:12, fontWeight:700, letterSpacing:2.5, margin:"0 0 10px", fontFamily:"monospace" }}>•••• •••• •••• ••••</p>
//                       <p style={{ fontSize:10, opacity:0.8, margin:0 }}>{nomCarte || "NOM TITULAIRE"}</p>
//                     </div>
//                   </div>

//                   {/* Choix couleur */}
//                   <p style={{ fontSize:11, fontWeight:700, color:C.muted, marginBottom:6 }}>Couleur de la carte</p>
//                   <div style={{ display:"flex", gap:8, marginBottom:16 }}>
//                     {designs.map(d => (
//                       <div key={d.id} onClick={() => setDesignChoisi(d.id)}
//                         style={{ width:44, height:28, borderRadius:8, background:d.gradient, cursor:"pointer", border:designChoisi===d.id?"3px solid #0f172a":"3px solid transparent", transition:"border .15s" }} title={d.label}/>
//                     ))}
//                   </div>

//                   {/* Champs */}
//                   <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
//                     <div>
//                       <label style={lbl}>Nom sur la carte *</label>
//                       <input value={nomCarte} onChange={e => setNomCarte(e.target.value)} placeholder="NOM PRÉNOM" style={inp}/>
//                     </div>
//                     <div>
//                       <label style={lbl}>Solde initial (XAF)</label>
//                       <div style={{ display:"flex", alignItems:"center", border:"1px solid #ede9fe", borderRadius:8, overflow:"hidden" }}>
//                         <span style={{ padding:"9px 8px", background:"#f8fafc", fontSize:12, color:C.muted, borderRight:"1px solid #ede9fe" }}>XAF</span>
//                         <input value={soldeInit} onChange={e => setSoldeInit(e.target.value)} placeholder="0" style={{ flex:1, padding:"9px 10px", border:"none", fontSize:12, outline:"none" }}/>
//                       </div>
//                     </div>
//                   </div>

//                   {/* Récap frais */}
//                   <div style={{ background:"#f8fafc", borderRadius:10, padding:"12px 14px", marginBottom:14 }}>
//                     <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:C.muted, marginBottom:4 }}>
//                       <span>Frais d'émission</span><span>{typeChoisi.frais} XAF</span>
//                     </div>
//                     <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, fontWeight:700, color:C.text, borderTop:`1px solid ${C.border}`, paddingTop:8, marginTop:4 }}>
//                       <span>Total</span>
//                       <span style={{ color:C.primary }}>
//                         {((Number(typeChoisi.frais.replace(/[.\s]/g,""))||0) + (Number(soldeInit)||0)).toLocaleString("fr-FR")} XAF
//                       </span>
//                     </div>
//                   </div>

//                   {/* PIN */}
//                   <div style={{ marginBottom:18 }}>
//                     <label style={{ ...lbl, marginBottom:10 }}>Code PIN à 4 chiffres *</label>
//                     <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
//                       {pin.map((p, i) => (
//                         <input key={i} type="password" maxLength={1} value={p}
//                           onChange={e => { const np=[...pin]; np[i]=e.target.value; setPin(np); if(e.target.value&&i<3) document.getElementById(`pin-${i+1}`)?.focus(); }}
//                           id={`pin-${i}`}
//                           style={{ width:48, height:48, textAlign:"center", border:`2px solid ${C.border}`, borderRadius:10, fontSize:20, fontWeight:700, outline:"none", color:C.primary, transition:"border .15s" }}
//                           onFocus={e => e.target.style.borderColor = C.primary2}
//                           onBlur={e  => e.target.style.borderColor = C.border}/>
//                       ))}
//                     </div>
//                   </div>

//                   <div style={{ display:"flex", gap:10 }}>
//                     <button onClick={() => setShowModal(false)} style={{ flex:1, background:"#f8fafc", border:`1px solid ${C.border}`, borderRadius:8, padding:"10px 0", fontSize:13, fontWeight:600, cursor:"pointer", color:C.muted }}>
//                       Annuler
//                     </button>
//                     <button onClick={creerCarte} style={{ flex:1.5, background:C.primary2, color:"#fff", border:"none", borderRadius:8, padding:"10px 0", fontSize:13, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
//                       <FiCheck size={14}/> Confirmer & Créer
//                     </button>
//                   </div>
//                 </>
//               )}

//               {etapeModal === "loading" && (
//                 <div style={{ textAlign:"center", padding:"32px 0" }}>
//                   <div style={{ width:48, height:48, border:`4px solid ${C.border}`, borderTop:`4px solid ${C.primary}`, borderRadius:"50%", margin:"0 auto 16px", animation:"spin 1s linear infinite" }}/>
//                   <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
//                   <p style={{ fontSize:13, color:C.muted }}>Création de votre carte...</p>
//                 </div>
//               )}

//               {etapeModal === "success" && (
//                 <div style={{ textAlign:"center", padding:"24px 0" }}>
//                   <div style={{ width:56, height:56, borderRadius:"50%", background:"#dcfce7", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 14px", color:"#16a34a" }}>
//                     <FiCheck size={26}/>
//                   </div>
//                   <p style={{ fontSize:16, fontWeight:800, color:C.text, margin:"0 0 6px" }}>Carte créée !</p>
//                   <p style={{ fontSize:12, color:C.muted, marginBottom:20 }}>{typeChoisi?.nom} a été créée avec succès.</p>
//                   <button onClick={() => setShowModal(false)} style={{ background:C.primary2, color:"#fff", border:"none", borderRadius:10, padding:"10px 32px", fontSize:13, fontWeight:700, cursor:"pointer" }}>
//                     OK
//                   </button>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       )}

//       {/* ══════════════════ MODAL SUPPRESSION ══════════════════ */}
//       {confirmSuppr && (
//         <div style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 }}>
//           <div style={{ background:"#fff", borderRadius:14, padding:28, width:340, boxShadow:"0 20px 60px rgba(0,0,0,0.15)" }}>
//             <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
//               <div style={{ width:40, height:40, borderRadius:10, background:"#fef2f2", display:"flex", alignItems:"center", justifyContent:"center", color:"#ef4444" }}>
//                 <FiAlertTriangle size={18}/>
//               </div>
//               <div>
//                 <div style={{ fontWeight:700, fontSize:15, color:C.text }}>Supprimer la carte</div>
//                 <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>Cette action est irréversible</div>
//               </div>
//             </div>
//             <p style={{ fontSize:13, color:C.muted, marginBottom:20, lineHeight:1.6 }}>
//               Êtes-vous sûr de vouloir supprimer cette carte ? Elle ne pourra plus être utilisée.
//             </p>
//             <div style={{ display:"flex", gap:10 }}>
//               <button onClick={() => setConfirmSuppr(null)} style={{ flex:1, background:"#f8fafc", border:`1px solid ${C.border}`, borderRadius:8, padding:"9px 0", fontSize:13, fontWeight:600, cursor:"pointer", color:C.muted }}>
//                 Annuler
//               </button>
//               <button onClick={() => supprimerCarte(confirmSuppr)} style={{ flex:1, background:"#ef4444", color:"#fff", border:"none", borderRadius:8, padding:"9px 0", fontSize:13, fontWeight:700, cursor:"pointer" }}>
//                 Supprimer
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* ══════════════════ MODAL RECHARGE ══════════════════ */}
//       {carteARecharger && (
//         <ModalRechargeCarte
//           carte={carteARecharger}
//           soldeWallet={soldeWallet}
//           onClose={() => setCarteARecharger(null)}
//           onSuccess={() => { setCarteARecharger(null); chargerCartes(); }}
//         />
//       )}
//     </div>
//   );
// }

// // ─── Styles helpers ──────────────────────────────────────────────
// const lbl = { display:"block", fontSize:11, fontWeight:600, color:"#374151", marginBottom:5 };
// const inp = { width:"100%", padding:"9px 12px", border:"1px solid #ede9fe", borderRadius:8, fontSize:12, outline:"none", background:"#fafafa", boxSizing:"border-box" };












// import { useState, useEffect } from "react";
// import { FiCreditCard, FiPlus, FiSearch, FiX, FiCheck, FiLock, FiUnlock, FiTrash2, FiAlertTriangle, FiDollarSign, FiArrowRight, FiCheckCircle, FiAlertCircle } from "react-icons/fi";
// import { MdOutlineAccountBalanceWallet } from "react-icons/md";
// import api from "../../services/api";

// const C = {
//   primary: "#6d28d9", primary2: "#7c3aed", primary3: "#8b5cf6",
//   dark: "#2e1065", border: "#ede9fe", text: "#1e1b4b", muted: "#6b7280",
// };

// const designs = [
//   { id:"violet", label:"Violet",  gradient:"linear-gradient(135deg,#2e1065,#7c3aed)" },
//   { id:"blue",   label:"Bleu",    gradient:"linear-gradient(135deg,#1d4ed8,#3b82f6)" },
//   { id:"orange", label:"Orange",  gradient:"linear-gradient(135deg,#ea580c,#fb923c)" },
//   { id:"vert",   label:"Vert",    gradient:"linear-gradient(135deg,#065f46,#10b981)" },
// ];

// const typesCarte = [
//   { id:"prepayee", badge:"CARTE PRÉPAYÉE",  logo:"🔴🟠", nom:"Mastercard Argent",  desc:"Carte prépayée pour publicités (Meta, Google, TikTok)", frais:"10.000" },
//   { id:"debit",    badge:"CARTE DE DÉBIT",  logo:"🔴🟠", nom:"Mastercard World",   desc:"Carte de débit. Apple Pay & Google Pay. Publicités, Abonnements", frais:"15.000" },
//   { id:"credit",   badge:"CARTE DE CRÉDIT", logo:"VISA",  nom:"VISA Platinum",      desc:"Carte de crédit. Apple Pay & Google Pay. Crypto, POS & tous marchands", frais:"20.000" },
// ];

// // ═══════════════════════════════════════════════════════════════
// //  MODAL RECHARGE CARTE VIRTUELLE
// // ═══════════════════════════════════════════════════════════════
// function ModalRechargeCarte({ carte, soldeWallet, onClose, onSuccess }) {
//   const [etape, setEtape] = useState("montant"); // montant → loading → succes → erreur
//   const [montant, setMontant] = useState("");
//   const [erreur, setErreur] = useState("");

//   const montantsRapides = [1000, 2000, 5000, 10000, 25000, 50000];

//   const recharger = async () => {
//     setErreur("");
//     if (!montant || Number(montant) < 100) {
//       setErreur("Montant minimum : 100 XAF"); return;
//     }
//     if (Number(montant) > soldeWallet) {
//       setErreur(`Solde wallet insuffisant. Disponible : ${soldeWallet.toLocaleString("fr-FR")} XAF`); return;
//     }
//     setEtape("loading");
//     try {
//       const token = localStorage.getItem("token");
//       await api.post(
//         `/cartes/${carte.id}/recharger`,
//         { montant: Number(montant) },
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       setEtape("succes");
//       if (onSuccess) onSuccess(Number(montant));
//     } catch (e) {
//       setErreur(e.response?.data?.message || "Erreur lors de la recharge.");
//       setEtape("erreur");
//     }
//   };

//   const design = designs.find(d => d.id === (carte.design || "violet")) || designs[0];

//   return (
//     <div style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1100, padding:16 }}>
//       <div style={{ background:"#fff", borderRadius:20, width:"100%", maxWidth:420, boxShadow:"0 32px 80px rgba(0,0,0,0.22)", overflow:"hidden" }}>
//         {/* Header */}
//         <div style={{ background:`linear-gradient(135deg,${C.dark},${C.primary2})`, padding:"20px 24px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
//           <div style={{ display:"flex", alignItems:"center", gap:10 }}>
//             <div style={{ width:36, height:36, borderRadius:10, background:"rgba(255,255,255,0.15)", display:"flex", alignItems:"center", justifyContent:"center" }}>
//               <FiDollarSign size={18} color="#fff"/>
//             </div>
//             <div>
//               <div style={{ color:"#fff", fontWeight:700, fontSize:15 }}>Recharger la carte</div>
//               <div style={{ color:"rgba(255,255,255,0.6)", fontSize:11 }}>Wallet → Carte virtuelle</div>
//             </div>
//           </div>
//           {(etape === "montant" || etape === "succes" || etape === "erreur") && (
//             <button onClick={onClose} style={{ background:"rgba(255,255,255,0.12)", border:"none", borderRadius:8, width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"#fff" }}>
//               <FiX size={16}/>
//             </button>
//           )}
//         </div>

//         <div style={{ padding:24 }}>

//           {/* ── MONTANT ── */}
//           {etape === "montant" && (
//             <div>
//               {/* Aperçu carte */}
//               <div style={{ width:"100%", height:100, borderRadius:12, background:design.gradient, padding:"14px 16px", color:"#fff", boxSizing:"border-box", marginBottom:20, position:"relative", overflow:"hidden" }}>
//                 <div style={{ position:"absolute", top:-10, right:-10, width:60, height:60, borderRadius:"50%", background:"rgba(255,255,255,0.07)" }}/>
//                 <p style={{ fontSize:8, opacity:0.6, margin:"0 0 10px", letterSpacing:1.5 }}>CARTE VIRTUELLE</p>
//                 <p style={{ fontSize:12, fontWeight:700, letterSpacing:2.5, margin:"0 0 8px" }}>•••• •••• •••• {carte.numero?.slice(-4) || "0000"}</p>
//                 <p style={{ fontSize:9, opacity:0.7, margin:0 }}>Exp. {carte.dateExpiration || "12/27"}</p>
//               </div>

//               {/* Flux visuel */}
//               <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20, padding:"10px 14px", background:"#f5f3ff", borderRadius:10, border:`1px solid ${C.border}` }}>
//                 <div style={{ display:"flex", alignItems:"center", gap:6 }}>
//                   <MdOutlineAccountBalanceWallet size={16} color={C.primary2}/>
//                   <div>
//                     <p style={{ fontSize:10, color:C.muted, margin:0 }}>Wallet PayVirtual</p>
//                     <p style={{ fontSize:12, fontWeight:700, color:C.text, margin:0 }}>{soldeWallet.toLocaleString("fr-FR")} XAF</p>
//                   </div>
//                 </div>
//                 <FiArrowRight size={16} color={C.muted} style={{ flexShrink:0 }}/>
//                 <div style={{ display:"flex", alignItems:"center", gap:6 }}>
//                   <FiCreditCard size={16} color={C.primary2}/>
//                   <div>
//                     <p style={{ fontSize:10, color:C.muted, margin:0 }}>Carte virtuelle</p>
//                     <p style={{ fontSize:12, fontWeight:700, color:C.text, margin:0 }}>•••• {carte.numero?.slice(-4) || "0000"}</p>
//                   </div>
//                 </div>
//               </div>

//               <div style={{ marginBottom:14 }}>
//                 <label style={{ fontSize:12, fontWeight:600, color:C.text, display:"block", marginBottom:6 }}>
//                   Montant à recharger (XAF) <span style={{ color:"#dc2626" }}>*</span>
//                 </label>
//                 <input type="number" value={montant} onChange={e => setMontant(e.target.value)} placeholder="Ex: 5000" min={100}
//                   style={{ width:"100%", padding:"12px 14px", border:`1px solid ${C.border}`, borderRadius:10, fontSize:16, fontWeight:700, color:C.text, outline:"none", fontFamily:"inherit", boxSizing:"border-box" }}/>
//                 <p style={{ fontSize:10, color:C.muted, margin:"4px 0 0" }}>Minimum : 100 XAF · Disponible : {soldeWallet.toLocaleString("fr-FR")} XAF</p>
//               </div>

//               <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:18 }}>
//                 {montantsRapides.map(m => (
//                   <button key={m} onClick={() => setMontant(String(m))} style={{ padding:"8px 0", borderRadius:8, fontSize:12, fontWeight:600, border:`1px solid ${montant==m?C.primary2:C.border}`, background:montant==m?"#f5f3ff":"#fff", color:montant==m?C.primary2:C.muted, cursor:"pointer" }}>
//                     {m.toLocaleString("fr-FR")}
//                   </button>
//                 ))}
//               </div>

//               {erreur && (
//                 <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 12px", background:"#fef2f2", borderRadius:10, marginBottom:14 }}>
//                   <FiAlertCircle size={14} color="#dc2626"/>
//                   <span style={{ fontSize:12, color:"#dc2626" }}>{erreur}</span>
//                 </div>
//               )}

//               {montant && Number(montant) >= 100 && (
//                 <div style={{ padding:"12px 14px", background:"#f5f3ff", borderRadius:10, marginBottom:16, border:`1px solid ${C.border}` }}>
//                   <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:C.muted, marginBottom:4 }}>
//                     <span>Montant rechargé</span><span style={{ fontWeight:700, color:C.text }}>{Number(montant).toLocaleString("fr-FR")} XAF</span>
//                   </div>
//                   <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:C.muted, marginBottom:4 }}>
//                     <span>Frais de transfert</span><span style={{ fontWeight:600, color:"#16a34a" }}>0 XAF</span>
//                   </div>
//                   <div style={{ height:1, background:C.border, margin:"8px 0" }}/>
//                   <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, fontWeight:700 }}>
//                     <span style={{ color:C.text }}>Nouveau solde wallet</span>
//                     <span style={{ color:C.primary2 }}>{(soldeWallet - Number(montant)).toLocaleString("fr-FR")} XAF</span>
//                   </div>
//                 </div>
//               )}

//               <button onClick={recharger} style={{ width:"100%", padding:"13px 0", background:`linear-gradient(135deg,${C.dark},${C.primary2})`, color:"#fff", border:"none", borderRadius:12, fontSize:14, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
//                 <FiCheck size={14}/> Confirmer la recharge
//               </button>
//             </div>
//           )}

//           {/* ── LOADING ── */}
//           {etape === "loading" && (
//             <div style={{ textAlign:"center", padding:"32px 0" }}>
//               <div style={{ width:56, height:56, border:`4px solid ${C.border}`, borderTop:`4px solid ${C.primary}`, borderRadius:"50%", margin:"0 auto 16px", animation:"spin 1s linear infinite" }}/>
//               <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
//               <p style={{ fontSize:13, color:C.muted }}>Transfert en cours...</p>
//             </div>
//           )}

//           {/* ── SUCCÈS ── */}
//           {etape === "succes" && (
//             <div style={{ textAlign:"center", padding:"10px 0" }}>
//               <div style={{ width:72, height:72, borderRadius:"50%", background:"#f0fdf4", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
//                 <FiCheckCircle size={36} color="#16a34a"/>
//               </div>
//               <h3 style={{ fontSize:16, fontWeight:700, color:C.text, margin:"0 0 8px" }}>Carte rechargée !</h3>
//               <p style={{ fontSize:13, color:C.muted, margin:"0 0 20px", lineHeight:1.6 }}>
//                 <strong style={{ color:"#16a34a" }}>{Number(montant).toLocaleString("fr-FR")} XAF</strong> ont été transférés de votre wallet vers la carte <strong>•••• {carte.numero?.slice(-4) || "0000"}</strong>.
//               </p>
//               <button onClick={onClose} style={{ width:"100%", padding:"13px 0", background:`linear-gradient(135deg,#15803d,#16a34a)`, color:"#fff", border:"none", borderRadius:12, fontSize:14, fontWeight:700, cursor:"pointer" }}>
//                 Retour aux cartes
//               </button>
//             </div>
//           )}

//           {/* ── ERREUR ── */}
//           {etape === "erreur" && (
//             <div style={{ textAlign:"center", padding:"10px 0" }}>
//               <div style={{ width:72, height:72, borderRadius:"50%", background:"#fef2f2", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
//                 <FiAlertCircle size={36} color="#dc2626"/>
//               </div>
//               <h3 style={{ fontSize:16, fontWeight:700, color:C.text, margin:"0 0 8px" }}>Échec de la recharge</h3>
//               <p style={{ fontSize:13, color:C.muted, margin:"0 0 20px", lineHeight:1.6 }}>{erreur}</p>
//               <div style={{ display:"flex", gap:10 }}>
//                 <button onClick={onClose} style={{ flex:1, padding:"11px 0", background:"#f8fafc", border:`1px solid ${C.border}`, borderRadius:10, fontSize:13, fontWeight:600, cursor:"pointer", color:C.muted }}>Fermer</button>
//                 <button onClick={() => { setEtape("montant"); setErreur(""); }} style={{ flex:1, padding:"11px 0", background:C.primary2, border:"none", borderRadius:10, fontSize:13, fontWeight:700, cursor:"pointer", color:"#fff" }}>Réessayer</button>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

// // ═══════════════════════════════════════════════════════════════
// //  PAGE CARTES PRINCIPALE
// // ═══════════════════════════════════════════════════════════════
// export default function PageCartes({ dashData }) {
//   const [cartes,        setCartes]        = useState([]);
//   const [loading,       setLoading]       = useState(true);
//   const [msg,           setMsg]           = useState(null);
//   const [searchCarte,   setSearchCarte]   = useState("");
//   const [filtreStatut,  setFiltreStatut]  = useState("Tous");
//   const [showModal,     setShowModal]     = useState(false);
//   const [typeChoisi,    setTypeChoisi]    = useState(null);
//   const [nomCarte,      setNomCarte]      = useState("");
//   const [soldeInit,     setSoldeInit]     = useState("");
//   const [designChoisi,  setDesignChoisi]  = useState("violet");
//   const [pin,           setPin]           = useState(["","","",""]);
//   const [etapeModal,    setEtapeModal]    = useState("liste");
//   const [actionId,      setActionId]      = useState(null);
//   const [confirmSuppr,  setConfirmSuppr]  = useState(null);
//   const [carteARecharger, setCarteARecharger] = useState(null);

//   const token   = localStorage.getItem("token");
//   const headers = { Authorization: `Bearer ${token}` };
//   const soldeWallet = Number(dashData?.solde || 0);

//   const chargerCartes = async () => {
//     try {
//       setLoading(true);
//       const res = await api.get("/cartes/mes-cartes", { headers });
//       setCartes(res.data.cartes || []);
//     } catch { setCartes([]); } finally { setLoading(false); }
//   };

//   useEffect(() => { chargerCartes(); }, []);

//   const ouvrirModal = (type) => {
//     setTypeChoisi(type);
//     setNomCarte(dashData?.user?.nom?.toUpperCase() || "");
//     setSoldeInit("");
//     setPin(["","","",""]);
//     setDesignChoisi("violet");
//     setEtapeModal("form");
//     setShowModal(true);
//   };

//   const creerCarte = async () => {
//     setEtapeModal("loading");
//     try {
//       await api.post("/cartes/creer", { type: typeChoisi?.nom, devise: "XAF", design: designChoisi }, { headers });
//       setMsg({ type:"success", text:"Carte créée avec succès !" });
//       chargerCartes();
//       setEtapeModal("success");
//     } catch (e) {
//       setMsg({ type:"error", text: e.response?.data?.message || "Erreur lors de la création." });
//       setEtapeModal("form");
//     }
//   };

//   const bloquerCarte    = async (id) => { try { setActionId(id); await api.put(`/cartes/${id}/bloquer`, {}, { headers }); setMsg({ type:"success", text:"Carte bloquée." }); chargerCartes(); } catch (e) { setMsg({ type:"error", text:e.response?.data?.message||"Erreur." }); } finally { setActionId(null); } };
//   const debloquerCarte  = async (id) => { try { setActionId(id); await api.put(`/cartes/${id}/debloquer`, {}, { headers }); setMsg({ type:"success", text:"Carte débloquée." }); chargerCartes(); } catch (e) { setMsg({ type:"error", text:e.response?.data?.message||"Erreur." }); } finally { setActionId(null); } };
//   const supprimerCarte  = async (id) => { try { setActionId(id); await api.delete(`/cartes/${id}`, { headers }); setMsg({ type:"success", text:"Carte supprimée." }); setConfirmSuppr(null); chargerCartes(); } catch (e) { setMsg({ type:"error", text:e.response?.data?.message||"Erreur." }); } finally { setActionId(null); } };

//   const cartesFiltrees = cartes.filter(c => {
//     const matchStatut = filtreStatut === "Tous" || c.statut === filtreStatut;
//     const matchSearch = !searchCarte || c.numero?.includes(searchCarte);
//     return matchStatut && matchSearch;
//   });

//   const nbActives  = cartes.filter(c => c.statut === "ACTIVE").length;
//   const nbBloquees = cartes.filter(c => c.statut === "BLOQUEE").length;

//   return (
//     <div>
//       {/* En-tête */}
//       <div style={{ background:"linear-gradient(135deg,#2e1065,#7c3aed)", borderRadius:16, padding:"22px 26px", color:"#fff", marginBottom:20, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
//         <div>
//           <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}><FiCreditCard size={18}/><span style={{ fontSize:18, fontWeight:800 }}>Mes cartes</span></div>
//           <p style={{ fontSize:12, opacity:0.7, margin:0 }}>Gérez vos cartes virtuelles PayVirtual</p>
//         </div>
//         <button onClick={() => { setTypeChoisi(null); setEtapeModal("liste"); setShowModal(true); }} style={{ background:"rgba(255,255,255,0.15)", border:"1px solid rgba(255,255,255,0.25)", color:"#fff", borderRadius:10, padding:"10px 18px", fontSize:12, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
//           <FiPlus size={14}/> Créer une nouvelle carte
//         </button>
//       </div>

//       {/* Stats */}
//       <div style={{ display:"flex", gap:12, marginBottom:20 }}>
//         {[
//           { label:"Total cartes", val:cartes.length,  color:C.primary2, bg:"#f5f3ff", border:C.border },
//           { label:"Actives",      val:nbActives,       color:"#16a34a",  bg:"#f0fdf4", border:"#bbf7d0" },
//           { label:"Bloquées",     val:nbBloquees,      color:"#ef4444",  bg:"#fef2f2", border:"#fecaca" },
//         ].map(s => (
//           <div key={s.label} style={{ flex:1, background:s.bg, border:`1px solid ${s.border}`, borderRadius:12, padding:"14px 18px", textAlign:"center" }}>
//             <div style={{ fontSize:26, fontWeight:900, color:s.color }}>{s.val}</div>
//             <div style={{ fontSize:11, color:"#64748b", fontWeight:500, marginTop:2 }}>{s.label}</div>
//           </div>
//         ))}
//       </div>

//       {msg && (
//         <div style={{ padding:"10px 14px", borderRadius:8, marginBottom:16, fontSize:13, fontWeight:600, background:msg.type==="success"?"#f0fdf4":"#fef2f2", color:msg.type==="success"?"#16a34a":"#dc2626", border:`1px solid ${msg.type==="success"?"#bbf7d0":"#fecaca"}` }}>
//           {msg.text}
//         </div>
//       )}

//       {/* Filtres & liste */}
//       <div style={{ background:"#fff", borderRadius:16, padding:"20px 22px", border:`1px solid ${C.border}`, marginBottom:20 }}>
//         <div style={{ display:"flex", gap:12, marginBottom:18 }}>
//           <div style={{ flex:1, display:"flex", alignItems:"center", gap:8, background:"#f8fafc", borderRadius:10, padding:"8px 14px", border:`1px solid ${C.border}` }}>
//             <FiSearch size={13} color={C.muted}/>
//             <input value={searchCarte} onChange={e => setSearchCarte(e.target.value)} placeholder="Rechercher une carte..." style={{ border:"none", background:"transparent", fontSize:12, outline:"none", color:C.text, flex:1 }}/>
//           </div>
//           <select value={filtreStatut} onChange={e => setFiltreStatut(e.target.value)} style={{ padding:"8px 14px", borderRadius:10, border:`1px solid ${C.border}`, fontSize:12, color:C.muted, background:"#f8fafc", cursor:"pointer" }}>
//             <option value="Tous">Tous les statuts</option>
//             <option value="ACTIVE">Active</option>
//             <option value="BLOQUEE">Bloquée</option>
//           </select>
//         </div>

//         {loading ? (
//           <p style={{ textAlign:"center", color:C.muted, padding:30 }}>Chargement...</p>
//         ) : cartesFiltrees.length === 0 ? (
//           <div style={{ textAlign:"center", padding:"40px 0" }}>
//             <div style={{ width:72, height:72, borderRadius:"50%", background:"#f5f3ff", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px", opacity:0.6 }}><FiCreditCard size={30} color={C.primary}/></div>
//             <p style={{ fontSize:14, fontWeight:700, color:C.text, margin:"0 0 6px" }}>Aucune carte trouvée</p>
//             <p style={{ fontSize:12, color:C.muted, margin:0 }}>Essayez de modifier vos filtres ou créez une nouvelle carte.</p>
//           </div>
//         ) : (
//           <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
//             {cartesFiltrees.map((c, i) => {
//               const design   = designs[i % designs.length];
//               const bloquee  = c.statut === "BLOQUEE";
//               const enAction = actionId === c.id;
//               return (
//                 <div key={c.id} style={{ background:"#f8fafc", borderRadius:14, border:`1px solid ${C.border}`, overflow:"hidden" }}>
//                   <div style={{ display:"flex", alignItems:"center", gap:20, padding:"16px 20px" }}>
//                     {/* Visuel carte */}
//                     <div style={{ width:140, height:84, borderRadius:10, background:bloquee?"#94a3b8":design.gradient, padding:"10px 12px", color:"#fff", flexShrink:0, display:"flex", flexDirection:"column", justifyContent:"space-between", opacity:bloquee?0.7:1, position:"relative" }}>
//                       {bloquee && <div style={{ position:"absolute", inset:0, borderRadius:10, background:"rgba(0,0,0,0.25)", display:"flex", alignItems:"center", justifyContent:"center" }}><FiLock size={20} color="#fff"/></div>}
//                       <span style={{ fontSize:7, opacity:0.7 }}>PayVirtual</span>
//                       <div>
//                         <p style={{ fontSize:10, fontWeight:700, letterSpacing:2, margin:"0 0 4px" }}>•••• {c.numero?.slice(-4) || "0000"}</p>
//                         <p style={{ fontSize:7, opacity:0.7, margin:0 }}>Exp. {c.dateExpiration || "12/27"}</p>
//                       </div>
//                     </div>

//                     {/* Infos */}
//                     <div style={{ flex:1 }}>
//                       <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
//                         <span style={{ fontSize:13, fontWeight:700, color:C.text }}>•••• •••• •••• {c.numero?.slice(-4) || "0000"}</span>
//                         <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:20, background:bloquee?"#fef2f2":"#f0fdf4", color:bloquee?"#ef4444":"#16a34a" }}>
//                           {bloquee ? "🔒 BLOQUÉE" : "✅ ACTIVE"}
//                         </span>
//                       </div>
//                       <p style={{ fontSize:11, color:C.muted, margin:0 }}>Expiration : {c.dateExpiration || "12/27"}</p>
//                       <p style={{ fontSize:11, color:C.muted, margin:"3px 0 0" }}>Type : {c.type || "Visa"} · Devise : {c.devise || "XAF"}</p>
//                     </div>

//                     {/* Actions */}
//                     <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
//                       {/* ✨ BOUTON RECHARGE */}
//                       <button onClick={() => setCarteARecharger(c)} disabled={bloquee || enAction}
//                         style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 14px", borderRadius:8, border:`1px solid ${C.primary2}`, background:"#f5f3ff", color:C.primary2, fontSize:12, fontWeight:700, cursor:bloquee?"not-allowed":"pointer", opacity:bloquee?0.5:1 }}>
//                         <FiDollarSign size={13}/> Recharger
//                       </button>

//                       {bloquee ? (
//                         <button onClick={() => debloquerCarte(c.id)} disabled={enAction}
//                           style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 14px", borderRadius:8, border:"1px solid #16a34a", background:"#f0fdf4", color:"#16a34a", fontSize:12, fontWeight:700, cursor:"pointer", opacity:enAction?0.6:1 }}>
//                           <FiUnlock size={13}/> {enAction?"...":"Débloquer"}
//                         </button>
//                       ) : (
//                         <button onClick={() => bloquerCarte(c.id)} disabled={enAction}
//                           style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 14px", borderRadius:8, border:"1px solid #f59e0b", background:"#fffbeb", color:"#d97706", fontSize:12, fontWeight:700, cursor:"pointer", opacity:enAction?0.6:1 }}>
//                           <FiLock size={13}/> {enAction?"...":"Bloquer"}
//                         </button>
//                       )}
//                       <button onClick={() => setConfirmSuppr(c.id)} disabled={enAction}
//                         style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 14px", borderRadius:8, border:"1px solid #ef4444", background:"#fef2f2", color:"#ef4444", fontSize:12, fontWeight:700, cursor:"pointer", opacity:enAction?0.6:1 }}>
//                         <FiTrash2 size={13}/> Supprimer
//                       </button>
//                     </div>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         )}
//       </div>

//       {/* Catalogue types de cartes */}
//       <div style={{ background:"#fff", borderRadius:16, padding:"22px", border:`1px solid ${C.border}` }}>
//         <div style={{ background:"linear-gradient(135deg,#2e1065,#7c3aed)", borderRadius:12, padding:"22px 24px", marginBottom:20, color:"#fff" }}>
//           <p style={{ fontSize:16, fontWeight:800, margin:"0 0 6px" }}>Choisissez votre carte virtuelle — <span style={{ color:"#c4b5fd" }}>Émission instantanée</span></p>
//           <p style={{ fontSize:11, opacity:0.7, margin:0 }}>Cartes virtuelles acceptées partout dans le monde, avec sécurité 3DS.</p>
//           <div style={{ display:"flex", gap:24, marginTop:14, fontSize:11, opacity:0.8 }}>
//             <span>🏪 Des marchands</span><span>🌍 20+ pays</span><span>🔒 3DS Sécurisé</span><span>🕐 24h/24</span>
//           </div>
//         </div>
//         <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16 }}>
//           {typesCarte.map(tc => (
//             <div key={tc.id} style={{ border:`1px solid ${C.border}`, borderRadius:14, padding:20, textAlign:"center" }}>
//               <span style={{ fontSize:9, fontWeight:800, color:"#fff", background:tc.id==="credit"?"#92400e":tc.id==="debit"?C.primary2:"#166534", borderRadius:20, padding:"3px 10px", letterSpacing:0.8 }}>{tc.badge}</span>
//               <div style={{ fontSize:28, margin:"14px 0 6px" }}>{tc.logo === "VISA" ? <span style={{ color:"#1a1f71", fontWeight:900, fontSize:22 }}>VISA</span> : tc.logo}</div>
//               <p style={{ fontSize:13, fontWeight:700, color:C.text, margin:"0 0 6px" }}>{tc.nom}</p>
//               <p style={{ fontSize:11, color:C.muted, margin:"0 0 14px", lineHeight:1.4 }}>{tc.desc}</p>
//               <div style={{ fontSize:26, fontWeight:900, color:C.text, margin:"0 0 4px" }}><sup style={{ fontSize:12 }}>XAF </sup>{tc.frais}</div>
//               <button onClick={() => ouvrirModal(tc)} style={{ width:"100%", marginTop:14, background:C.primary2, color:"#fff", border:"none", borderRadius:10, padding:"11px 0", fontSize:13, fontWeight:700, cursor:"pointer" }}>Créer →</button>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* MODAL CRÉATION */}
//       {showModal && (
//         <div style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.55)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 }}>
//           <div style={{ background:"#fff", borderRadius:16, width:440, boxShadow:"0 24px 64px rgba(0,0,0,0.18)", overflow:"hidden" }}>
//             <div style={{ background:C.primary, padding:"16px 20px", display:"flex", justifyContent:"space-between", alignItems:"center", color:"#fff" }}>
//               <div style={{ display:"flex", alignItems:"center", gap:8, fontWeight:700, fontSize:14 }}><FiCreditCard size={16}/> Créer une carte</div>
//               <button onClick={() => setShowModal(false)} style={{ background:"none", border:"none", color:"#fff", cursor:"pointer" }}><FiX size={18}/></button>
//             </div>
//             <div style={{ padding:24 }}>
//               {etapeModal === "liste" && (
//                 <>
//                   <p style={{ fontSize:13, color:C.muted, marginBottom:16 }}>Choisissez un type de carte :</p>
//                   {typesCarte.map(tc => (
//                     <button key={tc.id} onClick={() => { setTypeChoisi(tc); setEtapeModal("form"); }} style={{ display:"block", width:"100%", background:"#f5f3ff", border:`1px solid ${C.border}`, borderRadius:10, padding:"12px 16px", marginBottom:8, cursor:"pointer", textAlign:"left", fontSize:13, fontWeight:600, color:C.text }}>
//                       {tc.nom} — {tc.frais} XAF
//                     </button>
//                   ))}
//                 </>
//               )}
//               {etapeModal === "form" && typeChoisi && (
//                 <>
//                   <div style={{ textAlign:"center", marginBottom:16 }}>
//                     <p style={{ fontSize:15, fontWeight:700, color:C.text, margin:"0 0 4px" }}>{typeChoisi.nom}</p>
//                     <p style={{ fontSize:11, color:C.muted, margin:0 }}>Devise : XAF</p>
//                   </div>
//                   <div style={{ width:"100%", height:100, borderRadius:12, background:designs.find(d=>d.id===designChoisi)?.gradient||designs[0].gradient, padding:"14px 16px", color:"#fff", boxSizing:"border-box", marginBottom:14, position:"relative", overflow:"hidden" }}>
//                     <div style={{ position:"absolute", top:-10, right:-10, width:60, height:60, borderRadius:"50%", background:"rgba(255,255,255,0.08)" }}/>
//                     <p style={{ fontSize:8, opacity:0.6, margin:"0 0 8px", letterSpacing:1.5 }}>CARTE VIRTUELLE</p>
//                     <p style={{ fontSize:11, fontWeight:700, letterSpacing:2.5, margin:"0 0 8px" }}>•••• •••• •••• ••••</p>
//                     <p style={{ fontSize:9, opacity:0.7, margin:0 }}>{nomCarte || "NOM TITULAIRE"}</p>
//                   </div>
//                   <p style={{ fontSize:11, fontWeight:700, color:C.muted, marginBottom:6 }}>Couleur de la carte</p>
//                   <div style={{ display:"flex", gap:8, marginBottom:14 }}>
//                     {designs.map(d => (
//                       <div key={d.id} onClick={() => setDesignChoisi(d.id)} style={{ width:40, height:26, borderRadius:6, background:d.gradient, cursor:"pointer", border:designChoisi===d.id?"3px solid #0f172a":"3px solid transparent" }} title={d.label}/>
//                     ))}
//                   </div>
//                   <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
//                     <div>
//                       <label style={lbl}>Nom sur la carte *</label>
//                       <input value={nomCarte} onChange={e => setNomCarte(e.target.value)} placeholder="NOM PRÉNOM" style={inp}/>
//                     </div>
//                     <div>
//                       <label style={lbl}>Solde initial (XAF) *</label>
//                       <div style={{ display:"flex", alignItems:"center", border:"1px solid #ede9fe", borderRadius:8, overflow:"hidden" }}>
//                         <span style={{ padding:"9px 8px", background:"#f8fafc", fontSize:12, color:C.muted, borderRight:"1px solid #ede9fe" }}>XAF</span>
//                         <input value={soldeInit} onChange={e => setSoldeInit(e.target.value)} placeholder="5000" style={{ flex:1, padding:"9px 10px", border:"none", fontSize:12, outline:"none" }}/>
//                       </div>
//                     </div>
//                   </div>
//                   <div style={{ background:"#f8fafc", borderRadius:10, padding:"12px 14px", marginBottom:14 }}>
//                     <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:C.muted, marginBottom:4 }}>
//                       <span>Frais d'émission</span><span>{typeChoisi.frais} XAF</span>
//                     </div>
//                     <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, fontWeight:700, color:C.text, borderTop:`1px solid ${C.border}`, paddingTop:8, marginTop:4 }}>
//                       <span>Total</span>
//                       <span style={{ color:C.primary }}>{((Number(typeChoisi.frais.replace(/[. ]/g,""))||0) + (Number(soldeInit)||0)).toLocaleString("fr-FR")} XAF</span>
//                     </div>
//                   </div>
//                   <div style={{ marginBottom:18 }}>
//                     <label style={{ ...lbl, marginBottom:10 }}>Code PIN à 4 chiffres *</label>
//                     <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
//                       {pin.map((p, i) => (
//                         <input key={i} type="password" maxLength={1} value={p}
//                           onChange={e => { const np=[...pin]; np[i]=e.target.value; setPin(np); if(e.target.value&&i<3) document.getElementById(`pin-${i+1}`)?.focus(); }}
//                           id={`pin-${i}`}
//                           style={{ width:46, height:46, textAlign:"center", border:`1px solid ${C.border}`, borderRadius:10, fontSize:18, fontWeight:700, outline:"none", color:C.primary }}/>
//                       ))}
//                     </div>
//                   </div>
//                   <div style={{ display:"flex", gap:10 }}>
//                     <button onClick={() => setShowModal(false)} style={{ flex:1, background:"#f8fafc", border:`1px solid ${C.border}`, borderRadius:8, padding:"10px 0", fontSize:13, fontWeight:600, cursor:"pointer", color:C.muted }}>Annuler</button>
//                     <button onClick={creerCarte} style={{ flex:1.5, background:C.primary2, color:"#fff", border:"none", borderRadius:8, padding:"10px 0", fontSize:13, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
//                       <FiCheck size={14}/> Confirmer & Créer
//                     </button>
//                   </div>
//                 </>
//               )}
//               {etapeModal === "loading" && (
//                 <div style={{ textAlign:"center", padding:"32px 0" }}>
//                   <div style={{ width:48, height:48, border:`4px solid ${C.border}`, borderTop:`4px solid ${C.primary}`, borderRadius:"50%", margin:"0 auto 16px", animation:"spin 1s linear infinite" }}/>
//                   <p style={{ fontSize:13, color:C.muted }}>Création de votre carte...</p>
//                   <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
//                 </div>
//               )}
//               {etapeModal === "success" && (
//                 <div style={{ textAlign:"center", padding:"24px 0" }}>
//                   <div style={{ width:56, height:56, borderRadius:"50%", background:"#dcfce7", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 14px", color:"#16a34a" }}><FiCheck size={26}/></div>
//                   <p style={{ fontSize:16, fontWeight:800, color:C.text, margin:"0 0 6px" }}>Carte créée !</p>
//                   <p style={{ fontSize:12, color:C.muted, marginBottom:20 }}>{typeChoisi?.nom} a été créée avec succès.</p>
//                   <button onClick={() => setShowModal(false)} style={{ background:C.primary2, color:"#fff", border:"none", borderRadius:10, padding:"10px 32px", fontSize:13, fontWeight:700, cursor:"pointer" }}>OK</button>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       )}

//       {/* MODAL SUPPRESSION */}
//       {confirmSuppr && (
//         <div style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 }}>
//           <div style={{ background:"#fff", borderRadius:14, padding:28, width:340, boxShadow:"0 20px 60px rgba(0,0,0,0.15)" }}>
//             <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
//               <div style={{ width:40, height:40, borderRadius:10, background:"#fef2f2", display:"flex", alignItems:"center", justifyContent:"center", color:"#ef4444" }}><FiAlertTriangle size={18}/></div>
//               <div>
//                 <div style={{ fontWeight:700, fontSize:15, color:C.text }}>Supprimer la carte</div>
//                 <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>Cette action est irréversible</div>
//               </div>
//             </div>
//             <p style={{ fontSize:13, color:C.muted, marginBottom:20, lineHeight:1.6 }}>Êtes-vous sûr de vouloir supprimer cette carte ? Elle ne pourra plus être utilisée.</p>
//             <div style={{ display:"flex", gap:10 }}>
//               <button onClick={() => setConfirmSuppr(null)} style={{ flex:1, background:"#f8fafc", border:`1px solid ${C.border}`, borderRadius:8, padding:"9px 0", fontSize:13, fontWeight:600, cursor:"pointer", color:C.muted }}>Annuler</button>
//               <button onClick={() => supprimerCarte(confirmSuppr)} style={{ flex:1, background:"#ef4444", color:"#fff", border:"none", borderRadius:8, padding:"9px 0", fontSize:13, fontWeight:700, cursor:"pointer" }}>Supprimer</button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* MODAL RECHARGE CARTE */}
//       {carteARecharger && (
//         <ModalRechargeCarte
//           carte={carteARecharger}
//           soldeWallet={soldeWallet}
//           onClose={() => setCarteARecharger(null)}
//           onSuccess={() => { setCarteARecharger(null); chargerCartes(); }}
//         />
//       )}
//     </div>
//   );
// }

// const lbl = { display:"block", fontSize:11, fontWeight:600, color:"#374151", marginBottom:5 };
// const inp = { width:"100%", padding:"9px 12px", border:"1px solid #ede9fe", borderRadius:8, fontSize:12, outline:"none", background:"#fafafa", boxSizing:"border-box" };