import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true, // using 'index' for optimal serching
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },

    userType: {
      type: String,
      enum: ["STUDENT", "ISSUER", "ADMIN"],
      default: "STUDENT",
    },
    refreshToken: {
      type: String,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",

      // This field is only required if the user is an ISSUER or a STUDENT
      required: function () {
        return this.userType === "ISSUER" || this.userType === "STUDENT";
      },
    },
  },
  { timestamps: true }
);


// 1. Pre-save hook to hash the password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 15);
  next();
});

// 2. Method to check password validity
userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// 3.Methods to generate JWTs
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      userType: this.userType,
    },
    process.env.SECRET_ACCESS_TOKEN, // Make sure this variable name is correct
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.SECRET_REFRESH_TOKEN, 
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

export const User = mongoose.model("User", userSchema);
