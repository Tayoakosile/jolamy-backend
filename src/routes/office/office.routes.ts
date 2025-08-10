import { Router } from "express";
import { getAllOfficeOrders } from "../../controllers/Office/office.controllers";
import { appAuth, isWorker } from "../../middlewares/auth";
import { validateOrder } from "../../middlewares/order";

const router = Router();

router.get("/", appAuth, isWorker, validateOrder, getAllOfficeOrders);
