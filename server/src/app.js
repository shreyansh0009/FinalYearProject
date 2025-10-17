import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

const app = express()
app.use(cors({
    origin: process.env.CORS_PORT   
}))

app.use(express.json({limit: "16kb"})) 
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

// --- ROUTES IMPORT ---
import userRouter from './routes/user.routes.js'
import departmentRouter from './routes/department.routes.js';
import documentRouter from './routes/document.routes.js';

// --- ROUTES DECLARATION ---
app.use("/api/v1/users", userRouter)
app.use("/api/v1/departments", departmentRouter)
app.use("/api/v1/documents", documentRouter);



export { app }