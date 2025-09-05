"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const finance_controllers_1 = require("../controllers/finance.controllers");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
router.get("/", auth_1.appAuth, finance_controllers_1.getAllFinance);
router.get("/:id", auth_1.appAuth, finance_controllers_1.getSingleFinance);
router.post("/", auth_1.appAuth, finance_controllers_1.createNewFinance);
// edit cash flow
router.put("/:id", auth_1.appAuth, finance_controllers_1.updateFinance);
router.patch("/:id", auth_1.appAuth, finance_controllers_1.updateFinance);
exports.default = router;
