"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controllers_1 = require("../controllers/auth.controllers");
const auth_1 = require("../middlewares/auth");
const users_controllers_1 = require("../controllers/general/Users/users.controllers");
// import { createUser, getUsers } from '../controllers/user.controllers';
const router = (0, express_1.Router)();
// router.get("/", getUsers);
router.post("/", auth_controllers_1.createAccount);
// Routes for user management
router.get("/", auth_1.appAuth, users_controllers_1.getAllUsers);
router.get("/:id", auth_1.appAuth, users_controllers_1.getSingleUser);
exports.default = router;
