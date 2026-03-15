const express = require("express");
const { authMiddleware } = require("../middlewares/authMiddleware");
const {
	registerController,
	loginController,
	forgotPasswordController,
	getAllPropertiesController,
	authController,
	bookingHandleController,
	getAllBookingsController,
	requestPhoneOtpController,
	verifyPhoneOtpController,
} = require("../controllers/userController");

const router = express.Router();

router.post("/register", registerController);
router.post("/login", loginController);
router.post("/forgotpassword", forgotPasswordController);
router.get("/getAllProperties", getAllPropertiesController);
router.post("/getuserdata", authMiddleware, authController);
router.post("/request-phone-otp", authMiddleware, requestPhoneOtpController);
router.post("/verify-phone-otp", authMiddleware, verifyPhoneOtpController);
router.post("/bookinghandle/:propertyid", authMiddleware, bookingHandleController);
router.get("/getallbookings", authMiddleware, getAllBookingsController);

module.exports = router;