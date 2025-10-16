import { Router } from "express";
import { createDepartment } from "../controllers/department.controller.js";

const router = Router();

router.route("/createDept").post(createDepartment);

export default router;