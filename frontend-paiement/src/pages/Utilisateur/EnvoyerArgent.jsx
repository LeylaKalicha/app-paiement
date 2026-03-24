import { useState } from "react";
import { FiArrowLeft, FiZap, FiDollarSign, FiShield, FiSmartphone, FiX } from "react-icons/fi";
import api from "../../services/api";

const pays    = ["Cameroun", "France", "USA", "Sénégal", "Côte d'Ivoire", "RD Congo", "Gabon", "Maroc", "Nigeria"];
const banques = ["MTN Mobile Money", "Orange Money", "Express Union", "CCA Bank", "Afriland First Bank", "UBA", "Société Générale"];
const raisons = ["Famille & Amis", "Loyer", "Factures", "Commerce", "Santé", "Éducation", "Autre"];

export default function EnvoyerArgent({ retour, dashData }) {
  const [onglet,  setOnglet]  = useState("wallet");
  const [etape,   setEtape]   = useState(1);       // 1=formulaire | 2=révision | 3=succès | 4=annulé
  const [msg,     setMsg]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [resultat, setResultat] = useState(null);  // réponse du backend

  const [form, setForm] = useState({
    emailWallet: "", telephone: "", montant: "",
    paysSrc: "", paysDest: "", banque: "",
    numeroCompte: "", nomBeneficiaire: "", raison: "",
  });

  // ── Validation avant révision ──
  const continuer = () => {
    if (!form.montant) { setMsg({ type: "error", text: "Veuillez entrer un montant." }); return; }
    if (Number(form.montant) <= 0) { setMsg({ type: "error", text: "Le montant doit être supérieur à 0." }); return; }
    if (onglet === "wallet" && !form.emailWallet) { setMsg({ type: "error", text: "Veuillez entrer l'email du destinataire." }); return; }
    if (onglet === "mobile" && !form.telephone) { setMsg({ type: "error", text: "Veuillez entrer votre numéro de téléphone." }); return; }
    if (onglet === "bank" && !form.nomBeneficiaire) { setMsg({ type: "error", text: "Veuillez entrer le nom du bénéficiaire." }); return; }
    setMsg(null);
    setEtape(2);
  };

  // ── Annuler depuis l'étape révision ──
  const annuler = () => {
    setEtape(4); // ← page annulé
  };

  // ── Confirmation finale ──
  const confirmer = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      let res;

      // MOBILE MONEY → topup (CamPay)
      if (onglet === "mobile") {
        res = await api.post("/transactions/topup", {
          montant:   Number(form.montant),
          telephone: form.telephone.replace(/[\s+\-()]/g, ""),
        }, { headers: { Authorization: `Bearer ${token}` } });

      // PORTEFEUILLE → transfert entre utilisateurs SwiftCard
      } else if (onglet === "wallet") {
        res = await api.post("/transactions/transfert", {
          montant:         Number(form.montant),
          type:            "wallet",
          nomBeneficiaire: form.emailWallet,
          numeroCompte:    form.emailWallet,  // email du destinataire
          raison:          form.raison,
        }, { headers: { Authorization: `Bearer ${token}` } });

      // VIREMENT BANCAIRE
      } else {
        res = await api.post("/transactions/transfert", {
          montant:         Number(form.montant),
          type:            "bank",
          nomBeneficiaire: form.nomBeneficiaire,
          numeroCompte:    form.numeroCompte,
          banque:          form.banque,
          paysSrc:         form.paysSrc,
          paysDest:        form.paysDest,
          raison:          form.raison,
        }, { headers: { Authorization: `Bearer ${token}` } });
      }

      setResultat(res.data);
      setEtape(3); // ← succès

    } catch (e) {
      setMsg({
        type: "error",
        text: e.response?.data?.message || "Erreur lors de la transaction.",
      });
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setEtape(1);
    setMsg(null);
    setResultat(null);
    setForm({ emailWallet:"", telephone:"", montant:"", paysSrc:"", paysDest:"", banque:"", numeroCompte:"", nomBeneficiaire:"", raison:"" });
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:24 }}>
        <button onClick={retour} style={{ background:"#f1f5f9", border:"none", borderRadius:8, padding:"7px 10px", cursor:"pointer", display:"flex", color:"#64748b" }}>
          <FiArrowLeft size={16} />
        </button>
        <div>
          <p style={{ fontSize:11, color:"#94a3b8", margin:0 }}>Accueil › Envoyer de l'argent</p>
          <h2 style={{ fontSize:20, fontWeight:800, color:"#0f172a", margin:0 }}>Transfert d'argent</h2>
        </div>
      </div>

      {/* Bannière */}
      <div style={{ background:"linear-gradient(135deg,#7c3aed,#a78bfa)", borderRadius:14, padding:"20px 28px", marginBottom:24, color:"#fff" }}>
        <p style={{ fontSize:18, fontWeight:800, margin:"0 0 4px" }}>Envoyez de l'argent partout dans le monde</p>
        <p style={{ fontSize:13, opacity:0.85, margin:0 }}>Transferts rapides, sécurisés et à faible coût à l'international</p>
      </div>

      {/* 3 avantages */}
      <div style={{ display:"flex", gap:14, marginBottom:24 }}>
        {[
          { icon:<FiZap size={20} color="#7c3aed"/>,      titre:"Transferts instantanés",  desc:"Envoyez de l'argent en quelques minutes" },
          { icon:<FiDollarSign size={20} color="#7c3aed"/>,titre:"Frais réduits",           desc:"Payez des frais minimes comparés aux banques" },
          { icon:<FiShield size={20} color="#7c3aed"/>,   titre:"Sécurisé",                desc:"Sécurité de niveau bancaire" },
        ].map(a => (
          <div key={a.titre} style={{ flex:1, background:"#fff", borderRadius:12, padding:"18px 20px", border:"1px solid #e2e8f0", textAlign:"center" }}>
            <div style={{ marginBottom:10 }}>{a.icon}</div>
            <p style={{ fontSize:13, fontWeight:700, color:"#0f172a", marginBottom:6 }}>{a.titre}</p>
            <p style={{ fontSize:11, color:"#94a3b8", margin:0, lineHeight:1.5 }}>{a.desc}</p>
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 280px", gap:20 }}>

        {/* Formulaire principal */}
        <div style={{ background:"#fff", borderRadius:14, padding:"24px 28px", border:"1px solid #e2e8f0" }}>

          {/* Onglets */}
          <div style={{ display:"flex", borderBottom:"2px solid #f1f5f9", marginBottom:20 }}>
            {[
              { id:"wallet", label:"Portefeuille SwiftCard" },
              { id:"mobile", label:"Mobile Money" },
              { id:"bank",   label:"Virement bancaire" },
            ].map(o => (
              <button key={o.id} onClick={() => { setOnglet(o.id); setEtape(1); setMsg(null); }} style={{
                flex:1, padding:"10px 8px", border:"none", background:"transparent", cursor:"pointer",
                fontSize:12, fontWeight:onglet===o.id ? 700 : 500,
                color:onglet===o.id ? "#7c3aed" : "#94a3b8",
                borderBottom:onglet===o.id ? "2px solid #7c3aed" : "2px solid transparent",
                marginBottom:"-2px"
              }}>{o.label}</button>
            ))}
          </div>

          {/* ════ ÉTAPE 1 : Formulaire ════ */}
          {etape === 1 && (
            <>
              {msg && (
                <div style={{ padding:"10px 14px", borderRadius:8, marginBottom:16, fontSize:13, fontWeight:600, background:"#fef2f2", color:"#dc2626", border:"1px solid #fecaca" }}>
                  {msg.text}
                </div>
              )}

              {/* PORTEFEUILLE */}
              {onglet === "wallet" && (
                <>
                  <div style={{ background:"#f5f3ff", borderRadius:10, padding:"12px 16px", marginBottom:16, border:"1px solid #ede9fe" }}>
                    <p style={{ fontSize:12, fontWeight:700, color:"#7c3aed", margin:"0 0 4px" }}>⚡ Transfert interne SwiftCard</p>
                    <p style={{ fontSize:11, color:"#5b21b6", margin:0 }}>L'argent sera débité de votre compte et crédité immédiatement sur le compte du destinataire.</p>
                  </div>
                  <div style={{ marginBottom:14 }}>
                    <label style={lbl}>Email du destinataire SwiftCard</label>
                    <input value={form.emailWallet} onChange={e => setForm({...form, emailWallet: e.target.value})} placeholder="nafi@gmail.com" style={inp} />
                  </div>
                  <div style={{ marginBottom:14 }}>
                    <label style={lbl}>Montant (XAF)</label>
                    <input type="number" value={form.montant} onChange={e => setForm({...form, montant: e.target.value})} placeholder="ex: 5000" style={inp} />
                  </div>
                  <div style={{ marginBottom:20 }}>
                    <label style={lbl}>Raison (optionnel)</label>
                    <select value={form.raison} onChange={e => setForm({...form, raison: e.target.value})} style={sel}>
                      <option value="">Sélectionner une raison</option>
                      {raisons.map(r => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                  {/* Solde dispo */}
                  <div style={{ background:"#f5f3ff", borderRadius:8, padding:"10px 14px", marginBottom:16, display:"flex", justifyContent:"space-between" }}>
                    <span style={{ fontSize:12, color:"#7c3aed" }}>Solde disponible</span>
                    <span style={{ fontSize:12, fontWeight:700, color:"#7c3aed" }}>{Number(dashData?.solde || 0).toLocaleString("fr-FR")} XAF</span>
                  </div>
                </>
              )}

              {/* MOBILE MONEY */}
              {onglet === "mobile" && (
                <>
                  <div style={{ background:"#f5f3ff", borderRadius:10, padding:"12px 16px", marginBottom:16, border:"1px solid #ede9fe" }}>
                    <p style={{ fontSize:12, fontWeight:700, color:"#7c3aed", margin:"0 0 4px" }}>📱 Recharge Mobile Money</p>
                    <p style={{ fontSize:11, color:"#5b21b6", margin:0, lineHeight:1.6 }}>
                      Entrez votre numéro MTN/Orange → vous recevrez une notification → confirmez avec votre PIN → votre solde SwiftCard est crédité.
                    </p>
                  </div>
                  <div style={{ marginBottom:14 }}>
                    <label style={lbl}>Votre numéro Mobile Money</label>
                    <div style={{ display:"flex", alignItems:"center", gap:8, border:"1px solid #e2e8f0", borderRadius:8, padding:"9px 12px", background:"#fafafa" }}>
                      <FiSmartphone size={16} color="#7c3aed" />
                      <input value={form.telephone} onChange={e => setForm({...form, telephone: e.target.value})} placeholder="237670000000" style={{ border:"none", background:"transparent", fontSize:13, outline:"none", flex:1 }} />
                    </div>
                  </div>
                  <div style={{ marginBottom:20 }}>
                    <label style={lbl}>Montant à recharger (XAF)</label>
                    <input type="number" value={form.montant} onChange={e => setForm({...form, montant: e.target.value})} placeholder="ex: 5000" style={inp} />
                  </div>
                </>
              )}

              {/* VIREMENT BANCAIRE */}
              {onglet === "bank" && (
                <>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
                    <div>
                      <label style={lbl}>Pays d'origine</label>
                      <select value={form.paysSrc} onChange={e => setForm({...form, paysSrc: e.target.value})} style={sel}>
                        <option value="">Sélectionner</option>
                        {pays.map(p => <option key={p}>{p}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={lbl}>Pays de destination</label>
                      <select value={form.paysDest} onChange={e => setForm({...form, paysDest: e.target.value})} style={sel}>
                        <option value="">Sélectionner</option>
                        {pays.map(p => <option key={p}>{p}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{ marginBottom:14 }}>
                    <label style={lbl}>Montant (XAF)</label>
                    <input type="number" value={form.montant} onChange={e => setForm({...form, montant: e.target.value})} placeholder="0.00" style={inp} />
                  </div>
                  <div style={{ marginBottom:14 }}>
                    <label style={lbl}>Banque</label>
                    <select value={form.banque} onChange={e => setForm({...form, banque: e.target.value})} style={sel}>
                      <option value="">Sélectionner une banque</option>
                      {banques.map(b => <option key={b}>{b}</option>)}
                    </select>
                  </div>
                  <div style={{ marginBottom:14 }}>
                    <label style={lbl}>Numéro de compte</label>
                    <input value={form.numeroCompte} onChange={e => setForm({...form, numeroCompte: e.target.value})} placeholder="Numéro de compte" style={inp} />
                  </div>
                  <div style={{ marginBottom:14 }}>
                    <label style={lbl}>Nom du bénéficiaire</label>
                    <input value={form.nomBeneficiaire} onChange={e => setForm({...form, nomBeneficiaire: e.target.value})} placeholder="Nom complet" style={inp} />
                  </div>
                  <div style={{ marginBottom:20 }}>
                    <label style={lbl}>Raison (optionnel)</label>
                    <select value={form.raison} onChange={e => setForm({...form, raison: e.target.value})} style={sel}>
                      <option value="">Sélectionner</option>
                      {raisons.map(r => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                </>
              )}

              <button onClick={continuer} style={{ width:"100%", background:"linear-gradient(135deg,#7c3aed,#a78bfa)", color:"#fff", border:"none", borderRadius:10, padding:"13px 0", fontSize:14, fontWeight:700, cursor:"pointer" }}>
                Continuer pour révision →
              </button>
            </>
          )}

          {/* ════ ÉTAPE 2 : Révision + bouton ANNULER ════ */}
          {etape === 2 && (
            <div>
              <h3 style={{ fontSize:16, fontWeight:700, color:"#0f172a", marginBottom:16 }}>Révision du transfert</h3>

              {msg && (
                <div style={{ padding:"10px 14px", borderRadius:8, marginBottom:16, fontSize:13, fontWeight:600, background:"#fef2f2", color:"#dc2626", border:"1px solid #fecaca" }}>
                  {msg.text}
                </div>
              )}

              <div style={{ background:"#f8fafc", borderRadius:10, padding:"16px", marginBottom:20 }}>
                {onglet === "wallet" && [
                  { label:"Bénéficiaire", val: form.emailWallet },
                  { label:"Montant",      val: `${Number(form.montant).toLocaleString("fr-FR")} XAF` },
                  { label:"Type",         val: "Portefeuille" },
                  { label:"Raison",       val: form.raison || "—" },
                ].map(r => (
                  <div key={r.label} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid #f1f5f9", fontSize:13 }}>
                    <span style={{ color:"#94a3b8", fontWeight:600 }}>{r.label}</span>
                    <span style={{ color:"#0f172a", fontWeight:700 }}>{r.val}</span>
                  </div>
                ))}

                {onglet === "mobile" && [
                  { label:"Numéro",  val: form.telephone },
                  { label:"Montant", val: `${Number(form.montant).toLocaleString("fr-FR")} XAF` },
                  { label:"Type",    val: "Mobile Money" },
                ].map(r => (
                  <div key={r.label} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid #f1f5f9", fontSize:13 }}>
                    <span style={{ color:"#94a3b8", fontWeight:600 }}>{r.label}</span>
                    <span style={{ color:"#0f172a", fontWeight:700 }}>{r.val}</span>
                  </div>
                ))}

                {onglet === "bank" && [
                  { label:"Bénéficiaire",  val: form.nomBeneficiaire },
                  { label:"Banque/Compte", val: `${form.banque || ""} ${form.numeroCompte}` },
                  { label:"Montant",       val: `${Number(form.montant).toLocaleString("fr-FR")} XAF` },
                  { label:"Raison",        val: form.raison || "—" },
                ].map(r => (
                  <div key={r.label} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid #f1f5f9", fontSize:13 }}>
                    <span style={{ color:"#94a3b8", fontWeight:600 }}>{r.label}</span>
                    <span style={{ color:"#0f172a", fontWeight:700 }}>{r.val}</span>
                  </div>
                ))}
              </div>

              {/* 3 boutons : Modifier | Annuler | Confirmer */}
              <div style={{ display:"flex", gap:10 }}>
                <button onClick={() => setEtape(1)} style={{ flex:1, background:"#f1f5f9", border:"none", borderRadius:8, padding:"11px 0", fontSize:13, fontWeight:600, cursor:"pointer", color:"#64748b" }}>
                  ← Modifier
                </button>
                <button onClick={annuler} style={{ flex:1, background:"#fff", border:"2px solid #ef4444", borderRadius:8, padding:"11px 0", fontSize:13, fontWeight:700, cursor:"pointer", color:"#ef4444", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                  <FiX size={14} /> Annuler
                </button>
                <button onClick={confirmer} disabled={loading} style={{ flex:2, background:"linear-gradient(135deg,#7c3aed,#a78bfa)", color:"#fff", border:"none", borderRadius:8, padding:"11px 0", fontSize:13, fontWeight:700, cursor:loading?"not-allowed":"pointer", opacity:loading?0.7:1 }}>
                  {loading ? "⏳ Traitement..." : "✅ Confirmer le transfert"}
                </button>
              </div>
            </div>
          )}

          {/* ════ ÉTAPE 3 : SUCCÈS ════ */}
          {etape === 3 && (
            <div style={{ textAlign:"center", padding:"30px 0" }}>
              <div style={{ fontSize:60, marginBottom:16 }}>✅</div>
              <h3 style={{ fontSize:20, fontWeight:800, color:"#16a34a", marginBottom:8 }}>
                {onglet === "mobile" ? "Demande envoyée !" : "Argent envoyé !"}
              </h3>

              {/* Message du backend */}
              <div style={{ background:"#f0fdf4", borderRadius:10, padding:"16px", margin:"16px 0", border:"1px solid #bbf7d0" }}>
                <p style={{ fontSize:13, color:"#15803d", fontWeight:600, margin:0, lineHeight:1.6 }}>
                  {resultat?.message}
                </p>
                {resultat?.destinataire && (
                  <p style={{ fontSize:12, color:"#16a34a", marginTop:8, margin:"8px 0 0" }}>
                    💚 {resultat.destinataire.nom} ({resultat.destinataire.email}) a bien reçu les fonds
                  </p>
                )}
                {onglet === "mobile" && (
                  <p style={{ fontSize:12, color:"#15803d", marginTop:8, margin:"8px 0 0" }}>
                    📲 Vérifiez votre téléphone et confirmez avec votre PIN Mobile Money
                  </p>
                )}
              </div>

              {/* Nouveau solde */}
              {resultat?.nouveauSolde !== undefined && (
                <div style={{ background:"#f5f3ff", borderRadius:8, padding:"10px 14px", marginBottom:16, display:"inline-flex", gap:8, alignItems:"center" }}>
                  <span style={{ fontSize:12, color:"#7c3aed" }}>Votre nouveau solde :</span>
                  <span style={{ fontSize:14, fontWeight:800, color:"#7c3aed" }}>
                    {Number(resultat.nouveauSolde).toLocaleString("fr-FR")} XAF
                  </span>
                </div>
              )}

              <div style={{ display:"flex", gap:10, justifyContent:"center", marginTop:16 }}>
                <button onClick={retour} style={{ background:"#f1f5f9", border:"none", borderRadius:8, padding:"10px 20px", fontSize:13, fontWeight:600, cursor:"pointer", color:"#64748b" }}>
                  Retour au dashboard
                </button>
                <button onClick={reset} style={{ background:"#7c3aed", color:"#fff", border:"none", borderRadius:8, padding:"10px 24px", fontSize:13, fontWeight:700, cursor:"pointer" }}>
                  Nouveau transfert
                </button>
              </div>
            </div>
          )}

          {/* ════ ÉTAPE 4 : ANNULÉ ════ */}
          {etape === 4 && (
            <div style={{ textAlign:"center", padding:"30px 0" }}>
              <div style={{ fontSize:60, marginBottom:16 }}>❌</div>
              <h3 style={{ fontSize:20, fontWeight:800, color:"#dc2626", marginBottom:8 }}>Transfert annulé</h3>
              <div style={{ background:"#fef2f2", borderRadius:10, padding:"16px", margin:"16px 0", border:"1px solid #fecaca" }}>
                <p style={{ fontSize:13, color:"#dc2626", margin:0 }}>
                  Votre transfert de <strong>{Number(form.montant).toLocaleString("fr-FR")} XAF</strong> a été annulé.
                  <br />Aucun montant n'a été débité de votre compte.
                </p>
              </div>
              <div style={{ display:"flex", gap:10, justifyContent:"center", marginTop:16 }}>
                <button onClick={retour} style={{ background:"#f1f5f9", border:"none", borderRadius:8, padding:"10px 20px", fontSize:13, fontWeight:600, cursor:"pointer", color:"#64748b" }}>
                  Retour au dashboard
                </button>
                <button onClick={reset} style={{ background:"#7c3aed", color:"#fff", border:"none", borderRadius:8, padding:"10px 24px", fontSize:13, fontWeight:700, cursor:"pointer" }}>
                  Recommencer
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Panel droite */}
        <div>
          <div style={{ background:"#fff", borderRadius:14, padding:20, border:"1px solid #e2e8f0", marginBottom:14 }}>
            <p style={{ fontSize:13, fontWeight:700, color:"#0f172a", marginBottom:14 }}>Détails du transfert</p>
            {[
              { num:"1", label:"Saisir le transfert",  desc:"Remplissez les champs requis" },
              { num:"2", label:"Réviser & Confirmer",  desc:"Vérifiez avant d'envoyer" },
              { num:"3", label:"Argent envoyé !",      desc:"Fonds reçus par le bénéficiaire" },
            ].map(s => (
              <div key={s.num} style={{ display:"flex", gap:12, marginBottom:14 }}>
                <div style={{ width:26, height:26, borderRadius:"50%", background:etape > Number(s.num) ? "#16a34a" : etape === Number(s.num) ? "#7c3aed" : "#e2e8f0", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, flexShrink:0 }}>{s.num}</div>
                <div>
                  <p style={{ fontSize:12, fontWeight:700, color:"#0f172a", margin:0 }}>{s.label}</p>
                  <p style={{ fontSize:11, color:"#94a3b8", margin:0, lineHeight:1.4 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ background:"#fff", borderRadius:14, padding:20, border:"1px solid #e2e8f0" }}>
            <p style={{ fontSize:13, fontWeight:700, color:"#0f172a", marginBottom:8 }}>Solde disponible</p>
            <p style={{ fontSize:26, fontWeight:900, color:"#7c3aed", margin:"0 0 4px" }}>
              {Number(resultat?.nouveauSolde ?? dashData?.solde ?? 0).toLocaleString("fr-FR")} <span style={{ fontSize:13 }}>XAF</span>
            </p>
            {form.montant && etape < 3 && (
              <div style={{ marginTop:10, paddingTop:10, borderTop:"1px solid #f1f5f9" }}>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:12 }}>
                  <span style={{ color:"#94a3b8" }}>Après transfert</span>
                  <span style={{ fontWeight:700, color: Number(dashData?.solde||0) >= Number(form.montant) ? "#dc2626" : "#ef4444" }}>
                    -{Number(form.montant).toLocaleString("fr-FR")} XAF
                  </span>
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, marginTop:6 }}>
                  <span style={{ color:"#94a3b8" }}>Nouveau solde</span>
                  <span style={{ fontWeight:800, color:"#7c3aed" }}>
                    {Math.max(0, Number(dashData?.solde||0) - Number(form.montant)).toLocaleString("fr-FR")} XAF
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const lbl = { display:"block", fontSize:12, fontWeight:600, color:"#374151", marginBottom:6 };
const inp = { width:"100%", padding:"9px 12px", border:"1px solid #e2e8f0", borderRadius:8, fontSize:13, outline:"none", background:"#fafafa", boxSizing:"border-box" };
const sel = { width:"100%", padding:"9px 12px", border:"1px solid #e2e8f0", borderRadius:8, fontSize:13, outline:"none", background:"#fafafa", cursor:"pointer", boxSizing:"border-box" };