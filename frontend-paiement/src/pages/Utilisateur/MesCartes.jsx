import { useState, useEffect } from "react";
import { FiArrowLeft, FiPlus, FiLock, FiUnlock, FiTrash2, FiAlertTriangle } from "react-icons/fi";
import api from "../../services/api";

const designs = [
  { id: "blue",   label: "Bleu",    gradient: "linear-gradient(135deg,#1d4ed8,#3b82f6)" },
  { id: "violet", label: "Violet",  gradient: "linear-gradient(135deg,#7c3aed,#a78bfa)" },
  { id: "orange", label: "Orange",  gradient: "linear-gradient(135deg,#ea580c,#fb923c)" },
  { id: "nature", label: "Nature",  gradient: "linear-gradient(135deg,#065f46,#10b981)" },
];

export default function MesCartes({ retour, dashData }) {
  const [cartes,       setCartes]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [msg,          setMsg]          = useState(null);
  const [designChoisi, setDesign]       = useState("blue");
  const [cardType,     setCardType]     = useState("Visa");
  const [devise,       setDevise]       = useState("XAF");
  const [nomCarte,     setNomCarte]     = useState(dashData?.user?.nom?.toUpperCase() || "NOM TITULAIRE");
  const [creating,     setCreating]     = useState(false);
  const [actionId,     setActionId]     = useState(null); // id de la carte en cours d'action
  const [confirmSuppr, setConfirmSuppr] = useState(null); // id carte à supprimer

  const token   = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const chargerCartes = async () => {
    try {
      setLoading(true);
      const res = await api.get("/cartes/mes-cartes", { headers });
      setCartes(res.data.cartes || []);
    } catch {
      setCartes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { chargerCartes(); }, []);

  const creerCarte = async () => {
    try {
      setCreating(true);
      setMsg(null);
      await api.post("/cartes/creer", { type: cardType, devise, design: designChoisi }, { headers });
      setMsg({ type: "success", text: "Carte créée avec succès !" });
      chargerCartes();
    } catch (e) {
      setMsg({ type: "error", text: e.response?.data?.message || "Erreur lors de la création." });
    } finally {
      setCreating(false);
    }
  };

  const bloquerCarte = async (id) => {
    try {
      setActionId(id);
      await api.put(`/cartes/${id}/bloquer`, {}, { headers });
      setMsg({ type: "success", text: "Carte bloquée." });
      chargerCartes();
    } catch (e) {
      setMsg({ type: "error", text: e.response?.data?.message || "Erreur." });
    } finally {
      setActionId(null);
    }
  };

  const debloquerCarte = async (id) => {
    try {
      setActionId(id);
      await api.put(`/cartes/${id}/debloquer`, {}, { headers });
      setMsg({ type: "success", text: "Carte débloquée." });
      chargerCartes();
    } catch (e) {
      setMsg({ type: "error", text: e.response?.data?.message || "Erreur." });
    } finally {
      setActionId(null);
    }
  };

  const supprimerCarte = async (id) => {
    try {
      setActionId(id);
      await api.delete(`/cartes/${id}`, { headers });
      setMsg({ type: "success", text: "Carte supprimée." });
      setConfirmSuppr(null);
      chargerCartes();
    } catch (e) {
      setMsg({ type: "error", text: e.response?.data?.message || "Erreur." });
    } finally {
      setActionId(null);
    }
  };

  const designActif = designs.find(d => d.id === designChoisi) || designs[0];
  const nbActives   = cartes.filter(c => c.statut === "ACTIVE").length;
  const nbBloquees  = cartes.filter(c => c.statut === "BLOQUEE").length;

  return (
    <div>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:24 }}>
        <button onClick={retour} style={{ background:"#f1f5f9", border:"none", borderRadius:8, padding:"7px 10px", cursor:"pointer", display:"flex", color:"#64748b" }}>
          <FiArrowLeft size={16} />
        </button>
        <div>
          <p style={{ fontSize:11, color:"#94a3b8", margin:0 }}>Accueil › Mes cartes virtuelles</p>
          <h2 style={{ fontSize:20, fontWeight:800, color:"#0f172a", margin:0 }}>Mes cartes virtuelles</h2>
          <p style={{ fontSize:12, color:"#94a3b8", margin:0 }}>Gérez vos cartes de paiement virtuelles PayVirtual</p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:"flex", gap:12, marginBottom:20 }}>
        {[
          { label:"Total cartes",  val:cartes.length, color:"#7c3aed", bg:"#f5f3ff", border:"#ede9fe" },
          { label:"Actives",       val:nbActives,     color:"#16a34a", bg:"#f0fdf4", border:"#bbf7d0" },
          { label:"Bloquées",      val:nbBloquees,    color:"#ef4444", bg:"#fef2f2", border:"#fecaca" },
        ].map(s => (
          <div key={s.label} style={{ flex:1, background:s.bg, border:`1px solid ${s.border}`, borderRadius:10, padding:"14px 18px", textAlign:"center" }}>
            <div style={{ fontSize:24, fontWeight:900, color:s.color }}>{s.val}</div>
            <div style={{ fontSize:11, color:"#64748b", fontWeight:500, marginTop:2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {msg && (
        <div style={{ padding:"10px 14px", borderRadius:8, marginBottom:16, fontSize:13, fontWeight:600, background:msg.type==="success"?"#f0fdf4":"#fef2f2", color:msg.type==="success"?"#16a34a":"#dc2626", border:`1px solid ${msg.type==="success"?"#bbf7d0":"#fecaca"}` }}>
          {msg.text}
        </div>
      )}

      <div style={{ display:"grid", gridTemplateColumns:"300px 1fr", gap:28 }}>

        {/* ── CRÉER UNE CARTE ── */}
        <div>
          <div style={{ background:"#fff", borderRadius:14, padding:22, border:"1px solid #e2e8f0", marginBottom:16 }}>
            <p style={{ fontSize:13, fontWeight:700, color:"#0f172a", marginBottom:16 }}>➕ Créer une nouvelle carte</p>

            {/* Aperçu */}
            <div style={{ width:"100%", height:150, borderRadius:14, background:designActif.gradient, padding:"18px 20px", color:"#fff", marginBottom:16, display:"flex", flexDirection:"column", justifyContent:"space-between", boxShadow:"0 8px 24px rgba(124,58,237,0.2)" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ width:28, height:28, background:"rgba(255,255,255,0.2)", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:14 }}>P</div>
                <span style={{ fontWeight:700, fontSize:13 }}>PayVirtual</span>
              </div>
              <div>
                <p style={{ fontSize:8, opacity:0.7, margin:"0 0 6px" }}>Carte Virtuelle</p>
                <p style={{ fontSize:13, fontWeight:700, letterSpacing:2, margin:"0 0 10px" }}>•••• •••• •••• 0000</p>
                <div style={{ display:"flex", justifyContent:"space-between" }}>
                  <span style={{ fontSize:10, fontWeight:600 }}>{nomCarte}</span>
                  <span style={{ fontSize:10 }}>{cardType}</span>
                </div>
              </div>
            </div>

            {/* Design */}
            <p style={{ fontSize:11, fontWeight:700, color:"#374151", marginBottom:8 }}>Design</p>
            <div style={{ display:"flex", gap:8, marginBottom:14 }}>
              {designs.map(d => (
                <div key={d.id} onClick={() => setDesign(d.id)} style={{ width:44, height:30, borderRadius:6, background:d.gradient, cursor:"pointer", border:designChoisi===d.id?"3px solid #0f172a":"3px solid transparent", transition:"border 0.15s" }} title={d.label}/>
              ))}
            </div>

            <label style={lbl}>Nom titulaire</label>
            <input value={nomCarte} onChange={e => setNomCarte(e.target.value)} placeholder="NOM PRÉNOM" style={{ ...inp, marginBottom:10 }} />

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
              <div>
                <label style={lbl}>Type</label>
                <select value={cardType} onChange={e => setCardType(e.target.value)} style={sel}>
                  <option>Visa</option>
                  <option>Mastercard</option>
                </select>
              </div>
              <div>
                <label style={lbl}>Devise</label>
                <select value={devise} onChange={e => setDevise(e.target.value)} style={sel}>
                  <option>XAF</option>
                  <option>USD</option>
                  <option>EUR</option>
                </select>
              </div>
            </div>

            <button onClick={creerCarte} disabled={creating || cartes.length >= 5} style={{ width:"100%", background:creating||cartes.length>=5?"#e2e8f0":"#7c3aed", color:creating||cartes.length>=5?"#94a3b8":"#fff", border:"none", borderRadius:10, padding:"11px 0", fontSize:13, fontWeight:700, cursor:creating||cartes.length>=5?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
              <FiPlus size={15}/> {creating ? "Création..." : cartes.length >= 5 ? "Max 5 cartes atteint" : "Créer la carte"}
            </button>
          </div>
        </div>

        {/* ── MES CARTES EXISTANTES ── */}
        <div>
          <p style={{ fontSize:13, fontWeight:700, color:"#0f172a", marginBottom:14 }}>
            Vos cartes ({cartes.length}/5)
          </p>

          {loading ? (
            <p style={{ fontSize:13, color:"#94a3b8" }}>Chargement...</p>
          ) : cartes.length === 0 ? (
            <div style={{ textAlign:"center", padding:"40px 0", color:"#94a3b8" }}>
              <p style={{ fontSize:14, fontWeight:600, color:"#cbd5e1" }}>Aucune carte</p>
              <p style={{ fontSize:12 }}>Créez votre première carte virtuelle pour effectuer des paiements.</p>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              {cartes.map((c, i) => {
                const design   = designs[i % designs.length];
                const bloquee  = c.statut === "BLOQUEE";
                const enAction = actionId === c.id;

                return (
                  <div key={c.id} style={{ background:"#fff", borderRadius:14, border:"1px solid #e2e8f0", overflow:"hidden", boxShadow:"0 1px 4px rgba(0,0,0,0.04)" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:20, padding:"16px 20px" }}>

                      {/* Mini carte */}
                      <div style={{ width:140, height:84, borderRadius:10, background:bloquee?"#94a3b8":design.gradient, padding:"10px 12px", color:"#fff", flexShrink:0, display:"flex", flexDirection:"column", justifyContent:"space-between", opacity:bloquee?0.7:1, position:"relative" }}>
                        {bloquee && (
                          <div style={{ position:"absolute", inset:0, borderRadius:10, background:"rgba(0,0,0,0.25)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                            <FiLock size={20} color="#fff" />
                          </div>
                        )}
                        <span style={{ fontSize:7, opacity:0.7 }}>PayVirtual</span>
                        <div>
                          <p style={{ fontSize:10, fontWeight:700, letterSpacing:2, margin:"0 0 4px" }}>•••• {c.numero?.slice(-4)}</p>
                          <p style={{ fontSize:7, opacity:0.7, margin:0 }}>Exp. {c.dateExpiration}</p>
                        </div>
                      </div>

                      {/* Infos */}
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                          <span style={{ fontSize:13, fontWeight:700, color:"#0f172a" }}>•••• •••• •••• {c.numero?.slice(-4)}</span>
                          <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:20, background:bloquee?"#fef2f2":"#f0fdf4", color:bloquee?"#ef4444":"#16a34a" }}>
                            {bloquee ? "🔒 BLOQUÉE" : "✅ ACTIVE"}
                          </span>
                        </div>
                        <p style={{ fontSize:11, color:"#94a3b8", margin:0 }}>Expiration : {c.dateExpiration}</p>
                        {bloquee && (
                          <p style={{ fontSize:11, color:"#ef4444", margin:"4px 0 0", fontWeight:600 }}>
                            ⚠️ Cette carte ne peut pas être utilisée pour les virements
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                        {bloquee ? (
                          <button onClick={() => debloquerCarte(c.id)} disabled={enAction} style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 14px", borderRadius:8, border:"1px solid #16a34a", background:"#f0fdf4", color:"#16a34a", fontSize:12, fontWeight:700, cursor:"pointer", opacity:enAction?0.6:1 }}>
                            <FiUnlock size={13}/> {enAction ? "..." : "Débloquer"}
                          </button>
                        ) : (
                          <button onClick={() => bloquerCarte(c.id)} disabled={enAction} style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 14px", borderRadius:8, border:"1px solid #f59e0b", background:"#fffbeb", color:"#d97706", fontSize:12, fontWeight:700, cursor:"pointer", opacity:enAction?0.6:1 }}>
                            <FiLock size={13}/> {enAction ? "..." : "Bloquer"}
                          </button>
                        )}
                        <button onClick={() => setConfirmSuppr(c.id)} disabled={enAction} style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 14px", borderRadius:8, border:"1px solid #ef4444", background:"#fef2f2", color:"#ef4444", fontSize:12, fontWeight:700, cursor:"pointer", opacity:enAction?0.6:1 }}>
                          <FiTrash2 size={13}/> Supprimer
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── MODAL CONFIRMATION SUPPRESSION ── */}
      {confirmSuppr && (
        <div style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 }}>
          <div style={{ background:"#fff", borderRadius:14, padding:28, width:340, boxShadow:"0 20px 60px rgba(0,0,0,0.15)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
              <div style={{ width:40, height:40, borderRadius:10, background:"#fef2f2", display:"flex", alignItems:"center", justifyContent:"center", color:"#ef4444" }}>
                <FiAlertTriangle size={18}/>
              </div>
              <div>
                <div style={{ fontWeight:700, fontSize:15, color:"#0f172a" }}>Supprimer la carte</div>
                <div style={{ fontSize:12, color:"#64748b", marginTop:2 }}>Cette action est irréversible</div>
              </div>
            </div>
            <p style={{ fontSize:13, color:"#64748b", marginBottom:20, lineHeight:1.6 }}>
              Êtes-vous sûr de vouloir supprimer cette carte virtuelle ? Elle ne pourra plus être utilisée pour les virements.
            </p>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => setConfirmSuppr(null)} style={{ flex:1, background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:8, padding:"9px 0", fontSize:13, fontWeight:600, cursor:"pointer", color:"#64748b" }}>
                Annuler
              </button>
              <button onClick={() => supprimerCarte(confirmSuppr)} style={{ flex:1, background:"#ef4444", color:"#fff", border:"none", borderRadius:8, padding:"9px 0", fontSize:13, fontWeight:700, cursor:"pointer" }}>
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const lbl = { display:"block", fontSize:11, fontWeight:600, color:"#374151", marginBottom:4 };
const inp = { width:"100%", padding:"8px 10px", border:"1px solid #e2e8f0", borderRadius:7, fontSize:12, outline:"none", background:"#fafafa", boxSizing:"border-box" };
const sel = { width:"100%", padding:"8px 10px", border:"1px solid #e2e8f0", borderRadius:7, fontSize:12, outline:"none", background:"#fafafa", cursor:"pointer", boxSizing:"border-box" };