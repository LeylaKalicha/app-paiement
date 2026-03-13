import React from "react";
import { Bar } from "react-chartjs-2";
import { Link } from "react-router-dom";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
} from "chart.js";

import {
  FiHome,
  FiUsers,
  FiCreditCard,
  FiRepeat,
  FiClock,
  FiAlertTriangle,
  FiBarChart2,
  FiBriefcase,
  FiLock,
  FiSettings,
  FiLogOut,
  FiEye,
  FiCheckCircle,
  FiXCircle
} from "react-icons/fi";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

/* ================= KPI CARD ================= */
const KpiCard = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white rounded-xl shadow p-5 flex justify-between items-center">
    <div>
      <p className="text-sm text-gray-600">{title}</p>
      <p className="text-2xl font-bold text-black">{value}</p>
    </div>
    <div className={`p-3 rounded-full ${color}`}>
      <Icon className="text-white text-xl" />
    </div>
  </div>
);

export default function AdminDashboard() {
  /* -------- GRAPH DATA -------- */
  const data = {
    labels: ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"],
    datasets: [
      {
        label: "Volume financier",
        data: [12000, 15000, 18000, 22000, 20000, 26000, 24000, 28000, 30000, 32000, 35000, 38000],
        backgroundColor: "#6B003E",
        borderRadius: 6
      }
    ]
  };

  return (
    <div className="flex min-h-screen bg-gray-100">

      {/* ================= SIDEBAR ADMIN ================= */}
      <aside className="w-64 bg-gray-50 border-r p-6 flex flex-col">
        <h1 className="text-2xl font-bold mb-10 text-black">
          Admin Dashboard
        </h1>

        <nav className="space-y-2 flex-1">
          <Link to="/Admin" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-200 text-black">
            <FiHome /> Dashboard
          </Link>

          <Link to="/admin/users" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-200 text-black">
            <FiUsers /> Utilisateurs
          </Link>

          <Link to="/admin/cards" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-200 text-black">
            <FiCreditCard /> Cartes
          </Link>

          <Link to="/admin/transactions" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-200 text-black">
            <FiRepeat /> Transactions
          </Link>

          <Link to="/admin/pending" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-200 text-black">
            <FiClock /> Paiements en attente
          </Link>

          <Link to="/admin/fraud" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-200 text-black">
            <FiAlertTriangle /> Signalements
          </Link>

          <Link to="/admin/analytics" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-200 text-black">
            <FiBarChart2 /> Rapports
          </Link>

          <Link to="/admin/merchants" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-200 text-black">
            <FiBriefcase /> Marchands
          </Link>

          <Link to="/admin/security" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-200 text-black">
            <FiLock /> Sécurité
          </Link>
        </nav>

        <div className="space-y-2">
          <Link to="/admin/settings" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-200 text-black">
            <FiSettings /> Paramètres
          </Link>

          <Link to="/logout" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-200 text-black">
            <FiLogOut /> Déconnexion
          </Link>
        </div>
      </aside>

      {/* ================= MAIN ================= */}
      <main className="flex-1 p-8">

        {/* HEADER */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h2 className="text-lg font-semibold text-black">
            Tableau de bord Administrateur
          </h2>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <KpiCard title="Volume total" value="38 000 $" icon={FiBarChart2} color="bg-purple-600" />
          <KpiCard title="Utilisateurs actifs" value="1 245" icon={FiUsers} color="bg-blue-600" />
          <KpiCard title="Transactions aujourd'hui" value="320" icon={FiRepeat} color="bg-green-600" />
          <KpiCard title="Alertes fraude" value="12" icon={FiAlertTriangle} color="bg-red-600" />
        </div>

        {/* CONTENT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* GRAPH */}
          <div className="bg-white p-6 rounded-xl shadow lg:col-span-2">
            <h3 className="font-semibold mb-4 text-black">
              Volume financier annuel
            </h3>
            <Bar data={data} options={{ plugins: { legend: { display: false } } }} />
          </div>

          {/* PENDING PAYMENTS */}
          <div className="bg-white p-6 rounded-xl shadow">
            <h3 className="font-semibold mb-4 text-black">
              Paiements en attente
            </h3>

            {[
              { user: "James Smith", amount: "497 $" },
              { user: "Linda Brown", amount: "1 200 $" },
              { user: "Robert Wilson", amount: "850 $" }
            ].map((p, i) => (
              <div key={i} className="flex justify-between items-center mb-4">
                <div>
                  <p className="font-medium text-black">{p.user}</p>
                  <p className="text-sm text-gray-500">En attente</p>
                </div>

                <div className="flex gap-2">
                  <button className="p-2 bg-green-500 rounded text-white">
                    <FiCheckCircle />
                  </button>
                  <button className="p-2 bg-red-500 rounded text-white">
                    <FiXCircle />
                  </button>
                  <button className="p-2 bg-gray-200 rounded text-black">
                    <FiEye />
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      </main>
    </div>
  );
}
