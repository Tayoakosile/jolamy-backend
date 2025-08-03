import { Router } from "express";
import { createAccount, loginAccount } from "../controllers/auth.controllers";
import {
  getUserInfo,
  verifyDocuments,
} from "../controllers/verify-document.controllers";
import { protect } from "../middlewares/auth";

const router = Router();

router.post("/signup", createAccount);
router.post("/login", loginAccount);
router.post("/forget-password", loginAccount);
router.post(
  "/verify-documents",
  protect,

  verifyDocuments
);
router.post(
  "/verify-documents/:id",
  protect,
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
router.get("/verify-documents/:id", protect, getUserInfo);

export default router;
