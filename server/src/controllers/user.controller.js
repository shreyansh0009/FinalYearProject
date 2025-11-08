import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { User } from "../models/user.model.js";
import { adminContract } from "../utils/ethersService.js";
import jwt from "jsonwebtoken";
import { ethers } from "ethers";

const registerUser = asyncHandler(async (req, res) => {
  const { userName, email, fullName, password, userType, department, ethereumAddress } =
    req.body;

  // 2. Validate core fields
  const coreFields = [userName, email, fullName, password, userType];
  if (coreFields.some((field) => !field || field.trim() === "")) {
    throw new apiError(
      400,
      "Username, email, fullName, password, and userType are required"
    );
  }

  // Conditionally validate 'department'
  if (
    (userType === "STUDENT" || userType === "ISSUER") &&
    (!department || department.trim() === "")
  ) {
    throw new apiError(400, "Department is required for Students and Issuers");
  }

  // 4. --- NEW VALIDATION ---
  // If the user is an ISSUER, their Ethereum wallet address is mandatory
  if (
    userType === "ISSUER" &&
    (!ethereumAddress || !ethers.isAddress(ethereumAddress))
  ) {
    throw new apiError(
      400,
      "A valid Ethereum address is required for an Issuer"
    );
  }

  // Normalize inputs *before* querying
  const normalizedUsername = userName.toLowerCase();
  const normalizedEmail = email.toLowerCase();

  //iii. checking user exists or not?
  const isExists = await User.findOne({
    $or: [{ userName: normalizedUsername }, { email: normalizedEmail }],
  });
  if (isExists) {
    throw new apiError(409, "User already exists!");
  }

  //v. now creating user in database.
  const userToCreate = {
    fullName,
    email: normalizedEmail,
    password,
    username: normalizedUsername,
    userType,
    ethereumAddress: userType === "ISSUER" ? ethereumAddress : undefined,
  };

  // Only add department if it's provided and relevant
  if (userType !== "ADMIN" && department) {
    userToCreate.department = department;
  }

  // 7. --- NEW BLOCKCHAIN LOGIC ---
  if (userType === "ISSUER") {
    try {
      console.log(`Granting ISSUER role to ${ethereumAddress} on-chain...`);
      // Call the setIssuer function on the smart contract (address, true)
      const tx = await adminContract.setIssuer(ethereumAddress, true);
      await tx.wait(); // Wait for the transaction to be mined
      console.log(`Role granted. Transaction hash: ${tx.hash}`);
    } catch (onChainError) {
      console.error(
        "On-chain error while adding issuer:",
        onChainError.message
      );
      throw new apiError(
        500,
        "Failed to grant on-chain role. Database user not created."
      );
    }
  }

  const user = await User.create(userToCreate);

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

// User validation or login
const loginUser = asyncHandler(async (req, res) => {
  //1. getting data from body
  const { username, password } = req.body;

  //2. checking for empty fields...
  if ([username, password].some((field) => field?.trim() === "")) {
    throw new apiError(400, "Username and password are required!");
  }

  //3. finding user in database..
  const user = await User.findOne({ username }); // checking for both username or password
  if (!user) {
    throw new apiError(404, "User doesn't exists");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new apiError(401, "Invalid user credentials!");
  }

  //4. Generating Access Token
  const generateAccessAndRefreshToken = async (userId) => {
    try {
      const loggedInUser = await User.findById(userId);
      if (!loggedInUser) {
        throw new apiError(404, "User not found");
      }
      const accessToken = await loggedInUser.generateAccessToken();
      const refreshToken = await loggedInUser.generateRefreshToken();

      loggedInUser.refreshToken = refreshToken;
      await loggedInUser.save({ validateBeforeSave: false });
      return { accessToken, refreshToken };
    } catch (error) {
      throw new apiError(
        500,
        "Something went wrong while generating access and refresh token"
      );
    }
  };

  // we gonna use it many times, that why make a function
  //calling function..
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  // updating 'user' object after generating access and refresh token
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  //options for cookies
  const options = {
    // httpOnly: used for, client won't able to edit cookies in his browser, cookies can only editable from server
    httpOnly: true,
    secure: true,
  };

  return res
    .status(201)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new apiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged In successfully!"
      )
    );
});

// loging out user using middleware..
const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );
  const options = {
    // httpOnly: used for, client won't able to edit cookies in his browser, cookies can only editable from server
    httpOnly: true,
    secure: true,
  };
  return res
    .status(201)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new apiResponse(200, "User logged out successfully!"));
});

// Refreshing access token

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new apiError(401, "unauthorized request!!");
  }

  try {
    const decodedIncomingRefreshToken = jwt.verify(
      incomingRefreshToken,
      process.env.SECRET_REFRESH_TOKEN
    );
    if (!decodedIncomingRefreshToken) {
      throw new apiError(401, "Invalid Refresh Token!");
    }

    const user = await User.findById(decodedIncomingRefreshToken?._id);

    if (!user) {
      throw new apiError(401, "Invalid user!");
    }

    if (decodedIncomingRefreshToken !== user.refreshToken) {
      throw new apiError(401, "Token is invalid or may modified!");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshToken(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken)
      .cookie("refreshToken", newRefreshToken)
      .json(
        new apiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access Token Refreshed!"
        )
      );
  } catch (error) {
    throw new apiError(401, error?.message || "Something went wrong!");
  }
});

export { registerUser, loginUser, logoutUser, refreshAccessToken };
