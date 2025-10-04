import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  createAccount,
  forgotPassword,
  getUserProfile,
  loginAccount,
  resetPassword,
  sendVerificationOtpToMail,
  updateAccountOnSignUp,
  verifyResetToken,
  verifySignUpDetails,
} from "../controllers/auth.controllers";
import {
  getUserInfo,
  verifyDocuments,
} from "../controllers/verify-document.controllers";
import { appAuth, appAuthForInactiveUsers } from "../middlewares/auth";
import { removeSensitiveFields } from "../utils/util";

const authApiLimiter = rateLimit({
  windowMs: 10* 60 * 1000,
  max: 30,
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  message: {
    status: 429,
    error: "Too many requests. Please try again later.",
  },
});

const router = Router();

router.post("/signup", authApiLimiter, removeSensitiveFields, createAccount);
router.put(
  "/signup",
  authApiLimiter,
  appAuthForInactiveUsers,
  removeSensitiveFields,
  updateAccountOnSignUp
);
router.post(
  "/send-otp",
  authApiLimiter,
  removeSensitiveFields,
  sendVerificationOtpToMail
);

router.post(
  "/verify-otp",
  authApiLimiter,
  removeSensitiveFields,
  // appAuth,
  verifySignUpDetails
);
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
router.get(
  "/reset-password/:token",
  authApiLimiter,
  removeSensitiveFields,
  verifyResetToken
);
router.post("/verify-documents", appAuthForInactiveUsers, verifyDocuments);
router.post(
  "/verify-documents/:id",
  appAuth,

  verifyDocuments
);
router.get("/verify-documents/:id", appAuth, getUserInfo);
router.get("/profile", appAuthForInactiveUsers, getUserProfile);

export default router;
