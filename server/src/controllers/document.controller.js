import { uploadFile } from "../utils/fileUpload.js";
import { Document } from "../models/document.model.js"
import crypto from "crypto";
import fs from "fs";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { adminContract, publicContract } from "../utils/ethersService.js";
import { ethers } from "ethers";


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
            success: true,
            message: "Document uploaded successfully and is pending verification.",
            data: document
        });

    } catch (error) {
        console.error("Error uploading document:", error);
        return res.status(500).json({ success: false, message: "Internal server error during document upload." });
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
    .populate("owner", "fullName username email") // Show the student's name/email
    .populate("department", "name shortCode") // Show department info
    .sort({ createdAt: 1 }); // Show the oldest requests first

    // 3. Send the list
    return res.status(200).json({
        success: true,
        message: "Pending documents fetched successfully",
        data: pendingDocuments
    });
});



const approveDocument = asyncHandler(async (req, res) => {
    // 1. Get the document ID from the URL parameters
    const { documentId } = req.params;

    if (!documentId) {
        throw new apiError(400, "Document ID is required");
    }

    // 2. Get the issuer's ID and department from the logged-in user
    const issuerId = req.user._id;
    const issuerDepartment = req.user.department;
    const issuerEthAddress = req.user.ethereumAddress;

    if (!issuerEthAddress) {
        throw new apiError(400, "Issuer account does not have an Ethereum address linked.");
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

    // 5. --- NEW BLOCKCHAIN LOGIC ---
    // Convert the hash string to bytes32 format for Solidity
    const hashBytes32 = "0x" + document.documentHash;

    try {
        console.log(`Issuing document hash ${hashBytes32} on-chain for issuer ${issuerEthAddress}...`);
        
        // First, check if the address is actually an issuer on-chain
        const isIssuerOnChain = await adminContract.isIssuer(issuerEthAddress);
        console.log(`Is ${issuerEthAddress} an issuer on-chain? ${isIssuerOnChain}`);
        
        if (!isIssuerOnChain) {
            throw new apiError(400, "This user is not registered as an issuer on the blockchain. Please re-register the user.");
        }
        
        // Call the smart contract function as the ADMIN (issuing on behalf of the issuer)
        const tx = await adminContract.issueDocumentOnBehalf(hashBytes32, issuerEthAddress);
        await tx.wait(); // Wait for the transaction to be mined
        
        console.log(`Document hash issued. Transaction: ${tx.hash}`);
    } catch (onChainError) {
        console.error("On-chain error while issuing document:", onChainError.message);
        throw new apiError(500, onChainError.message || "Failed to issue document on-chain.");
    }

    // 6. Update the document
    document.status = "ISSUED";
    document.issuer = issuerId; // Stamp the document with the issuer's ID
    document.issuedAt = new Date(); // Set the issued date
    
    const updatedDocument = await document.save({ validateBeforeSave: true });

    return res.status(200).json(
        new apiResponse(
            200,
            updatedDocument,
            "Document issued successfully on-chain and in database"
        )
    );
});

// Public verification endpoint - no login required
const verifyDocument = asyncHandler(async (req, res) => {

    const { hash } = req.body;

    if (!hash || hash.trim() === "") {
        throw new apiError(400, "Document hash is required for verification.");
    }

    // Convert string hash to bytes32 format
    const hashBytes32 = "0x" + hash;
    let isVerifiedOnChain = false;
    try {
        console.log(`Verifying hash on-chain: ${hashBytes32}`);
        // Call the 'verifyDocument' function on our smart contract
        isVerifiedOnChain = await publicContract.verifyDocument(hashBytes32);
        console.log(`On-chain result: ${isVerifiedOnChain}`);
    } catch (error) {
        console.error("On-chain verification error:", error.message);
        throw new apiError(500, "Error while communicating with the blockchain.");
    }

    // 2. If it's not verified on the blockchain, it's not valid.
    if (!isVerifiedOnChain) {
        throw new apiError(404, "Verification Failed: This document is not on the blockchain.");
    }


    // Find document by hash
    const document = await Document.findOne({ documentHash: hash, status: "ISSUED" })
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
                issuedBy: document.issuer?.fullName || "Issuing Authority",
                issuedAt: document.updatedAt,
                uploadedAt: document.createdAt,
                onChain: true,
                inDatabase: true
            },
            "✅ Document is authentic and verified!"
        )
    );
});

// Get all documents (Admin only)
const getAllDocuments = asyncHandler(async (req, res) => {
  try {
    const documents = await Document.find()
      .populate('owner', 'fullName username email')
      .populate('issuer', 'fullName username email')
      .populate('department', 'name shortCode')
      .sort({ createdAt: -1 });
    
    return res.status(200).json({
      success: true,
      message: "Documents fetched successfully",
      data: documents,
    });
  } catch (error) {
    console.error('getAllDocuments error:', error);
    throw new apiError(500, "Internal Server Error! try again after sometime.");
  }
});

// Get documents uploaded by the logged-in student
const getMyDocuments = asyncHandler(async (req, res) => {
  try {
    const documents = await Document.find({ owner: req.user._id })
      .populate('issuer', 'fullName username email')
      .populate('department', 'name shortCode')
      .sort({ createdAt: -1 });
    
    return res.status(200).json({
      success: true,
      message: "Documents fetched successfully",
      data: documents,
    });
  } catch (error) {
    console.error('getMyDocuments error:', error);
    throw new apiError(500, "Internal Server Error! try again after sometime.");
  }
});

// Reject a document (Issuer only)
const rejectDocument = asyncHandler(async (req, res) => {
  try {
    const { documentId } = req.params;
    const { reason } = req.body;
    
    const document = await Document.findById(documentId);
    
    if (!document) {
      throw new apiError(404, "Document not found");
    }
    
    if (document.status !== 'PENDING') {
      throw new apiError(400, "Document is not pending");
    }
    
    document.status = 'REJECTED';
    document.rejectionReason = reason || 'No reason provided';
    document.rejectedAt = new Date();
    document.issuer = req.user._id;
    await document.save();
    
    return res.status(200).json({
      success: true,
      message: "Document rejected successfully",
      data: document,
    });
  } catch (error) {
    throw new apiError(500, "Internal Server Error! try again after sometime.");
  }
});

export { 
  uploadDocument, 
  getPendingDocuments, 
  approveDocument, 
  verifyDocument,
  getAllDocuments,
  getMyDocuments,
  rejectDocument
};