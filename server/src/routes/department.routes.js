import { Router } from "express";
import { createDepartment } from "../controllers/department.controller.js";
import { verifyJwt, isAdmin } from "../middlewares/auth.middleware.js";

const router = Router();

// Admin-only route - create department
router.route("/createDept").post(verifyJwt, isAdmin, createDepartment);

export default router;