import db from "../config/db.js";

const genNumero    = () => { const p=()=>Math.floor(1000+Math.random()*9000); return `${p()}${p()}${p()}${p()}`; };
const genCVV       = () => String(Math.floor(100+Math.random()*900));
const genExpiration= () => { const d=new Date(); d.setFullYear(d.getFullYear()+3); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-01`; };
const fmtDate      = (d) => { if(!d) return "—"; const dt=new Date(d); return `${String(dt.getMonth()+1).padStart(2,"0")}/${String(dt.getFullYear()).slice(-2)}`; };
const fmtNumero    = (n) => n?.replace(/(\d{4})(?=\d)/g,"$1 ")||"";

// GET /api/cartes/mes-cartes
export const getMesCartes = async (req, res) => {
  try {
    const [cartes] = await db.query(
      "SELECT id,numero,dateExpiration,statut,created_at FROM cartevirtuelle WHERE utilisateur_id=? ORDER BY created_at DESC",
      [req.utilisateur.id]
    );
    return res.status(200).json({
      cartes: cartes.map(c=>({ id:c.id, numero:c.numero, numeroAffiche:fmtNumero(c.numero), dateExpiration:fmtDate(c.dateExpiration), cvv:"***", statut:c.statut })),
      total: cartes.length
    });
  } catch(err){ console.error(err); return res.status(500).json({message:"Erreur serveur."}); }
};

// POST /api/cartes/creer
export const creerCarte = async (req, res) => {
  try {
    const [[{total}]] = await db.query(
      "SELECT COUNT(*) AS total FROM cartevirtuelle WHERE utilisateur_id=? AND statut='ACTIVE'",
      [req.utilisateur.id]
    );
    if(total>=5) return res.status(400).json({message:"Maximum 5 cartes actives atteint."});

    const numero=genNumero(), cvv=genCVV(), dateExpiration=genExpiration();
    const [result] = await db.query(
      "INSERT INTO cartevirtuelle (numero,dateExpiration,cvv,statut,utilisateur_id) VALUES (?,?,?,'ACTIVE',?)",
      [numero, dateExpiration, cvv, req.utilisateur.id]
    );
    return res.status(201).json({
      message:"Carte créée !",
      carte:{ id:result.insertId, numero, numeroAffiche:fmtNumero(numero), dateExpiration:fmtDate(dateExpiration), cvv, statut:"ACTIVE" }
    });
  } catch(err){
    if(err.code==="ER_DUP_ENTRY") return res.status(409).json({message:"Réessayez."});
    console.error(err); return res.status(500).json({message:"Erreur serveur."});
  }
};

// PUT /api/cartes/:id/bloquer
export const bloquerCarte = async (req, res) => {
  try {
    const [[c]] = await db.query("SELECT id,statut FROM cartevirtuelle WHERE id=? AND utilisateur_id=?",[req.params.id,req.utilisateur.id]);
    if(!c) return res.status(404).json({message:"Carte introuvable."});
    if(c.statut==="BLOQUEE") return res.status(400).json({message:"Déjà bloquée."});
    await db.query("UPDATE cartevirtuelle SET statut='BLOQUEE',updated_at=NOW() WHERE id=?",[req.params.id]);
    return res.status(200).json({message:"Carte bloquée."});
  } catch(err){ console.error(err); return res.status(500).json({message:"Erreur serveur."}); }
};

// PUT /api/cartes/:id/debloquer
export const debloquerCarte = async (req, res) => {
  try {
    const [[c]] = await db.query("SELECT id FROM cartevirtuelle WHERE id=? AND utilisateur_id=?",[req.params.id,req.utilisateur.id]);
    if(!c) return res.status(404).json({message:"Carte introuvable."});
    await db.query("UPDATE cartevirtuelle SET statut='ACTIVE',updated_at=NOW() WHERE id=?",[req.params.id]);
    return res.status(200).json({message:"Carte débloquée."});
  } catch(err){ console.error(err); return res.status(500).json({message:"Erreur serveur."}); }
};

// DELETE /api/cartes/:id
export const supprimerCarte = async (req, res) => {
  try {
    const [[c]] = await db.query("SELECT id FROM cartevirtuelle WHERE id=? AND utilisateur_id=?",[req.params.id,req.utilisateur.id]);
    if(!c) return res.status(404).json({message:"Carte introuvable."});
    await db.query("DELETE FROM cartevirtuelle WHERE id=?",[req.params.id]);
    return res.status(200).json({message:"Carte supprimée."});
  } catch(err){ console.error(err); return res.status(500).json({message:"Erreur serveur."}); }
};