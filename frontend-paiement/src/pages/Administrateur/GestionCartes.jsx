import { useState } from "react";

const themes = [
  { id: "violet", label: "Violet",       gradient: "linear-gradient(135deg, #7c3aed, #4f46e5)" },
  { id: "noir",   label: "Noir",         gradient: "linear-gradient(135deg, #1e1e2e, #374151)" },
  { id: "or",     label: "Or",           gradient: "linear-gradient(135deg, #d97706, #f59e0b)" },
  { id: "rouge",  label: "Rouge",        gradient: "linear-gradient(135deg, #dc2626, #ef4444)" },
  { id: "bleu",   label: "Bleu",         gradient: "linear-gradient(135deg, #1d4ed8, #3b82f6)" },
  { id: "vert",   label: "Vert",         gradient: "linear-gradient(135deg, #065f46, #10b981)" },
  { id: "rose",   label: "Rose",         gradient: "linear-gradient(135deg, #9d174d, #ec4899)" },
  { id: "argent", label: "Argent",       gradient: "linear-gradient(135deg, #6b7280, #d1d5db)" },
];

const cartesInitiales = [
  { id: 1, titulaire: "Christabel N.", numero: "4532 •••• •••• 7821", expiration: "12/27", reseau: "VISA",       theme: "violet", statut: "ACTIVE" },
  { id: 2, titulaire: "Kevin M.",      numero: "5412 •••• •••• 3390", expiration: "08/26", reseau: "MASTERCARD", theme: "noir",   statut: "ACTIVE" },
];

function CarteVisuelle({ carte }) {
  const themeObj = themes.find(t => t.id === carte.theme) || themes[0];
  return (
    <div style={{
      width: "100%", maxWidth: 320, height: 180, borderRadius: 16,
      background: themeObj.gradient, padding: "22px 26px",
      position: "relative", fontFamily: "'Courier New', monospace",
      boxShadow: "0 8px 32px #0000001a",
    }}>
      <div style={{ position: "absolute", top: 18, right: 22, fontSize: 13, fontWeight: 900, color: "#fff", opacity: 0.9, letterSpacing: 1 }}>
        {carte.reseau}
      </div>
      <div style={{ width: 38, height: 28, background: "rgba(255,255,255,0.25)", borderRadius: 5, marginBottom: 18, border: "1px solid rgba(255,255,255,0.3)" }} />
      <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", letterSpacing: 3, marginBottom: 18 }}>
        {carte.numero}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.65)", marginBottom: 2, letterSpacing: 1 }}>TITULAIRE</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{carte.titulaire || "NOM PRÉNOM"}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.65)", marginBottom: 2, letterSpacing: 1 }}>EXPIRE</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{carte.expiration || "MM/YY"}</div>
        </div>
      </div>
      {carte.statut === "SUSPENDUE" && (
        <div style={{
          position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)",
          borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <span style={{ color: "#fff", fontWeight: 900, fontSize: 16, letterSpacing: 3, fontFamily: "sans-serif" }}>SUSPENDUE</span>
        </div>
      )}
    </div>
  );
}

const formVide = { titulaire: "", numero: "", expiration: "", reseau: "VISA", theme: "violet" };

