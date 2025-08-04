"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const finace_controllers_1 = require("../controllers/finace.controllers");
const auth_1 = require("../middlewares/auth");
// import { createUser, getUsers } from '../controllers/user.controllers';
const router = (0, express_1.Router)();
router.get("/", auth_1.appAuth, auth_1.isWorker, finace_controllers_1.getAllFinance);
exports.default = router;
