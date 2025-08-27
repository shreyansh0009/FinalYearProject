import mongoose from "mongoose";

const departmentSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    shortCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      // "Computer Science & Engineering": "CSE"
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export const Department = mongoose.model("Department", departmentSchema);