const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const UserModel = require("../models/UserSchema");
const PropertyModel = require("../models/PropertySchema");
const BookingModel = require("../models/BookingSchema");
const EmailVerificationModel = require("../models/EmailVerificationSchema");

const hashPassword = async (plainPassword) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainPassword, salt);
};

const formatServerError = (res, error) =>
  res.status(500).send({ success: false, message: `${error.message}` });

const EMAIL_OTP_EXPIRY_MINUTES = 10;
const EMAIL_OTP_COOLDOWN_SECONDS = 60;
const EMAIL_VERIFICATION_TOKEN_VALIDITY_MINUTES = 30;
const RENT_BOOKING_FEE_RUPEES = 50;

const normalizeEmail = (email = "") => String(email || "").trim().toLowerCase();

const isValidEmail = (email = "") =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ""));

const generateEmailOtp = () => String(Math.floor(100000 + Math.random() * 900000));

const hashOtp = (otp = "") =>
  crypto.createHash("sha256").update(String(otp)).digest("hex");

const getEmailTransporter = () => {
  const host = process.env.EMAIL_SMTP_HOST;
  const user = process.env.EMAIL_SMTP_USER;
  const pass = process.env.EMAIL_SMTP_PASS;
  const port = Number(process.env.EMAIL_SMTP_PORT || 587);
  const secure = String(process.env.EMAIL_SMTP_SECURE || "false").toLowerCase() === "true";

  if (!host || !user || !pass) {
    throw new Error(
      "Email SMTP is not configured. Set EMAIL_SMTP_HOST, EMAIL_SMTP_PORT, EMAIL_SMTP_USER, EMAIL_SMTP_PASS"
    );
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });
};

const sendEmailOtpMessage = async (email, otp) => {
  const transporter = getEmailTransporter();
  const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_SMTP_USER;

  await transporter.sendMail({
    from: fromEmail,
    to: email,
    subject: "ApnaGhar Email Verification OTP",
    text: `Your ApnaGhar OTP is ${otp}. It expires in ${EMAIL_OTP_EXPIRY_MINUTES} minutes.`,
    html: `<p>Your ApnaGhar OTP is <b>${otp}</b>.</p><p>It expires in ${EMAIL_OTP_EXPIRY_MINUTES} minutes.</p>`,
  });
};

const isValidPaymentIntentRef = (reference = "") =>
  /^[A-Za-z0-9_-]{10,80}$/.test(String(reference || "").trim());

const formatPhoneForOtp = (phone = "") => {
  const defaultCountryCode = process.env.OTP_DEFAULT_COUNTRY_CODE || "+91";
  const trimmedPhone = String(phone).trim();

  if (!trimmedPhone) {
    return "";
  }

  if (trimmedPhone.startsWith("+")) {
    return trimmedPhone;
  }

  const digitsOnly = trimmedPhone.replace(/\D/g, "");

  if (!digitsOnly) {
    return "";
  }

  if (digitsOnly.length === 10 && defaultCountryCode.startsWith("+")) {
    return `${defaultCountryCode}${digitsOnly}`;
  }

  return `+${digitsOnly}`;
};

const normalizeAccountType = (rawType = "") => {
  const normalizedType = String(rawType).trim().toLowerCase();

  if (normalizedType === "admin") return "admin";
  if (["user", "owner", "renter"].includes(normalizedType)) return "user";

  return "";
};

const requestEmailOtpController = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email || "");

    if (!isValidEmail(email)) {
      return res.status(400).send({
        success: false,
        message: "Please enter a valid email address",
      });
    }

    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(400).send({
        success: false,
        message: "Email is already registered",
      });
    }

    const existingVerification = await EmailVerificationModel.findOne({ email });
    if (existingVerification?.lastSentAt) {
      const secondsSinceLastSend = Math.floor(
        (Date.now() - new Date(existingVerification.lastSentAt).getTime()) / 1000
      );

      if (secondsSinceLastSend < EMAIL_OTP_COOLDOWN_SECONDS) {
        return res.status(429).send({
          success: false,
          message: `Please wait ${EMAIL_OTP_COOLDOWN_SECONDS - secondsSinceLastSend}s before requesting OTP again`,
        });
      }
    }

    const otp = generateEmailOtp();
    const expiresAt = new Date(Date.now() + EMAIL_OTP_EXPIRY_MINUTES * 60 * 1000);

    await EmailVerificationModel.findOneAndUpdate(
      { email },
      {
        email,
        otpHash: hashOtp(otp),
        expiresAt,
        verifiedAt: null,
        lastSentAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await sendEmailOtpMessage(email, otp);

    return res.status(200).send({
      success: true,
      message: "OTP sent to your email",
    });
  } catch (error) {
    console.error("[OTP ERROR]", error);
    return res.status(500).send({
      success: false,
      message: error.message || "Unknown error",
      errorCode: error.code || null,
      errorCommand: error.command || null,
    });
  }
};

