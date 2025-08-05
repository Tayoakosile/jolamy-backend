"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const product_controllers_1 = require("../controllers/product.controllers");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
router.post("/:id/cart", auth_1.appAuth, product_controllers_1.addToCart);
router.get("/:id", auth_1.appAuth, product_controllers_1.getSingleProductForNotAdmin);
exports.default = router;
