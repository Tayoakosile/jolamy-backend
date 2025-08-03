"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const verify_document_controllers_1 = require("../controllers/verify-document.controllers");
const router = (0, express_1.Router)();
router.post("/", verify_document_controllers_1.verifyDocuments);
exports.default = router;
