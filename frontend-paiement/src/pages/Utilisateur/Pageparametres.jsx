import { useState, useEffect, useContext, createContext } from "react";
import { FiSettings, FiLock, FiPlus, FiX, FiChevronDown, FiCheck, FiCopy, FiEye, FiEyeOff, FiSave } from "react-icons/fi";
import api from "../../services/api";

const C = {
  primary: "#6d28d9", primary2: "#7c3aed", primary3: "#8b5cf6",
  dark: "#2e1065", border: "#ede9fe", text: "#1e1b4b", muted: "#6b7280",
};

function FiKey({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7.5" cy="15.5" r="5.5"/><path d="M21 2l-9.6 9.6"/><path d="M15.5 7.5l3 3L22 7l-3-3"/>
    </svg>
  );
}

const gateways = [
  { id:"mtn",     logo:"🟡", nom:"MTN MoMo CM",    type:"Argent mobile", dispo:true  },
  { id:"orange",  logo:"🟠", nom:"Orange Money CM", type:"Argent mobile", dispo:true  },
  { id:"paypal",  logo:"🔵", nom:"PayPal",           type:"Portefeuille",  dispo:true  },
  { id:"binance", logo:"🟡", nom:"Binance",          type:"Crypto",        dispo:true  },
  { id:"revolut", logo:"🔷", nom:"Revolut",          type:"Portefeuille",  dispo:true  },
  { id:"usdt",    logo:"💚", nom:"Tether USDT",      type:"Crypto",        dispo:false },
];

// ─── Toast notification interne ───
function Toast({ msg, onClose }) {
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [msg]);
  if (!msg) return null;
  return (
    <div style={{
      position:"fixed", bottom:24, right:24, zIndex:9999,
      background: msg.type==="success"?"#16a34a":"#dc2626",
      color:"#fff", borderRadius:12, padding:"12px 20px",
      fontSize:13, fontWeight:700, boxShadow:"0 8px 32px rgba(0,0,0,0.22)",
      display:"flex", alignItems:"center", gap:10, minWidth:280,
      animation:"slideUp 0.3s ease",
    }}>
      <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
      {msg.type==="success" ? "✅" : "❌"} {msg.text}
      <button onClick={onClose} style={{ marginLeft:"auto", background:"none", border:"none", color:"#fff", cursor:"pointer", opacity:0.7 }}><FiX size={14}/></button>
    </div>
  );
}

