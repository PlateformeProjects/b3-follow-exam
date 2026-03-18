import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Configuration with placeholders
const firebaseConfig = {
  apiKey: "AIzaSyDqwHPAp_-7M1u_ifmenfIOxNGq0dEj1WE",
  authDomain: "b3-follow.firebaseapp.com",
  projectId: "b3-follow",
  storageBucket: "b3-follow.firebasestorage.app",
  messagingSenderId: "931484092111",
  appId: "1:931484092111:web:01b887d7fba64f80bcd9ba"
};

// Initialize Firebase once
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
