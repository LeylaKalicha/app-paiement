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
  FiLogOut,
  FiSearch,
  FiDownload
} from "react-icons/fi";

const transactions = [
  { id: 1, name: "Amazon", date: "2026-01-10", amount: "-120 $", status: "Réussi" },
  { id: 2, name: "Netflix", date: "2026-01-11", amount: "-15 $", status: "Réussi" },
  { id: 3, name: "Recharge mobile", date: "2026-01-12", amount: "-10 $", status: "En attente" },
  { id: 4, name: "Salaire", date: "2026-01-13", amount: "+1 200 $", status: "Réussi" },
  { id: 5, name: "Virement", date: "2026-01-14", amount: "-300 $", status: "Échoué" }
];

export default function Transactions() {
  return (
    <div className="flex min-h-screen bg-gray-100">

      {/* SIDEBAR (même que ton dashboard) */}
      <aside className="w-64 bg-gray-50 border-r p-6 flex flex-col">
        <h1 className="text-2xl font-bold mb-10 text-black">
          User Dashboard
        </h1>

        <nav className="space-y-2 flex-1">
          <Link to="/dashboard" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-200 text-black"><FiHome /> Tableau de bord</Link>
          <Link to="/cardscreen" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-200 text-black"><FiCreditCard /> Mes cartes</Link>
          <Link to="/transfer" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-200 text-black"><FiSend /> Envoyer</Link>
          <Link to="/transactions" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-200 text-black bg-gray-200"><FiRepeat /> Transactions</Link>
          <Link to="/analytics" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-200 text-black"><FiBarChart2 /> Analytique</Link>
          <Link to="/profile" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-200 text-black"><FiUser /> Profil</Link>
        </nav>

        <div className="space-y-2">
                    <Link to="/profile" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-200 text-black"><FiUser /> Inviter les amis</Link>
          <Link to="/settings" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-200 text-black"><FiSettings /> Paramètres</Link>
          <Link to="/log" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-200 text-black"><FiLogOut /> Déconnexion</Link>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 p-8">

        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h2 className="text-lg font-semibold text-black">
            Historique des transactions
          </h2>
        </div>

        {/* FILTER BAR */}
        <div className="bg-white rounded-lg shadow p-4 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-2 border rounded-lg px-3 py-2">
            <FiSearch className="text-gray-500" />
            <input
              type="text"
              placeholder="Rechercher..."
              className="outline-none text-sm w-full"
            />
          </div>

          <button className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg">
            <FiDownload /> Exporter
          </button>
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-100 text-sm">
              <tr>
                <th className="p-3">Nom</th>
                <th className="p-3">Date</th>
                <th className="p-3">Montant</th>
                <th className="p-3">Statut</th>
              </tr>
            </thead>

            <tbody>
              {transactions.map(tx => (
                <tr key={tx.id} className="border-t text-sm">
                  <td className="p-3">{tx.name}</td>
                  <td className="p-3">{tx.date}</td>
                  <td className={`p-3 font-semibold ${tx.amount.startsWith("+") ? "text-green-600" : "text-red-600"}`}>
                    {tx.amount}
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs 
                      ${tx.status === "Réussi" && "bg-green-100 text-green-700"}
                      ${tx.status === "En attente" && "bg-yellow-100 text-yellow-700"}
                      ${tx.status === "Échoué" && "bg-red-100 text-red-700"}`}>
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </main>
    </div>
  );
}
