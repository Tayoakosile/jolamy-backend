import { Router } from "express";
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

const router = Router();

router.post("/signup", createAccount);
router.post("/login", loginAccount);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.post(
  "/verify-documents",
  appAuth,

  verifyDocuments
);
router.post(
  "/verify-documents/:id",
  appAuth,

  // upload.fields([
  //   { name: "nin" },
  //   { name: "passport" },
  //   { name: "warehouse_photos_internal" },
  //   { name: "warehouse_photos_external" },
  //   { name: "business_registration" },
  //   { name: "other_documents" },

  // ]),

  verifyDocuments
);
router.get("/verify-documents/:id", appAuth, getUserInfo);
router.get("/profile", appAuth, getUserProfile);

export default router;
