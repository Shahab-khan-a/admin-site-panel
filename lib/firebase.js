import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBcrO387ur65XWNUA7NBqQvWTSJo0vXEpI",
  authDomain: "site-panel-b86c8.firebaseapp.com",
  projectId: "site-panel-b86c8",
  storageBucket: "site-panel-b86c8.firebasestorage.app",
  messagingSenderId: "115092629905",
  appId: "1:115092629905:web:cae19e74b4eecabe5b5230",
  measurementId: "G-95DJ35D9T5"
};

// Initialize Firebase (singleton pattern for Next.js)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

let analytics = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {});
}

export { app, db, analytics, firebaseConfig };
