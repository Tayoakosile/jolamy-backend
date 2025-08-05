"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Order_controllers_1 = require("../controllers/Order.controllers");
const auth_1 = require("../middlewares/auth");
const product_controllers_1 = require("../controllers/product.controllers");
const router = (0, express_1.Router)();
router.post("/:id/cart", auth_1.appAuth, Order_controllers_1.addToCart);
router.get("/products/:id", auth_1.appAuth, product_controllers_1.getSingleProductForNotAdmin);
