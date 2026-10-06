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

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAAqrQkw6wmDLWUgy2b8iEQK0LPUh5m-G8",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "gharmb-aba6e.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "gharmb-aba6e",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "gharmb-aba6e.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "734300419980",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:734300419980:android:cc6774bcfa19d3440288a9",
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

export { app, auth, googleProvider };
export default auth;

