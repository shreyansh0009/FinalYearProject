import { Router } from "express";
import { uploadDocument, getPendingDocuments, approveDocument } from "../controllers/document.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { isIssuer } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// This is a protected route. User must be logged in.
// --- Student Route ---
router.route("/upload").post(
    verifyJwt,                  // First, verify the user is logged in
    upload.single("document"),  // Then, handle the single file upload
    uploadDocument              // Finally, run the controller logic
);


// --- Issuer Route ---
router.route("/pending").get(
    verifyJwt,      // First, check if they are logged in
    isIssuer,       // Then, check if they are an ISSUER
    getPendingDocuments // If both pass, run the controller
);


// 2. Add the new approve route
router.route("/approve/:documentId").patch(
    verifyJwt,
    isIssuer,
    approveDocument
);

export default router;