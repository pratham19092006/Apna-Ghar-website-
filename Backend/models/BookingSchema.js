const mongoose = require("mongoose");

const bookingModel = mongoose.Schema(
  {
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "propertyschema",
    },
    propertId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "propertyschema",
    },
    ownerID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    userID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    userName: {
      type: String,
      required: [true, "Please provide a User Name"],
    },
    phone: {
      type: String,
      required: [true, "Please provide a Phone Number"],
    },
    address: {
      type: String,
      required: [true, "Please provide an Address"],
    },
    memberCount: {
      type: Number,
      required: [true, "Please provide member count"],
    },
    femaleCount: {
      type: Number,
      required: [true, "Please provide female member count"],
    },
    maleCount: {
      type: Number,
      required: [true, "Please provide male member count"],
    },
    bookingStatus: {
      type: String,
      required: [true, "Please provide a booking Type"],
    },
    bookingFeeAmount: {
      type: Number,
      default: 0,
    },
    bookingFeeStatus: {
      type: String,
      default: "not-applicable",
    },
    refundPolicyNote: {
      type: String,
      default: "",
    },
    razorpayOrderId: {
      type: String,
      default: "",
    },
    razorpayPaymentId: {
      type: String,
      default: "",
    },
    paymentVerified: {
      type: Boolean,
      default: false,
    },
    paymentMethod: {
      type: String,
      default: "",
    },
    paymentReference: {
      type: String,
      default: "",
    },
    paymentIntentRef: {
      type: String,
      default: "",
    },
  },
  {
    strict: false,
  }
);

const bookingSchema = mongoose.model("bookingschema", bookingModel);

module.exports = bookingSchema;