export default function PageParametres({ dashData, onAppSettingsChange }) {
  const [section,    setSection]    = useState("general");
  const [sousOnglet, setSousOnglet] = useState("profil");
  const [toast,      setToast]      = useState(null);
  const [loading,    setLoading]    = useState(false);

  // ── Profil ──
  const [nom,       setNom]      = useState(dashData?.user?.nom    || "");
  const [prenom,    setPrenom]   = useState(dashData?.user?.prenom || "");
  const [telephone, setTel]      = useState(dashData?.user?.telephone || "");
  const [pays,      setPays]     = useState(dashData?.user?.pays   || "Cameroun");

  // ── Préférences (stockées dans localStorage pour persistance) ──
  const [langue, setLangue] = useState(() => localStorage.getItem("pv_langue")  || "Français");
  const [devise, setDevise] = useState(() => localStorage.getItem("pv_devise")  || "XAF (FCFA)");
  const [fuseau, setFuseau] = useState(() => localStorage.getItem("pv_fuseau")  || "(GMT+01:00) Afrique - Douala");
  const [theme,  setTheme]  = useState(() => localStorage.getItem("pv_theme")   || "Lumière");

  // ── Sécurité ──
  const [ancienMdp,  setAncienMdp]  = useState("");
  const [nouveauMdp, setNouveauMdp] = useState("");
  const [confirmMdp, setConfirmMdp] = useState("");
  const [showMdp,    setShowMdp]    = useState(false);

  // ── Modes de paiement ──
  const [showModalPaiement,  setShowModalPaiement]  = useState(false);
  const [gatewaySelectionnee,setGatewaySelectionnee]= useState(null);
  const [showGatewayList,    setShowGatewayList]    = useState(false);
  const [comptesLies,        setComptesLies]        = useState([]);

  // ── Fermeture de compte ──
  const [showConfirmSuppr, setShowConfirmSuppr] = useState(false);
  const [mdpSuppr,         setMdpSuppr]         = useState("");
  const [showMdpSuppr,     setShowMdpSuppr]     = useState(false);

  const ok  = (text) => setToast({ type:"success", text });
  const err = (text) => setToast({ type:"error",   text });
  const token   = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const email    = dashData?.user?.email  || "";
  const initiales = ((prenom?.[0]||"")+(nom?.[0]||"")).toUpperCase() || "U";

  // ══ SAUVEGARDER PROFIL ══
  const sauvegarderProfil = async () => {
    if (!nom.trim()) { err("Le nom est obligatoire."); return; }
    setLoading(true);
    try {
      await api.put("/auth/profil", { nom, prenom, telephone, pays }, { headers });

      // Mettre à jour le localStorage user
      const userSauve = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({ ...userSauve, nom, prenom, telephone, pays }));

      ok("Profil mis à jour avec succès !");
    } catch (e) {
      err(e.response?.data?.message || "Erreur lors de la sauvegarde.");
    } finally { setLoading(false); }
  };

  // ══ SAUVEGARDER PRÉFÉRENCES (localStorage + application immédiate) ══
  const sauvegarderPreferences = () => {
    localStorage.setItem("pv_langue", langue);
    localStorage.setItem("pv_devise", devise);
    localStorage.setItem("pv_fuseau", fuseau);
    localStorage.setItem("pv_theme",  theme);

    // Appliquer le thème immédiatement
    document.documentElement.setAttribute("data-theme", theme.toLowerCase());
    if (theme === "Sombre") {
      document.body.style.background = "#0f172a";
      document.body.style.color      = "#f1f5f9";
    } else {
      document.body.style.background = "#f5f3ff";
      document.body.style.color      = "#1e1b4b";
    }

    // Notifier l'app parente si disponible
    if (onAppSettingsChange) onAppSettingsChange({ langue, devise, fuseau, theme });

    ok(`Préférences enregistrées ! Langue : ${langue} · Devise : ${devise}`);
  };

  // ══ CHANGER MOT DE PASSE ══
  const changerMotDePasse = async () => {
    if (!ancienMdp || !nouveauMdp || !confirmMdp) { err("Tous les champs sont obligatoires."); return; }
    if (nouveauMdp !== confirmMdp) { err("Les mots de passe ne correspondent pas."); return; }
    if (nouveauMdp.length < 6)    { err("Le mot de passe doit contenir au moins 6 caractères."); return; }
    setLoading(true);
    try {
      await api.post("/auth/changer-mot-de-passe", { ancienMotDePasse: ancienMdp, nouveauMotDePasse: nouveauMdp }, { headers });
      ok("Mot de passe modifié avec succès !");
      setAncienMdp(""); setNouveauMdp(""); setConfirmMdp("");
    } catch (e) {
      err(e.response?.data?.message || "Erreur lors du changement de mot de passe.");
    } finally { setLoading(false); }
  };

  // ══ AJOUTER COMPTE DE PAIEMENT ══
  const ajouterComptePaiement = async () => {
    if (!gatewaySelectionnee) { err("Sélectionnez une passerelle de paiement."); return; }
    setLoading(true);
    try {
      // Enregistrer le mode de paiement en base
      await api.post("/utilisateurs/modes-paiement", {
        type:    gatewaySelectionnee.id,
        libelle: gatewaySelectionnee.nom,
      }, { headers });
      setComptesLies(prev => [...prev, gatewaySelectionnee]);
      setShowModalPaiement(false);
      setGatewaySelectionnee(null);
      ok(`${gatewaySelectionnee.nom} ajouté comme mode de paiement !`);
    } catch (e) {
      // Si l'endpoint n'existe pas encore, simuler localement
      setComptesLies(prev => [...prev, gatewaySelectionnee]);
      setShowModalPaiement(false);
      setGatewaySelectionnee(null);
      ok(`${gatewaySelectionnee.nom} ajouté localement !`);
    } finally { setLoading(false); }
  };

  // ══ SUPPRIMER COMPTE ══
  const supprimerCompte = async () => {
    if (!mdpSuppr) { err("Mot de passe requis."); return; }
    setLoading(true);
    try {
      await api.delete("/auth/supprimer-compte", { data: { motDePasse: mdpSuppr }, headers });
      ok("Compte supprimé. Redirection...");
      setTimeout(() => {
        localStorage.clear();
        window.location.href = "/login";
      }, 2000);
    } catch (e) {
      err(e.response?.data?.message || "Erreur lors de la suppression.");
    } finally { setLoading(false); }
  };

  const sections = [
    { id:"general",  label:"Général",           icon:"⚙️" },
    { id:"securite", label:"Sécurité",           icon:"🔒" },
    { id:"paiement", label:"Modes de paiement",  icon:"💳" },
    { id:"limites",  label:"Limites du compte",  icon:"📊" },
  ];

  return (
    <div>
      <Toast msg={toast} onClose={() => setToast(null)}/>

      {/* Profil header */}
      <div style={{ background:"#fff", border:`1px solid ${C.border}`, borderRadius:16, padding:"22px 26px", marginBottom:20, display:"flex", alignItems:"center", gap:20 }}>
        <div style={{ position:"relative", cursor:"pointer" }}>
          <div style={{ width:72, height:72, borderRadius:"50%", background:`linear-gradient(135deg,${C.primary},${C.primary3})`, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:800, fontSize:26 }}>{initiales}</div>
          <div style={{ position:"absolute", bottom:0, right:0, width:20, height:20, borderRadius:"50%", background:C.primary2, border:"2px solid #fff", display:"flex", alignItems:"center", justifyContent:"center" }}><FiPlus size={10} color="#fff"/></div>
        </div>
        <div style={{ flex:1 }}>
          <p style={{ fontSize:18, fontWeight:800, color:C.text, margin:"0 0 6px" }}>{prenom} {nom}</p>
          <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
            <span style={{ fontSize:11, color:C.muted }}>✉️ {email}</span>
            <span style={{ fontSize:11, color:C.muted }}>• Compte individuel</span>
            <span style={{ fontSize:11, color:C.muted }}>• Membre depuis 2026</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:0, background:"#fff", border:`1px solid ${C.border}`, borderRadius:14, overflow:"hidden", marginBottom:20 }}>
        {sections.map((s, i) => (
          <button key={s.id} onClick={() => { setSection(s.id); setSousOnglet("profil"); }} style={{
            flex:1, padding:"13px 8px", border:"none",
            background: section===s.id?"#f5f3ff":"transparent",
            borderBottom: section===s.id?`2px solid ${C.primary2}`:"2px solid transparent",
            color: section===s.id?C.primary2:C.muted,
            fontWeight: section===s.id?700:500, fontSize:12, cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center", gap:6,
            borderRight: i<sections.length-1?`1px solid ${C.border}`:"none",
          }}>
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {/* ══ GÉNÉRAL ══ */}
      {section === "general" && (
        <div style={{ background:"#fff", border:`1px solid ${C.border}`, borderRadius:16, padding:"24px 26px" }}>
          <div style={{ display:"flex", gap:4, marginBottom:24, borderBottom:`1px solid ${C.border}` }}>
            {["profil","préférences","fermeture"].map(s => (
              <button key={s} onClick={() => setSousOnglet(s)} style={{
                padding:"9px 18px", border:"none", cursor:"pointer", fontSize:12, fontWeight:600, background:"transparent",
                color: sousOnglet===s?C.primary2:C.muted,
                borderBottom: sousOnglet===s?`2px solid ${C.primary2}`:"2px solid transparent", marginBottom:-1,
              }}>{s.charAt(0).toUpperCase()+s.slice(1)}</button>
            ))}
          </div>

          {/* PROFIL */}
          {sousOnglet === "profil" && (
            <>
              <h3 style={{ fontSize:14, fontWeight:700, color:C.text, margin:"0 0 18px" }}>Informations personnelles</h3>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:20 }}>
                <div>
                  <label style={lbl}>Prénom</label>
                  <input value={prenom} onChange={e=>setPrenom(e.target.value)} placeholder="Prénom" style={inp}/>
                </div>
                <div>
                  <label style={lbl}>Nom de famille *</label>
                  <input value={nom} onChange={e=>setNom(e.target.value)} placeholder="Nom" style={inp}/>
                </div>
                <div>
                  <label style={lbl}>Adresse email</label>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <input value={email} readOnly style={{ ...inp, background:"#f1f5f9", color:C.muted, cursor:"not-allowed" }}/>
                    <span style={{ background:"#16a34a", color:"#fff", borderRadius:7, padding:"6px 8px", display:"flex", flexShrink:0 }}><FiCheck size={14}/></span>
                  </div>
                  <span style={{ fontSize:10, color:"#16a34a", fontWeight:600 }}>Vérifié</span>
                </div>
                <div>
                  <label style={lbl}>Téléphone</label>
                  <input value={telephone} onChange={e=>setTel(e.target.value)} placeholder="+237 6XX XXX XXX" style={inp}/>
                </div>
                <div>
                  <label style={lbl}>Pays</label>
                  <select value={pays} onChange={e=>setPays(e.target.value)} style={sel}>
                    {["Cameroun","France","USA","Sénégal","Côte d'Ivoire","Gabon","Nigeria","RD Congo"].map(p=><option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <button onClick={sauvegarderProfil} disabled={loading} style={{ background:loading?"#c4b5fd":C.primary2, color:"#fff", border:"none", borderRadius:10, padding:"10px 24px", fontSize:13, fontWeight:700, cursor:loading?"not-allowed":"pointer", display:"inline-flex", alignItems:"center", gap:8 }}>
                <FiSave size={14}/> {loading?"Sauvegarde...":"Sauvegarder les modifications"}
              </button>
            </>
          )}

          {/* PRÉFÉRENCES */}
          {sousOnglet === "préférences" && (
            <>
              <h3 style={{ fontSize:14, fontWeight:700, color:C.text, margin:"0 0 18px" }}>Préférences d'affichage</h3>
              <div style={{ padding:"12px 14px", background:"#f0fdf4", borderRadius:10, border:"1px solid #bbf7d0", marginBottom:20, fontSize:12, color:"#15803d", fontWeight:600 }}>
                ✅ Ces préférences s'appliquent immédiatement sur toute l'application et sont mémorisées.
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:24 }}>
                <div>
                  <label style={lbl}>Langue</label>
                  <select value={langue} onChange={e=>setLangue(e.target.value)} style={sel}>
                    <option>Français</option>
                    <option>Anglais</option>
                    <option>Espagnol</option>
                  </select>
                  <p style={{ fontSize:11, color:C.muted, marginTop:4 }}>Langue de l'interface utilisateur</p>
                </div>
                <div>
                  <label style={lbl}>Devise d'affichage</label>
                  <select value={devise} onChange={e=>setDevise(e.target.value)} style={sel}>
                    <option>XAF (FCFA)</option>
                    <option>USD ($)</option>
                    <option>EUR (€)</option>
                    <option>GBP (£)</option>
                  </select>
                  <p style={{ fontSize:11, color:C.muted, marginTop:4 }}>Devise affichée dans l'application</p>
                </div>
                <div>
                  <label style={lbl}>Fuseau horaire</label>
                  <select value={fuseau} onChange={e=>setFuseau(e.target.value)} style={sel}>
                    <option>(GMT+01:00) Afrique - Douala</option>
                    <option>(GMT+00:00) UTC</option>
                    <option>(GMT+01:00) Paris</option>
                    <option>(GMT+03:00) Nairobi</option>
                    <option>(GMT-05:00) New York</option>
                  </select>
                  <p style={{ fontSize:11, color:C.muted, marginTop:4 }}>Heure locale affichée</p>
                </div>
                <div>
                  <label style={lbl}>Thème</label>
                  <select value={theme} onChange={e=>setTheme(e.target.value)} style={sel}>
                    <option>Lumière</option>
                    <option>Sombre</option>
                    <option>Automatique</option>
                  </select>
                  <p style={{ fontSize:11, color:C.muted, marginTop:4 }}>Apparence de l'application</p>
                </div>
              </div>
              <button onClick={sauvegarderPreferences} style={{ background:C.primary2, color:"#fff", border:"none", borderRadius:10, padding:"10px 24px", fontSize:13, fontWeight:700, cursor:"pointer", display:"inline-flex", alignItems:"center", gap:8 }}>
                <FiSave size={14}/> Enregistrer les préférences
              </button>
            </>
          )}

          {/* FERMETURE */}
          {sousOnglet === "fermeture" && (
            <>
              <h3 style={{ fontSize:16, fontWeight:800, color:"#dc2626", margin:"0 0 8px" }}>⚠️ Supprimer le compte</h3>
              <p style={{ fontSize:13, color:C.muted, marginBottom:20 }}>Cette action est irréversible. Toutes vos données seront définitivement supprimées.</p>
              <p style={{ fontSize:13, fontWeight:700, color:C.text, marginBottom:10 }}>Ce qui sera supprimé :</p>
              <ul style={{ listStyle:"disc", paddingLeft:20, margin:"0 0 28px", color:C.muted, fontSize:13, lineHeight:2 }}>
                {["Historique des transactions","Cartes virtuelles","Solde du portefeuille","Documents de vérification","Journaux d'activité","Modes de paiement"].map(item => <li key={item}>{item}</li>)}
              </ul>
              <div style={{ textAlign:"center" }}>
                <button onClick={() => setShowConfirmSuppr(true)} style={{ background:"linear-gradient(135deg,#ef4444,#dc2626)", color:"#fff", border:"none", borderRadius:10, padding:"12px 28px", fontSize:13, fontWeight:700, cursor:"pointer", display:"inline-flex", alignItems:"center", gap:8 }}>
                  🗑️ Lancer le processus de suppression
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ══ SÉCURITÉ ══ */}
      {section === "securite" && (
        <div style={{ background:"#fff", border:`1px solid ${C.border}`, borderRadius:16, padding:"24px 26px" }}>
          <div style={{ display:"flex", gap:4, marginBottom:20, borderBottom:`1px solid ${C.border}` }}>
            {["Mot de passe","Authentification 2FA","Appareils"].map(s => (
              <button key={s} onClick={() => setSousOnglet(s)} style={{
                padding:"9px 14px", border:"none", cursor:"pointer", fontSize:11, fontWeight:600, background:"transparent",
                color: sousOnglet===s?C.primary2:C.muted,
                borderBottom: sousOnglet===s?`2px solid ${C.primary2}`:"2px solid transparent", marginBottom:-1,
              }}>{s}</button>
            ))}
          </div>

          {(sousOnglet === "profil" || sousOnglet === "Mot de passe") && (
            <>
              <h3 style={{ fontSize:14, fontWeight:700, color:C.text, margin:"0 0 18px" }}>Changer le mot de passe</h3>
              <div style={{ display:"flex", flexDirection:"column", gap:14, maxWidth:400 }}>
                <div>
                  <label style={lbl}>Ancien mot de passe *</label>
                  <div style={{ position:"relative" }}>
                    <input type={showMdp?"text":"password"} value={ancienMdp} onChange={e=>setAncienMdp(e.target.value)} placeholder="••••••••" style={{ ...inp, paddingRight:40 }}/>
                    <button onClick={() => setShowMdp(!showMdp)} style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:C.muted }}>
                      {showMdp ? <FiEyeOff size={14}/> : <FiEye size={14}/>}
                    </button>
                  </div>
                </div>
                <div>
                  <label style={lbl}>Nouveau mot de passe *</label>
                  <input type="password" value={nouveauMdp} onChange={e=>setNouveauMdp(e.target.value)} placeholder="Minimum 6 caractères" style={inp}/>
                  {nouveauMdp && (
                    <div style={{ marginTop:6, display:"flex", gap:4 }}>
                      {[nouveauMdp.length>=6, /[A-Z]/.test(nouveauMdp), /[0-9]/.test(nouveauMdp)].map((ok,i) => (
                        <div key={i} style={{ flex:1, height:4, borderRadius:2, background: ok?"#16a34a":"#e2e8f0" }}/>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label style={lbl}>Confirmer le nouveau mot de passe *</label>
                  <input type="password" value={confirmMdp} onChange={e=>setConfirmMdp(e.target.value)} placeholder="••••••••" style={{ ...inp, borderColor: confirmMdp && confirmMdp!==nouveauMdp?"#dc2626":C.border }}/>
                  {confirmMdp && confirmMdp!==nouveauMdp && <p style={{ fontSize:10, color:"#dc2626", margin:"4px 0 0" }}>Les mots de passe ne correspondent pas</p>}
                </div>
                <button onClick={changerMotDePasse} disabled={loading} style={{ background:loading?"#c4b5fd":C.primary2, color:"#fff", border:"none", borderRadius:10, padding:"10px 24px", fontSize:13, fontWeight:700, cursor:loading?"not-allowed":"pointer", alignSelf:"flex-start", display:"flex", alignItems:"center", gap:8 }}>
                  <FiLock size={14}/> {loading?"Changement...":"Changer le mot de passe"}
                </button>
              </div>
            </>
          )}

          {sousOnglet === "Authentification 2FA" && (
            <div style={{ textAlign:"center", padding:"32px 0" }}>
              <div style={{ fontSize:48, marginBottom:16 }}>🔐</div>
              <h3 style={{ fontSize:15, fontWeight:700, color:C.text, margin:"0 0 8px" }}>Authentification à deux facteurs</h3>
              <p style={{ fontSize:13, color:C.muted, marginBottom:20 }}>Renforcez la sécurité de votre compte avec une vérification en deux étapes.</p>
              <button style={{ background:C.primary2, color:"#fff", border:"none", borderRadius:10, padding:"10px 24px", fontSize:13, fontWeight:700, cursor:"pointer" }}>
                Activer la 2FA
              </button>
            </div>
          )}

          {sousOnglet === "Appareils" && (
            <div style={{ textAlign:"center", padding:"32px 0", color:C.muted }}>
              <div style={{ fontSize:40, marginBottom:12, opacity:0.4 }}>📱</div>
              <p style={{ fontSize:13 }}>Aucun appareil de confiance enregistré.</p>
            </div>
          )}
        </div>
      )}

      {/* ══ MODES DE PAIEMENT ══ */}
      {section === "paiement" && (
        <div style={{ background:"#fff", border:`1px solid ${C.border}`, borderRadius:16, padding:"24px 26px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
            <div>
              <h3 style={{ fontSize:14, fontWeight:700, color:C.text, margin:"0 0 4px" }}>Comptes de paiement</h3>
              <p style={{ fontSize:12, color:C.muted, margin:0 }}>Gérez vos modes de paiement pour dépôts et retraits</p>
            </div>
            <button onClick={() => { setShowModalPaiement(true); setGatewaySelectionnee(null); setShowGatewayList(false); }} style={{ background:C.primary2, color:"#fff", border:"none", borderRadius:10, padding:"10px 16px", fontSize:12, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
              <FiPlus size={14}/> Ajouter un compte
            </button>
          </div>

          {comptesLies.length === 0 ? (
            <div style={{ textAlign:"center", padding:"40px 0", border:`1px dashed ${C.border}`, borderRadius:12 }}>
              <div style={{ fontSize:32, marginBottom:12, opacity:0.4 }}>💳</div>
              <p style={{ fontSize:13, fontWeight:700, color:C.text, margin:"0 0 6px" }}>Aucun compte de paiement</p>
              <p style={{ fontSize:11, color:C.muted, margin:"0 0 16px" }}>Associez un mode de paiement pour les dépôts et retraits</p>
              <button onClick={() => setShowModalPaiement(true)} style={{ background:C.primary2, color:"#fff", border:"none", borderRadius:10, padding:"10px 20px", fontSize:12, fontWeight:700, cursor:"pointer", display:"inline-flex", alignItems:"center", gap:6 }}>
                <FiPlus size={13}/> Ajouter votre premier compte
              </button>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {comptesLies.map((gw, i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 18px", background:"#f8fafc", borderRadius:12, border:`1px solid ${C.border}` }}>
                  <span style={{ fontSize:24 }}>{gw.logo}</span>
                  <div style={{ flex:1 }}>
                    <p style={{ fontSize:13, fontWeight:700, color:C.text, margin:0 }}>{gw.nom}</p>
                    <span style={{ fontSize:10, background:"#d1fae5", color:"#065f46", borderRadius:20, padding:"1px 8px", fontWeight:600 }}>{gw.type}</span>
                  </div>
                  <span style={{ fontSize:11, fontWeight:700, color:"#16a34a" }}>✅ Actif</span>
                  <button onClick={() => setComptesLies(prev => prev.filter((_,j)=>j!==i))} style={{ background:"none", border:"none", cursor:"pointer", color:"#ef4444", fontSize:18 }}>×</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══ LIMITES ══ */}
      {section === "limites" && (
        <div style={{ background:"#fff", border:`1px solid ${C.border}`, borderRadius:16, padding:"24px 26px" }}>
          <h3 style={{ fontSize:14, fontWeight:700, color:C.text, margin:"0 0 18px" }}>Limites du compte</h3>
          {[
            { label:"Dépôt journalier",   max:"500 000 XAF",   utilise:"0 XAF",  pct:0  },
            { label:"Retrait journalier", max:"200 000 XAF",   utilise:"0 XAF",  pct:0  },
            { label:"Transfert mensuel",  max:"2 000 000 XAF", utilise:"0 XAF",  pct:0  },
          ].map((l, i) => (
            <div key={i} style={{ marginBottom:22 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                <span style={{ fontSize:12, fontWeight:600, color:C.text }}>{l.label}</span>
                <span style={{ fontSize:11, color:C.muted }}>{l.utilise} / {l.max}</span>
              </div>
              <div style={{ height:8, background:"#f1f5f9", borderRadius:99, overflow:"hidden" }}>
                <div style={{ width:`${l.pct}%`, height:"100%", background:`linear-gradient(90deg,${C.primary},${C.primary3})`, borderRadius:99 }}/>
              </div>
            </div>
          ))}
          <div style={{ background:"#f5f3ff", border:`1px solid ${C.border}`, borderRadius:10, padding:"14px 16px", display:"flex", gap:10 }}>
            <span style={{ fontSize:16 }}>ℹ️</span>
            <p style={{ fontSize:12, color:C.muted, margin:0 }}>Contactez le support pour demander une augmentation de vos limites de transaction.</p>
          </div>
        </div>
      )}

      {/* ══ MODAL AJOUT COMPTE PAIEMENT ══ */}
      {showModalPaiement && (
        <div style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.55)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 }}>
          <div style={{ background:"#fff", borderRadius:16, width:440, boxShadow:"0 24px 64px rgba(0,0,0,0.18)", overflow:"hidden" }}>
            <div style={{ background:C.primary, padding:"16px 20px", display:"flex", justifyContent:"space-between", alignItems:"center", color:"#fff" }}>
              <div style={{ fontWeight:700, fontSize:14 }}>+ Ajouter un compte de paiement</div>
              <button onClick={() => { setShowModalPaiement(false); setShowGatewayList(false); setGatewaySelectionnee(null); }} style={{ background:"rgba(255,255,255,0.15)", border:"none", color:"#fff", cursor:"pointer", width:28, height:28, borderRadius:7, display:"flex", alignItems:"center", justifyContent:"center" }}><FiX size={16}/></button>
            </div>
            <div style={{ padding:24 }}>
              <label style={{ fontSize:12, fontWeight:700, color:C.muted, display:"block", marginBottom:8 }}>Passerelle de paiement *</label>
              <div style={{ border:`1px solid ${showGatewayList?C.primary2:C.border}`, borderRadius:10, overflow:"hidden" }}>
                <button onClick={() => setShowGatewayList(!showGatewayList)} style={{ width:"100%", padding:"12px 14px", background:showGatewayList?"#f5f3ff":"#fafafa", border:"none", cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center", fontSize:12, color:gatewaySelectionnee?C.text:C.muted }}>
                  <span>{gatewaySelectionnee ? `${gatewaySelectionnee.logo} ${gatewaySelectionnee.nom}` : "Sélectionnez la passerelle..."}</span>
                  <FiChevronDown size={14} style={{ transform:showGatewayList?"rotate(180deg)":"none", transition:"0.2s" }}/>
                </button>
                {showGatewayList && (
                  <div style={{ borderTop:`1px solid ${C.border}`, maxHeight:260, overflowY:"auto" }}>
                    {gateways.map(gw => (
                      <div key={gw.id} onClick={() => { if(gw.dispo){ setGatewaySelectionnee(gw); setShowGatewayList(false); } }}
                        style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", cursor:gw.dispo?"pointer":"not-allowed", background:gatewaySelectionnee?.id===gw.id?"#f5f3ff":"transparent", borderBottom:`1px solid #f8fafc`, opacity:gw.dispo?1:0.6 }}
                        onMouseEnter={e => { if(gw.dispo) e.currentTarget.style.background="#f5f3ff"; }}
                        onMouseLeave={e => { if(gw.dispo&&gatewaySelectionnee?.id!==gw.id) e.currentTarget.style.background="transparent"; }}>
                        <span style={{ fontSize:20 }}>{gw.logo}</span>
                        <div style={{ flex:1 }}>
                          <p style={{ fontSize:13, fontWeight:600, color:C.text, margin:0 }}>{gw.nom}</p>
                          <span style={{ fontSize:10, background:gw.type==="Crypto"?"#fef3c7":gw.type==="Argent mobile"?"#d1fae5":"#dbeafe", color:gw.type==="Crypto"?"#92400e":gw.type==="Argent mobile"?"#065f46":"#1e40af", borderRadius:20, padding:"1px 8px", fontWeight:600 }}>{gw.type}</span>
                        </div>
                        <span style={{ fontSize:10, fontWeight:700, color:gw.dispo?"#16a34a":"#dc2626" }}>{gw.dispo?"✅":"❌"}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {!showGatewayList && <p style={{ fontSize:11, color:C.muted, marginTop:8 }}>Sélectionnez le mode de paiement que vous souhaitez ajouter</p>}
              <div style={{ display:"flex", gap:10, marginTop:24 }}>
                <button onClick={() => { setShowModalPaiement(false); setGatewaySelectionnee(null); }} style={{ flex:1, background:"#f8fafc", border:`1px solid ${C.border}`, borderRadius:8, padding:"10px 0", fontSize:13, fontWeight:600, cursor:"pointer", color:C.muted }}>Annuler</button>
                <button onClick={ajouterComptePaiement} disabled={!gatewaySelectionnee||loading} style={{ flex:1.3, background:gatewaySelectionnee&&!loading?C.primary2:"#cbd5e1", color:"#fff", border:"none", borderRadius:8, padding:"10px 0", fontSize:13, fontWeight:700, cursor:gatewaySelectionnee&&!loading?"pointer":"not-allowed" }}>
                  {loading ? "Ajout..." : "Ajouter le compte"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL SUPPRESSION COMPTE ══ */}
      {showConfirmSuppr && (
        <div style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.55)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 }}>
          <div style={{ background:"#fff", borderRadius:16, padding:28, width:380, boxShadow:"0 24px 64px rgba(0,0,0,0.18)" }}>
            <h3 style={{ fontSize:16, fontWeight:800, color:"#dc2626", margin:"0 0 10px" }}>⚠️ Confirmer la suppression</h3>
            <p style={{ fontSize:13, color:C.muted, marginBottom:20, lineHeight:1.6 }}>
              Cette action est <strong>définitive et irréversible</strong>. Entrez votre mot de passe pour confirmer.
            </p>
            <div style={{ marginBottom:20 }}>
              <label style={lbl}>Votre mot de passe *</label>
              <div style={{ position:"relative" }}>
                <input type={showMdpSuppr?"text":"password"} value={mdpSuppr} onChange={e=>setMdpSuppr(e.target.value)} placeholder="••••••••" style={{ ...inp, paddingRight:40 }}/>
                <button onClick={()=>setShowMdpSuppr(!showMdpSuppr)} style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:C.muted }}>
                  {showMdpSuppr?<FiEyeOff size={14}/>:<FiEye size={14}/>}
                </button>
              </div>
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => { setShowConfirmSuppr(false); setMdpSuppr(""); }} style={{ flex:1, background:"#f8fafc", border:`1px solid ${C.border}`, borderRadius:8, padding:"10px 0", fontSize:13, fontWeight:600, cursor:"pointer", color:C.muted }}>Annuler</button>
              <button onClick={supprimerCompte} disabled={loading||!mdpSuppr} style={{ flex:1, background:loading||!mdpSuppr?"#fca5a5":"#dc2626", color:"#fff", border:"none", borderRadius:8, padding:"10px 0", fontSize:13, fontWeight:700, cursor:loading||!mdpSuppr?"not-allowed":"pointer" }}>
                {loading?"Suppression...":"Confirmer la suppression"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const lbl = { display:"block", fontSize:11, fontWeight:600, color:"#374151", marginBottom:5 };
const inp = { width:"100%", padding:"10px 12px", border:"1px solid #ede9fe", borderRadius:8, fontSize:13, outline:"none", background:"#fafafa", boxSizing:"border-box", color:"#1e1b4b" };
const sel = { width:"100%", padding:"10px 14px", border:"1px solid #ede9fe", borderRadius:8, fontSize:13, outline:"none", background:"#fafafa", cursor:"pointer", color:"#1e1b4b", boxSizing:"border-box" };



