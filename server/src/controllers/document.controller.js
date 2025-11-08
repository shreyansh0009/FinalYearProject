import { uploadFile } from "../utils/fileUpload.js";
import { Document } from "../models/document.model.js"
import crypto from "crypto";
import fs from "fs";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";


const uploadDocument = asyncHandler(async (req, res) => {

    try {
        // 1. Geting the local file path from Multer
        const documentLocalPath = req.file?.path;

        if (!documentLocalPath) {
            return res.status(400).json({ message: "Document file is required" });
        }

        // 2. Calculating the document's hash (SHA-256)
        const fileBuffer = fs.readFileSync(documentLocalPath);
        const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

        // 3. Check if a document with this hash already exists
        const existingDocument = await Document.findOne({ documentHash: hash });
        if (existingDocument) {
            fs.unlinkSync(documentLocalPath); // Clean up the temp file
            return res.status(409).json({ message: "This exact document has already been uploaded." });
        }

        // 4. Upload the file to Cloudinary
        const cloudinaryResponse = await uploadFile(documentLocalPath);
        if (!cloudinaryResponse) {
            return res.status(500).json({ message: "Failed to upload document to cloud storage." });
        }

        // 5. Create the document record in the database
        const document = await Document.create({
            documentName: req.file.originalname,
            storageUrl: cloudinaryResponse.url,
            documentHash: hash,
            owner: req.user._id, // Get the logged-in user's ID from our verifyJWT middleware
            department: req.user.department, // Get the user's department
        });

        return res.status(201).json({
            message: "Document uploaded successfully and is pending verification.",
            document
        });

    } catch (error) {
        console.error("Error uploading document:", error);
        return res.status(500).json({ message: "Internal server error during document upload." });
    }
})



const getPendingDocuments = asyncHandler(async (req, res) => {
    // 1. Get the issuer's department from the req.user (provided by verifyJWT)
    const issuerDepartment = req.user.department;

    // 2. Find all documents that are "PENDING" AND match the issuer's department
    const pendingDocuments = await Document.find({
        department: issuerDepartment,
        status: "PENDING"
    })
    .populate("owner", "fullName email") // Show the student's name/email
    .sort({ createdAt: 1 }); // Show the oldest requests first

    // 3. Send the list
    return res.status(200).json({
        message: "Pending documents fetched successfully",
        documents: pendingDocuments
    });
});



const approveDocument = asyncHandler(async (req, res) => {
    // 1. Get the document ID from the URL parameters
    const { documentId } = req.params;

    // 2. Get the issuer's ID and department from the logged-in user
    const issuerId = req.user._id;
    const issuerDepartment = req.user.department;

    if (!documentId) {
        throw new apiError(400, "Document ID is required");
    }

    // 3. Find the document
    const document = await Document.findById(documentId);

    if (!document) {
        throw new apiError(404, "Document not found");
    }

    // 4. Security Check: Ensure the issuer is from the SAME department as the document
    // We compare strings because they are ObjectId objects
    if (document.department.toString() !== issuerDepartment.toString()) {
        throw new apiError(403, "Forbidden: You are not authorized to approve documents for this department.");
    }

    // 5. Check if the document is already issued
    if (document.status === "ISSUED") {
        throw new apiError(400, "This document has already been issued.");
    }

    // 6. Update the document
    document.status = "ISSUED";
    document.issuer = issuerId; // Stamp the document with the issuer's ID
    
    const updatedDocument = await document.save({ validateBeforeSave: true });

    return res.status(200).json(
        new apiResponse(
            200,
            updatedDocument,
            "Document issued successfully"
        )
    );
});

// Public verification endpoint - no login required
const verifyDocument = asyncHandler(async (req, res) => {
    const { hash } = req.body;

    if (!hash) {
        throw new apiError(400, "Document hash is required");
    }

    // Find document by hash
    const document = await Document.findOne({ documentHash: hash })
        .populate("owner", "fullName email")
        .populate("department", "name")
        .populate("issuer", "fullName");

    if (!document) {
        return res.status(404).json(
            new apiResponse(404, null, "Document not found. This document has not been uploaded to our system.")
        );
    }

    // Check if document is issued
    if (document.status !== "ISSUED") {
        return res.status(200).json(
            new apiResponse(
                200,
                {
                    status: document.status,
                    documentName: document.documentName,
                    uploadedAt: document.createdAt
                },
                "Document found but not yet verified by the issuing authority."
            )
        );
    }

    // Document is verified and issued
    return res.status(200).json(
        new apiResponse(
            200,
            {
                status: document.status,
                documentName: document.documentName,
                ownerName: document.owner?.fullName || "Unknown",
                ownerEmail: document.owner?.email || "N/A",
                department: document.department?.name || "Unknown",
                issuedBy: document.issuer?.fullName || "Unknown",
                issuedAt: document.updatedAt,
                uploadedAt: document.createdAt
            },
            "✅ Document is authentic and verified!"
        )
    );
});

export { uploadDocument, getPendingDocuments, approveDocument, verifyDocument };