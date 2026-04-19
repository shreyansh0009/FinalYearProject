import multer from "multer";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const tempDir = "./public/temp";

// Ensure the temporary directory exists
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
    console.log(`Created temporary directory: ${path.resolve(tempDir)}`);
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, tempDir);
    },
    filename: function (req, file, cb) {
        // Sanitize filename: use random UUID + original extension to prevent collisions and path traversal
        const ext = path.extname(file.originalname).toLowerCase();
        const safeName = crypto.randomUUID() + ext;
        cb(null, safeName);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png'
    ];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only PDF, JPG, and PNG files are allowed'), false);
    }
};

export const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    fileFilter,
});
