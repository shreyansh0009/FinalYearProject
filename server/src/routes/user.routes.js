import { Router } from "express";
import { registerIssuer, registerStudent, loginUser, logoutUser, refreshAccessToken, regrantIssuerRole } from "../controllers/user.controller.js";
import { verifyJwt, isAdmin, isIssuer } from "../middlewares/auth.middleware.js";


const router = Router();

// Public routes
router.route("/login").post(loginUser);

// Admin-only routes
router.route("/register-issuer").post(verifyJwt, isAdmin, registerIssuer);
router.route("/regrant-issuer-role").post(verifyJwt, isAdmin, regrantIssuerRole);

// Issuer-only routes
router.route("/register-student").post(verifyJwt, isIssuer, registerStudent);

// Protected routes (any authenticated user)
router.route("/logout").post(verifyJwt, logoutUser);
router.route("/refresh-accessToken").post(refreshAccessToken);




export default router;