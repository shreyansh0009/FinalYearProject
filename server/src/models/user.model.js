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
      index: true, // use 'index' for optimal serching
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

export const User = mongoose.model("User", userSchema);
