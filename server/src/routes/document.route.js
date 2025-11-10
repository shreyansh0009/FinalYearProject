import { Router } from "express";
import { 
  uploadDocument, 
  getPendingDocuments, 
  approveDocument, 
  verifyDocument,
  getAllDocuments,
  getMyDocuments,
  rejectDocument
} from "../controllers/document.controller.js";
import { verifyJwt, isIssuer, isAdmin } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// --- PUBLIC ROUTE (No authentication required) ---
router.route("/verify").post(verifyDocument);

// --- Student Routes ---
router.route("/upload").post(
    verifyJwt,                  // First, verify the user is logged in
    upload.single("document"),  // Then, handle the single file upload
    uploadDocument              // Finally, run the controller logic
);

router.route("/my-documents").get(verifyJwt, getMyDocuments);

// --- Issuer Routes ---
router.route("/pending").get(verifyJwt, isIssuer, getPendingDocuments);
router.route("/approve/:documentId").patch(verifyJwt, isIssuer, approveDocument);
router.route("/reject/:documentId").patch(verifyJwt, isIssuer, rejectDocument);

// --- Admin Routes ---
router.route("/all").get(verifyJwt, isAdmin, getAllDocuments);

export default router;