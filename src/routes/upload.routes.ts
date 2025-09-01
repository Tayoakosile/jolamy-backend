import { Router } from "express";
import { uploadToR2 } from "../controllers/upload-r2.controllers";
import { upload } from "../utils/upload";
import { uploadImage } from "../controllers/upload.controllers";

const router = Router();

// router.post("/", upload.array("files", 10), uploadImage);

router.post("/", upload.array("files", 10), uploadToR2);


export default router;


