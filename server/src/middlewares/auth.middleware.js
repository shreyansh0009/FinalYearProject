import { apiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";



export const verifyJwt = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new apiError(401, "Unauthorized request!");
    }

    const decodedToken = jwt.verify(token, process.env.SECRET_ACCESS_TOKEN);

    if (!decodedToken) {
      throw new apiError(401, "Unable to verify token");
    }

    const user = await User.findById(decodedToken._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      throw new apiError(401, "Invalid Access Token");
    }

    req.user = user;
    next();
  } catch (error) {
    throw new apiError(401, error?.message || "Invalid Token");
  }
});

export const isIssuer = (req, res, next) => {
    if (req.user?.userType !== "ISSUER") {
        return res.status(403).json({ message: "Access denied. Issuer role required." });
    }
    next();
};

export const isAdmin = (req, res, next) => {
    if (req.user?.userType !== "ADMIN") {
        return res.status(403).json({ message: "Access denied. Admin role required." });
    }
    next();
};
