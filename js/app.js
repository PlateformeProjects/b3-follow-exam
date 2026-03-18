// app.js - Point d'entrée principal
import { initData, subscribeToData } from './api.js';
import { initUI } from './ui.js';
import { onAuthChanged, login, logout } from './auth.js';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Gérer l'authentification
    onAuthChanged(async (user) => {
        if (user) {
            // Utilisateur connecté
            document.body.classList.remove('not-logged-in');
            document.body.classList.add('logged-in');
            
            // 2. Initialiser les données et l'UI
            const data = await initData();
            if (data) {
                initUI();
                // 3. Écouter les mises à jour en temps réel
                subscribeToData(() => {
                    import('./ui.js').then(ui => ui.renderStudents());
                });
            }
        } else {
            // Utilisateur déconnecté : Afficher le formulaire de login
            showLoginModal();
        }
    });

    // Gestion du bouton logout (s'il existe dans le header)
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
});

function showLoginModal() {
    // Création dynamique d'un simple formulaire de login si pas déjà présent
    if (document.getElementById('login-modal')) return;

    const modal = document.createElement('div');
    modal.id = 'login-modal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h2>Connexion Requise</h2>
            <form id="login-form">
                <div class="step-item">
                    <label>Email :</label>
                    <input type="email" id="login-email" required style="width:100%; padding:8px;">
                </div>
                <div class="step-item">
                    <label>Mot de passe :</label>
                    <input type="password" id="login-password" required style="width:100%; padding:8px;">
                </div>
                <div class="form-actions" style="margin-top:20px;">
                    <button type="submit" class="btn btn-primary">Se connecter</button>
                </div>
                <p id="login-error" style="color:red; display:none; margin-top:10px;">Identifiants incorrects.</p>
            </form>
        </div>
    `;
    document.body.appendChild(modal);

    const form = document.getElementById('login-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const errorMsg = document.getElementById('login-error');

        const success = await login(email, password);
        if (success) {
            modal.remove();
        } else {
            errorMsg.style.display = 'block';
        }
    });
}
