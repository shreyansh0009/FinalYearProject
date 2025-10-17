import { Router } from "express";
import { uploadDocument } from "../controllers/document.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// This is a protected route. User must be logged in.
router.route("/upload").post(
    verifyJWT,                  // First, verify the user is logged in
    upload.single("document"),  // Then, handle the single file upload
    uploadDocument              // Finally, run the controller logic
);

export default router;