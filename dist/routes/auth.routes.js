"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controllers_1 = require("../controllers/auth.controllers");
const verify_document_controllers_1 = require("../controllers/verify-document.controllers");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
router.post("/signup", auth_controllers_1.createAccount);
router.post("/login", auth_controllers_1.loginAccount);
router.post("/forgot-password", auth_controllers_1.forgotPassword);
router.post("/verify-documents", auth_1.protect, verify_document_controllers_1.verifyDocuments);
router.post("/verify-documents/:id", auth_1.protect, 
// upload.fields([
//   { name: "nin" },
//   { name: "passport" },
//   { name: "warehouse_photos_internal" },
//   { name: "warehouse_photos_external" },
//   { name: "business_registration" },
//   { name: "other_documents" },
// ]),
verify_document_controllers_1.verifyDocuments);
router.get("/verify-documents/:id", auth_1.protect, verify_document_controllers_1.getUserInfo);
exports.default = router;
