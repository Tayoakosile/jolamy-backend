import http from "http";

import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import connectDB from "./config/db";
import { getStats } from "./controllers/stats.controller";
import { appAuth } from "./middlewares/auth";
import { apiLimiter } from "./middlewares/rate-limiter";
import adminRoutes from "./routes/Admin/admin.routes";
import authRoutes from "./routes/auth.routes";
import bankRoutes from "./routes/banks.route";
import cartRoutes from "./routes/carts.route";
import financesRoutes from "./routes/finance.routes";
import officeRoutes from "./routes/office.routes";
import orderRoutes from "./routes/order.routes";
import productRoutes from "./routes/products.route";
import salesAgentRoute from "./routes/sales_agent/sales_agent.route";
import transactionRoutes from "./routes/transactions.routes";
import uploadRoutes from "./routes/upload.routes";
import userRoutes from "./routes/user.routes";
import { initSocket } from "./utils/socket";
// import "./jobs/birthday.cron";
// import "./jobs/bonus.cron";

const app = express();

// Middleware

app.use(cors());
app.use(express.json());
dotenv.config();
app.use("/api/auth", authRoutes);
app.use(apiLimiter);
app.use("/api/users", userRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/finances", financesRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/offices", officeRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/products", productRoutes);
app.use("/api/carts", cartRoutes);
app.use("/api/sales_agent", salesAgentRoute);
app.use("/api/stats", appAuth, getStats);
app.use("/api/banks", bankRoutes);
// app.get("/api/banks", appAuth, getBanks);

const server = http.createServer(app);

// ✅ Initialize socket.io in a reusable way
initSocket(server);


const PORT = process.env.PORT || 5000;

connectDB(() => {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});

// Connect DB here

export default app;
