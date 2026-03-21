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

const isOriginAllowed = (origin) => {
  if (!origin) return true;
  const normalized = normalizeOrigin(origin);
  // Always allow localhost for local dev
  if (normalized.startsWith("http://localhost:")) return true;
  // Always allow ANY vercel.app subdomain (covers all preview + production URLs)
  if (normalized.endsWith(".vercel.app")) return true;
  // Allow any extra origins set explicitly via env variable on Render
  const extraOrigins = (process.env.FRONTEND_URLS || "")
    .split(",")
    .map(normalizeOrigin)
    .filter(Boolean);
  if (extraOrigins.includes(normalized)) return true;
  return false;
};

const corsOptions = {
  origin(origin, callback) {
    if (isOriginAllowed(origin)) return callback(null, true);
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