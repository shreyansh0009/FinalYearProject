import { Department } from "../models/department.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";

const createDepartment = asyncHandler(async (req, res) => {
  try {
    const { name, shortCode } = req.body;

    if (!name || !shortCode) {
      return res
        .status(400)
        .json({ message: "Name and short code are required" });
    }

    const existingDept = await Department.findOne({
      $or: [{ name }, { shortCode }],
    });

    if (existingDept) {
      return res
        .status(409)
        .json({ message: "Department with this name or code already exists" });
    }

    const department = await Department.create({
      name,
      shortCode: shortCode.toUpperCase(),
      // createdBy: req.user._id // We'll add this later when the admin is logged in
    });

    return res.status(201).json({
      message: "Department created successfully",
      department,
    });
  } catch (error) {
    throw new apiError(500, "Internal Server Error! try again after sometime.");
  }
});


export { createDepartment }
