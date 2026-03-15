const express = require("express");
const { authMiddleware } = require("../middlewares/authMiddleware");
const {
	requestEmailOtpController,
	verifyEmailOtpController,
	registerController,
	loginController,
	forgotPasswordController,
	logoutController,
	getAllPropertiesController,
	createPhonePePaymentIntentController,
	authController,
	bookingHandleController,
	getAllBookingsController,
} = require("../controllers/userController");

const router = express.Router();

router.post("/request-email-otp", requestEmailOtpController);
router.post("/verify-email-otp", verifyEmailOtpController);
router.post("/register", registerController);
router.post("/login", loginController);
router.post("/forgotpassword", forgotPasswordController);
router.post("/logout", logoutController);
router.get("/getAllProperties", getAllPropertiesController);
router.post("/getuserdata", authMiddleware, authController);
router.post(
	"/create-phonepe-payment-intent/:propertyid",
	authMiddleware,
	createPhonePePaymentIntentController
);
router.post("/bookinghandle/:propertyid", authMiddleware, bookingHandleController);
router.get("/getallbookings", authMiddleware, getAllBookingsController);

module.exports = router;