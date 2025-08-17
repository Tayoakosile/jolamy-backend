// routes/admin.routes.ts

import { Router } from "express";
import {
  approveUser,
  getPendingUsers,
  rejectUser,
} from "../../controllers/Admin/admin.controller";
import {
  getAllCashFlow,
  getSingleCashFlow,
} from "../../controllers/Admin/admin.finance.controller";
import {
  createNewOffices,
  getOffices,
  getSingleOffice,
  updateOffice,
} from "../../controllers/Admin/admin.offices.controller";
import {
  addOfficeWorker,
  updateWorkerDetails,
} from "../../controllers/Admin/admin.offices.worker.controller";
import {
  addNewProducts,
  archiveProduct,
  getProducts,
  getSingleProducts,
  updateProduct,
} from "../../controllers/Admin/admin.products.controller";
import { getStats } from "../../controllers/Admin/admin.stats.controller";

import { appAuth, isAdmin } from "../../middlewares/auth";
import { removeSensitiveFields } from "../../utils/util";

const router = Router();

// users

router.post("/approve/:user_id", appAuth, isAdmin, approveUser);
router.post("/reject/:user_id", appAuth, isAdmin, rejectUser);
// users

// offices
router.post(
  "/offices",
  appAuth,
  isAdmin,
  removeSensitiveFields,
  createNewOffices
);
router.get("/offices", appAuth, isAdmin, getOffices);
router.get("/offices/:id", appAuth, isAdmin, getSingleOffice);
router.put(
  "/offices/:id",
  appAuth,
  isAdmin,
  removeSensitiveFields,
  updateOffice
);
router.patch("/offices/:id", appAuth, isAdmin, updateOffice);
router.post(
  "/offices/:id/add-worker",
  appAuth,
  isAdmin,
  removeSensitiveFields,
  addOfficeWorker
);
router.post(
  "/offices/add-worker",
  appAuth,
  isAdmin,
  removeSensitiveFields,
  addOfficeWorker
);
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

// stats
router.get("/stats", appAuth, isAdmin, getStats);

// users
router.get("/pending-users", appAuth, isAdmin, getPendingUsers);

// users

export default router;
