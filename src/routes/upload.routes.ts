import { Router } from "express";
import { uploadImage } from "../controllers/upload.controllers";
import { upload } from "../utils/upload";

const router = Router();

router.post("/", upload.array("files"), uploadImage);

export default router;
