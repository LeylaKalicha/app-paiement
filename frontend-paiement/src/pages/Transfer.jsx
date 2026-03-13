import React, { useState } from "react";
import {
  FiHome,
  FiCreditCard,
  FiSend,
  FiRepeat,
  FiBarChart2,
  FiUser,
  FiSettings,
  FiLogOut
} from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";

export default function SendMoney() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    recipient: "",
    amount: "",
    message: ""
  });

  const handleSendMoney = () => {
    const { recipient, amount } = formData;

    if (!recipient.trim()) {
      alert("Veuillez entrer l’adresse email ou le numéro du destinataire.");
      return;
    }

    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      alert("Veuillez entrer un montant valide.");
      return;
    }

    alert(`Vous avez envoyé ${amount} € à ${recipient}`);
    console.log("Envoi d’argent :", formData);

    setFormData({ recipient: "", amount: "", message: "" });
  };

  const handleLogout = () => {
    alert("Vous avez été déconnecté.");
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-gray-100">

      {/* SIDEBAR FIXE */}
      <aside className="w-64 bg-gray-50 border-r p-6 flex flex-col">
        <h1 className="text-2xl font-bold mb-10 text-black">
          User Dashboard
        </h1>

        <nav className="space-y-2 flex-1">
          <Link to="/dashboard" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-200 text-black">
            <FiHome /> Tableau de bord
          </Link>
          <Link to="/cardscreen" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-200 text-black">
            <FiCreditCard /> Mes cartes
          </Link>
          <Link
            to="/transfer"
            className="flex items-center gap-3 p-3 rounded-lg bg-gray-200 text-black"
          >
            <FiSend /> Envoyer
          </Link>
          <Link to="/transactions" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-200 text-black">
            <FiRepeat /> Transactions
          </Link>
          <Link to="/analytics" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-200 text-black">
            <FiBarChart2 /> Analytique
          </Link>
          <Link to="/profile" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-200 text-black">
            <FiUser /> Profil
          </Link>
        </nav>

        <div className="space-y-2">
           <Link to="/profile" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-200 text-black">
                      <FiUser /> Inviter les amis
                    </Link>
          <Link to="/settings" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-200 text-black">
            <FiSettings /> Paramètres
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-200 text-black"
          >
            <FiLogOut /> Déconnexion
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 p-8 flex justify-center items-start">

        <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md space-y-6">
          <h1 className="text-3xl font-bold text-gray-800 text-center">
            Envoyer de l’argent
          </h1>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-2">
                Destinataire (email ou téléphone)
              </label>
              <input
                type="text"
                placeholder="exemple@email.com ou +237612345678"
                value={formData.recipient}
                onChange={(e) =>
                  setFormData({ ...formData, recipient: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-300 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-2">
                Montant (€)
              </label>
              <input
                type="number"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-300 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-2">
                Message (facultatif)
              </label>
              <input
                type="text"
                placeholder="Ex : Pour le dîner"
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-300 outline-none"
              />
            </div>
          </div>

          <button
            onClick={handleSendMoney}
            className="w-full bg-purple-500 text-white py-3 rounded-lg font-semibold hover:bg-purple-600 transition"
          >
            Envoyer
          </button>
        </div>

      </main>
    </div>
  );
}
