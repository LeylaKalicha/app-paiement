import React, { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import api from "../services/api";

const PayVirtualLogin = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    motDePasse: "", 
  });

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await api.post("/auth/login", formData);

      // Sauvegarder token
      localStorage.setItem("token", response.data.token);

      // Sauvegarder user (optionnel mais recommandé)
      localStorage.setItem("user", JSON.stringify(response.data.user));

      // Redirection selon type
      if (response.data.user.type === "ADMIN") {
        navigate("/AdminDashboard");
      } else {
        navigate("/Dashboard");
      }

    } catch (error) {
      if (error.response) {
        alert(error.response.data.message);
      } else {
        alert("Erreur serveur");
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <div className="flex flex-col lg:flex-row mt-24 min-h-screen">
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">

          <button
            onClick={() => navigate("/")}
            className="absolute top-6 left-6 flex items-center gap-2 bg-white text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-100 transition shadow-sm"
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">
              Retour à l'accueil
            </span>
          </button>

          <div className="w-full max-w-md mt-12">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">
              Se connecter
            </h1>

            <form onSubmit={handleLogin} className="space-y-4">

              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  Adresse email
                </label>
                <input
                  type="email"
                  required
                  placeholder="exemple@email.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-300 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  Mot de passe
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={formData.motDePasse}
                  onChange={(e) =>
                    setFormData({ ...formData, motDePasse: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-300 outline-none"
                />
              </div>

              <div className="text-right">
                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  className="text-sm hover:underline"
                >
                  Mot de passe oublié ?
                </button>
              </div>

              <button
                type="submit"
                className="w-full bg-purple-500 text-white py-3 rounded-lg font-semibold hover:bg-purple-600 transition"
              >
                Se connecter
              </button>

            </form>

            <div className="mt-6 text-center text-sm text-gray-700">
              Pas encore membre ?{" "}
              <button
                onClick={() => navigate("/register")}
                className="hover:underline font-medium"
              >
                Inscrivez-vous
              </button>
            </div>
          </div>
        </div>

        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-purple-300 via-purple-400 to-purple-500 items-center justify-center p-12 relative overflow-hidden">
          <div className="relative z-10 text-center max-w-lg text-white">
            <h2 className="text-4xl font-bold mb-4">
              L'émission de cartes simplifiée
            </h2>
            <p className="text-lg text-purple-100">
              Créez, gérez et utilisez des cartes virtuelles partout dans le monde.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayVirtualLogin;