import { useState, useRef } from "react";
import { FiX, FiCheck, FiAlertCircle, FiLoader, FiLock } from "react-icons/fi";
import api from "../../services/api";

// ─────────────────────────────────────────────────────────────
//  CONSTANTES — 1% de frais, pas de minimum fixe, min retrait 5 XAF
// ─────────────────────────────────────────────────────────────
const TAUX_FRAIS  = 0.01;  // 1% exactement, sans plancher
const RETRAIT_MIN = 5;     // ✅ minimum 5 XAF

const C = {
  violet: "#7c3aed", violet2: "#6d28d9",
  border: "#ede9fe", bg: "#f5f3ff",
  text:   "#1e1b4b", muted: "#6b7280",
  vert:   "#16a34a", rouge: "#dc2626",
};

const modes = [
  { id:"mtn",      groupe:"Mobile Money",  label:"MTN Mobile Money CM",   icon:"🟡", desc:"~5 secondes",        isMobile:true  },
  { id:"orange",   groupe:"Mobile Money",  label:"Orange Money CM",        icon:"🟠", desc:"~5 secondes",        isMobile:true  },
  { id:"cca",      groupe:"Banque locale", label:"CCA Bank",               icon:"🏦", desc:"1–2 jours ouvrables",isMobile:false },
  { id:"afriland", groupe:"Banque locale", label:"Afriland First Bank",    icon:"🏦", desc:"1–2 jours ouvrables",isMobile:false },
  { id:"uba",      groupe:"Banque locale", label:"UBA Cameroun",           icon:"🏦", desc:"1–2 jours ouvrables",isMobile:false },
  { id:"sgc",      groupe:"Banque locale", label:"Société Générale",       icon:"🏦", desc:"1–2 jours ouvrables",isMobile:false },
];
const groupes = [...new Set(modes.map(m => m.groupe))];

const montantsRapidesRetrait = [5, 100, 500, 1000, 5000, 25000];
const raisons = ["Retrait personnel","Paiement fournisseur","Remboursement","Loyer","Factures","Autre"];

const lbl = { display:"block", fontSize:12, fontWeight:600, color:"#374151", marginBottom:6 };
const inp = { width:"100%", padding:"10px 14px", border:`1px solid #ede9fe`, borderRadius:8, fontSize:14, outline:"none", background:"#fafafa", boxSizing:"border-box" };

