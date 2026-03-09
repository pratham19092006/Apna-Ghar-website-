const UserModel = require("../models/UserSchema");
const PropertyModel = require("../models/PropertySchema");
const BookingModel = require("../models/BookingSchema");

const getAllUsersController = async (req, res) => {
  try {
    const users = await UserModel.find({});

    if (!users) {
      return res.status(401).send({
        success: false,
        message: "No users presents",
      });
    }

    return res.status(200).send({
      success: true,
      message: "All users",
      data: users,
    });
  } catch (error) {
    console.log("Error in get All Users Controller ", error);
  }
};

const handleStatusController = async (req, res) => {
  const { userid, status } = req.body;

  try {
    await UserModel.findByIdAndUpdate(userid, { granted: status }, { new: true });

    return res.status(200).send({
      success: true,
      message: `User has been ${status}`,
    });
  } catch (error) {
    console.log("Error in get All Users Controller ", error);
  }
};

const getAllPropertiesController = async (req, res) => {
  try {
    const properties = await PropertyModel.find({});

    if (!properties) {
      return res.status(401).send({
        success: false,
        message: "No properties presents",
      });
    }

    return res.status(200).send({
      success: true,
      message: "All properties",
      data: properties,
    });
  } catch (error) {
    console.log("Error in get All Users Controller ", error);
  }
};

const getAllBookingsController = async (req, res) => {
  try {
    const bookings = await BookingModel.find();
    return res.status(200).send({
      success: true,
      data: bookings,
    });
  } catch (error) {
    console.log("Error in get All Users Controller ", error);
  }
};
module.exports = {
  getAllUsersController,
  handleStatusController,
  getAllPropertiesController,
  getAllBookingsController
};
