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
import { useNavigate, Link } from "react-router-dom";
import cardImage from "/carte1.jpg";

export default function FyatuInterface() {
  const navigate = useNavigate();
  const [showWalletMenu, setShowWalletMenu] = useState(false);

  const [card, setCard] = useState({
    number: "",
    expiry: "",
    address: "",
    city: "",
    postal: ""
  });

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
          <Link to="/cardscreen" className="flex items-center gap-3 p-3 rounded-lg bg-gray-200 text-black">
            <FiCreditCard /> Mes cartes
          </Link>
          <Link to="/transfer" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-200 text-black">
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
      <main className="flex-1 p-8">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex flex-col lg:flex-row gap-8">

            {/* Carte */}
            <div className="flex justify-center">
              <img
                src={cardImage}
                alt="Virtual Card"
                className="w-full max-w-sm rounded-xl shadow-xl"
              />
            </div>

            {/* Formulaire */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <Input label="Card Number" value={card.number} onChange={e => setCard({ ...card, number: e.target.value })} />
              <Input label="Expiry Date" value={card.expiry} onChange={e => setCard({ ...card, expiry: e.target.value })} />
              <Input label="Billing Address" value={card.address} onChange={e => setCard({ ...card, address: e.target.value })} />
              <Input label="City / Country" value={card.city} onChange={e => setCard({ ...card, city: e.target.value })} />
              <Input label="Postal Code" value={card.postal} onChange={e => setCard({ ...card, postal: e.target.value })} />
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

/* ===== Components ===== */
const Input = ({ label, ...props }) => (
  <div>
    <p className="text-gray-500">{label}</p>
    <input
      {...props}
      className="w-full border rounded-md px-3 py-2 font-semibold"
    />
  </div>
);
