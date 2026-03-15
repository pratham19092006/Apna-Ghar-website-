const mongoose = require("mongoose");

const userModel = mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    set: function (value) {
      return value.charAt(0).toUpperCase() + value.slice(1);
    },
  },
  email: {
    type: String,
    required: [true, "email is required"],
  },
  phone: {
    type: String,
    required: [true, "phone is required"],
    trim: true,
  },
  password: {
    type: String,
    required: [true, "password is required"],
  },
  phoneVerified: {
    type: Boolean,
    default: false,
  },
  phoneOtpCode: {
    type: String,
    default: null,
  },
  phoneOtpExpiresAt: {
    type: Date,
    default: null,
  },
  type: {
    type: String,
    enum: ["user", "admin"],
    lowercase: true,
    trim: true,
    required: [true, "type is required"],
  },
},{
   strict: false,
});

const userSchema = mongoose.model("user", userModel);

module.exports = userSchema;


