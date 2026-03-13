import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bar } from "react-chartjs-2";
import api from "../services/api";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";

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

import { FaCcVisa, FaDollarSign } from "react-icons/fa";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

/* ---------------- STAT CARD ---------------- */
const StatCard = ({ title, amount, icon: Icon, bg }) => {
  return (
    <div className="bg-white rounded-xl shadow p-5 flex items-center justify-between">
      <div>
        <p className="text-gray-600 text-sm">{title}</p>
        <p className="text-xl font-bold text-black">{amount}</p>
      </div>
      <div className={`p-3 rounded-full ${bg}`}>
        <Icon className="text-white text-xl" />
      </div>
    </div>
  );
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);

  /* 🔐 Charger infos utilisateur */
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await api.get("/dashboard");
        setUserName(response.data.user.nom);
      } catch (error) {
        console.error(error);

        // Si token invalide → redirection login
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  const data = {
    labels: ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"],
    datasets: [
      {
        label: "Solde",
        data: [400,700,500,900,600,800,750,820,780,860,910,950],
        backgroundColor: "#6B003E",
        borderRadius: 8
      }
    ]
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg font-semibold">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">

      {/* ================= SIDEBAR ================= */}
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
            <FiSend /> Envoyer de l'argent
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
          <button
            onClick={() => {
              localStorage.removeItem("token");
              navigate("/login");
            }}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-200 text-black w-full text-left"
          >
            <FiLogOut /> Déconnexion
          </button>
        </div>
      </aside>

      {/* ================= MAIN ================= */}
      <main className="flex-1 p-8">

        {/* 🔥 BIENVENUE DYNAMIQUE */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h2 className="text-lg font-semibold text-black">
            Bienvenue à nouveau, {userName} 👋
          </h2>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <StatCard title="Solde du portefeuille" amount="12 450 XAF" icon={FaDollarSign} bg="bg-green-500"/>
          <StatCard title="Transactions aujourd’hui" amount="327" icon={FiRepeat} bg="bg-blue-500"/>
          <StatCard title="Paiements en attente" amount="18" icon={FiSend} bg="bg-yellow-500"/>
          <StatCard title="Cartes virtuelles actives" amount="5" icon={FiCreditCard} bg="bg-purple-500"/>
        </div>

        {/* GRAPH */}
        <div className="bg-white p-6 rounded-xl shadow">
          <h3 className="font-semibold mb-4 text-black">
            Évolution de l'équilibre
          </h3>

          <Bar
            data={data}
            options={{
              responsive: true,
              plugins: { legend: { display: false } }
            }}
          />
        </div>

      </main>
    </div>
  );
}