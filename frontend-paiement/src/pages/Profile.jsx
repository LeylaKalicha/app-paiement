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
import { Edit, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export default function UserProfile() {
  const navigate = useNavigate();

  const [user, setUser] = useState({
    firstName: "Jean",
    lastName: "Kamga",
    email: "jean.kamga@email.com",
    phone: "+237 6 12 34 56 78",
    photo: null
  });

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setUser({ ...user, photo: reader.result });
    };
    reader.readAsDataURL(file);
  };

  const handleEditProfile = () => {
    alert("Formulaire de modification du profil à implémenter");
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
          <Link to="/transfer" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-200 text-black">
            <FiSend /> Envoyer
          </Link>
          <Link to="/transactions" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-200 text-black">
            <FiRepeat /> Transactions
          </Link>
          <Link to="/analytics" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-200 text-black">
            <FiBarChart2 /> Analytique
          </Link>
          <Link
            to="/profile"
            className="flex items-center gap-3 p-3 rounded-lg bg-gray-200 text-black"
          >
            <FiUser /> Profil
          </Link>
        </nav>

        <div className="space-y-2">
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
            Profil Utilisateur
          </h1>

          {/* PHOTO */}
          <div className="flex flex-col items-center">
            <div className="w-32 h-32 rounded-full bg-gray-200 overflow-hidden mb-4 border-4 border-purple-400">
              {user.photo ? (
                <img
                  src={user.photo}
                  alt="Profil"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl">
                  👤
                </div>
              )}
            </div>

            <label className="cursor-pointer bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg font-medium transition">
              Ajouter / Changer photo
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </label>
          </div>

          {/* INFOS */}
          <div className="space-y-4">
            <ProfileRow
              label="Nom"
              value={`${user.firstName} ${user.lastName}`}
              onEdit={handleEditProfile}
            />
            <ProfileRow
              label="Email"
              value={user.email}
              onEdit={handleEditProfile}
            />
            <ProfileRow
              label="Téléphone"
              value={user.phone}
              onEdit={handleEditProfile}
            />
          </div>

          {/* ACTIONS */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleEditProfile}
              className="flex-1 bg-purple-500 text-white py-3 rounded-lg font-semibold hover:bg-purple-600 transition"
            >
              Modifier profil
            </button>

            <button
              onClick={handleLogout}
              className="flex-1 bg-white border border-gray-300 text-gray-900 py-3 rounded-lg font-semibold hover:bg-gray-100 transition flex items-center justify-center gap-2"
            >
              <LogOut size={16} /> Déconnexion
            </button>
          </div>
        </div>

      </main>
    </div>
  );
}

/* ===== COMPONENT ===== */

const ProfileRow = ({ label, value, onEdit }) => (
  <div className="flex justify-between items-center">
    <span className="font-semibold text-gray-700">{label} :</span>
    <span className="text-gray-600 flex-1 text-right mr-3">{value}</span>
    <button
      onClick={onEdit}
      className="p-1 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition"
    >
      <Edit size={16} />
    </button>
  </div>
);
