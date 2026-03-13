import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar'; // <-- Navbar fixe importée

const PayVirtualRegister = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    referralCode: '',
    acceptTerms: false
  });

  const navigate = useNavigate();

  const handleRegister = () => {
    if (!formData.firstName.trim()) return alert('Veuillez entrer votre prénom');
    if (!formData.lastName.trim()) return alert('Veuillez entrer votre nom de famille');
    if (!formData.email.trim()) return alert('Veuillez entrer votre adresse email');
    if (!formData.password.trim()) return alert('Veuillez entrer un mot de passe');
    if (formData.password.length < 8) return alert('Le mot de passe doit contenir au moins 8 caractères');
    if (formData.password !== formData.confirmPassword) return alert('Les mots de passe ne correspondent pas');
    if (!formData.acceptTerms) return alert('Veuillez accepter les conditions générales');

    console.log('Register:', formData);
    navigate('/dashboard'); // redirection après inscription
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Navbar fixe */}
      <Navbar />

      {/* Contenu principal */}
      <div className="flex flex-col lg:flex-row mt-24 min-h-screen">
        {/* Colonne gauche - Formulaire */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
          <button
            onClick={() => navigate('/')}
            className="absolute top-6 left-6 flex items-center gap-2 bg-white text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-100 transition shadow-sm"
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Retour à l'accueil</span>
          </button>

          <div className="w-full max-w-md mt-12">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">S'inscrire</h1>

            <div className="space-y-4">
              {/* Prénom & Nom */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Prénom</label>
                  <input
                    type="text"
                    placeholder="Jean"
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-300 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Nom de famille</label>
                  <input
                    type="text"
                    placeholder="Kamga"
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-300 outline-none"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm text-gray-600 mb-2">Adresse email</label>
                <input
                  type="email"
                  placeholder="exemple@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-300 outline-none"
                />
              </div>

              {/* Mot de passe */}
              <div>
                <label className="block text-sm text-gray-600 mb-2">Mot de passe</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-300 outline-none"
                />
              </div>

              {/* Confirmer mot de passe */}
              <div>
                <label className="block text-sm text-gray-600 mb-2">Répéter le mot de passe</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-300 outline-none"
                />
              </div>

              {/* Code parrainage */}
              <div>
                <label className="block text-sm text-gray-600 mb-2">Code de parrainage (facultatif)</label>
                <input
                  type="text"
                  placeholder="Entrez le code"
                  value={formData.referralCode}
                  onChange={(e) => setFormData({...formData, referralCode: e.target.value})}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-300 outline-none"
                />
              </div>

              {/* Checkbox */}
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="terms"
                  checked={formData.acceptTerms}
                  onChange={(e) => setFormData({...formData, acceptTerms: e.target.checked})}
                  className="mt-1 w-4 h-4 rounded border-gray-300 text-purple-400 focus:ring-purple-300"
                />
                <label htmlFor="terms" className="text-sm text-gray-600">
                  J'accepte les conditions générales
                </label>
              </div>

              {/* Bouton S'inscrire */}
              <button
                onClick={handleRegister}
                className="w-full bg-purple-400 text-white py-3 rounded-lg font-semibold hover:bg-purple-500 transition"
              >
                S'inscrire
              </button>
            </div>

            {/* Lien connexion */}
            <div className="mt-6 text-center text-sm">
              <span className="text-gray-600">Vous avez déjà un compte ? </span>
              <button
                onClick={() => navigate("/log")}
                className="bg-white text-gray-900 px-3 py-1 rounded hover:bg-gray-100 transition font-medium"
              >
                Se connecter
              </button>
            </div>
          </div>
        </div>

        {/* Colonne droite - Promotion */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-purple-300 via-purple-400 to-purple-500 items-center justify-center p-12 relative overflow-hidden">
          <div className="relative z-10 text-center max-w-lg">
            <h2 className="text-3xl font-bold mb-4 text-white">
              L'émission de cartes simplifiée
            </h2>
            <p className="text-lg text-purple-50">
              Nous aidons les particuliers et les entreprises à créer un nombre illimité de cartes virtuelles.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayVirtualRegister;
