import { useState } from "react";
import { FiArrowLeft, FiCopy, FiCheck } from "react-icons/fi";

export default function InviterAmis({ retour, dashData }) {
  const [copie, setCopie] = useState(false);
  const userId = dashData?.user?.id || "0000";
  const lienParrainage = `https://swiftcard.com/ref/${userId}`;

  const copier = () => {
    navigator.clipboard.writeText(lienParrainage);
    setCopie(true);
    setTimeout(() => setCopie(false), 2000);
  };

  const partager = (reseau) => {
    const msg = encodeURIComponent(`Rejoignez SwiftCard avec mon lien : ${lienParrainage}`);
    const urls = {
      facebook: `https://facebook.com/sharer/sharer.php?u=${encodeURIComponent(lienParrainage)}`,
      twitter:  `https://twitter.com/intent/tweet?text=${msg}`,
      whatsapp: `https://api.whatsapp.com/send?text=${msg}`,
      email:    `mailto:?subject=Rejoignez SwiftCard&body=${msg}`,
    };
    window.open(urls[reseau], "_blank");
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button onClick={retour} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, padding: "7px 10px", cursor: "pointer", display: "flex", color: "#64748b" }}>
          <FiArrowLeft size={16} />
        </button>
        <div>
          <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>Accueil › Inviter & Gagner</p>
        </div>
      </div>

      {/* Bannière */}
      <div style={{ background: "linear-gradient(135deg,#00c6ff,#7c3aed)", borderRadius: 14, padding: "28px 36px", marginBottom: 28, color: "#fff", textAlign: "center" }}>
        <h2 style={{ fontSize: 24, fontWeight: 900, margin: "0 0 8px" }}>Invitez des amis & Gagnez des récompenses</h2>
        <p style={{ fontSize: 13, opacity: 0.9, margin: 0 }}>Gagnez 10 $ pour chaque ami qui s'inscrit et complète ses 3 premières transactions</p>
      </div>

      {/* Lien de parrainage */}
      <div style={{ background: "#fff", borderRadius: 14, padding: "24px 28px", border: "1px solid #e2e8f0", marginBottom: 20 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 14 }}>Votre lien de parrainage</p>
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <input value={lienParrainage} readOnly style={{ flex: 1, padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, color: "#374151", background: "#f8fafc", outline: "none" }} />
          <button onClick={copier} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "10px 20px",
            background: copie ? "#16a34a" : "#ef4444", color: "#fff", border: "none",
            borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "background 0.2s"
          }}>
            {copie ? <FiCheck size={14} /> : <FiCopy size={14} />}
            {copie ? "Copié !" : "Copier"}
          </button>
        </div>

        {/* Boutons partage */}
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          {[
            { id: "facebook", label: "Facebook",  bg: "#1877f2" },
            { id: "twitter",  label: "Twitter",   bg: "#1da1f2" },
            { id: "whatsapp", label: "WhatsApp",  bg: "#25d366" },
            { id: "email",    label: "Email",     bg: "#64748b" },
          ].map(s => (
            <button key={s.id} onClick={() => partager(s.id)} style={{
              flex: 1, padding: "9px 0", background: s.bg, color: "#fff", border: "none",
              borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer"
            }}>f {s.label}</button>
          ))}
        </div>

        {/* QR Code placeholder */}
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 13, color: "#64748b", marginBottom: 10 }}>Scanner le QR Code pour partager</p>
          <div style={{ width: 100, height: 100, background: "#f1f5f9", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto", border: "1px solid #e2e8f0" }}>
            <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>QR Code</span>
          </div>
        </div>
      </div>

      {/* Progression */}
      <div style={{ background: "#fff", borderRadius: 14, padding: "24px 28px", border: "1px solid #e2e8f0", marginBottom: 20 }}>
        <p style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", marginBottom: 20 }}>Votre progression de parrainage</p>
        <div style={{ display: "flex", gap: 0, marginBottom: 20 }}>
          {[
            { val: "15", label: "Amis invités" },
            { val: "8",  label: "Inscrits" },
            { val: "5",  label: "Transactions complétées" },
            { val: "$50",label: "Gains totaux" },
          ].map((s, i) => (
            <div key={i} style={{ flex: 1, textAlign: "center", borderRight: i < 3 ? "1px solid #f1f5f9" : "none", padding: "0 16px" }}>
              <p style={{ fontSize: 28, fontWeight: 900, color: "#7c3aed", margin: 0 }}>{s.val}</p>
              <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Barre progression */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#94a3b8", marginBottom: 6 }}>
            <span>Prochain palier : 100 $ (10 parrainages)</span>
            <span style={{ color: "#7c3aed", fontWeight: 700 }}>80%</span>
          </div>
          <div style={{ height: 8, background: "#f1f5f9", borderRadius: 20 }}>
            <div style={{ width: "80%", height: 8, background: "linear-gradient(90deg,#7c3aed,#a78bfa)", borderRadius: 20 }} />
          </div>
        </div>
      </div>

      {/* Comment ça marche */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={{ background: "#fff", borderRadius: 14, padding: "24px 28px", border: "1px solid #e2e8f0" }}>
          <p style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", marginBottom: 18 }}>Comment ça marche</p>
          {[
            { num: "1", titre: "Partagez votre lien de parrainage", desc: "Utilisez votre lien unique ou les boutons de partage pour inviter des amis via les réseaux sociaux ou applications de messagerie." },
            { num: "2", titre: "Les amis s'inscrivent et vérifient", desc: "Vos amis s'inscrivent via votre lien et complètent la vérification de leur compte." },
            { num: "3", titre: "Ils complètent leur première transaction", desc: "Quand ils complètent leur première transaction de 50 $ ou plus, vous gagnez tous les deux des récompenses !" },
          ].map(s => (
            <div key={s.num} style={{ display: "flex", gap: 14, marginBottom: 16 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#7c3aed", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{s.num}</div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", margin: "0 0 4px" }}>{s.titre}</p>
                <p style={{ fontSize: 11, color: "#94a3b8", margin: 0, lineHeight: 1.5 }}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Paliers de récompense */}
        <div style={{ background: "#fff", borderRadius: 14, padding: "24px 28px", border: "1px solid #e2e8f0" }}>
          <p style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", marginBottom: 18 }}>Paliers de récompense</p>
          <p style={{ fontSize: 12, color: "#94a3b8", marginBottom: 16 }}>Gagnez plus en parrainant davantage d'amis avec notre système de récompenses par paliers</p>
          <div style={{ display: "flex", gap: 10 }}>
            {[
              { label: "Basique", bg: "#374151", color: "#fff", items: ["10 $ par parrainage", "Jusqu'à 5 parrainages", "Support standard"] },
              { label: "Pro",     bg: "#7c3aed", color: "#fff", items: ["15 $ par parrainage", "6–15 parrainages", "Support prioritaire", "Bonus 50 $ à 10"] },
              { label: "Premium", bg: "#ef4444", color: "#fff", items: ["20 $ par parrainage", "16+ parrainages", "Support VIP", "Bonus 200 $ à 20", "Fonctionnalités exclusives"] },
            ].map(tier => (
              <div key={tier.label} style={{ flex: 1, background: tier.bg, borderRadius: 12, padding: "16px 14px", color: tier.color }}>
                <p style={{ fontSize: 13, fontWeight: 800, textAlign: "center", margin: "0 0 12px" }}>{tier.label}</p>
                {tier.items.map(item => (
                  <p key={item} style={{ fontSize: 10, margin: "0 0 6px", opacity: 0.9 }}>✓ {item}</p>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}