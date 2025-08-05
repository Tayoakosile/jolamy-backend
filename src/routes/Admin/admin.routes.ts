// routes/admin.routes.ts

import { Router } from "express";
import { appAuth, isAdmin } from "../../middlewares/auth";
import {
  addNewProducts,
  archiveProduct,
  getProducts,
  getSingleProducts,
  updateProduct,
} from "../../controllers/Admin/admin.products.controller";
import {
  getPendingUsers,
  approveUser,
  rejectUser,
} from "../../controllers/Admin/admin.controller";
import {
  createNewOffices,
  getOffices,
  getSingleOffice,
  updateOffice,
} from "../../controllers/Admin/admin.offices.controller";
import {
  getAllCashFlow,
  getSingleCashFlow,
} from "../../controllers/Admin/admin.finance.controller";
import {
  addOfficeWorker,
  updateWorkerDetails,
} from "../../controllers/Admin/admin.offices.worker.controller";
import { upload } from "../../utils/upload";

const router = Router();

// users
router.get("/pending-users", appAuth, isAdmin, getPendingUsers);
router.post("/approve/:user_id", appAuth, isAdmin, approveUser);
router.post("/reject/:user_id", appAuth, isAdmin, rejectUser);
// users

// offices
router.post("/offices", appAuth, isAdmin, createNewOffices);
router.get("/offices", appAuth, isAdmin, getOffices);
router.get("/offices/:id", appAuth, isAdmin, getSingleOffice);
router.put("/offices/:id", appAuth, isAdmin, updateOffice);
router.patch("/offices/:id", appAuth, isAdmin, updateOffice);
router.post("/offices/:id/add-worker", appAuth, isAdmin, addOfficeWorker);
router.put(
  "/offices/:id/workers/:worker_id/edit-worker",
  appAuth,
  isAdmin,
  updateWorkerDetails
);
router.patch(
  "/offices/:id/workers/:worker_id/edit-worker",
  appAuth,
  isAdmin,
  updateWorkerDetails
);
// offices

// finance
router.get("/finances", appAuth, isAdmin, getAllCashFlow);
router.get("/finances/:id", appAuth, isAdmin, getSingleCashFlow);
// finance

// products

// users
router.get("/products", appAuth, isAdmin, getProducts);
router.post(
  "/products",
  appAuth,
  isAdmin,
  // upload.array("files"),
  addNewProducts
);
router.get("/products/:id", appAuth, isAdmin, getSingleProducts);
router.put("/products/:id", appAuth, isAdmin, updateProduct);
router.patch("/products/:id", appAuth, isAdmin, updateProduct);
router.patch("/products/:id/archive", appAuth, isAdmin, archiveProduct);
// users

// products

export default router;
