import dotenv from "dotenv";
dotenv.config({path: "../.env"});
import connectDB from "./database/connection.js";
import { app } from "./app.js";

connectDB()
  .then(() => {
    app.on("error", (err) => {
      console.log("Error: ", err);
      throw err;
    });
    app.listen(process.env.PORT || 8000, () => {
      console.log(`⚙️ Server is listning on port: ${process.env.PORT}`);
    });
    app.get("/", (req, res) => {
      try {
        res.send("Database Connected!!");
      } catch (error) {
        console.log(error);
      }
    });
  })
  .catch((err) => {
    console.log("Mongo connection failed! ", err);
  });
