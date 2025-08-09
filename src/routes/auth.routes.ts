import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  createAccount,
  forgotPassword,
  getUserProfile,
  loginAccount,
  resetPassword,
} from "../controllers/auth.controllers";
import {
  getUserInfo,
  verifyDocuments,
} from "../controllers/verify-document.controllers";
import { appAuth } from "../middlewares/auth";
import { apiLimiter } from "../middlewares/rate-limiter";

const authApiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 15,
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  message: {
    status: 429,
    error: "Too many requests. Please try again later.",
  },
});

const router = Router();

router.post("/signup", authApiLimiter, createAccount);
router.post("/login", authApiLimiter, loginAccount);
router.post("/forgot-password", authApiLimiter,forgotPassword);
router.post("/reset-password/:token",authApiLimiter, resetPassword);
router.post(
  "/verify-documents",
  appAuth,

  verifyDocuments
);
router.post(
  "/verify-documents/:id",
  appAuth,



  verifyDocuments
);
router.get("/verify-documents/:id", appAuth, getUserInfo);
router.get("/profile", appAuth, getUserProfile);

export default router;
