import React from "react";
import { FiHome, FiLogIn, FiUserPlus, FiShield } from "react-icons/fi";
import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <header className="fixed top-0 left-0 w-full bg-white shadow z-50 flex items-center justify-between px-8 py-4">
      <h1 className="logo text-xl font-bold">PayVirtual</h1>

      <nav className="flex items-center gap-6">
        <Link to="/"><FiHome /> Accueil</Link>
        <Link to="/login"><FiLogIn /> Connexion</Link>
        <Link to="/register" className="flex items-center gap-1 bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition">
          <FiUserPlus /> Créer un compte
        </Link>
      </nav>
    </header>
  );
}
