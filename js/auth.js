// auth.js - Gestion de la connexion via Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { firebaseConfig } from './firebase-config.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export function getAuthInstance() {
    return auth;
}

export function isAuthenticated() {
    return auth.currentUser !== null;
}

export function getLoggedUser() {
    return auth.currentUser ? auth.currentUser.email : null;
}

export function onAuthChanged(callback) {
    onAuthStateChanged(auth, callback);
}

export async function login(email, password) {
    try {
        await signInWithEmailAndPassword(auth, email, password);
        return true;
    } catch (error) {
        console.error("Erreur de connexion Firebase :", error.code, error.message);
        return false;
    }
}

export async function logout() {
    try {
        await signOut(auth);
        return true;
    } catch (error) {
        console.error("Erreur de déconnexion :", error);
        return false;
    }
}
