import mongoose from "mongoose";

const connectDB = async () => {
  try {
    
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
