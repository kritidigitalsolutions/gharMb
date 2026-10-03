const admin = require("firebase-admin");
const { initializeApp, getApps, getApp, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getStorage } = require("firebase-admin/storage");

let app;
let auth;
let bucket;

try {
  const apps = getApps();
  if (!apps.length) {
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      const serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      };

      app = initializeApp({
        credential: cert(serviceAccount),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET
      });
      console.log(`🔥 Firebase Admin SDK initialized successfully for project: ${process.env.FIREBASE_PROJECT_ID}`);
    } else {
      app = initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || 'gharmb',
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET
      });
      console.log('🔥 Firebase Admin SDK initialized with default credentials');
    }
  } else {
    app = getApp();
  }

  auth = getAuth(app);

  if (process.env.FIREBASE_STORAGE_BUCKET) {
    try {
      bucket = getStorage(app).bucket();
    } catch (storageErr) {
      console.warn("⚠️ Firebase Storage Bucket initialization warning:", storageErr.message);
    }
  }
} catch (error) {
  console.error("❌ Firebase Admin initialization error:", error.message);
}

module.exports = {
  admin,
  app,
  auth,
  bucket
};

// For backward compatibility
module.exports.default = bucket;

