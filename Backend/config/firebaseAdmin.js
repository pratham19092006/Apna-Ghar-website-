const admin = require("firebase-admin");

const requiredConfig = [
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
];

const hasRequiredConfig = requiredConfig.every((key) => Boolean(process.env[key]));

const getPrivateKey = () =>
  process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
    : "";

const initializeFirebaseAdmin = () => {
  if (admin.apps.length > 0) {
    return admin;
  }

  if (!hasRequiredConfig) {
    return null;
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: getPrivateKey(),
    }),
  });

  return admin;
};

const firebaseAdmin = initializeFirebaseAdmin();

module.exports = {
  firebaseAdmin,
  firebaseConfigured: Boolean(firebaseAdmin),
};