export default function GestionCartes({ allerVers }) {
  const [cartes, setCartes] = useState(cartesInitiales);
  const [selectId, setSelectId] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [modeModal, setModeModal] = useState("ajouter");
  const [form, setForm] = useState(formVide);

  const carteActive = cartes.find(c => c.id === selectId) || cartes[0];

  const ouvrirAjout = () => {
    setModeModal("ajouter");
    setForm(formVide);
    setShowModal(true);
  };

  const ouvrirModif = (carte) => {
    setModeModal("modifier");
    setForm({ titulaire: carte.titulaire, numero: carte.numero, expiration: carte.expiration, reseau: carte.reseau, theme: carte.theme });
    setSelectId(carte.id);
    setShowModal(true);
  };

  const sauvegarder = () => {
    if (!form.titulaire.trim() || !form.numero.trim()) return;
    if (modeModal === "ajouter") {
      const nouvelleId = Date.now();
      setCartes([...cartes, { id: nouvelleId, ...form, numero: form.numero.replace(/\d(?=\d{4})/g, "•"), statut: "ACTIVE" }]);
      setSelectId(nouvelleId);
    } else {
      setCartes(c => c.map(x => x.id === selectId ? { ...x, ...form, numero: form.numero.includes("•") ? x.numero : form.numero.replace(/\d(?=\d{4})/g, "•") } : x));
    }
    setShowModal(false);
  };

  const changerTheme = (themeId) => {
    if (!carteActive) return;
    setCartes(c => c.map(x => x.id === carteActive.id ? { ...x, theme: themeId } : x));
  };

  const suspendre = (id) => setCartes(c => c.map(x => x.id === id ? { ...x, statut: x.statut === "ACTIVE" ? "SUSPENDUE" : "ACTIVE" } : x));
  const supprimer = (id) => { setCartes(c => c.filter(x => x.id !== id)); if (selectId === id) setSelectId(cartes[0]?.id); };

  return (
    <div style={{ color: "#1e1e2e" }}>

      {/* En-tête */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Gestion des cartes</h2>
          <p style={{ color: "#9ca3af", fontSize: 13, marginTop: 4 }}>Ajoutez, modifiez et personnalisez les cartes de la plateforme</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => allerVers && allerVers("dashboard")}
            style={{ background: "none", border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#6b7280" }}>
            ← Retour
          </button>
          {/* ── BOUTON AJOUTER PRINCIPAL ── */}
          <button onClick={ouvrirAjout} style={{
            background: "#7c3aed", color: "#fff", border: "none",
            borderRadius: 8, padding: "8px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer"
          }}>
            + Ajouter une carte
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 24 }}>

        {/* Colonne gauche */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Aperçu carte sélectionnée */}
          {carteActive && (
            <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 6px #0000000d" }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Aperçu de la carte</div>
              <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 20 }}>Carte sélectionnée : {carteActive.titulaire}</div>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <CarteVisuelle carte={carteActive} />
              </div>
            </div>
          )}

          {/* Liste des cartes */}
          <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 6px #0000000d" }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>
              Toutes les cartes
              <span style={{ fontSize: 12, color: "#9ca3af", fontWeight: 400, marginLeft: 8 }}>{cartes.length} carte(s)</span>
            </div>

            {cartes.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: "#9ca3af" }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>💳</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Aucune carte</div>
                <div style={{ fontSize: 12 }}>Cliquez sur "Ajouter une carte" pour commencer</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {cartes.map(carte => {
                  const themeObj = themes.find(t => t.id === carte.theme) || themes[0];
                  const selected = selectId === carte.id;
                  return (
                    <div key={carte.id} onClick={() => setSelectId(carte.id)} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "12px 16px", borderRadius: 10, cursor: "pointer",
                      border: `1.5px solid ${selected ? "#7c3aed" : "#e5e7eb"}`,
                      background: selected ? "#f5f3ff" : "#fafafa",
                      transition: "all 0.2s"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 44, height: 28, borderRadius: 6, background: themeObj.gradient, flexShrink: 0 }} />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>{carte.titulaire}</div>
                          <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>{carte.numero} · {carte.reseau} · {carte.expiration}</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{
                          background: carte.statut === "ACTIVE" ? "#dcfce7" : "#fee2e2",
                          color: carte.statut === "ACTIVE" ? "#16a34a" : "#dc2626",
                          padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700
                        }}>{carte.statut}</span>
                        <button onClick={e => { e.stopPropagation(); ouvrirModif(carte); }}
                          style={{ background: "none", border: "1px solid #e5e7eb", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer", color: "#6366f1" }}>
                          Modifier
                        </button>
                        <button onClick={e => { e.stopPropagation(); suspendre(carte.id); }}
                          style={{ background: "none", border: "1px solid #e5e7eb", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer", color: carte.statut === "ACTIVE" ? "#d97706" : "#16a34a" }}>
                          {carte.statut === "ACTIVE" ? "Suspendre" : "Réactiver"}
                        </button>
                        <button onClick={e => { e.stopPropagation(); supprimer(carte.id); }}
                          style={{ background: "none", border: "1px solid #fee2e2", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer", color: "#dc2626" }}>
                          Supprimer
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Colonne droite */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Sélecteur de thème */}
          <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 6px #0000000d" }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Thème de la carte</div>
            <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 16 }}>
              {carteActive ? `Thème appliqué à : ${carteActive.titulaire}` : "Sélectionnez une carte"}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {themes.map(t => {
                const selectionne = carteActive?.theme === t.id;
                return (
                  <div key={t.id} onClick={() => changerTheme(t.id)} style={{
                    borderRadius: 8, overflow: "hidden", cursor: "pointer",
                    border: `2px solid ${selectionne ? "#7c3aed" : "#e5e7eb"}`,
                    transition: "all 0.15s", opacity: carteActive ? 1 : 0.4
                  }}>
                    <div style={{ height: 36, background: t.gradient }} />
                    <div style={{ padding: "5px 8px", background: "#f9fafb", fontSize: 11, fontWeight: selectionne ? 700 : 500, color: selectionne ? "#7c3aed" : "#6b7280", textAlign: "center" }}>
                      {selectionne ? "✓ " : ""}{t.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Statistiques */}
          <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 6px #0000000d" }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>Statistiques</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {[
                { label: "Total des cartes",  val: cartes.length },
                { label: "Cartes actives",    val: cartes.filter(c => c.statut === "ACTIVE").length },
                { label: "Cartes suspendues", val: cartes.filter(c => c.statut === "SUSPENDUE").length },
                { label: "VISA",              val: cartes.filter(c => c.reseau === "VISA").length },
                { label: "MASTERCARD",        val: cartes.filter(c => c.reseau === "MASTERCARD").length },
              ].map((s, i, arr) => (
                <div key={s.label} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "10px 0", borderBottom: i < arr.length - 1 ? "1px solid #f3f4f6" : "none"
                }}>
                  <span style={{ fontSize: 13, color: "#6b7280" }}>{s.label}</span>
                  <span style={{ fontWeight: 800, fontSize: 15, color: "#1e1e2e" }}>{s.val}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ── MODAL AJOUTER / MODIFIER ── */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 32, width: 480, boxShadow: "0 16px 48px rgba(0,0,0,0.15)", maxHeight: "90vh", overflowY: "auto" }}>

            <h3 style={{ fontWeight: 800, fontSize: 18, color: "#1e1e2e", marginBottom: 4 }}>
              {modeModal === "ajouter" ? "Ajouter une carte" : "Modifier la carte"}
            </h3>
            <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 24 }}>Remplissez les informations ci-dessous</p>

            {/* Aperçu live dans le modal */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
              <CarteVisuelle carte={{ ...form, statut: "ACTIVE" }} />
            </div>

            {/* Champs */}
            {[
              { label: "Nom du titulaire", key: "titulaire", placeholder: "ex: Jean Dupont",         type: "text" },
              { label: "Numéro de carte",  key: "numero",    placeholder: "ex: 4532 1234 5678 9012", type: "text" },
              { label: "Date d'expiration",key: "expiration",placeholder: "ex: 12/27",               type: "text" },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>{f.label}</label>
                <input
                  value={form[f.key]}
                  onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                  placeholder={f.placeholder}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, outline: "none", boxSizing: "border-box", background: "#fafafa" }}
                />
              </div>
            ))}

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Réseau</label>
              <select value={form.reseau} onChange={e => setForm({ ...form, reseau: e.target.value })}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, background: "#fafafa", outline: "none" }}>
                <option>VISA</option>
                <option>MASTERCARD</option>
                <option>AMEX</option>
                <option>MTN</option>
                <option>ORANGE</option>
              </select>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 10 }}>Thème de la carte</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                {themes.map(t => (
                  <div key={t.id} onClick={() => setForm({ ...form, theme: t.id })} style={{
                    borderRadius: 8, overflow: "hidden", cursor: "pointer",
                    border: `2px solid ${form.theme === t.id ? "#7c3aed" : "#e5e7eb"}`,
                    transition: "all 0.15s"
                  }}>
                    <div style={{ height: 28, background: t.gradient }} />
                    <div style={{ padding: "4px 4px", background: "#f9fafb", fontSize: 10, fontWeight: form.theme === t.id ? 700 : 500, color: form.theme === t.id ? "#7c3aed" : "#6b7280", textAlign: "center" }}>
                      {form.theme === t.id ? "✓ " : ""}{t.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Boutons */}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setShowModal(false)} style={{
                background: "none", border: "1px solid #e5e7eb", borderRadius: 8,
                padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#6b7280"
              }}>Annuler</button>
              <button onClick={sauvegarder} style={{
                background: "#7c3aed", color: "#fff", border: "none",
                borderRadius: 8, padding: "10px 24px", fontSize: 13, fontWeight: 700, cursor: "pointer"
              }}>
                {modeModal === "ajouter" ? "Ajouter la carte" : "Sauvegarder"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}