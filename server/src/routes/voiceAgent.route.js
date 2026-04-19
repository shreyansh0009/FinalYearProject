import { Router } from "express";
import { verifyDocumentVoice, getDocumentsByPhone, getDocumentById } from "../controllers/voiceAgent.controller.js";
import { verifyVoiceAgentKey } from "../middlewares/voiceAgent.middleware.js";

const router = Router();

// All voice agent routes require API key
router.use(verifyVoiceAgentKey);

// Verify a document by hash (blockchain + DB)
router.post("/verify", verifyDocumentVoice);

// Get all documents for a student by phone number
router.get("/documents/phone/:phone", getDocumentsByPhone);

// Get a single document by its MongoDB ID
router.get("/documents/:documentId", getDocumentById);

export default router;
