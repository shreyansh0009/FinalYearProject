import { Router } from "express";
import { registerUser, loginUser, logoutUser, refreshAccessToken } from "../controllers/user.controller.js";
import { verifyJwt } from "../middlewares/auth.middlewares.js";


const router = Router();

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);

// secured routes...
router.route("/logout").post(verifyJwt, logoutUser);
router.route("/refresh-accessToken").post(refreshAccessToken)




export default router;