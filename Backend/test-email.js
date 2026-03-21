const nodemailer = require("nodemailer");
require("dotenv").config();

async function test() {
  console.log("Testing SMTP connection...");
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.EMAIL_SMTP_PORT) || 587,
    secure: process.env.EMAIL_SMTP_SECURE === "true",
    auth: {
      user: process.env.EMAIL_SMTP_USER,
      pass: process.env.EMAIL_SMTP_PASS,
    },
  });

  try {
    await transporter.verify();
    console.log("SUCCESS: SMTP connection is working!");
  } catch (error) {
    console.error("ERROR: SMTP connection failed:", error.message);
  }
}

test();
