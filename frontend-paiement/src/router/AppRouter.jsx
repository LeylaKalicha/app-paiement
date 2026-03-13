import { BrowserRouter, Routes, Route } from "react-router-dom";

import HomePage from "../pages/HomePage";

import Log from "../pages/Log";
import Dashboard from "../pages/Dashboard";
import Transfer from "../pages/Transfer";
import History from "../pages/History";
import Profile from "../pages/Profile";
import AdminDashboard from "../pages/AdminDashboard";
import Cardscreen from "../pages/Cardscreen";
import Register from "../pages/Register";
import Analytics from "../pages/Analytics";
import Transactions from "../pages/Transactions";
import Settings from "../pages/Settings";
import Api from "../services/api";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage/>} />
       
         <Route path="/log" element={<Log />} />
        <Route path="/Cardscreen" element={<Cardscreen/>} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/transfer" element={<Transfer />} />
        <Route path="/history" element={<History />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admindashboard" element={<AdminDashboard />} />
        <Route path="/register" element={<Register />} />
        <Route path="/analytics" element={<Analytics />} />
         <Route path="/transactions" element={<Transactions />} />
        <Route path="/settings" element={<Settings />} />
         <Route path="/api" element={<api />} />
      </Routes>
    </BrowserRouter>
  );
}