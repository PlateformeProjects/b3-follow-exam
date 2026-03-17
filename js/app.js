import { initData } from './api.js';
import { initUI } from './ui.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize data from localstorage or fetch db.json
    await initData();
    
    // Initialize UI and event listeners
    initUI();
});
