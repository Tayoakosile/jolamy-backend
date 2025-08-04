// routes/admin.routes.ts

import { Router } from "express";
import { appAuth, isAdmin } from "../../middlewares/auth";
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
import { addOfficeWorker, updateWorkerDetails } from "../../controllers/Admin/admin.offices.worker.controller";

const router = Router();

// users
router.get("/pending-users", appAuth, isAdmin, getPendingUsers);
router.post("/approve/:userId", appAuth, isAdmin, approveUser);
router.post("/reject/:userId", appAuth, isAdmin, rejectUser);
// users

// offices
router.post("/offices", appAuth, isAdmin, createNewOffices);
router.get("/offices", appAuth, isAdmin, getOffices);
router.get("/offices/:id", appAuth, isAdmin, getSingleOffice);
router.put("/offices/:id", appAuth, isAdmin, updateOffice);
router.patch("/offices/:id", appAuth, isAdmin, updateOffice);

// Add worker
router.post("/offices/:id/add-worker", appAuth, isAdmin, addOfficeWorker);
// Edit workers details
router.put("/offices/:id/workers/:worker_id/edit-worker", appAuth, isAdmin, updateWorkerDetails);
router.patch("/offices/:id/workers/:worker_id/edit-worker", appAuth, isAdmin, updateWorkerDetails);
// offices

// finance
router.get("/finances", appAuth, isAdmin, getAllCashFlow);
router.get("/finances/:id", appAuth, isAdmin, getSingleCashFlow);
// finance

export default router;
