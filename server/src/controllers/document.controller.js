import { uploadFile } from "../utils/fileUpload.js";
import { Document } from "../models/document.model.js";
import { User } from "../models/user.model.js";
import crypto from "crypto";
import fs from "fs";
import mongoose from "mongoose";
import QRCode from "qrcode";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { adminContract, publicContract } from "../utils/ethersService.js";
import { ethers } from "ethers";
import { sendDocumentIssuedEmail, sendDocumentRejectedEmail } from "../utils/emailService.js";
import { triggerVoiceNotification } from "../utils/voiceNotification.js";


const uploadDocument = asyncHandler(async (req, res) => {

    try {
        // 1. Geting the local file path from Multer
        const documentLocalPath = req.file?.path;

        if (!documentLocalPath) {
            throw new apiError(400, "Document file is required");
        }

        // 2. Calculating the document's hash (SHA-256)
        const fileBuffer = fs.readFileSync(documentLocalPath);
        const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

        // 3. Check if a document with this hash already exists
        const existingDocument = await Document.findOne({ documentHash: hash });
        if (existingDocument) {
            // Allow re-upload only if the previous attempt was REJECTED
            if (existingDocument.status !== 'REJECTED') {
                fs.unlinkSync(documentLocalPath);
                throw new apiError(409, "This exact document has already been uploaded.");
            }
            // Delete the old rejected record so the new upload can proceed
            await Document.findByIdAndDelete(existingDocument._id);
        }

        // 4. Upload the file to Cloudinary
        const cloudinaryResponse = await uploadFile(documentLocalPath);
        if (!cloudinaryResponse) {
            throw new apiError(500, "Failed to upload document to cloud storage.");
        }

        // 5. Create the document record in the database
        const document = await Document.create({
            documentName: req.file.originalname,
            documentType: req.body.documentType || undefined,
            storageUrl: cloudinaryResponse.secure_url,
            documentHash: hash,
            owner: req.user._id,
            department: req.user.department,
        });

        return res.status(201).json(
            new apiResponse(201, document, "Document uploaded successfully and is pending verification.")
        );

    } catch (error) {
        if (error instanceof apiError) throw error;
        console.error("Error uploading document:", error);
        throw new apiError(500, "Internal server error during document upload.");
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
    return res.status(200).json(
        new apiResponse(200, pendingDocuments, "Pending documents fetched successfully")
    );
});



const approveDocument = asyncHandler(async (req, res) => {
    // 1. Get the document ID from the URL parameters
    const { documentId } = req.params;

    if (!documentId || !mongoose.Types.ObjectId.isValid(documentId)) {
        throw new apiError(400, "Valid Document ID is required");
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

    let txHash;
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
        txHash = tx.hash;

        console.log(`Document hash issued. Transaction: ${txHash}`);
    } catch (onChainError) {
        console.error("On-chain error while issuing document:", onChainError.message);
        throw new apiError(500, onChainError.message || "Failed to issue document on-chain.");
    }

    // 6. Generate QR code pointing to the public verification page
    const verifyUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/verify?hash=${document.documentHash}`;
    let qrCodeUrl = null;
    try {
        qrCodeUrl = await QRCode.toDataURL(verifyUrl);
    } catch (qrError) {
        console.error("QR code generation failed (non-fatal):", qrError.message);
    }

    // 7. Update the document
    document.status = "ISSUED";
    document.issuer = issuerId;
    document.issuedAt = new Date();
    document.transactionHash = txHash;
    if (qrCodeUrl) document.qrCodeUrl = qrCodeUrl;

    const updatedDocument = await document.save({ validateBeforeSave: true });

    // 8. Send email notification to student (non-fatal if it fails)
    try {
        const populatedDoc = await Document.findById(updatedDocument._id)
            .populate("owner", "fullName email")
            .populate("issuer", "fullName")
            .populate("department", "name");
        if (populatedDoc?.owner?.email) {
            await sendDocumentIssuedEmail({
                toEmail: populatedDoc.owner.email,
                studentName: populatedDoc.owner.fullName,
                documentName: populatedDoc.documentName,
                issuedBy: populatedDoc.issuer?.fullName || "Issuing Authority",
                department: populatedDoc.department?.name || "N/A",
                verifyUrl,
            });
        }
    } catch (emailError) {
        console.error("Email notification failed (non-fatal):", emailError.message);
    }

    // Voice notification (non-fatal)
    try {
        const owner = await User.findById(document.owner).select("phone fullName");
        if (owner?.phone) {
            triggerVoiceNotification({
                phone: owner.phone,
                studentName: owner.fullName,
                documentName: document.documentName,
                status: "APPROVED",
            });
        }
    } catch (voiceError) {
        console.error("Voice notification failed (non-fatal):", voiceError.message);
    }

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
    let issuerAddress;
    try {
        console.log(`Verifying hash on-chain: ${hashBytes32}`);
        // verifyDocument returns the issuer's address, or address(0) if not found/revoked
        issuerAddress = await publicContract.verifyDocument(hashBytes32);
        console.log(`On-chain result: ${issuerAddress}`);
    } catch (error) {
        console.error("On-chain verification error:", error.message);
        throw new apiError(500, "Error while communicating with the blockchain.");
    }

    // 2. If the returned address is the zero address, the document is not on the blockchain.
    if (!issuerAddress || issuerAddress === ethers.ZeroAddress) {
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

    // Document is verified and issued (query already filters by ISSUED status)
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
            "Document is authentic and verified!"
        )
    );
});

// Get all documents (Admin only)
const getAllDocuments = asyncHandler(async (req, res) => {
    const documents = await Document.find()
      .populate('owner', 'fullName username email')
      .populate('issuer', 'fullName username email')
      .populate('department', 'name shortCode')
      .sort({ createdAt: -1 });
    
    return res.status(200).json(
      new apiResponse(200, documents, "Documents fetched successfully")
    );
});

// Get documents uploaded by the logged-in student
const getMyDocuments = asyncHandler(async (req, res) => {
    const documents = await Document.find({ owner: req.user._id })
      .populate('issuer', 'fullName username email')
      .populate('department', 'name shortCode')
      .sort({ createdAt: -1 });
    
    return res.status(200).json(
      new apiResponse(200, documents, "Documents fetched successfully")
    );
});

// Reject a document (Issuer only)
const rejectDocument = asyncHandler(async (req, res) => {
  try {
    const { documentId } = req.params;
    const { reason } = req.body;

    if (!documentId || !mongoose.Types.ObjectId.isValid(documentId)) {
      throw new apiError(400, "Valid Document ID is required");
    }

    const document = await Document.findById(documentId);
    
    if (!document) {
      throw new apiError(404, "Document not found");
    }
    
    if (document.status !== 'PENDING') {
      throw new apiError(400, "Document is not pending");
    }
    
    // Security Check: Ensure the issuer is from the SAME department as the document
    if (document.department.toString() !== req.user.department.toString()) {
      throw new apiError(403, "Forbidden: You are not authorized to reject documents for this department.");
    }
    
    document.status = 'REJECTED';
    document.rejectionReason = reason || 'No reason provided';
    document.rejectedAt = new Date();
    document.issuer = req.user._id;
    await document.save();

    // Send email notification to student (non-fatal if it fails)
    try {
        const populatedDoc = await Document.findById(document._id).populate("owner", "fullName email");
        if (populatedDoc?.owner?.email) {
            await sendDocumentRejectedEmail({
                toEmail: populatedDoc.owner.email,
                studentName: populatedDoc.owner.fullName,
                documentName: document.documentName,
                rejectionReason: document.rejectionReason,
            });
        }
    } catch (emailError) {
        console.error("Email notification failed (non-fatal):", emailError.message);
    }

    // Voice notification (non-fatal)
    try {
        const owner = await User.findById(document.owner).select("phone fullName");
        if (owner?.phone) {
            triggerVoiceNotification({
                phone: owner.phone,
                studentName: owner.fullName,
                documentName: document.documentName,
                status: "REJECTED",
                reason: document.rejectionReason,
            });
        }
    } catch (voiceError) {
        console.error("Voice notification failed (non-fatal):", voiceError.message);
    }

    return res.status(200).json(
      new apiResponse(200, document, "Document rejected successfully")
    );
  } catch (error) {
    if (error instanceof apiError) throw error;
    throw new apiError(500, "Internal Server Error! try again after sometime.");
  }
});

// Confirm DB after issuer signs issueDocument() directly from their wallet (Wagmi flow)
const approveDocumentDirect = asyncHandler(async (req, res) => {
    const { documentId } = req.params;
    const { txHash } = req.body;

    if (!documentId || !mongoose.Types.ObjectId.isValid(documentId)) {
        throw new apiError(400, "Valid Document ID is required");
    }
    if (!txHash) {
        throw new apiError(400, "Transaction hash is required");
    }

    const issuerId = req.user._id;
    const issuerDepartment = req.user.department;
    const issuerEthAddress = req.user.ethereumAddress;

    if (!issuerEthAddress) {
        throw new apiError(400, "Issuer account does not have an Ethereum address linked.");
    }

    const document = await Document.findById(documentId);
    if (!document) {
        throw new apiError(404, "Document not found");
    }

    if (document.department.toString() !== issuerDepartment.toString()) {
        throw new apiError(403, "Forbidden: You are not authorized to approve documents for this department.");
    }

    if (document.status === "ISSUED") {
        throw new apiError(400, "This document has already been issued.");
    }

    // Re-verify on blockchain: check the document was actually issued and by the correct issuer
    const hashBytes32 = "0x" + document.documentHash;
    let onChainIssuer;
    try {
        onChainIssuer = await publicContract.verifyDocument(hashBytes32);
    } catch (err) {
        throw new apiError(500, "Failed to verify document on blockchain.");
    }

    if (!onChainIssuer || onChainIssuer === ethers.ZeroAddress) {
        throw new apiError(400, "Document not found on blockchain. The transaction may not be confirmed yet — please wait a moment and try again.");
    }

    if (onChainIssuer.toLowerCase() !== issuerEthAddress.toLowerCase()) {
        throw new apiError(403, "On-chain issuer address does not match your registered Ethereum address.");
    }

    // Generate QR code
    const verifyUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/verify?hash=${document.documentHash}`;
    let qrCodeUrl = null;
    try {
        qrCodeUrl = await QRCode.toDataURL(verifyUrl);
    } catch (qrError) {
        console.error("QR code generation failed (non-fatal):", qrError.message);
    }

    // Update DB
    document.status = "ISSUED";
    document.issuer = issuerId;
    document.issuedAt = new Date();
    document.transactionHash = txHash;
    if (qrCodeUrl) document.qrCodeUrl = qrCodeUrl;

    const updatedDocument = await document.save({ validateBeforeSave: true });

    // Send email (non-fatal)
    try {
        const populatedDoc = await Document.findById(updatedDocument._id)
            .populate("owner", "fullName email")
            .populate("issuer", "fullName")
            .populate("department", "name");
        if (populatedDoc?.owner?.email) {
            await sendDocumentIssuedEmail({
                toEmail: populatedDoc.owner.email,
                studentName: populatedDoc.owner.fullName,
                documentName: populatedDoc.documentName,
                issuedBy: populatedDoc.issuer?.fullName || "Issuing Authority",
                department: populatedDoc.department?.name || "N/A",
                verifyUrl,
            });
        }
    } catch (emailError) {
        console.error("Email notification failed (non-fatal):", emailError.message);
    }

    return res.status(200).json(
        new apiResponse(200, updatedDocument, "Document confirmed and updated in database")
    );
});

// Revoke an issued document (Admin only)
const revokeDocumentAdmin = asyncHandler(async (req, res) => {
    const { documentId } = req.params;

    if (!documentId || !mongoose.Types.ObjectId.isValid(documentId)) {
        throw new apiError(400, "Valid Document ID is required");
    }

    const document = await Document.findById(documentId);
    if (!document) {
        throw new apiError(404, "Document not found");
    }

    if (document.status !== "ISSUED") {
        throw new apiError(400, "Only issued documents can be revoked");
    }

    const hashBytes32 = "0x" + document.documentHash;

    try {
        console.log(`Revoking document hash ${hashBytes32} on-chain...`);
        const tx = await adminContract.revokeDocument(hashBytes32);
        await tx.wait();
        console.log(`Document revoked on-chain. Transaction: ${tx.hash}`);
    } catch (onChainError) {
        console.error("On-chain revocation error:", onChainError.message);
        throw new apiError(500, onChainError.message || "Failed to revoke document on-chain.");
    }

    document.status = "REVOKED";
    document.revokedAt = new Date();
    await document.save();

    return res.status(200).json(
        new apiResponse(200, document, "Document revoked successfully on-chain and in database")
    );
});

// Get analytics data (Admin only)
const getAnalytics = asyncHandler(async (req, res) => {
    // Status breakdown (pie chart)
    const statusBreakdown = await Document.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    // Documents per department (bar chart)
    const perDepartment = await Document.aggregate([
        { $match: { status: "ISSUED" } },
        { $group: { _id: "$department", count: { $sum: 1 } } },
        {
            $lookup: {
                from: "departments",
                localField: "_id",
                foreignField: "_id",
                as: "dept"
            }
        },
        { $unwind: { path: "$dept", preserveNullAndEmptyArrays: true } },
        {
            $project: {
                _id: 1,
                count: 1,
                name: { $ifNull: ["$dept.name", "Unknown"] }
            }
        },
        { $sort: { count: -1 } }
    ]);

    // Monthly issuance trend — last 6 months (line chart)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const monthlyTrend = await Document.aggregate([
        { $match: { status: "ISSUED", issuedAt: { $gte: sixMonthsAgo } } },
        {
            $group: {
                _id: {
                    year: { $year: "$issuedAt" },
                    month: { $month: "$issuedAt" }
                },
                count: { $sum: 1 }
            }
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    // Total counts
    const [totalDocuments, totalUsers, totalDepartments] = await Promise.all([
        Document.countDocuments(),
        mongoose.model("User").countDocuments(),
        mongoose.model("Department").countDocuments(),
    ]);

    return res.status(200).json(
        new apiResponse(200, {
            statusBreakdown,
            perDepartment,
            monthlyTrend,
            totals: { totalDocuments, totalUsers, totalDepartments }
        }, "Analytics fetched successfully")
    );
});

export {
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
};