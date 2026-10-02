import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCmh_kP00ykojpe5W8nuEiKAU2Ih8Xly0I",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "gharmb.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "gharmb",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "gharmb.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "677731997630",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:677731997630:web:gharmb-admin",
};

// Safe initialization of Firebase app
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

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
    } else if (error.code === "auth/too-many-requests") {
      message = "Too many attempts. Account temporarily locked by Firebase.";
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
 * Sign out of Firebase session
 */
export const logOutOfFirebase = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.warn("Firebase sign out warning:", error);
  }
};

export { app, auth, googleProvider };
export default auth;
