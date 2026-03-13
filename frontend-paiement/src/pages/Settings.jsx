import React from "react";
import { Link } from "react-router-dom";
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

export default function Settings() {
  return (
    <div className="flex min-h-screen bg-gray-100">

      {/* SIDEBAR */}
      <aside className="w-64 bg-gray-50 border-r p-6 flex flex-col">
        <h1 className="text-2xl font-bold mb-10 text-black">
          User Dashboard
        </h1>

        <nav className="space-y-2 flex-1">
          <Link to="/dashboard" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-200 text-black"><FiHome /> Tableau</Link>
          <Link to="/cardscreen" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-200 text-black"><FiCreditCard /> Cartes</Link>
          <Link to="/transfer" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-200 text-black"><FiSend /> Envoyer</Link>
          <Link to="/transactions" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-200 text-black"><FiRepeat /> Transactions</Link>
          <Link to="/analytics" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-200 text-black"><FiBarChart2 /> Analytique</Link>
          <Link to="/profile" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-200 text-black"><FiUser /> Profil</Link>
        </nav>

        <div className="space-y-2">
          <Link to="/settings" className="flex items-center gap-3 p-3 rounded-lg bg-gray-200 text-black">
            <FiSettings /> Paramètres
          </Link>

          <Link to="/log" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-200 text-black">
            <FiLogOut /> Déconnexion
          </Link>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 p-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Paramètres</h2>

          <div className="space-y-4">
            <div className="flex justify-between">
              <span>Notifications</span>
              <input type="checkbox" />
            </div>

            <div className="flex justify-between">
              <span>Mode sombre</span>
              <input type="checkbox" />
            </div>

            <div className="flex justify-between">
              <span>Langue</span>
              <select className="border rounded p-1">
                <option>Français</option>
                <option>English</option>
              </select>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
