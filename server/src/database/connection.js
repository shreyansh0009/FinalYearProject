import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config({
  path: "../.env"
});

const connectDB = async () => {
  try {
    console.log(process.env.MONGODB_URI);
    
    const connectionData = await mongoose.connect(process.env.MONGODB_URI);
    console.log(
      `MongoDB connected !! DB Host: ${connectionData.connection.host}`
    );

  } catch (error) {
    console.log("Mongoose connection error: ", error);
    process.exit(1);
  }
};

export default connectDB;
