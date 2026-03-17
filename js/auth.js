// auth.js - Gestion de la connexion mockée
import { hashPassword } from './utils.js';

const TOKEN_KEY = 'b3_auth_token';
const USERNAME_KEY = 'b3_auth_user';

// Mock credentials: admin / admin123
const MOCK_ADMIN_HASH = "240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9"; // admin123 hashed

export function isAuthenticated() {
    return localStorage.getItem(TOKEN_KEY) !== null;
}

export function getLoggedUser() {
    return localStorage.getItem(USERNAME_KEY);
}

export async function login(username, password) {
    if (username === 'admin') {
        const hash = await hashPassword(password);
        if (hash === MOCK_ADMIN_HASH) {
            // Generate a fake token
            const fakeToken = btoa(username + ':' + Date.now());
            localStorage.setItem(TOKEN_KEY, fakeToken);
            localStorage.setItem(USERNAME_KEY, username);
            return true;
        }
    }
    return false;
}

export function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USERNAME_KEY);
}
