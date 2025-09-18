"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const banks_controllers_1 = require("../controllers/banks.controllers");
const router = (0, express_1.Router)();
router.get("/", banks_controllers_1.getBanks);
router.get("/resolve", banks_controllers_1.verifyBankAccount);
exports.default = router;
