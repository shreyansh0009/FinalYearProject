import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";

const registerUser = asyncHandler(async (req, res) => {
  const { userName, email, fullName, password, userType, department } =
    req.body;

  //2nd approach, best approach, checking for empty fields
  if (
    [userName, email, fullName, password].some((field) => field?.trim() === "")
  ) {
    throw new apiError(400, "All fields are required and cannot be empty!");
  }

  //iii. checking user exists or not?
  const isExists = await User.findOne({ $or: [{ userName }, { email }] });
  if (isExists) {
    throw new apiError(409, "User already exists!");
  }

  //v. now creating user in database.
  const user = await User.create({
    fullName,
    email,
    password,
    username: userName.toLowerCase(),
    userType,
    department,
  });

  //iv. validating user created or not?
  //iv. validating user created or not?
  const createdUser = await User.findById(user._id)
    .populate("department") 
    .select("-password -refreshToken");

  if (!createdUser) {
    throw new apiError(500, "Something went wrong while registering the user");
  }

  res.status(201).json({
    success: true,
    message: "User Registered successfully",
    data: createdUser,
  });
});

export { registerUser };
