import { Router } from "express";
import {
  uploadDocument,
  getPendingDocuments,
  approveDocument,
  approveDocumentDirect,
  verifyDocument,
  getAllDocuments,
  getMyDocuments,
  rejectDocument,
  revokeDocumentAdmin,
  getAnalytics
} from "../controllers/document.controller.js";
import { verifyJwt, isIssuer, isAdmin } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// --- PUBLIC ROUTE (No authentication required) ---
router.route("/verify").post(verifyDocument);

// --- Student Routes ---
router.route("/upload").post(
    verifyJwt,
    upload.single("document"),
    uploadDocument
);

router.route("/my-documents").get(verifyJwt, getMyDocuments);

// --- Issuer Routes ---
router.route("/pending").get(verifyJwt, isIssuer, getPendingDocuments);
router.route("/approve/:documentId").patch(verifyJwt, isIssuer, approveDocument);
router.route("/approve-direct/:documentId").patch(verifyJwt, isIssuer, approveDocumentDirect);
router.route("/reject/:documentId").patch(verifyJwt, isIssuer, rejectDocument);

// --- Admin Routes ---
router.route("/all").get(verifyJwt, isAdmin, getAllDocuments);
router.route("/revoke/:documentId").patch(verifyJwt, isAdmin, revokeDocumentAdmin);
router.route("/analytics").get(verifyJwt, isAdmin, getAnalytics);

export default router;