const verifyEmailOtpController = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email || "");
    const otp = String(req.body.otp || "").trim();

    if (!isValidEmail(email)) {
      return res.status(400).send({
        success: false,
        message: "Please enter a valid email address",
      });
    }

    if (!otp) {
      return res.status(400).send({
        success: false,
        message: "OTP is required",
      });
    }

    const verificationRecord = await EmailVerificationModel.findOne({ email });
    if (!verificationRecord || !verificationRecord.otpHash || !verificationRecord.expiresAt) {
      return res.status(400).send({
        success: false,
        message: "Please request OTP first",
      });
    }

    if (new Date() > new Date(verificationRecord.expiresAt)) {
      return res.status(400).send({
        success: false,
        message: "OTP has expired. Please request a new OTP",
      });
    }

    if (hashOtp(otp) !== verificationRecord.otpHash) {
      return res.status(400).send({
        success: false,
        message: "Invalid OTP",
      });
    }

    verificationRecord.verifiedAt = new Date();
    verificationRecord.otpHash = null;
    verificationRecord.expiresAt = null;
    await verificationRecord.save();

    const emailVerificationToken = jwt.sign(
      {
        purpose: "register-email-verification",
        email,
      },
      process.env.JWT_KEY,
      { expiresIn: "30m" }
    );

    return res.status(200).send({
      success: true,
      message: "Email verified successfully",
      emailVerificationToken,
    });
  } catch (error) {
    console.log(error);
    return formatServerError(res, error);
  }
};

const registerController = async (req, res) => {
  try {
    const normalizedEmail = normalizeEmail(req.body.email || "");
    const providedPhone = formatPhoneForOtp(req.body.phone || "");
    const emailVerificationToken = String(req.body.emailVerificationToken || "").trim();

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).send({
        message: "Please enter a valid email address",
        success: false,
      });
    }

    if (!providedPhone) {
      return res.status(400).send({
        message: "Phone number is required",
        success: false,
      });
    }

    if (!emailVerificationToken) {
      return res.status(400).send({
        message: "Email verification is required",
        success: false,
      });
    }

    let decodedEmailToken;
    try {
      decodedEmailToken = jwt.verify(emailVerificationToken, process.env.JWT_KEY);
    } catch (tokenError) {
      return res.status(400).send({
        message: "Invalid or expired email verification token",
        success: false,
      });
    }

    if (
      decodedEmailToken?.purpose !== "register-email-verification" ||
      normalizeEmail(decodedEmailToken?.email || "") !== normalizedEmail
    ) {
      return res.status(400).send({
        message: "Email verification does not match the entered email",
        success: false,
      });
    }

    const verificationRecord = await EmailVerificationModel.findOne({ email: normalizedEmail });
    const verifiedAt = verificationRecord?.verifiedAt
      ? new Date(verificationRecord.verifiedAt).getTime()
      : 0;
    const verificationIsFresh =
      verifiedAt > 0 &&
      Date.now() - verifiedAt <= EMAIL_VERIFICATION_TOKEN_VALIDITY_MINUTES * 60 * 1000;

    if (!verificationIsFresh) {
      return res.status(400).send({
        message: "Please verify your email OTP again before registering",
        success: false,
      });
    }

    // Force account type to "user" for public registrations
    const accountType = "user";

    const existingUser = await UserModel.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res
        .status(200)
        .send({ message: "User already exists", success: false });
    }

    const encryptedPassword = await hashPassword(req.body.password);
    const accountPayload = {
      name: req.body.name,
      email: normalizedEmail,
      phone: providedPhone,
      emailVerified: true,
      type: accountType,
      password: encryptedPassword,
    };

    const createdUser = new UserModel(accountPayload);
    await createdUser.save();
    await EmailVerificationModel.deleteOne({ email: normalizedEmail });

    const authToken = jwt.sign({ id: createdUser._id }, process.env.JWT_KEY, {
      expiresIn: "1d",
    });

    createdUser.password = undefined;

    const isProduction = process.env.NODE_ENV === "production";

    res.cookie("token", authToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.status(201).send({ 
      message: "Register Success", 
      success: true,
      user: createdUser,
      token: authToken
    });
  } catch (error) {
    console.log(error);
    return formatServerError(res, error);
  }
};

