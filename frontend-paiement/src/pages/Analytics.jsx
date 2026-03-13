import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
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
import { Link } from "react-router-dom";

const dashboardData = [
  { month: "Jan", sent: 500, received: 300 },
  { month: "Feb", sent: 700, received: 400 },
  { month: "Mar", sent: 600, received: 350 },
  { month: "Apr", sent: 800, received: 500 },
  { month: "May", sent: 750, received: 450 }
];

export default function DashboardAnalytics() {
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
          <Link to="/transfer" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-200 text-black">
            <FiSend /> Envoyer
          </Link>
          <Link to="/transactions" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-200 text-black">
            <FiRepeat /> Transactions
          </Link>
          <Link
            to="/analytics"
            className="flex items-center gap-3 p-3 rounded-lg bg-gray-200 text-black"
          >
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
          <Link to="/log" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-200 text-black">
            <FiLogOut /> Déconnexion
          </Link>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-8">

        <h1 className="text-3xl font-bold text-gray-800 mb-8">
          Tableau de bord analytique
        </h1>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white shadow rounded-2xl p-6 text-center">
            <p className="text-gray-500">Solde actuel</p>
            <p className="text-2xl font-bold text-purple-600 mt-2">1 250 €</p>
          </div>
          <div className="bg-white shadow rounded-2xl p-6 text-center">
            <p className="text-gray-500">Total envoyé</p>
            <p className="text-2xl font-bold text-purple-600 mt-2">3 400 €</p>
          </div>
          <div className="bg-white shadow rounded-2xl p-6 text-center">
            <p className="text-gray-500">Total reçu</p>
            <p className="text-2xl font-bold text-purple-600 mt-2">2 800 €</p>
          </div>
        </div>

        {/* GRAPH */}
        <div className="bg-white shadow rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            Activité mensuelle
          </h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={dashboardData}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="sent" fill="#7c3aed" name="Envoyé" />
              <Bar dataKey="received" fill="#d946ef" name="Reçu" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* RECENT TRANSACTIONS */}
        <div className="bg-white shadow rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            Transactions récentes
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between bg-purple-50 p-3 rounded-lg">
              <span>Envoyé à jean.kamga@email.com</span>
              <span className="font-bold text-purple-600">-50 €</span>
            </div>
            <div className="flex justify-between bg-purple-50 p-3 rounded-lg">
              <span>Reçu de marie@example.com</span>
              <span className="font-bold text-purple-600">+120 €</span>
            </div>
            <div className="flex justify-between bg-purple-50 p-3 rounded-lg">
              <span>Envoyé à +237612345678</span>
              <span className="font-bold text-purple-600">-200 €</span>
            </div>
            <div className="flex justify-between bg-purple-50 p-3 rounded-lg">
              <span>Reçu de paul@example.com</span>
              <span className="font-bold text-purple-600">+75 €</span>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
