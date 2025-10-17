import { uploadFile } from "../utils/fileUpload.js";
import { Document } from "../models/document.model.js"
import crypto from "crypto";
import fs from "fs";
import { asyncHandler } from "../utils/asyncHandler.js";


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

export { uploadDocument };