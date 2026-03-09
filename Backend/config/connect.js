const mongoose = require("mongoose");

const connectDB = async () => {
  const mongoUri = process.env.MONGO_DB || "mongodb://127.0.0.1:27017/apnaghar";

  try {
    const conn = await mongoose.connect(mongoUri);
    console.log(
      `Connected to MongoDB: ${conn.connection.host}/${conn.connection.name}`
    );
  } catch (err) {
    console.error(`Could not connect to MongoDB: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;