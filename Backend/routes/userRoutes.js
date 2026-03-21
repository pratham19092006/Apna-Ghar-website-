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

// TEMPORARY DEBUG ROUTE - remove after fixing email issue
router.get("/test-smtp", async (req, res) => {
  const nodemailer = require("nodemailer");
  const host = process.env.EMAIL_SMTP_HOST;
  const user = process.env.EMAIL_SMTP_USER;
  const pass = process.env.EMAIL_SMTP_PASS;
  const port = Number(process.env.EMAIL_SMTP_PORT || 587);
  const secure = String(process.env.EMAIL_SMTP_SECURE || "false").toLowerCase() === "true";

  if (!host || !user || !pass) {
    return res.status(500).json({ ok: false, error: "Missing env vars", host: !!host, user: !!user, pass: !!pass });
  }

  try {
    const transporter = nodemailer.createTransport({ host, port, secure, auth: { user, pass } });
    await transporter.verify();
    return res.json({ ok: true, message: "SMTP connection successful!", host, port, user });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message, code: err.code, command: err.command, host, port, user });
  }
});

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