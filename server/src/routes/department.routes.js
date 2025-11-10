import { Router } from "express";
import { createDepartment, getAllDepartments } from "../controllers/department.controller.js";
import { verifyJwt, isAdmin } from "../middlewares/auth.middleware.js";

const router = Router();

// Admin-only routes
router.route("/createDept").post(verifyJwt, isAdmin, createDepartment);
router.route("/").get(verifyJwt, getAllDepartments); // Get all departments

export default router;