const loginController = async (req, res) => {
  try {
    const matchedUser = await UserModel.findOne({ email: req.body.email });

    if (!matchedUser) {
      return res
        .status(200)
        .send({ message: "User not found", success: false });
    }

    const passwordMatches = await bcrypt.compare(
      req.body.password,
      matchedUser.password
    );

    if (!passwordMatches) {
      return res
        .status(200)
        .send({ message: "Invalid email or password", success: false });
    }

    const authToken = jwt.sign({ id: matchedUser._id }, process.env.JWT_KEY, {
      expiresIn: "1d",
    });

    matchedUser.password = undefined;

    const isProduction = process.env.NODE_ENV === "production";

    // Cross-site auth (frontend on Vercel, backend on Render) requires SameSite=None + Secure.
    res.cookie("token", authToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.status(200).send({
      message: "Login success successfully",
      success: true,
      user: matchedUser,
      token: authToken,
    });
  } catch (error) {
    console.log(error);
    return formatServerError(res, error);
  }
};

const forgotPasswordController = async (req, res) => {
  try {
    const { email, password } = req.body;
    const encryptedPassword = await hashPassword(password);

    const updatedUser = await UserModel.findOneAndUpdate(
      { email },
      { password: encryptedPassword },
      { new: true }
    );

    if (!updatedUser) {
      return res
        .status(200)
        .send({ message: "User not found", success: false });
    }

    await updatedUser.save();

    return res.status(200).send({
      message: "Password changed successfully",
      success: true,
    });
  } catch (error) {
    console.log(error);
    return formatServerError(res, error);
  }
};

const logoutController = async (req, res) => {
  try {
    const isProduction = process.env.NODE_ENV === "production";

    res.clearCookie("token", {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
    });

    return res.status(200).send({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.log(error);
    return formatServerError(res, error);
  }
};

const authController = async (req, res) => {
  try {
    const currentUser = await UserModel.findOne({ _id: req.body.userId });

    if (!currentUser) {
      return res
        .status(200)
        .send({ message: "user not found", success: false });
    }

    return res.status(200).send({
      success: true,
      data: currentUser,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send({ message: "auth error", success: false, error });
  }
};

const getAllPropertiesController = async (req, res) => {
  try {
    const properties = await PropertyModel.find({});

    if (!properties) {
      throw new Error("No properties available");
    }

    return res.status(200).send({ success: true, data: properties });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send({ message: "auth error", success: false, error });
  }
};

const createPhonePePaymentIntentController = async (req, res) => {
  const { propertyid } = req.params;
  const { userId } = req.body;

  try {
    const currentUser = await UserModel.findById(userId);

    if (!currentUser) {
      return res.status(404).send({
        success: false,
        message: "User not found",
      });
    }

    const property = await PropertyModel.findById(propertyid);

    if (!property) {
      return res.status(404).send({
        success: false,
        message: "Property not found",
      });
    }

    const isRentBooking =
      String(property.propertyAdType || "").trim().toLowerCase() === "rent";

    if (!isRentBooking) {
      return res.status(400).send({
        success: false,
        message: "Online booking payment is only required for rental homes",
      });
    }

    const isOwnProperty = property.ownerId?.toString() === userId;
    if (isOwnProperty) {
      return res.status(403).send({
        success: false,
        message: "You cannot book your own property",
      });
    }

    const upiId = String(process.env.PHONEPE_UPI_ID || "").trim();
    const merchantName = String(process.env.PHONEPE_MERCHANT_NAME || "ApnaGhar").trim();

    if (!upiId) {
      return res.status(500).send({
        success: false,
        message: "PhonePe UPI is not configured. Set PHONEPE_UPI_ID in backend env",
      });
    }

    const transactionRef = `AGHAR${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const note = "Booking confirmation charges";
    const upiUrl =
      `upi://pay?pa=${encodeURIComponent(upiId)}` +
      `&pn=${encodeURIComponent(merchantName)}` +
      `&tr=${encodeURIComponent(transactionRef)}` +
      `&tn=${encodeURIComponent(note)}` +
      `&am=${encodeURIComponent(RENT_BOOKING_FEE_RUPEES.toFixed(2))}` +
      `&cu=INR`;

    return res.status(200).send({
      success: true,
      message: "PhonePe payment intent created",
      paymentMethod: "phonepe",
      upiUrl,
      upiId,
      merchantName,
      transactionRef,
      bookingFeeInRupees: RENT_BOOKING_FEE_RUPEES,
      refundPolicyNote:
        "If the home is not finally rented, this minimal booking amount will be refunded",
    });
  } catch (error) {
    console.error("Error creating PhonePe payment intent:", error);
    return formatServerError(res, error);
  }
};

const bookingHandleController = async (req, res) => {
  const { propertyid } = req.params;
  const {
    userDetails,
    status,
    userId,
    bookingFeeAccepted,
    paymentMethod,
    paymentIntentRef,
  } = req.body;

  try {
    const currentUser = await UserModel.findById(userId);

    if (!currentUser) {
      return res
        .status(404)
        .send({ success: false, message: "User not found" });
    }

    const fullName = String(userDetails?.fullName || "").trim();
    const address = String(userDetails?.address || "").trim();
    const phone = String(userDetails?.phone || "").trim();
    const memberCount = Number(userDetails?.memberCount);
    const femaleCount = Number(userDetails?.femaleCount);
    const maleCount = Number(userDetails?.maleCount);

    if (!fullName || !address || !phone) {
      return res.status(400).send({
        success: false,
        message: "Full name, address, and phone number are required",
      });
    }

    const hasInvalidMembers =
      Number.isNaN(memberCount) ||
      Number.isNaN(femaleCount) ||
      Number.isNaN(maleCount) ||
      memberCount <= 0 ||
      femaleCount < 0 ||
      maleCount < 0;

    if (hasInvalidMembers) {
      return res.status(400).send({
        success: false,
        message: "Please provide valid member counts",
      });
    }

    if (femaleCount + maleCount !== memberCount) {
      return res.status(400).send({
        success: false,
        message: "Female and male members must equal total members",
      });
    }

    const property = await PropertyModel.findById(propertyid);

    if (!property) {
      return res
        .status(404)
        .send({ success: false, message: "Property not found" });
    }

    const isRentBooking =
      String(property.propertyAdType || "").trim().toLowerCase() === "rent";

    if (isRentBooking && bookingFeeAccepted !== true) {
      return res.status(400).send({
        success: false,
        message:
          `To book a rental home, please accept the Rs ${RENT_BOOKING_FEE_RUPEES} booking amount with refund policy note`,
      });
    }

    if (isRentBooking) {
      const normalizedMethod = String(paymentMethod || "").trim().toLowerCase();
      const normalizedIntentRef = String(paymentIntentRef || "").trim();

      if (normalizedMethod !== "phonepe") {
        return res.status(400).send({
          success: false,
          message: "Please complete payment using PhonePe to book this rental home",
        });
      }

      if (!isValidPaymentIntentRef(normalizedIntentRef)) {
        return res.status(400).send({
          success: false,
          message: "Please initiate payment in PhonePe before booking",
        });
      }
    }

    const isOwnProperty = property.ownerId?.toString() === userId;

    if (isOwnProperty) {
      return res.status(403).send({
        success: false,
        message: "You cannot book your own property",
      });
    }

    const bookingEntry = new BookingModel({
      propertyId: propertyid,
      userID: userId,
      ownerID: property.ownerId,
      userName: fullName,
      address,
      phone,
      memberCount,
      femaleCount,
      maleCount,
      bookingStatus: status,
      bookingFeeAmount: isRentBooking ? RENT_BOOKING_FEE_RUPEES : 0,
      bookingFeeStatus: isRentBooking
        ? "payment_initiated_user_confirmation_pending"
        : "not-applicable",
      refundPolicyNote: isRentBooking
        ? "If the home is not finally rented, this minimal booking amount will be refunded"
        : "",
      paymentMethod: isRentBooking ? "phonepe" : "",
      paymentReference: "",
      paymentIntentRef: isRentBooking ? String(paymentIntentRef || "").trim() : "",
      paymentVerified: false,
    });

    await bookingEntry.save();

    return res
      .status(200)
      .send({ success: true, message: "Booking status updated" });
  } catch (error) {
    console.error("Error handling booking:", error);
    return res
      .status(500)
      .send({ success: false, message: "Error handling booking" });
  }
};

const getAllBookingsController = async (req, res) => {
  const { userId } = req.body;

  try {
    const allBookings = await BookingModel.find();
    const userBookings = allBookings.filter(
      (booking) => booking.userID.toString() === userId
    );

    return res.status(200).send({
      success: true,
      data: userBookings,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .send({ message: "Internal server error", success: false });
  }
};

module.exports = {
  requestEmailOtpController,
  verifyEmailOtpController,
  registerController,
  loginController,
  forgotPasswordController,
  logoutController,
  authController,
  getAllPropertiesController,
  createPhonePePaymentIntentController,
  bookingHandleController,
  getAllBookingsController,
};
