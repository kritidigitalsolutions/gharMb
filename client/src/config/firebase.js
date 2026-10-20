import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from "firebase/auth";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAsB0yRhrbHbbCCwec9y-MTh35E7914HAA",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "gharmb-1ce6f.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "gharmb-1ce6f",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "gharmb-1ce6f.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "9610363754",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:9610363754:android:c91e1762b2edf2bb295b13",
};

// Safe initialization of Firebase app
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const storage = getStorage(app);

// Configure Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});

/**
 * Sign in using Google popup via Firebase Auth
 * Returns the Firebase user and raw ID token needed for backend authentication
 */
export const signInWithFirebaseGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    const idToken = await user.getIdToken(true);

    return {
      success: true,
      user,
      idToken,
      email: user.email,
      name: user.displayName || user.email?.split("@")[0],
      photoUrl: user.photoURL,
      uid: user.uid,
    };
  } catch (error) {
    console.error("Firebase Google Sign-In Error:", error);

    // Provide human-friendly error messages
    let message = "Google Sign-In failed. Please try again.";
    if (error.code === "auth/popup-closed-by-user") {
      message = "Google Sign-In window was closed before completing.";
    } else if (error.code === "auth/cancelled-popup-request") {
      message = "Sign-in request was cancelled.";
    } else if (error.code === "auth/popup-blocked") {
      message = "Sign-in popup was blocked by browser. Please allow popups for this site.";
    } else if (error.code === "auth/network-request-failed") {
      message = "Network error. Please check your internet connection.";
    } else if (error.message) {
      message = error.message;
    }

    return {
      success: false,
      error: message,
      code: error.code,
    };
  }
};

/**
 * Sign in with Email & Password via Firebase Auth
 */
export const signInWithFirebaseEmail = async (email, password) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    const user = result.user;
    const idToken = await user.getIdToken(true);

    return {
      success: true,
      user,
      idToken,
      email: user.email,
      name: user.displayName || user.email?.split("@")[0],
      photoUrl: user.photoURL,
      uid: user.uid,
    };
  } catch (error) {
    console.error("Firebase Email Sign-In Error:", error);

    let message = "Email sign-in failed.";
    if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
      message = "Invalid email or password.";
    } else if (error.code === "auth/operation-not-allowed") {
      message = "Email/Password sign-in provider is disabled in Firebase Console. Please enable it in Firebase Console > Authentication > Sign-in method.";
    } else if (error.code === "auth/too-many-requests") {
      message = "Too many attempts. Account temporarily locked by Firebase. Please try again later.";
    } else if (error.code === "auth/invalid-email") {
      message = "Please enter a valid email address.";
    } else if (error.message) {
      message = error.message;
    }

    return {
      success: false,
      error: message,
      code: error.code,
      rawError: error,
    };
  }
};

/**
 * Sign out of Firebase session
 */
export const logOutOfFirebase = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.warn("Firebase sign out warning:", error);
  }
};

/**
 * Send Password Reset Link via Firebase Email
 */
export const sendFirebasePasswordReset = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return {
      success: true,
      message: `Password reset verification link has been sent to ${email}.`,
    };
  } catch (error) {
    console.error("Firebase sendPasswordResetEmail error:", error);
    let message = "Failed to send password reset email.";
    if (error.code === "auth/user-not-found") {
      message = "No Firebase user account found with this email.";
    } else if (error.code === "auth/invalid-email") {
      message = "Please enter a valid email address.";
    } else if (error.code === "auth/too-many-requests") {
      message = "Too many requests. Please wait a few moments before trying again.";
    } else if (error.message) {
      message = error.message;
    }
    return {
      success: false,
      error: message,
      code: error.code,
    };
  }
};

import { compressImage } from '../utils/imageCompressor';

/**
 * Direct client-side file upload helper to Firebase Storage with pre-compression and CDN caching
 * @param {File|Blob} file - File or Blob object from input
 * @param {string} folder - Target folder in bucket (e.g. 'user_uploads')
 * @returns {Promise<{ success: boolean, url?: string, path?: string, error?: string }>}
 */
export const uploadFileToFirebaseStorage = async (file, folder = 'uploads') => {
  try {
    // ⚡ Auto-compress image before sending over network
    const fileToUpload = await compressImage(file);
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}-${fileToUpload.name || 'file'}`;
    const storagePath = `${folder}/${uniqueName}`;
    const storageRef = ref(storage, storagePath);

    // 🚀 Set 1-year immutable cache header for instant repeat loads worldwide
    const metadata = {
      contentType: fileToUpload.type || 'application/octet-stream',
      cacheControl: 'public, max-age=31536000, immutable',
    };

    const snapshot = await uploadBytes(storageRef, fileToUpload, metadata);
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return {
      success: true,
      url: downloadUrl,
      path: storagePath,
    };
  } catch (error) {
    console.error("Firebase Storage Client Upload Error:", error);
    return {
      success: false,
      error: error.message || "Failed to upload file to Firebase Storage",
    };
  }
};

let messagingInstance = null;

/**
 * Get or initialize Firebase Cloud Messaging for Web
 */
export const getClientMessaging = async () => {
  if (typeof window === "undefined") return null;
  try {
    const { getMessaging, isSupported } = await import("firebase/messaging");
    const supported = await isSupported();
    if (supported && !messagingInstance) {
      messagingInstance = getMessaging(app);
    }
    return messagingInstance;
  } catch (err) {
    console.warn("FCM Web Messaging is not supported in this browser:", err.message);
    return null;
  }
};

/**
 * Request notification permission and retrieve the FCM device registration token
 * @param {string} [vapidKey] - Optional Firebase Web Push certificate key
 * @returns {Promise<{ success: boolean, token?: string, error?: string }>}
 */
export const requestFcmToken = async (vapidKey) => {
  try {
    const msg = await getClientMessaging();
    if (!msg) {
      return { success: false, error: "FCM is not supported in this browser environment." };
    }

    if (typeof Notification === "undefined") {
      return { success: false, error: "Browser does not support notifications." };
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return { success: false, error: `Notification permission ${permission}.` };
    }

    const { getToken } = await import("firebase/messaging");
    const key = vapidKey || import.meta.env.VITE_FIREBASE_VAPID_KEY;
    const token = await getToken(msg, key ? { vapidKey: key } : undefined);

    if (token) {
      return { success: true, token };
    }
    return { success: false, error: "Failed to generate FCM token from browser." };
  } catch (err) {
    console.error("FCM Token generation error:", err);
    return { success: false, error: err.message || "Failed to retrieve FCM token." };
  }
};

/**
 * Register foreground notification listener
 * @param {Function} callback - Function called with incoming FCM message
 */
export const onFcmForegroundMessage = async (callback) => {
  try {
    const msg = await getClientMessaging();
    if (msg && typeof callback === "function") {
      const { onMessage } = await import("firebase/messaging");
      return onMessage(msg, callback);
    }
  } catch (err) {
    console.warn("onFcmForegroundMessage error:", err.message);
  }
  return () => {};
};

export {
  app,
  auth,
  googleProvider,
  storage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
};
export default auth;

