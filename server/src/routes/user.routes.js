import { Router } from "express";
import { 
  registerIssuer, 
  registerStudent, 
  loginUser, 
  logoutUser, 
  refreshAccessToken, 
  regrantIssuerRole,
  getAllUsers,
  getMyStudents,
  getDepartmentStudents,
  getCurrentUser
} from "../controllers/user.controller.js";
import { verifyJwt, isAdmin, isIssuer } from "../middlewares/auth.middleware.js";


const router = Router();

// Public routes
router.route("/login").post(loginUser);

// Admin-only routes
router.route("/register-issuer").post(verifyJwt, isAdmin, registerIssuer);
router.route("/regrant-issuer-role").post(verifyJwt, isAdmin, regrantIssuerRole);
router.route("/all").get(verifyJwt, isAdmin, getAllUsers);

// Issuer-only routes
router.route("/register-student").post(verifyJwt, isIssuer, registerStudent);
router.route("/my-students").get(verifyJwt, isIssuer, getMyStudents);
router.route("/department-students").get(verifyJwt, isIssuer, getDepartmentStudents);

// Protected routes (any authenticated user)
router.route("/current").get(verifyJwt, getCurrentUser);
router.route("/logout").post(verifyJwt, logoutUser);
router.route("/refresh-accessToken").post(refreshAccessToken);




export default router;