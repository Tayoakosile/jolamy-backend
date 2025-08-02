import express from "express";
import dotenv from "dotenv";
import userRoutes from "./routes/user.routes";
import authRoutes from "./routes/auth.routes";
import mongoose from "mongoose";
import connectDB from "./config/db";
import { errorHandler } from "./middlewares/errorHandler";

dotenv.config();
const app = express();

// Middleware
app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);




app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});


// Connect DB here

export default app;
