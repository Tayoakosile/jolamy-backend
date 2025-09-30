"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const bonus_controllers_1 = require("../controllers/bonus.controllers");
const router = (0, express_1.Router)();
router.get("/:id", auth_1.appAuth, bonus_controllers_1.getSingleBonus);
exports.default = router;
