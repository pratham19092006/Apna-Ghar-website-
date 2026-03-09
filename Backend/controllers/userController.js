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

const registerController = async (req, res) => {
  try {
    const existingUser = await UserModel.findOne({ email: req.body.email });

    if (existingUser) {
      return res
        .status(200)
        .send({ message: "User already exists", success: false });
    }

    const encryptedPassword = await hashPassword(req.body.password);
    const basePayload = { ...req.body, password: encryptedPassword };

    const accountPayload =
      req.body.type === "Owner"
        ? { ...basePayload, granted: "ungranted" }
        : basePayload;

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

    res.cookie("token", authToken, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.status(200).send({
      message: "Login success successfully",
      success: true,
      user: matchedUser,
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
  const { userDetails, status, userId, ownerId } = req.body;

  try {
    const bookingEntry = new BookingModel({
      propertyId: propertyid,
      userID: userId,
      ownerID: ownerId,
      userName: userDetails.fullName,
      phone: userDetails.phone,
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
module.exports = {
  registerController,
  loginController,
  forgotPasswordController,
  authController,
  getAllPropertiesController,
  bookingHandleController,
  getAllBookingsController,
};
