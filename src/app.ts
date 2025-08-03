import dotenv from "dotenv";
import express from "express";
import connectDB from "./config/db";
import authRoutes from "./routes/auth.routes";
import uploadRoutes from "./routes/upload.routes";
import userRoutes from "./routes/user.routes";

dotenv.config();
const app = express();

// Middleware
app.use(express.json());

app.use("/api/upload", uploadRoutes);
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 5000;

connectDB(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});


// Connect DB here

export default app;
