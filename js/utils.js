// utils.js - Fonctions utilitaires

// Simule un hashage SHA-256 (Web Crypto API)
export async function hashPassword(password) {
    const msgUint8 = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

export function calculateProgress(stepsStatus, stepsLength) {
    if (!stepsStatus || stepsLength === 0) return 0;
    
    let completed = 0;
    Object.values(stepsStatus).forEach(status => {
        if (status === "Terminé") completed++;
        else if (status === "En cours") completed += 0.5;
    });
    
    return Math.round((completed / stepsLength) * 100);
}
