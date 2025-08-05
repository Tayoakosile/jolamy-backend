import { Router } from "express";
import { uploadToR2 } from "../controllers/upload-r2.controllers";
import { upload } from "../utils/upload";

const router = Router();

router.post("/", upload.single("file"), uploadToR2);

export default router;
