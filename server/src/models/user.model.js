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
    ethereumAddress: {
      type: String,
      lowercase: true,
      trim: true,
      unique: true,
      sparse: true, // Allows null values while maintaining uniqueness for non-null values
      validate: {
        validator: function(v) {
          // If provided, must be a valid Ethereum address (42 chars starting with 0x)
          if (!v) return true; // Allow empty for non-issuers
          return /^0x[a-fA-F0-9]{40}$/.test(v);
        },
        message: 'Invalid Ethereum address format'
      },
      required: function () {
        return this.userType === "ISSUER";
      },
    }
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
