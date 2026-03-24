import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import HomePage       from "../pages/HomePage";
import Login          from "../pages/Login";
import Register       from "../pages/Register";
import Dashboard      from "../pages/Utilisateur/Dashboard";
import AdminDashboard from "../pages/Administrateur/AdminDashboard";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"               element={<HomePage />} />
        <Route path="/login"          element={<Login />} />
        <Route path="/register"       element={<Register />} />
        <Route path="/Dashboard"      element={<Dashboard />} />
        <Route path="/AdminDashboard" element={<AdminDashboard />} />

        <Route path="*"               element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}