// ─────────────────────────────────────────────────────────────
export default function RetirerArgent({ retour, dashData, onRetraitReussi }) {
  const [mode,     setMode]     = useState(null);
  const [etape,    setEtape]    = useState(1); // 1=choix mode 2=form 3=PIN 4=révision 5=succès 6=annulé
  const [erreur,   setErreur]   = useState("");
  const [loading,  setLoading]  = useState(false);
  const [resultat, setResultat] = useState(null);
  const [form,     setForm]     = useState({ tel:"", montant:"", nom:"", compte:"", raison:"" });
  const [pin,      setPin]      = useState(["", "", "", ""]);
  const pinRefs = [useRef(), useRef(), useRef(), useRef()];

  const solde    = Number(dashData?.solde ?? 0);
  const isMobile = mode?.isMobile === true;

  // ── Calcul des frais : exactement 1%, sans plancher fixe ──
  const montantNum = Number(form.montant || 0);
  const frais      = mode ? Math.round(montantNum * TAUX_FRAIS * 100) / 100 : 0;
  const recu       = montantNum;
  const totalDebit = parseFloat((montantNum + frais).toFixed(2));

  // ── Gestion PIN ─────────────────────────────────────────────
  const handlePinChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    if (value && index < 3) pinRefs[index + 1].current?.focus();
  };
  const handlePinKeyDown = (index, e) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) pinRefs[index - 1].current?.focus();
  };
  const pinComplet = pin.every(d => d !== "");
  const pinValeur  = pin.join("");

  // ── Valider formulaire → passer au PIN ──────────────────────
  const continuer = () => {
    setErreur("");
    if (montantNum < RETRAIT_MIN)
      return setErreur(`Montant minimum : ${RETRAIT_MIN} XAF.`);
    if (totalDebit > solde)
      return setErreur(
        `Solde insuffisant.\n` +
        `• Montant : ${montantNum} XAF\n` +
        `• Frais (1%) : ${frais} XAF\n` +
        `• Total nécessaire : ${totalDebit} XAF\n` +
        `• Votre solde : ${solde} XAF`
      );
    if (isMobile) {
      const digits = form.tel.replace(/\D/g, "");
      if (!digits) return setErreur("Entrez le numéro du destinataire.");
      if (digits.length !== 9) return setErreur("9 chiffres requis (ex: 697833505).");
    }
    if (!isMobile) {
      if (!form.nom)    return setErreur("Entrez le nom du titulaire.");
      if (!form.compte) return setErreur("Entrez le numéro de compte.");
    }
    setPin(["", "", "", ""]);
    setEtape(3); // → saisie PIN
  };

  // ── Valider PIN → passer à la révision ──────────────────────
  const validerPin = () => {
    if (!pinComplet) {
      setErreur("Entrez votre code PIN à 4 chiffres.");
      return;
    }
    setErreur("");
    setEtape(4); // → révision finale
  };

  // ── Appel API retrait ────────────────────────────────────────
  const confirmer = async () => {
    try {
      setLoading(true); setErreur("");
      const token = localStorage.getItem("token");
      const payload = {
        montant: montantNum,
        raison:  form.raison || undefined,
        pin:     pinValeur,
        ...(isMobile ? {
          telephone:       form.tel.replace(/\D/g, "").slice(0, 9),
          nomBeneficiaire: form.nom || undefined,
        } : {
          nomBeneficiaire: form.nom,
          numeroCompte:    form.compte,
          banque:          mode.label,
        }),
      };
      const res = await api.post("/transactions/retrait", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setResultat(res.data);
      setEtape(5);
      if (onRetraitReussi) onRetraitReussi(res.data.nouveauSolde);
    } catch (e) {
      setErreur(e.response?.data?.message || "Erreur serveur. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setEtape(1); setMode(null); setErreur(""); setResultat(null);
    setForm({ tel:"", montant:"", nom:"", compte:"", raison:"" });
    setPin(["", "", "", ""]);
  };

  // ─────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth:900, margin:"0 auto" }}>

      {/* Bannière solde */}
      <div style={{ background:"linear-gradient(135deg,#2e1065,#7c3aed)", borderRadius:14, padding:"18px 24px", marginBottom:24, color:"#fff", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <p style={{ fontSize:17, fontWeight:800, margin:"0 0 3px" }}>Retrait de fonds</p>
          <p style={{ fontSize:12, opacity:0.8, margin:0 }}>
            Frais : 1% du montant · Min : {RETRAIT_MIN} XAF
          </p>
        </div>
        <div style={{ background:"rgba(255,255,255,0.15)", borderRadius:10, padding:"8px 16px", textAlign:"right" }}>
          <div style={{ fontSize:10, opacity:0.7, marginBottom:2 }}>Solde disponible</div>
          <div style={{ fontSize:17, fontWeight:800 }}>
            {Number(resultat?.nouveauSolde ?? solde).toLocaleString("fr-FR")} XAF
          </div>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 280px", gap:20 }}>

        {/* ─── Panneau principal ─────────────────────────── */}
        <div style={{ background:"#fff", borderRadius:14, padding:"24px 28px", border:`1px solid ${C.border}` }}>

          {/* ══ ÉTAPE 1 : Choisir le mode ══ */}
          {etape === 1 && (
            <div>
              <Titre n={1} txt="Choisir la destination"/>
              <p style={{ fontSize:12, color:C.muted, marginBottom:20 }}>Sélectionnez vers où retirer vos fonds</p>
              {groupes.map(groupe => (
                <div key={groupe} style={{ marginBottom:20 }}>
                  <p style={{ fontSize:11, fontWeight:700, color:C.muted, marginBottom:10 }}>
                    {groupe === "Mobile Money" ? "📱" : "🏦"} {groupe}
                    &nbsp;·&nbsp;
                    <span style={{ color:C.violet }}>Frais : 1% du montant</span>
                  </p>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                    {modes.filter(m => m.groupe === groupe).map(m => (
                      <div key={m.id}
                        onClick={() => { setMode(m); setErreur(""); setEtape(2); }}
                        style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 16px", border:`1px solid ${C.border}`, borderRadius:12, cursor:"pointer", background:"#fafafa", transition:"all .15s", position:"relative" }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor=C.violet; e.currentTarget.style.background=C.bg; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor=C.border; e.currentTarget.style.background="#fafafa"; }}>
                        <span style={{ fontSize:24 }}>{m.icon}</span>
                        <div style={{ flex:1 }}>
                          <p style={{ fontSize:12, fontWeight:700, color:C.text, margin:"0 0 2px" }}>{m.label}</p>
                          <p style={{ fontSize:10, color:C.muted, margin:0 }}>⏱ {m.desc}</p>
                        </div>
                        <span style={{ position:"absolute", bottom:8, right:10, fontSize:9, fontWeight:800, padding:"2px 7px", borderRadius:20, background:C.bg, color:C.violet }}>1%</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ══ ÉTAPE 2 : Formulaire ══ */}
          {etape === 2 && mode && (
            <div>
              <Titre n={2} txt="Saisir le retrait"/>
              <div style={{ background:C.bg, borderRadius:10, padding:"11px 16px", marginBottom:16, border:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ fontSize:20 }}>{mode.icon}</span>
                <div style={{ flex:1 }}>
                  <p style={{ fontSize:12, fontWeight:700, color:C.violet, margin:0 }}>{mode.label}</p>
                  <p style={{ fontSize:11, color:C.muted, margin:0 }}>Délai : {mode.desc} · Frais : 1%</p>
                </div>
                <button onClick={() => { setMode(null); setEtape(1); setErreur(""); }} style={{ background:"none", border:"none", cursor:"pointer", color:C.muted, fontSize:11, textDecoration:"underline" }}>Changer</button>
              </div>

              {erreur && <Erreur txt={erreur}/>}

              {isMobile && (
                <div style={{ marginBottom:18 }}>
                  <label style={lbl}>Numéro {mode.label} du destinataire *</label>
                  <div style={{ display:"flex", border:`1px solid ${C.border}`, borderRadius:8, overflow:"hidden", background:"#fafafa" }}>
                    <div style={{ padding:"10px 14px", background:"#f0f0f0", borderRight:`1px solid ${C.border}`, fontSize:13, fontWeight:700, color:C.muted, whiteSpace:"nowrap" }}>🇨🇲 +237</div>
                    <input value={form.tel}
                      onChange={e => setForm({...form, tel: e.target.value.replace(/\D/g,"").slice(0,9)})}
                      placeholder="6XXXXXXXX" maxLength={9}
                      style={{ flex:1, border:"none", outline:"none", background:"transparent", padding:"10px 14px", fontSize:14 }}/>
                  </div>
                  <p style={{ fontSize:10, marginTop:4, color: form.tel.length===9 ? C.vert : C.muted }}>
                    {form.tel.length}/9 chiffres{form.tel.length===9?" ✓":""}
                  </p>
                  <p style={{ fontSize:11, color:C.vert, marginTop:4, fontWeight:600 }}>
                    📲 Le destinataire recevra un SMS de confirmation du dépôt reçu.
                  </p>
                </div>
              )}

              {!isMobile && (
                <>
                  <div style={{ marginBottom:14 }}>
                    <label style={lbl}>Nom du titulaire *</label>
                    <input value={form.nom} onChange={e => setForm({...form,nom:e.target.value})} placeholder="Nom complet" style={inp}/>
                  </div>
                  <div style={{ marginBottom:14 }}>
                    <label style={lbl}>Numéro de compte {mode.label} *</label>
                    <input value={form.compte} onChange={e => setForm({...form,compte:e.target.value})} placeholder="Numéro de compte" style={inp}/>
                  </div>
                </>
              )}

              {/* Montant */}
              <div style={{ marginBottom:18 }}>
                <label style={lbl}>Montant à retirer (XAF) *</label>
                <div style={{ border:`1px solid ${C.border}`, borderRadius:10, overflow:"hidden", marginBottom:8 }}>
                  <div style={{ padding:"14px 16px", background:"#fafafa" }}>
                    <div style={{ display:"flex", alignItems:"center" }}>
                      <input type="number" min={RETRAIT_MIN} value={form.montant}
                        onChange={e => setForm({...form, montant: e.target.value})}
                        placeholder="0"
                        style={{ flex:1, border:"none", background:"transparent", fontSize:28, fontWeight:700, color:C.text, outline:"none" }}/>
                      <span style={{ fontSize:14, fontWeight:700, color:C.muted }}>XAF</span>
                    </div>
                    <p style={{ fontSize:11, marginTop:4, margin:"4px 0 0", color: totalDebit > solde ? C.rouge : C.muted }}>
                      {totalDebit > solde
                        ? `⚠️ Total avec frais 1% : ${totalDebit} XAF > solde ${solde} XAF`
                        : `Min : ${RETRAIT_MIN} XAF · Solde : ${solde} XAF`}
                    </p>
                  </div>
                  <div style={{ borderTop:`1px solid ${C.border}`, padding:"12px 16px", background:"#fafafa" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:4 }}>
                      <span style={{ color:C.muted }}>
                        {isMobile ? `📲 +237 ${form.tel||"XXXXXXXXX"} reçoit` : "Bénéficiaire reçoit"}
                      </span>
                      <span style={{ fontWeight:700, color:C.vert }}>{recu > 0 ? recu.toLocaleString("fr-FR") : 0} XAF</span>
                    </div>
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:4 }}>
                      <span style={{ color:C.muted }}>Frais PayVirtual (1%)</span>
                      <span style={{ fontWeight:700, color:C.rouge }}>+ {montantNum > 0 ? frais.toLocaleString("fr-FR") : 0} XAF</span>
                    </div>
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, borderTop:`1px solid ${C.border}`, paddingTop:6, marginTop:4 }}>
                      <span style={{ fontWeight:700, color:C.text }}>Total débité de votre wallet</span>
                      <span style={{ fontWeight:800, color:C.text }}>{totalDebit > 0 ? totalDebit.toLocaleString("fr-FR") : 0} XAF</span>
                    </div>
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, marginTop:4 }}>
                      <span style={{ color:C.muted }}>Solde restant</span>
                      <span style={{ fontWeight:700, color: solde - totalDebit < 0 ? C.rouge : C.violet }}>
                        {Math.max(0, solde - totalDebit).toLocaleString("fr-FR")} XAF
                      </span>
                    </div>
                  </div>
                </div>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  {montantsRapidesRetrait.map(v => (
                    <button key={v} onClick={() => setForm({...form, montant:v})}
                      style={{ padding:"5px 14px", borderRadius:20, cursor:"pointer", border:`1px solid ${C.border}`, background: Number(form.montant)===v ? C.violet : C.bg, color: Number(form.montant)===v ? "#fff" : C.muted, fontSize:11, fontWeight:600 }}>
                      {v.toLocaleString("fr-FR")} XAF
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom:20 }}>
                <label style={lbl}>Raison (optionnel)</label>
                <select value={form.raison} onChange={e => setForm({...form,raison:e.target.value})}
                  style={{ ...inp, cursor:"pointer" }}>
                  <option value="">Sélectionner</option>
                  {raisons.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>

              <button onClick={continuer}
                style={{ width:"100%", background:"linear-gradient(135deg,#6d28d9,#a78bfa)", color:"#fff", border:"none", borderRadius:10, padding:"13px 0", fontSize:14, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                <FiLock size={14}/> Continuer — Saisir le PIN
              </button>
            </div>
          )}

          {/* ══ ÉTAPE 3 : Saisie PIN ══ */}
          {etape === 3 && (
            <div style={{ textAlign:"center", padding:"10px 0" }}>
              <Titre n={3} txt="Sécurité — Code PIN"/>
              <div style={{ width:64, height:64, borderRadius:"50%", background:C.bg, border:`3px solid ${C.violet}`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px" }}>
                <FiLock size={28} color={C.violet}/>
              </div>
              <p style={{ fontSize:13, color:C.muted, marginBottom:6 }}>
                Retrait de <strong style={{ color:C.violet }}>{montantNum.toLocaleString("fr-FR")} XAF</strong>
              </p>
              <p style={{ fontSize:12, color:C.muted, marginBottom:24 }}>
                {isMobile ? `Via ${mode?.label} · +237 ${form.tel}` : `Via ${mode?.label}`}
              </p>

              {erreur && <Erreur txt={erreur}/>}

              <div style={{ display:"flex", gap:12, justifyContent:"center", marginBottom:28 }}>
                {pin.map((digit, i) => (
                  <input key={i} ref={pinRefs[i]}
                    type="password" maxLength={1} value={digit}
                    onChange={e => handlePinChange(i, e.target.value)}
                    onKeyDown={e => handlePinKeyDown(i, e)}
                    style={{ width:52, height:56, textAlign:"center", fontSize:22, fontWeight:800, border:`2px solid ${digit ? C.violet : C.border}`, borderRadius:12, outline:"none", background:digit ? C.bg : "#fafafa", color:C.text, transition:"all 0.15s" }}/>
                ))}
              </div>

              <button onClick={validerPin} disabled={!pinComplet}
                style={{ width:"100%", background: !pinComplet ? "#a78bfa" : "linear-gradient(135deg,#6d28d9,#a78bfa)", color:"#fff", border:"none", borderRadius:10, padding:"13px 0", fontSize:14, fontWeight:700, cursor: !pinComplet ? "not-allowed" : "pointer", marginBottom:12 }}>
                Valider le PIN →
              </button>
              <button onClick={() => { setEtape(2); setErreur(""); setPin(["","","",""]); }}
                style={{ width:"100%", background:"none", border:"none", color:C.muted, fontSize:13, cursor:"pointer", padding:"8px 0" }}>
                ← Modifier le retrait
              </button>
            </div>
          )}

          {/* ══ ÉTAPE 4 : Révision finale ══ */}
          {etape === 4 && mode && (
            <div>
              <Titre n={4} txt="Révision — Confirmez le retrait"/>
              {erreur && <Erreur txt={erreur}/>}
              <div style={{ background:"#f8fafc", borderRadius:10, padding:16, marginBottom:20, border:`1px solid ${C.border}` }}>
                {[
                  { l:"Mode",                        v:`${mode.icon} ${mode.label}` },
                  { l: isMobile ? `+237 ${form.tel} reçoit` : "Bénéficiaire reçoit",
                    v:`${recu.toLocaleString("fr-FR")} XAF`, c:C.vert },
                  { l:"Frais PayVirtual (1%)",        v:`+ ${frais.toLocaleString("fr-FR")} XAF`, c:C.rouge },
                  { l:"Total débité de votre wallet", v:`${totalDebit.toLocaleString("fr-FR")} XAF`, c:C.rouge, bold:true },
                  ...(!isMobile ? [{ l:"Titulaire", v:form.nom }, { l:"N° compte", v:form.compte }] : []),
                  { l:"Raison",  v:form.raison || "—" },
                  { l:"Délai",   v:mode.desc },
                ].map(r => (
                  <div key={r.l} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid #f1f5f9", fontSize:13 }}>
                    <span style={{ color:C.muted, fontWeight:600 }}>{r.l}</span>
                    <span style={{ color:r.c||C.text, fontWeight: r.bold ? 800 : 700 }}>{r.v}</span>
                  </div>
                ))}
              </div>

              {isMobile && (
                <div style={{ padding:"10px 14px", background:"#f0fdf4", borderRadius:10, marginBottom:16, border:"1px solid #bbf7d0", fontSize:12, color:"#15803d", fontWeight:600 }}>
                  📲 <strong>+237 {form.tel}</strong> recevra <strong>{recu.toLocaleString("fr-FR")} XAF</strong> via {mode.label} et sera notifié par SMS.<br/>
                  <span style={{ fontWeight:400, marginTop:4, display:"block" }}>
                    Wallet débité de <strong>{totalDebit.toLocaleString("fr-FR")} XAF</strong> ({recu.toLocaleString("fr-FR")} + {frais.toLocaleString("fr-FR")} XAF frais 1%).
                  </span>
                </div>
              )}

              <div style={{ background:C.bg, borderRadius:8, padding:"10px 14px", marginBottom:16, border:`1px solid ${C.border}`, fontSize:12, color:C.violet, display:"flex", alignItems:"center", gap:8 }}>
                <FiLock size={14}/> PIN vérifié ✓
              </div>

              <div style={{ display:"flex", gap:10 }}>
                <button onClick={() => { setEtape(2); setPin(["","","",""]); }}
                  style={{ flex:1, background:"#f1f5f9", border:"none", borderRadius:8, padding:"11px 0", fontSize:13, fontWeight:600, cursor:"pointer", color:C.muted }}>
                  ← Modifier
                </button>
                <button onClick={() => setEtape(6)}
                  style={{ flex:1, background:"#fff", border:"2px solid #ef4444", borderRadius:8, padding:"11px 0", fontSize:13, fontWeight:700, cursor:"pointer", color:"#ef4444", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                  <FiX size={14}/> Annuler
                </button>
                <button onClick={confirmer} disabled={loading}
                  style={{ flex:2, background:loading?"#a78bfa":"linear-gradient(135deg,#6d28d9,#a78bfa)", color:"#fff", border:"none", borderRadius:8, padding:"11px 0", fontSize:13, fontWeight:700, cursor:loading?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                  {loading
                    ? <><FiLoader size={14} style={{ animation:"spin 1s linear infinite" }}/> En cours...</>
                    : <><FiCheck size={14}/> Confirmer</>}
                </button>
              </div>
              <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
            </div>
          )}

          {/* ══ ÉTAPE 5 : Succès ══ */}
          {etape === 5 && (
            <div style={{ textAlign:"center", padding:"30px 0" }}>
              <div style={{ width:72, height:72, borderRadius:"50%", background:"#dcfce7", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px", color:C.vert }}>
                <FiCheck size={34}/>
              </div>
              <h3 style={{ fontSize:20, fontWeight:800, color:C.vert, marginBottom:8 }}>Retrait effectué !</h3>
              <div style={{ background:"#f0fdf4", borderRadius:10, padding:16, margin:"16px 0", border:"1px solid #bbf7d0" }}>
                <p style={{ fontSize:13, color:"#15803d", fontWeight:600, margin:"0 0 8px", lineHeight:1.6 }}>
                  {resultat?.message}
                </p>
                {isMobile && (
                  <p style={{ fontSize:12, color:"#15803d", margin:"8px 0 0" }}>
                    📱 <strong>+237 {form.tel}</strong> a reçu <strong>{recu.toLocaleString("fr-FR")} XAF</strong> — SMS de confirmation envoyé.
                  </p>
                )}
                <p style={{ fontSize:11, color:"#15803d", margin:"6px 0 0" }}>
                  Wallet débité de {totalDebit.toLocaleString("fr-FR")} XAF ({recu.toLocaleString("fr-FR")} XAF + {frais.toLocaleString("fr-FR")} XAF frais 1%).
                </p>
              </div>
              {resultat?.nouveauSolde !== undefined && (
                <div style={{ background:C.bg, borderRadius:8, padding:"10px 16px", marginBottom:16, display:"inline-flex", gap:8, alignItems:"center" }}>
                  <span style={{ fontSize:12, color:C.violet }}>Nouveau solde :</span>
                  <span style={{ fontSize:15, fontWeight:800, color:C.violet }}>{Number(resultat.nouveauSolde).toLocaleString("fr-FR")} XAF</span>
                </div>
              )}
              <div style={{ display:"flex", gap:10, justifyContent:"center", marginTop:16 }}>
                <button onClick={retour} style={{ background:"#f1f5f9", border:"none", borderRadius:8, padding:"10px 20px", fontSize:13, fontWeight:600, cursor:"pointer", color:C.muted }}>Tableau de bord</button>
                <button onClick={reset}  style={{ background:C.violet, color:"#fff", border:"none", borderRadius:8, padding:"10px 24px", fontSize:13, fontWeight:700, cursor:"pointer" }}>Nouveau retrait</button>
              </div>
            </div>
          )}

          {/* ══ ÉTAPE 6 : Annulé ══ */}
          {etape === 6 && (
            <div style={{ textAlign:"center", padding:"30px 0" }}>
              <div style={{ fontSize:60, marginBottom:16 }}>❌</div>
              <h3 style={{ fontSize:20, fontWeight:800, color:C.rouge, marginBottom:8 }}>Retrait annulé</h3>
              <p style={{ fontSize:13, color:C.muted }}>Aucun montant n'a été débité de votre wallet.</p>
              <div style={{ display:"flex", gap:10, justifyContent:"center", marginTop:20 }}>
                <button onClick={retour} style={{ background:"#f1f5f9", border:"none", borderRadius:8, padding:"10px 20px", fontSize:13, fontWeight:600, cursor:"pointer", color:C.muted }}>Retour</button>
                <button onClick={reset}  style={{ background:C.violet, color:"#fff", border:"none", borderRadius:8, padding:"10px 24px", fontSize:13, fontWeight:700, cursor:"pointer" }}>Recommencer</button>
              </div>
            </div>
          )}
        </div>

        {/* ─── Panneau résumé droite ─────────────────────── */}
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div style={{ background:"#fff", borderRadius:14, padding:20, border:`1px solid ${C.border}` }}>
            <p style={{ fontSize:13, fontWeight:700, color:C.text, marginBottom:14 }}>Résumé</p>
            {!mode ? (
              <p style={{ fontSize:12, color:C.muted, textAlign:"center", padding:"16px 0" }}>
                👆 Choisissez une destination
              </p>
            ) : (
              <>
                <Ligne l={isMobile ? "Destinataire reçoit" : "Bénéficiaire reçoit"}
                       v={montantNum>0?`${recu.toLocaleString("fr-FR")} XAF`:"—"} c={C.vert} bold/>
                <Ligne l="Frais (1%)" v={montantNum>0?`+ ${frais.toLocaleString("fr-FR")} XAF`:"—"} c={C.rouge}/>
                <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:8, marginTop:4 }}>
                  <Ligne l="Total débité wallet" v={totalDebit>0?`${totalDebit.toLocaleString("fr-FR")} XAF`:"—"} c={C.text} bold/>
                </div>
                <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:10, marginTop:8 }}>
                  <Ligne l="Opérateur" v={mode.label}/>
                  <Ligne l="Délai"     v={mode.desc}/>
                </div>
                {etape >= 2 && etape < 5 && (
                  <button onClick={() => setEtape(3)} disabled={etape===3||etape===4}
                    style={{ width:"100%", marginTop:14, background:etape===3||etape===4?"#cbd5e1":C.violet, color:"#fff", border:"none", borderRadius:10, padding:"11px 0", fontSize:13, fontWeight:700, cursor:etape===3||etape===4?"not-allowed":"pointer" }}>
                    🔒 Saisir PIN
                  </button>
                )}
              </>
            )}
          </div>

          <div style={{ background:"#fff", borderRadius:14, padding:20, border:`1px solid ${C.border}` }}>
            <p style={{ fontSize:13, fontWeight:700, color:C.text, marginBottom:6 }}>Solde wallet</p>
            <p style={{ fontSize:26, fontWeight:900, color:C.violet, margin:"0 0 4px" }}>
              {Number(resultat?.nouveauSolde ?? solde).toLocaleString("fr-FR")} <span style={{ fontSize:13 }}>XAF</span>
            </p>
            {montantNum > 0 && etape < 5 && (
              <div style={{ marginTop:8, paddingTop:8, borderTop:`1px solid ${C.border}`, fontSize:12 }}>
                <Ligne l="Débité (montant + frais 1%)" v={`-${totalDebit.toLocaleString("fr-FR")} XAF`} c={C.rouge}/>
                <Ligne l="Nouveau solde" v={`${Math.max(0,solde-totalDebit).toLocaleString("fr-FR")} XAF`} c={solde-totalDebit<0?C.rouge:C.violet} bold/>
              </div>
            )}
          </div>

          <div style={{ background:C.bg, borderRadius:14, padding:16, border:`1px solid ${C.border}` }}>
            <p style={{ fontSize:11, fontWeight:700, color:C.violet, marginBottom:8 }}>💡 Frais PayVirtual</p>
            <p style={{ fontSize:11, color:C.muted, margin:"0 0 4px" }}>
              Tous retraits : <strong style={{ color:C.text }}>1% du montant retiré</strong>
            </p>
            <p style={{ fontSize:11, color:C.muted, margin:0 }}>
              Ex. : 100 XAF → frais 1 XAF → total débité 101 XAF
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const Titre = ({ n, txt }) => (
  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
    <div style={{ width:28, height:28, borderRadius:"50%", background:"#7c3aed", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:800, flexShrink:0 }}>{n}</div>
    <h3 style={{ fontSize:15, fontWeight:700, color:"#1e1b4b", margin:0 }}>{txt}</h3>
  </div>
);

const Erreur = ({ txt }) => (
  <div style={{ padding:"10px 14px", borderRadius:8, marginBottom:14, fontSize:12, fontWeight:600, background:"#fef2f2", color:"#dc2626", border:"1px solid #fecaca", display:"flex", alignItems:"flex-start", gap:8, whiteSpace:"pre-line" }}>
    <FiAlertCircle size={16} style={{ flexShrink:0, marginTop:1 }}/> {txt}
  </div>
);

const Ligne = ({ l, v, c, bold }) => (
  <div style={{ display:"flex", justifyContent:"space-between", fontSize: bold?13:11, marginBottom:6, fontWeight: bold?700:500 }}>
    <span style={{ color:"#6b7280" }}>{l}</span>
    <span style={{ color:c||"#1e1b4b", fontWeight: bold?800:600 }}>{v}</span>
  </div>
);

