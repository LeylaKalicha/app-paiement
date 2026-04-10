import { useState } from "react";
import { FiZap, FiDollarSign, FiShield, FiX, FiCheck, FiLock } from "react-icons/fi";
import api from "../../services/api";

const C = {
  primary: "#6d28d9", primary2: "#7c3aed", border: "#ede9fe",
  text: "#1e1b4b", muted: "#6b7280",
};

const pays    = ["Cameroun", "France", "USA", "Sénégal", "Côte d'Ivoire", "RD Congo", "Gabon", "Maroc", "Nigeria"];
const banques = ["MTN Mobile Money", "Orange Money", "Express Union", "CCA Bank", "Afriland First Bank", "UBA", "Société Générale"];
const raisons = ["Famille & Amis", "Loyer", "Factures", "Commerce", "Santé", "Éducation", "Autre"];

const TAUX_FRAIS = 0.01;

const modesDeSrcTransfert = [
  { id:"payvirtual",          groupe:"Vers les comptes PayVirtual",  label:"PayVirtual",           icon:"🟣", desc:"Instantané",      frais:"Gratuit", gratuit:true  },
  { id:"payvirtual_business", groupe:"Vers les comptes PayVirtual",  label:"PayVirtual Business", icon:"🟣", desc:"Instantané",      frais:"Gratuit", gratuit:true  },
  { id:"mtn",                 groupe:"Vers Mobile Money",            label:"MTN MoMo CM",          icon:"🟡", desc:"15 minutes",      frais:"1%"  },
  { id:"orange",              groupe:"Vers Mobile Money",            label:"Orange Money CM",      icon:"🟠", desc:"15 minutes",      frais:"1%"  },
  { id:"binance",             groupe:"Vers d'autres portefeuilles",  label:"Binance",             icon:"🟡", desc:"15 minutes",      frais:"1%"  },
  { id:"paypal",              groupe:"Vers d'autres portefeuilles",  label:"PayPal",               icon:"🔵", desc:"Instantané",      frais:"1%"  },
  { id:"revolut",             groupe:"Vers d'autres portefeuilles",  label:"Revolut",              icon:"🔷", desc:"1 jour ouvrable", frais:"1%"  },
  { id:"skrill",              groupe:"Vers d'autres portefeuilles",  label:"Skrill",               icon:"🟢", desc:"15 à 60 min",     frais:"1%"  },
];
const groupes = [...new Set(modesDeSrcTransfert.map(m => m.groupe))];

const nettoyerNumero = (telephone) => String(telephone).replace(/[\s+\-()]/g, "");

const lbl = { fontSize:12, fontWeight:700, color:C.text, display:"block", marginBottom:6 };
const inp = { width:"100%", padding:"10px 14px", borderRadius:8, border:`1px solid ${C.border}`, outline:"none", fontSize:13 };
const sel = { ...inp, background:"#fff" };

