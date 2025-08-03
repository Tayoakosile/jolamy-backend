"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controllers_1 = require("../controllers/auth.controllers");
// import { createUser, getUsers } from '../controllers/user.controllers';
const router = (0, express_1.Router)();
// router.get("/", getUsers);
router.post("/", auth_controllers_1.createAccount);
exports.default = router;
