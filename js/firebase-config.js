import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Configuration with placeholders
const firebaseConfig = {
  apiKey: "___FIREBASE_API_KEY___",
  authDomain: "___FIREBASE_AUTH_DOMAIN___",
  projectId: "___FIREBASE_PROJECT_ID___",
  storageBucket: "___FIREBASE_STORAGE_BUCKET___",
  messagingSenderId: "___FIREBASE_MESSAGING_SENDER_ID___",
  appId: "___FIREBASE_APP_ID___"
};

// Initialize Firebase once
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
