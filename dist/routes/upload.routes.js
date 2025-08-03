"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const upload_controllers_1 = require("../controllers/upload.controllers");
const upload_1 = require("../utils/upload");
const router = (0, express_1.Router)();
router.post("/", upload_1.upload.array("files"), upload_controllers_1.uploadImage);
exports.default = router;
