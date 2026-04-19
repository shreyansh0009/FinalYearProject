import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { apiError } from './utils/apiError.js'

const app = express()
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true
}))

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

// --- ROUTES IMPORT ---
import userRouter from './routes/user.routes.js'
import departmentRouter from './routes/department.routes.js';
import documentRouter from './routes/document.route.js';
import voiceAgentRouter from './routes/voiceAgent.route.js';

// --- ROUTES DECLARATION ---
app.use("/api/v1/users", userRouter)
app.use("/api/v1/departments", departmentRouter)
app.use("/api/v1/documents", documentRouter);
app.use("/api/v1/voice", voiceAgentRouter);

// --- GLOBAL ERROR HANDLER ---
app.use((err, req, res, next) => {
    // If error is an apiError, use its status code and message
    if (err instanceof apiError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            errors: err.errors,
        });
    }

    // Handle multer file size error
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
            success: false,
            message: 'File too large. Maximum size is 10MB.',
        });
    }

    // Handle multer type error
    if (err.message && err.message.includes('Only PDF, JPG, and PNG files are allowed')) {
        return res.status(400).json({
            success: false,
            message: 'Only PDF, JPG, and PNG files are allowed',
        });
    }

    // Log unexpected errors but don't leak stack traces to client
    console.error('Unhandled error:', err);
    return res.status(500).json({
        success: false,
        message: 'Internal Server Error',
    });
});

export { app }
