const UserModel = require("../models/UserSchema");
const PropertyModel = require("../models/PropertySchema");
const BookingModel = require("../models/BookingSchema");

const mapUploadedImages = (uploadedFiles = []) =>
  uploadedFiles.map((uploadedFile) => ({
    filename: uploadedFile.filename,
    path: `/uploads/${uploadedFile.filename}`,
  }));

const addPropertyController = async (req, res) => {
  try {
    const images = mapUploadedImages(req.files);
    const owner = await UserModel.findById({ _id: req.body.userId });

    if (!owner) {
      return res
        .status(404)
        .send({ success: false, message: "User not found" });
    }

    const propertyEntry = new PropertyModel({
      ...req.body,
      propertyImage: images,
      ownerId: owner._id,
      ownerName: owner.name,
      isAvailable: "Available",
    });

    await propertyEntry.save();

    return res.status(200).send({
      success: true,
      message: "New Property has been stored",
    });
  } catch (error) {
    console.log("Error in get All Users Controller ", error);
  }
};

const getAllOwnerPropertiesController = async (req, res) => {
  const { userId } = req.body;

  try {
    const allProperties = await PropertyModel.find();
    const ownerProperties = allProperties.filter(
      (property) => property.ownerId.toString() === userId
    );

    return res.status(200).send({
      success: true,
      data: ownerProperties,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .send({ message: "Internal server error", success: false });
  }
};

const deletePropertyController = async (req, res) => {
  const propertyId = req.params.propertyid;

  try {
    await PropertyModel.findByIdAndDelete({ _id: propertyId });

    return res.status(200).send({
      success: true,
      message: "The property is deleted",
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .send({ message: "Internal server error", success: false });
  }
};

const updatePropertyController = async (req, res) => {
  const { propertyid } = req.params;

  try {
    await PropertyModel.findByIdAndUpdate(
      { _id: propertyid },
      {
        ...req.body,
        ownerId: req.body.userId,
      },
      { new: true }
    );

    return res.status(200).send({
      success: true,
      message: "Property updated successfully.",
    });
  } catch (error) {
    console.error("Error updating property:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update property.",
    });
  }
};

const getAllBookingsController = async (req, res) => {
  const { userId } = req.body;

  try {
    const allBookings = await BookingModel.find();
    const ownerBookings = allBookings.filter(
      (booking) => booking.ownerID.toString() === userId
    );

    return res.status(200).send({
      success: true,
      data: ownerBookings,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .send({ message: "Internal server error", success: false });
  }
};

const handleAllBookingstatusController = async (req, res) => {
  const { bookingId, propertyId, status } = req.body;

  try {
    await BookingModel.findByIdAndUpdate(
      { _id: bookingId },
      { bookingStatus: status },
      { new: true }
    );

    await PropertyModel.findByIdAndUpdate(
      { _id: propertyId },
      {
        isAvailable: status === "booked" ? "Unavailable" : "Available",
      },
      { new: true }
    );

    return res.status(200).send({
      success: true,
      message: `changed the status of property to ${status}`,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .send({ message: "Internal server error", success: false });
  }
};
module.exports = {
  addPropertyController,
  getAllOwnerPropertiesController,
  deletePropertyController,
  updatePropertyController,
  getAllBookingsController,
  handleAllBookingstatusController,
};