export default function EnvoyerArgent({ retour, dashData }) {
  const [modeSelectionne, setModeSelectionne] = useState(null);
  const [etape,    setEtape]    = useState(1);
  const [msg,      setMsg]      = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [resultat, setResultat] = useState(null);
  const [pin,      setPin]      = useState(""); // <-- AJOUT DU CODE PIN

  const [form, setForm] = useState({
    emailWallet: "", telephone: "", montant: "",
    paysSrc: "", paysDest: "", banque: "",
    numeroCompte: "", nomBeneficiaire: "", raison: "",
  });

  const solde = Number(dashData?.solde || 0);
  const isMobile   = modeSelectionne?.id === "mtn" || modeSelectionne?.id === "orange";
  const isWallet   = modeSelectionne?.id === "payvirtual" || modeSelectionne?.id === "payvirtual_business";
  const isExternal = !isMobile && !isWallet && modeSelectionne;

  const montantNum = Number(form.montant || 0);
  const fraisXAF   = modeSelectionne?.gratuit ? 0 : Math.max(50, Math.round(montantNum * TAUX_FRAIS));
  const recoitXAF  = Math.max(0, montantNum - fraisXAF);

  const continuer = () => {
    if (!form.montant || montantNum <= 0) {
      setMsg({ type:"error", text:"Veuillez entrer un montant valide." }); return;
    }
    if (montantNum > solde) {
      setMsg({ type:"error", text:`Solde insuffisant. Disponible : ${solde.toLocaleString("fr-FR")} XAF.` }); return;
    }
    if (isWallet && !form.emailWallet) {
      setMsg({ type:"error", text:"Veuillez entrer l'email du destinataire." }); return;
    }
    if (isMobile && !form.telephone) {
      setMsg({ type:"error", text:"Veuillez entrer le numéro Mobile Money." }); return;
    }
    if (isMobile && nettoyerNumero(form.telephone).length < 9) {
      setMsg({ type:"error", text:"Numéro invalide. Entrez 9 chiffres (ex: 655024817)." }); return;
    }
    if (isExternal && !form.nomBeneficiaire) {
      setMsg({ type:"error", text:"Veuillez entrer le nom du bénéficiaire." }); return;
    }
    setMsg(null);
    setEtape(3);
  };

  const confirmer = async () => {
    // Vérification du PIN avant l'envoi
    if (pin.length < 4) {
      setMsg({ type: "error", text: "Veuillez saisir votre code PIN de 4 chiffres." });
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      let payload;
      const endpoint = "/transactions/transfert";

      const basePayload = { 
        montant: montantNum, 
        raison: form.raison,
        pin: pin // <-- AJOUT DU PIN DANS LE PAYLOAD
      };

      if (isMobile) {
        payload = { ...basePayload, type: modeSelectionne.id, nomBeneficiaire: form.nomBeneficiaire || `Bénéficiaire ${modeSelectionne.label}`, numeroCompte: nettoyerNumero(form.telephone) };
      } else if (isWallet) {
        payload = { ...basePayload, type: "wallet", nomBeneficiaire: form.emailWallet, numeroCompte: form.emailWallet };
      } else {
        payload = { ...basePayload, type: "bank", nomBeneficiaire: form.nomBeneficiaire, numeroCompte: form.numeroCompte, banque: form.banque, paysSrc: form.paysSrc, paysDest: form.paysDest };
      }

      const res = await api.post(endpoint, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setResultat(res.data);
      setEtape(4);
    } catch (e) {
      setMsg({ type:"error", text: e.response?.data?.message || "Erreur lors de la transaction ou PIN incorrect." });
    } finally { setLoading(false); }
  };

  const reset = () => {
    setEtape(1); setMsg(null); setResultat(null); setModeSelectionne(null); setPin("");
    setForm({ emailWallet:"", telephone:"", montant:"", paysSrc:"", paysDest:"", banque:"", numeroCompte:"", nomBeneficiaire:"", raison:"" });
  };

  return (
    <div>
      {/* Bannière */}
      <div style={{ background:"linear-gradient(135deg,#2e1065,#7c3aed)", borderRadius:16, padding:"20px 28px", marginBottom:24, color:"#fff", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <p style={{ fontSize:18, fontWeight:800, margin:"0 0 4px" }}>Transfert de fonds</p>
          <p style={{ fontSize:13, opacity:0.85, margin:0 }}>Envoyez de l'argent à n'importe qui, n'importe où</p>
        </div>
        <div style={{ background:"rgba(255,255,255,0.12)", borderRadius:10, padding:"8px 16px", textAlign:"right" }}>
          <div style={{ fontSize:10, opacity:0.7, marginBottom:2 }}>Solde disponible</div>
          <div style={{ fontSize:16, fontWeight:800 }}>{solde.toLocaleString("fr-FR")} XAF</div>
        </div>
      </div>

      {/* 3 avantages */}
      <div style={{ display:"flex", gap:14, marginBottom:24 }}>
        {[
          { icon:<FiZap size={20} color={C.primary2}/>,        titre:"Transferts instantanés", desc:"Envoi en quelques minutes" },
          { icon:<FiDollarSign size={20} color={C.primary2}/>, titre:"Frais réduits",           desc:"Seulement 1% de frais" },
          { icon:<FiShield size={20} color={C.primary2}/>,     titre:"Sécurisé",                desc:"Sécurité de niveau bancaire" },
        ].map(a => (
          <div key={a.titre} style={{ flex:1, background:"#fff", borderRadius:12, padding:"16px 18px", border:`1px solid ${C.border}`, textAlign:"center" }}>
            <div style={{ marginBottom:8 }}>{a.icon}</div>
            <p style={{ fontSize:12, fontWeight:700, color:C.text, marginBottom:4 }}>{a.titre}</p>
            <p style={{ fontSize:11, color:C.muted, margin:0 }}>{a.desc}</p>
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 300px", gap:20 }}>
        <div style={{ background:"#fff", borderRadius:14, padding:"24px 28px", border:`1px solid ${C.border}` }}>

          {/* ── ÉTAPE 1 : Mode de transfert ── */}
          {etape === 1 && (
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
                <div style={{ width:28, height:28, borderRadius:"50%", background:C.primary2, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:800 }}>1</div>
                <h3 style={{ fontSize:15, fontWeight:700, color:C.text, margin:0 }}>Choisir le mode de transfert</h3>
              </div>
              <p style={{ fontSize:12, color:C.muted, marginBottom:20 }}>Sélectionnez une méthode pour envoyer votre argent</p>

              {msg && <div style={{ padding:"10px 14px", borderRadius:8, marginBottom:16, fontSize:13, fontWeight:600, background:"#fef2f2", color:"#dc2626", border:"1px solid #fecaca" }}>{msg.text}</div>}

              {groupes.map(groupe => (
                <div key={groupe} style={{ marginBottom:20 }}>
                  <p style={{ fontSize:11, fontWeight:700, color:C.muted, marginBottom:10 }}>
                    {groupe === "Vers les comptes PayVirtual" ? "⚡" : groupe === "Vers Mobile Money" ? "📱" : "🌐"} {groupe}
                  </p>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                    {modesDeSrcTransfert.filter(m => m.groupe === groupe).map(mode => (
                      <div key={mode.id} onClick={() => { setModeSelectionne(mode); setEtape(2); setMsg(null); }}
                        style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 16px", border:`1px solid ${modeSelectionne?.id===mode.id?C.primary2:C.border}`, borderRadius:12, cursor:"pointer", background:modeSelectionne?.id===mode.id?"#f5f3ff":"#fafafa", transition:"all 0.15s", position:"relative" }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor=C.primary2; e.currentTarget.style.background="#f5f3ff"; }}
                        onMouseLeave={e => { if(modeSelectionne?.id!==mode.id){ e.currentTarget.style.borderColor=C.border; e.currentTarget.style.background="#fafafa"; } }}>
                        <span style={{ fontSize:24 }}>{mode.icon}</span>
                        <div style={{ flex:1 }}>
                          <p style={{ fontSize:12, fontWeight:700, color:C.text, margin:"0 0 2px" }}>{mode.label}</p>
                          <p style={{ fontSize:10, color:C.muted, margin:0 }}>⏱ {mode.desc}</p>
                        </div>
                        <span style={{ position:"absolute", bottom:8, right:10, fontSize:9, fontWeight:800, padding:"2px 7px", borderRadius:20, background:mode.gratuit?"#d1fae5":C.border, color:mode.gratuit?"#065f46":C.primary2 }}>
                          {mode.frais}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── ÉTAPE 2 : Formulaire ── */}
          {etape === 2 && modeSelectionne && (
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
                <div style={{ width:28, height:28, borderRadius:"50%", background:C.primary2, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:800 }}>2</div>
                <h3 style={{ fontSize:15, fontWeight:700, color:C.text, margin:0 }}>Saisir le transfert</h3>
              </div>
              <div style={{ background:"#f5f3ff", borderRadius:10, padding:"12px 16px", marginBottom:16, border:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ fontSize:20 }}>{modeSelectionne.icon}</span>
                <div>
                  <p style={{ fontSize:12, fontWeight:700, color:C.primary2, margin:0 }}>{modeSelectionne.label}</p>
                  <p style={{ fontSize:11, color:C.muted, margin:0 }}>Délai : {modeSelectionne.desc} · Frais : {modeSelectionne.frais}</p>
                </div>
                <button onClick={() => { setEtape(1); setMsg(null); }} style={{ marginLeft:"auto", background:"none", border:"none", cursor:"pointer", color:C.muted, fontSize:11, textDecoration:"underline" }}>Changer</button>
              </div>

              {msg && <div style={{ padding:"10px 14px", borderRadius:8, marginBottom:14, fontSize:13, fontWeight:600, background:"#fef2f2", color:"#dc2626", border:"1px solid #fecaca" }}>{msg.text}</div>}

              <div style={{ marginBottom:14 }}>
                <div style={{ border:`1px solid ${C.border}`, borderRadius:10, overflow:"hidden", marginBottom:8 }}>
                  <div style={{ padding:"14px 16px", background:"#fafafa" }}>
                    <label style={{ fontSize:10, color:C.muted, display:"block", marginBottom:6 }}>Vous envoyez</label>
                    <div style={{ display:"flex", alignItems:"center" }}>
                      <input type="number" value={form.montant} onChange={e => setForm({...form, montant:e.target.value})} placeholder="0,00"
                        style={{ flex:1, border:"none", background:"transparent", fontSize:28, fontWeight:700, color:C.text, outline:"none" }}/>
                      <span style={{ fontSize:14, fontWeight:700, color:C.muted }}>XAF</span>
                    </div>
                    <p style={{ fontSize:10, color:montantNum>solde?"#dc2626":C.muted, margin:"4px 0 0" }}>
                      {montantNum>solde ? `⚠️ Solde insuffisant (${solde.toLocaleString("fr-FR")} XAF)` : `Min : 25 XAF · Disponible : ${solde.toLocaleString("fr-FR")} XAF`}
                    </p>
                  </div>
                  <div style={{ height:1, background:C.border }}/>
                  <div style={{ padding:"14px 16px" }}>
                    <label style={{ fontSize:10, color:C.muted, display:"block", marginBottom:4 }}>Destinataire reçoit (après frais {modeSelectionne.frais})</label>
                    <div style={{ fontSize:20, fontWeight:700, color:"#16a34a" }}>
                      {form.montant ? recoitXAF.toLocaleString("fr-FR", { minimumFractionDigits:2 }) : "0,00"} XAF
                    </div>
                  </div>
                </div>
              </div>

              {isWallet && (
                <div style={{ marginBottom:14 }}>
                  <label style={lbl}>Email du destinataire PayVirtual *</label>
                  <input value={form.emailWallet} onChange={e => setForm({...form, emailWallet:e.target.value})} placeholder="exemple@email.com" style={inp}/>
                </div>
              )}

              {isMobile && (
                <>
                  <div style={{ marginBottom:14 }}>
                    <label style={lbl}>Numéro {modeSelectionne.label} du destinataire *</label>
                    <div style={{ display:"flex", alignItems:"center", gap:8, border:`1px solid ${C.border}`, borderRadius:8, padding:"9px 12px", background:"#fafafa" }}>
                      <span style={{ fontSize:13, fontWeight:700, color:C.muted }}>🇨🇲 +237</span>
                      <input value={form.telephone} onChange={e => setForm({...form, telephone: e.target.value.replace(/\D/g,"").slice(0,9)})} placeholder="6XXXXXXXX" maxLength={9} style={{ border:"none", background:"transparent", fontSize:13, outline:"none", flex:1 }}/>
                    </div>
                  </div>
                  <div style={{ marginBottom:14 }}>
                    <label style={lbl}>Nom du destinataire (optionnel)</label>
                    <input value={form.nomBeneficiaire} onChange={e => setForm({...form, nomBeneficiaire:e.target.value})} placeholder="Nom du bénéficiaire" style={inp}/>
                  </div>
                </>
              )}

              {isExternal && (
                <>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
                    <div><label style={lbl}>Pays d'origine</label><select value={form.paysSrc} onChange={e=>setForm({...form,paysSrc:e.target.value})} style={sel}><option value="">Sélectionner</option>{pays.map(p=><option key={p}>{p}</option>)}</select></div>
                    <div><label style={lbl}>Pays de destination</label><select value={form.paysDest} onChange={e=>setForm({...form,paysDest:e.target.value})} style={sel}><option value="">Sélectionner</option>{pays.map(p=><option key={p}>{p}</option>)}</select></div>
                  </div>
                  <div style={{ marginBottom:12 }}><label style={lbl}>Banque</label><select value={form.banque} onChange={e=>setForm({...form,banque:e.target.value})} style={sel}><option value="">Sélectionner</option>{banques.map(b=><option key={b}>{b}</option>)}</select></div>
                  <div style={{ marginBottom:12 }}><label style={lbl}>Numéro de compte</label><input value={form.numeroCompte} onChange={e=>setForm({...form,numeroCompte:e.target.value})} placeholder="Numéro de compte" style={inp}/></div>
                  <div style={{ marginBottom:12 }}><label style={lbl}>Nom du bénéficiaire *</label><input value={form.nomBeneficiaire} onChange={e=>setForm({...form,nomBeneficiaire:e.target.value})} placeholder="Nom complet" style={inp}/></div>
                </>
              )}

              <div style={{ marginBottom:20 }}>
                <label style={lbl}>Raison (optionnel)</label>
                <select value={form.raison} onChange={e=>setForm({...form,raison:e.target.value})} style={sel}>
                  <option value="">Sélectionner une raison</option>
                  {raisons.map(r=><option key={r}>{r}</option>)}
                </select>
              </div>

              <button onClick={continuer} style={{ width:"100%", background:"linear-gradient(135deg,#6d28d9,#a78bfa)", color:"#fff", border:"none", borderRadius:10, padding:"13px 0", fontSize:14, fontWeight:700, cursor:"pointer" }}>
                Continuer →
              </button>
            </div>
          )}

          {/* ── ÉTAPE 3 : Révision + PIN ── */}
          {etape === 3 && (
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
                <div style={{ width:28, height:28, borderRadius:"50%", background:C.primary2, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:800 }}>3</div>
                <h3 style={{ fontSize:15, fontWeight:700, color:C.text, margin:0 }}>Révision du transfert</h3>
              </div>
              
              {msg && <div style={{ padding:"10px 14px", borderRadius:8, marginBottom:14, fontSize:13, fontWeight:600, background:"#fef2f2", color:"#dc2626", border:"1px solid #fecaca" }}>{msg.text}</div>}

              <div style={{ background:"#f8fafc", borderRadius:10, padding:"16px", marginBottom:20, border:`1px solid ${C.border}` }}>
                {[
                  { label:"Mode de transfert", val:`${modeSelectionne?.icon} ${modeSelectionne?.label}` },
                  { label:"Total à débiter",    val:`${montantNum.toLocaleString("fr-FR")} XAF` },
                  { label:"Destinataire reçoit",val:`${recoitXAF.toLocaleString("fr-FR")} XAF` },
                ].map(r => (
                  <div key={r.label} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:`1px solid #f1f5f9`, fontSize:13 }}>
                    <span style={{ color:C.muted, fontWeight:600 }}>{r.label}</span>
                    <span style={{ color:C.text, fontWeight:700 }}>{r.val}</span>
                  </div>
                ))}
              </div>

              {/* BLOC PIN AVANT CONFIRMATION */}
              <div style={{ marginBottom: 20, textAlign: "center", padding: "15px", background: "#f5f3ff", borderRadius: 10, border: `1px dashed ${C.primary2}` }}>
                <label style={{ ...lbl, marginBottom: 8 }}><FiLock /> Code PIN de sécurité</label>
                <input 
                  type="password" 
                  value={pin} 
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))} 
                  placeholder="••••" 
                  style={{ width: "100px", textAlign: "center", fontSize: 20, letterSpacing: 5, padding: "8px", borderRadius: 8, border: `1px solid ${C.border}`, outline: "none" }}
                />
              </div>

              <div style={{ display:"flex", gap:10 }}>
                <button onClick={() => setEtape(2)} style={{ flex:1, background:"#f1f5f9", border:"none", borderRadius:8, padding:"11px 0", fontSize:13, fontWeight:600, cursor:"pointer", color:C.muted }}>← Modifier</button>
                <button onClick={confirmer} disabled={loading || pin.length < 4} style={{ flex:2, background:"linear-gradient(135deg,#6d28d9,#a78bfa)", color:"#fff", border:"none", borderRadius:8, padding:"11px 0", fontSize:13, fontWeight:700, cursor:loading?"not-allowed":"pointer", opacity:(loading||pin.length<4)?0.7:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                  <FiCheck size={14}/> {loading ? "Traitement..." : "Confirmer l'envoi"}
                </button>
              </div>
            </div>
          )}

          {/* ── ÉTAPE 4 : SUCCÈS ── */}
          {etape === 4 && (
            <div style={{ textAlign:"center", padding:"30px 0" }}>
              <div style={{ width:64, height:64, borderRadius:"50%", background:"#dcfce7", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px", color:"#16a34a" }}><FiCheck size={28}/></div>
              <h3 style={{ fontSize:20, fontWeight:800, color:"#16a34a", marginBottom:8 }}>Transfert réussi !</h3>
              <p style={{ fontSize:13, color:C.muted }}>{resultat?.message}</p>
              <button onClick={reset} style={{ marginTop:20, background:C.primary2, color:"#fff", border:"none", borderRadius:8, padding:"10px 24px", fontSize:13, fontWeight:700, cursor:"pointer" }}>Nouveau transfert</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}