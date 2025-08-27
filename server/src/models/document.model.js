import mongoose from 'mongoose';

const documentSchema = mongoose.Schema({
    
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

   
    department: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        required: true
    },

    issuer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    documentName: {
        type: String,
        required: true,
        trim: true
    },

    storageUrl: {
        type: String,
        required: true
    },

    documentHash: {
        type: String,
        required: true,
        unique: true,
        index: true
    },

    status: {
        type: String,
        required: true,
        enum: ['PENDING', 'ISSUED', 'REJECTED'],
        default: 'PENDING'
    }
}, { timestamps: true });

export const Document = mongoose.model("Document", documentSchema);