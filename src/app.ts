import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import connectDB from "./config/db";
import { apiLimiter } from "./middlewares/rate-limiter";
import adminRoutes from "./routes/Admin/admin.routes";
import authRoutes from "./routes/auth.routes";
import financesRoutes from "./routes/finance.routes";
import orderRoutes from "./routes/order.routes";
import transactionRoutes from "./routes/transactions.routes";
import productRoutes from "./routes/products.route";
import cartRoutes from "./routes/carts.route";
import salesAgentRoute from "./routes/sales_agent/sales_agent.route";
import uploadRoutes from "./routes/upload.routes";
import userRoutes from "./routes/user.routes";
import officeRoutes from "./routes/office.routes";
import { appAuth } from "./middlewares/auth";
import { getStats } from "./controllers/stats.controller";

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
app.get("/api/stats", appAuth, getStats);

const PORT = process.env.PORT || 5000;

connectDB(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});

// Connect DB here

export default app;
