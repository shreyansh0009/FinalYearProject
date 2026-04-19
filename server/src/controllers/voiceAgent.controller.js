import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { User } from "../models/user.model.js";
import { Document } from "../models/document.model.js";

// Voice-friendly document status check by hash
const verifyDocumentVoice = asyncHandler(async (req, res) => {
    const { hash } = req.body;

    if (!hash || hash.trim() === "") {
        throw new apiError(400, "Document hash is required");
    }

    // Query DB directly — no blockchain call needed for status lookup
    const document = await Document.findOne({ documentHash: hash })
        .populate("owner", "fullName")
        .populate("department", "name")
        .populate("issuer", "fullName");

    if (!document) {
        return res.status(404).json(
            new apiResponse(404, { found: false, status: "NOT_FOUND" }, "Document not found")
        );
    }

    return res.status(200).json(
        new apiResponse(200, {
            found: true,
            status: document.status,
            documentName: document.documentName,
            ownerName: document.owner?.fullName || "Unknown",
            department: document.department?.name || "Unknown",
            issuedBy: document.issuer?.fullName || null,
            issuedAt: document.issuedAt || null,
            rejectionReason: document.rejectionReason || null,
        }, "Document status retrieved")
    );
});

// Look up documents by student phone number
const getDocumentsByPhone = asyncHandler(async (req, res) => {
    const { phone } = req.params;

    if (!phone || !/^\d{10}$/.test(phone)) {
        throw new apiError(400, "Valid 10-digit phone number is required");
    }

    const user = await User.findOne({ phone, userType: "STUDENT" });

    if (!user) {
        return res.status(404).json(
            new apiResponse(404, null, "No student found with this phone number")
        );
    }

    const documents = await Document.find({ owner: user._id })
        .populate("department", "name")
        .populate("issuer", "fullName")
        .select("documentName status issuedAt rejectedAt rejectionReason createdAt")
        .sort({ createdAt: -1 });

    return res.status(200).json(
        new apiResponse(200, {
            studentName: user.fullName,
            totalDocuments: documents.length,
            documents: documents.map(doc => ({
                documentName: doc.documentName,
                status: doc.status,
                department: doc.department?.name || "Unknown",
                issuedBy: doc.issuer?.fullName || null,
                issuedAt: doc.issuedAt || null,
                rejectedAt: doc.rejectedAt || null,
                rejectionReason: doc.rejectionReason || null,
                uploadedAt: doc.createdAt
            }))
        }, "Documents fetched successfully")
    );
});

// Look up single document by ID (voice-friendly)
const getDocumentById = asyncHandler(async (req, res) => {
    const { documentId } = req.params;

    const document = await Document.findById(documentId)
        .populate("owner", "fullName")
        .populate("department", "name")
        .populate("issuer", "fullName");

    if (!document) {
        return res.status(404).json(
            new apiResponse(404, null, "Document not found")
        );
    }

    return res.status(200).json(
        new apiResponse(200, {
            documentName: document.documentName,
            ownerName: document.owner?.fullName || "Unknown",
            department: document.department?.name || "Unknown",
            status: document.status,
            issuedBy: document.issuer?.fullName || null,
            issuedAt: document.issuedAt || null,
            uploadedAt: document.createdAt,
            verified: document.status === "ISSUED"
        }, "Document fetched successfully")
    );
});

export { verifyDocumentVoice, getDocumentsByPhone, getDocumentById };
