import express from "express";
import cors    from "cors";
import dotenv  from "dotenv";

import authRoutes         from "./routes/auth.routes.js";
import dashboardRoutes    from "./routes/dashboard.Routes.js";
import adminRoutes        from "./routes/admin.routes.js";
import transactionsRoutes from "./routes/transactions.routes.js";
import cartesRoutes       from "./routes/cartes.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import webhookRoutes from "./routes/webhook.routes.js";



dotenv.config();

const app = express();

app.use(cors({
  origin: ["http://localhost:5173","http://localhost:5174","http://localhost:5175","http://localhost:5176"],
  credentials: true,
}));

app.use(express.json());

// ── ROUTES ──
app.use("/api/auth",         authRoutes);
app.use("/api/dashboard",    dashboardRoutes);
app.use("/api/admin",        adminRoutes);
app.use("/api/transactions", transactionsRoutes);
app.use("/api/cartes",       cartesRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/webhooks", webhookRoutes);

app.get("/", (req, res) => res.json({ message: "✅ API PayVirtual", version: "1.0.0" }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Serveur démarré sur le port ${PORT}`));