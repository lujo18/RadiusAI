import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDk6kT-R00hBLs5hfsZJizhREzPPCTFY-4",
  authDomain: "slideforge-2488d.firebaseapp.com",
  projectId: "slideforge-2488d",
  storageBucket: "slideforge-2488d.firebasestorage.app",
  messagingSenderId: "124513981268",
  appId: "1:124513981268:web:27a3e2ff4c28d05ff2aec1",
  measurementId: "G-80SVGYQRRM"
};

// Initialize Firebase (avoid reinitializing)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Analytics only works in browser
let analytics;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export { app, auth, analytics, db, storage };