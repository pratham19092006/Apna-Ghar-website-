const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const UserModel = require("../models/UserSchema");
const PropertyModel = require("../models/PropertySchema");
const BookingModel = require("../models/BookingSchema");

const hashPassword = async (plainPassword) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainPassword, salt);
};

const formatServerError = (res, error) =>
  res.status(500).send({ success: false, message: `${error.message}` });

const generateOtpCode = () => String(Math.floor(1000 + Math.random() * 9000));

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

const registerController = async (req, res) => {
  try {
    if (!req.body.phone || !String(req.body.phone).trim()) {
      return res.status(400).send({
        message: "Phone number is required",
        success: false,
      });
    }

    const accountType = normalizeAccountType(req.body.type);

    if (!accountType) {
      return res.status(400).send({
        message: "Invalid account type. Allowed values are user or admin",
        success: false,
      });
    }

    const existingUser = await UserModel.findOne({ email: req.body.email });

    if (existingUser) {
      return res
        .status(200)
        .send({ message: "User already exists", success: false });
    }

    const encryptedPassword = await hashPassword(req.body.password);
    const accountPayload = {
      ...req.body,
      type: accountType,
      password: encryptedPassword,
    };

    const createdUser = new UserModel(accountPayload);
    await createdUser.save();

    return res.status(201).send({ message: "Register Success", success: true });
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

const bookingHandleController = async (req, res) => {
  const { propertyid } = req.params;
  const { userDetails, status, userId } = req.body;

  try {
    const currentUser = await UserModel.findById(userId);

    if (!currentUser) {
      return res
        .status(404)
        .send({ success: false, message: "User not found" });
    }

    if (!currentUser.phoneVerified) {
      return res.status(403).send({
        success: false,
        message: "Please verify your phone number with OTP before booking",
      });
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

const requestPhoneOtpController = async (req, res) => {
  const { userId, phone } = req.body;

  try {
    const currentUser = await UserModel.findById(userId);

    if (!currentUser) {
      return res
        .status(404)
        .send({ success: false, message: "User not found" });
    }

    const normalizedPhone = formatPhoneForOtp(phone || currentUser.phone || "");

    if (!normalizedPhone) {
      return res.status(400).send({
        success: false,
        message: "Please provide a valid phone number",
      });
    }

    currentUser.phone = normalizedPhone;
    currentUser.phoneVerified = false;
    currentUser.phoneOtpCode = generateOtpCode();
    currentUser.phoneOtpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await currentUser.save();

    console.log(`Demo OTP for ${normalizedPhone}: ${currentUser.phoneOtpCode}`);

    return res.status(200).send({
      success: true,
      message: "OTP generated successfully",
      demoOtp: currentUser.phoneOtpCode,
      isDemoMode: true,
    });
  } catch (error) {
    console.log(error);
    return formatServerError(res, error);
  }
};

const verifyPhoneOtpController = async (req, res) => {
  const { userId, otp } = req.body;

  try {
    const currentUser = await UserModel.findById(userId);

    if (!currentUser) {
      return res
        .status(404)
        .send({ success: false, message: "User not found" });
    }

    if (!currentUser.phone) {
      return res.status(400).send({
        success: false,
        message: "Phone number missing. Please request OTP first",
      });
    }

    const otpCode = String(otp || "").trim();

    if (!otpCode) {
      return res.status(400).send({
        success: false,
        message: "OTP is required",
      });
    }

    if (!currentUser.phoneOtpCode || !currentUser.phoneOtpExpiresAt) {
      return res.status(400).send({
        success: false,
        message: "Please request OTP first",
      });
    }

    if (new Date() > new Date(currentUser.phoneOtpExpiresAt)) {
      return res.status(400).send({
        success: false,
        message: "OTP has expired. Please request a new OTP",
      });
    }

    if (otpCode !== String(currentUser.phoneOtpCode)) {
      return res.status(400).send({
        success: false,
        message: "Invalid OTP",
      });
    }

    currentUser.phoneVerified = true;
    currentUser.phoneOtpCode = null;
    currentUser.phoneOtpExpiresAt = null;
    await currentUser.save();

    return res.status(200).send({
      success: true,
      message: "Phone number verified successfully",
    });
  } catch (error) {
    console.log(error);
    return formatServerError(res, error);
  }
};
module.exports = {
  registerController,
  loginController,
  forgotPasswordController,
  authController,
  getAllPropertiesController,
  bookingHandleController,
  getAllBookingsController,
  requestPhoneOtpController,
  verifyPhoneOtpController,
};
