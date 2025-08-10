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
import { validateOrder } from "../middlewares/order";
import { removeSensitiveFields } from "../utils/util";

const authApiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  message: {
    status: 429,
    error: "Too many requests. Please try again later.",
  },
});

const router = Router();

router.post("/signup", authApiLimiter, removeSensitiveFields, createAccount);
router.post("/login", authApiLimiter, removeSensitiveFields, loginAccount);
router.post(
  "/forgot-password",
  authApiLimiter,
  removeSensitiveFields,
  forgotPassword
);
router.post(
  "/reset-password/:token",
  authApiLimiter,
  removeSensitiveFields,
  resetPassword
);
router.post("/verify-documents", appAuth, verifyDocuments);
router.post(
  "/verify-documents/:id",
  appAuth,

  verifyDocuments
);
router.get("/verify-documents/:id", appAuth, getUserInfo);
router.get("/profile", appAuth, getUserProfile);

export default router;
