import { Router } from "express";
import { createAccount, loginAccount } from "../controllers/auth.controllers";
import { verifyDocuments } from "../controllers/verify-document.controllers";
import { upload } from "../utils/upload";

const router = Router();

router.post("/signup", createAccount);
router.post("/login", loginAccount);
router.post(
  "/verify-documents",
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
router.post(
  "/verify-documents/:id",
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
router.get(
  "/verify-documents/:id",
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

export default router;
