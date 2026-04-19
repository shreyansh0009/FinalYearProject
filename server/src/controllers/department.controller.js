import { Department } from "../models/department.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";

const createDepartment = asyncHandler(async (req, res) => {
    const { name, shortCode } = req.body;

    if (!name || !shortCode) {
      throw new apiError(400, "Name and short code are required");
    }

    const existingDept = await Department.findOne({
      $or: [{ name }, { shortCode }],
    });

    if (existingDept) {
      throw new apiError(409, "Department with this name or code already exists");
    }

    const department = await Department.create({
      name,
      shortCode: shortCode.toUpperCase(),
    });

    return res.status(201).json(
      new apiResponse(201, department, "Department created successfully")
    );
});

const getAllDepartments = asyncHandler(async (req, res) => {
    const departments = await Department.find().sort({ createdAt: -1 });
    
    return res.status(200).json(
      new apiResponse(200, departments, "Departments fetched successfully")
    );
});

export { createDepartment, getAllDepartments }
