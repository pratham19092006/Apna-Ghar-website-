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
    lowercase: true,
    trim: true,
  },
  emailVerified: {
    type: Boolean,
    default: false,
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


