import multer from "multer";
import fs from "fs";
import path from "path";

const tempDir = "./public/temp";

// Ensure the temporary directory exists
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
    console.log(`Created temporary directory: ${path.resolve(tempDir)}`);
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, tempDir); // Use the constant
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

export const upload = multer({ storage });