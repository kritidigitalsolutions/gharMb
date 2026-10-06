const admin = require("firebase-admin");
const { initializeApp, getApps, getApp, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getStorage } = require("firebase-admin/storage");
const { getMessaging } = require("firebase-admin/messaging");
const fs = require("fs");
const path = require("path");

let app;
let auth;
let bucket;
let messaging;
let hasServiceAccount = false;

try {
  const apps = getApps();
  if (!apps.length) {
    const projectId = process.env.FIREBASE_PROJECT_ID || 'gharmb-aba6e';

    // 1. Check for Service Account file paths
    const possibleFilePaths = [
      process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
      path.join(__dirname, '../firebase/serviceAccountKey.json'),
      path.join(__dirname, '../../serviceAccountKey.json'),
      path.join(__dirname, '../../../serviceAccountKey.json')
    ].filter(Boolean);

    let serviceAccount = null;

    for (const filePath of possibleFilePaths) {
      if (fs.existsSync(filePath)) {
        try {
          serviceAccount = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          console.log(`🔥 Loaded Firebase Service Account from file: ${filePath}`);
          break;
        } catch (readErr) {
          console.warn(`⚠️ Could not parse Firebase Service Account at ${filePath}:`, readErr.message);
        }
      }
    }

    // 2. Check for JSON string in env
    if (!serviceAccount && process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        console.log(`🔥 Loaded Firebase Service Account from FIREBASE_SERVICE_ACCOUNT env`);
      } catch (e) {
        console.warn("⚠️ Could not parse FIREBASE_SERVICE_ACCOUNT JSON env:", e.message);
      }
    }

    // 3. Check for FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY
    if (!serviceAccount && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      const email = process.env.FIREBASE_CLIENT_EMAIL.trim();
      const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n').trim();
      const emailProjectMatch = email.match(/@([a-z0-9-]+)\.iam\.gserviceaccount\.com/);
      const emailProjectId = emailProjectMatch ? emailProjectMatch[1] : null;

      serviceAccount = {
        projectId: emailProjectId || projectId,
        clientEmail: email,
        privateKey,
      };
    }

    if (serviceAccount) {
      const activeProject = serviceAccount.projectId || projectId;
      if (serviceAccount.projectId && projectId && serviceAccount.projectId !== projectId) {
        console.error(`\n🚨 ============================================================`);
        console.error(`🚨 FIREBASE SERVICE ACCOUNT MISMATCH DETECTED!`);
        console.error(`🚨 App/Backend Project ID : ${projectId}`);
        console.error(`🚨 Service Account Project: ${serviceAccount.projectId}`);
        console.error(`🚨 RESULT: FCM push notifications to devices will fail with`);
        console.error(`🚨 'SenderId mismatch' until you generate a key for '${projectId}'!`);
        console.error(`🚨 FIX: Download service account from Firebase Console > Project settings >`);
        console.error(`🚨 Service accounts, and save as server/serviceAccountKey.json`);
        console.error(`🚨 ============================================================\n`);
      }

      try {
        app = initializeApp({
          credential: cert(serviceAccount),
          projectId: activeProject,
          storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${projectId}.firebasestorage.app`
        });
        hasServiceAccount = true;
        console.log(`🔥 Firebase Admin SDK initialized with Service Account for: ${activeProject}`);
      } catch (certErr) {
        console.warn("⚠️ Service account initialization failed, falling back to project ID:", certErr.message);
        app = initializeApp({
          projectId,
          storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${projectId}.firebasestorage.app`
        });
      }
    } else {
      app = initializeApp({
        projectId,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${projectId}.firebasestorage.app`
      });
      console.log(`🔥 Firebase Admin SDK initialized for project: ${projectId}`);
    }
  } else {
    app = getApp();
  }

  auth = getAuth(app);

  try {
    messaging = getMessaging(app);
    console.log("🔥 Firebase Cloud Messaging (FCM) initialized successfully");
  } catch (msgErr) {
    console.warn("⚠️ Firebase Messaging initialization notice:", msgErr.message);
  }

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
  bucket,
  messaging,
  hasServiceAccount: () => hasServiceAccount
};

// For backward compatibility
module.exports.default = bucket;

