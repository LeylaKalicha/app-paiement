import React from "react";
import { FiHome, FiLogIn, FiUserPlus, FiShield } from "react-icons/fi";
import { Link } from "react-router-dom";
import "./Home.css"; // ton CSS actuel

export default function Home() {
  return (
    <div className="home">

      {/* NAVBAR FIXE */}
      <header className="navbar fixed top-0 left-0 w-full bg-white shadow z-50 flex items-center justify-between px-8 py-4">
        <h1 className="logo text-xl font-bold">PayVirtual</h1>

        <nav className="nav-links flex items-center gap-6">
          <Link to="/"><FiHome /> Accueil</Link>
          <Link to="/Admindashboard"><FiShield /> Sécurité</Link>
          <Link to="/log"><FiLogIn /> Connexion</Link>
          <Link to="/register" className="btn-primary flex items-center gap-1">
            <FiUserPlus /> Créer un compte
          </Link>
        </nav>
      </header>

      {/* CONTENU PRINCIPAL */}
      <main className="pt-24"> {/* padding-top pour ne pas cacher le contenu derrière la navbar */}
        
        {/* HERO */}
        <section className="hero flex flex-col md:flex-row items-center justify-between px-8 py-20 bg-purple-50">
          <div className="hero-left md:w-1/2 mb-10 md:mb-0">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Gérez vos paiements <br />
              avec des <span className="text-purple-600">cartes virtuelles sécurisées</span>
            </h1>
            <p className="mb-6 text-gray-700 text-lg">
              Créez des cartes virtuelles, effectuez des paiements en ligne
              et suivez vos transactions en toute sécurité.
            </p>
            <div className="hero-buttons flex gap-4">
              <Link to="/register" className="btn-primary px-6 py-3 rounded-lg text-white bg-purple-500 hover:bg-purple-600 transition">
                Commencer maintenant
              </Link>
              <Link to="/log" className="btn-outline px-6 py-3 rounded-lg border border-purple-500 text-purple-500 hover:bg-purple-100 transition">
                Se connecter
              </Link>
            </div>
          </div>

          <div className="hero-right md:w-1/2">
            <img
              src="https://images.unsplash.com/photo-1556742031-c6961e8560b0"
              alt="Paiement en ligne"
              className="rounded-xl shadow-lg"
            />
          </div>
        </section>

        {/* FEATURES */}
        <section className="features grid grid-cols-1 md:grid-cols-4 gap-8 px-8 py-20 bg-white text-center">
          <div className="feature p-6 shadow-lg rounded-xl hover:shadow-xl transition">
            💳
            <h4 className="font-semibold mt-2 mb-1">Carte virtuelle</h4>
            <p>Création instantanée</p>
          </div>

          <div className="feature p-6 shadow-lg rounded-xl hover:shadow-xl transition">
            🔐
            <h4 className="font-semibold mt-2 mb-1">Sécurité avancée</h4>
            <p>Protection anti-fraude</p>
          </div>

          <div className="feature p-6 shadow-lg rounded-xl hover:shadow-xl transition">
            ⚡
            <h4 className="font-semibold mt-2 mb-1">Paiement rapide</h4>
            <p>Transactions immédiates</p>
          </div>

          <div className="feature p-6 shadow-lg rounded-xl hover:shadow-xl transition">
            📊
            <h4 className="font-semibold mt-2 mb-1">Suivi en temps réel</h4>
            <p>Historique clair</p>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="text-center py-6 bg-purple-50 text-gray-700">
          © 2026 PayVirtual — Tous droits réservés
        </footer>
      </main>
    </div>
  );
}
