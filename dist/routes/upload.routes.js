"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const upload_r2_controllers_1 = require("../controllers/upload-r2.controllers");
const upload_1 = require("../utils/upload");
const router = (0, express_1.Router)();
// router.post("/", upload.array("files", 10), uploadImage);
router.post("/", upload_1.upload.array("files", 10), upload_r2_controllers_1.uploadToR2);
exports.default = router;
