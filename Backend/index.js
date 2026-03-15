const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/connect.js");

dotenv.config();

const app = express();
const SERVER_PORT = process.env.PORT || 8001;

const normalizeOrigin = (value) => value?.trim().replace(/\/+$/, "");

const defaultAllowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
];

const envAllowedOrigins = (process.env.FRONTEND_URLS || "")
  .split(",")
  .map((origin) => normalizeOrigin(origin))
  .filter(Boolean);

const allowedOrigins = [
  ...new Set([...defaultAllowedOrigins.map(normalizeOrigin), ...envAllowedOrigins]),
];

const corsOptions = {
  origin(origin, callback) {
    const normalizedOrigin = normalizeOrigin(origin);
    if (!normalizedOrigin || allowedOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  credentials: true,
};

app.use(express.json());
app.use(cors(corsOptions));
app.use(cookieParser());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/user", require("./routes/userRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/owner", require("./routes/ownerRoutes"));

app.listen(SERVER_PORT, () => {
  connectDB();
  console.log(`Server is running on port ${SERVER_PORT}`);
});