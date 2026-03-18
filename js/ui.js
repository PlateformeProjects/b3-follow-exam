import { getData, getStudentById, updateStudentStatus, addStudent, deleteStudent, setPartner } from './api.js';
import { calculateProgress } from './utils.js';

// DOM Elements
const studentsGrid = document.getElementById('students-grid');
const themeToggle = document.getElementById('theme-toggle');
const exportBtn = document.getElementById('export-btn');
const addStudentBtn = document.getElementById('add-student-btn');

// Modals
const editModal = document.getElementById('edit-modal');
const addModal = document.getElementById('add-modal');
const closeBtns = document.querySelectorAll('.close-btn');

// Forms
const editForm = document.getElementById('edit-form');
const addStudentForm = document.getElementById('add-student-form');

export function initUI() {
    setupTheme();
    setupUnitSelector();
    setupEventListeners();
    renderStudents();
}

function setupTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);

    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });
}

function setupUnitSelector() {
    const data = getData();
    const unitSelector = document.getElementById('unit-selector');
    const addStudentUnit = document.getElementById('add-student-unit');
    if (!unitSelector) return;

    const units = (data && data.units && data.units.length > 0) 
        ? data.units 
        : ["Logiciels", "JVSI", "IA", "Web"];

    unitSelector.innerHTML = '';
    if (addStudentUnit) addStudentUnit.innerHTML = '';

    units.forEach(unit => {
        const option = document.createElement('option');
        option.value = unit;
        option.textContent = unit;
        unitSelector.appendChild(option);

        if (addStudentUnit) {
            const addOption = document.createElement('option');
            addOption.value = unit;
            addOption.textContent = unit;
            addStudentUnit.appendChild(addOption);
        }
    });

    unitSelector.addEventListener('change', () => {
        renderStudents();
    });
}

export function renderStudents() {
    const data = getData();
    if (!data) return;

    const unitSelector = document.getElementById('unit-selector');
    const selectedUnit = unitSelector ? unitSelector.value : "Logiciels";
    
    studentsGrid.innerHTML = '';
    const stepsLength = data.steps.length;

    const filteredStudents = data.students.filter(student => student.unit === selectedUnit);

    filteredStudents.forEach(student => {
        const progress = calculateProgress(student.stepsStatus, stepsLength);
        
        // Trouver les partenaires
        const partners = student.teamId 
            ? data.students.filter(s => s.teamId === student.teamId && s.id !== student.id)
            : [];

        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="card-header">
                <span class="card-tag">${student.unit}</span>
                <div class="card-icon-mini">
                    ${partners.length > 0 
                        ? `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`
                        : `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`
                    }
                </div>
            </div>
            <div class="card-content">
                <h3>${student.name}</h3>
                ${partners.length > 0 ? `<p class="partners-list">Avec : ${partners.map(p => p.name).join(', ')}</p>` : ''}
                ${student.projectTitle ? `<p class="project-title-info">${student.projectTitle}</p>` : '<p class="text-muted" style="font-size: 13px;">Projet non défini</p>'}
                ${student.techStack ? `<p class="tech-stack-info">${student.techStack}</p>` : ''}
            </div>
            <div class="progress-wrapper">
                <div class="progress-text">
                    <span>${progress}%</span>
                </div>
                <div class="progress-container">
                    <div class="progress-bar" style="width: ${progress}%"></div>
                </div>
            </div>
            ${student.comments ? `<div class="comment-preview">${student.comments.substring(0, 60)}${student.comments.length > 60 ? '...' : ''}</div>` : ''}
        `;
        
        card.addEventListener('click', () => openEditModal(student.id));
        studentsGrid.appendChild(card);
    });
}

async function handleAutosave(studentId) {
    const formData = new FormData(editForm);
    const newStatuses = {};
    let techStack, projectTitle, studentName, studentUnit, comments;
    
    for (let [key, value] of formData.entries()) {
        if (key === 'techStack') techStack = value;
        else if (key === 'projectTitle') projectTitle = value;
        else if (key === 'studentName') studentName = value;
        else if (key === 'studentUnit') studentUnit = value;
        else if (key === 'comments') comments = value;
        else if (key.startsWith('step_')) {
            newStatuses[key.replace('step_', '')] = value;
        }
    }

    await updateStudentStatus(studentId, newStatuses, techStack, projectTitle, studentName, studentUnit, comments);
    // On ne re-render pas tout pour éviter de perdre le focus pendant la saisie
}

function openEditModal(studentId) {
    const student = getStudentById(studentId);
    if (!student) return;

    const data = getData();
    document.getElementById('edit-student-id').value = student.id;
    document.getElementById('edit-student-name').textContent = student.name;

    const stepsContainer = document.getElementById('steps-container');
    stepsContainer.innerHTML = '';

    // Section Infos de base
    const basicInfo = document.createElement('div');
    basicInfo.className = 'edit-section';
    basicInfo.innerHTML = `
        <h4 class="section-title">Informations Générales</h4>
        <div class="input-grid">
            <div class="input-group">
                <label>Nom de l'élève</label>
                <input type="text" name="studentName" value="${student.name}" required>
            </div>
            <div class="input-group">
                <label>Filière</label>
                <select name="studentUnit">
                    ${data.units.map(u => `<option value="${u}" ${u === student.unit ? 'selected' : ''}>${u}</option>`).join('')}
                </select>
            </div>
        </div>
        <div class="input-group">
            <label>Titre du projet</label>
            <input type="text" name="projectTitle" value="${student.projectTitle || ''}" placeholder="Nom de l'application">
        </div>
        <div class="input-group">
            <label>Stack technique</label>
            <input type="text" name="techStack" value="${student.techStack || ''}" placeholder="Technologies utilisées">
        </div>
    `;
    stepsContainer.appendChild(basicInfo);

    // Section Binôme / Équipe
    const teamSec = document.createElement('div');
    teamSec.className = 'edit-section';
    const partners = student.teamId 
        ? data.students.filter(s => s.teamId === student.teamId && s.id !== student.id)
        : [];
    
    const availablePartners = data.students.filter(s => 
        s.id !== student.id && 
        s.unit === student.unit && 
        (!s.teamId || s.teamId !== student.teamId)
    );

    teamSec.innerHTML = `
        <h4 class="section-title">Binôme / Équipe</h4>
        <div class="team-management">
            ${partners.length > 0 ? `
                <div class="current-partners">
                    <p>En équipe avec : <strong>${partners.map(p => p.name).join(', ')}</strong></p>
                    <button type="button" id="leave-team-btn" class="btn-small">Quitter l'équipe</button>
                </div>
            ` : `
                <div class="add-partner">
                    <label>Ajouter un partenaire :</label>
                    <div class="input-with-button">
                        <select id="partner-select">
                            <option value="">-- Choisir un élève --</option>
                            ${availablePartners.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
                        </select>
                        <button type="button" id="add-partner-btn" class="btn-secondary">Lier</button>
                    </div>
                </div>
            `}
        </div>
    `;
    stepsContainer.appendChild(teamSec);

    // Event listeners pour l'équipe
    setTimeout(() => {
        const addPartnerBtn = document.getElementById('add-partner-btn');
        if (addPartnerBtn) {
            addPartnerBtn.onclick = async () => {
                const partnerId = document.getElementById('partner-select').value;
                if (partnerId) {
                    if (await setPartner(student.id, partnerId)) {
                        openEditModal(student.id); // Recharger le modal
                    }
                }
            };
        }
        const leaveTeamBtn = document.getElementById('leave-team-btn');
        if (leaveTeamBtn) {
            leaveTeamBtn.onclick = async () => {
                if (confirm("Quitter l'équipe ? Le projet ne sera plus synchronisé avec vos anciens partenaires.")) {
                    if (await setPartner(student.id, null)) {
                        openEditModal(student.id);
                    }
                }
            };
        }
    }, 0);

    // Section Commentaires
    const commentsSec = document.createElement('div');
    commentsSec.className = 'edit-section';
    commentsSec.innerHTML = `
        <h4 class="section-title">Commentaires & Suivi</h4>
        <div class="input-group">
            <textarea name="comments" rows="3" placeholder="Notes de suivi...">${student.comments || ''}</textarea>
        </div>
    `;
    stepsContainer.appendChild(commentsSec);

    // Section Étapes
    const stepsSec = document.createElement('div');
    stepsSec.className = 'edit-section';
    stepsSec.innerHTML = `<h4 class="section-title">Avancement des étapes</h4>`;
    
    const stepsGrid = document.createElement('div');
    stepsGrid.className = 'steps-edit-grid';
    
    data.steps.forEach(step => {
        const currentStatus = student.stepsStatus[step.id] || "Non commencé";
        const valClass = currentStatus.toLowerCase().replace(/\s+/g, '-');
        const stepDiv = document.createElement('div');
        stepDiv.className = 'step-edit-item';
        stepDiv.innerHTML = `
            <label>${step.name}</label>
            <select name="step_${step.id}" class="status-select-bento status-${valClass}">
                ${data.statusOptions.map(opt => `<option value="${opt}" ${opt === currentStatus ? 'selected' : ''}>${opt}</option>`).join('')}
            </select>
        `;
        stepsGrid.appendChild(stepDiv);
    });
    stepsSec.appendChild(stepsGrid);
    stepsContainer.appendChild(stepsSec);

    // Ajout des Event Listeners pour l'Autosave
    const fields = stepsContainer.querySelectorAll('input, select, textarea');
    fields.forEach(field => {
        const eventType = (field.tagName === 'SELECT') ? 'change' : 'blur';
        field.addEventListener(eventType, () => {
            // Ne pas déclencher l'autosave pour le select des partenaires
            if (field.id === 'partner-select') return;
            
            handleAutosave(student.id);
            if (field.classList.contains('status-select-bento')) {
                const val = field.value.toLowerCase().replace(/\s+/g, '-');
                field.className = `status-select-bento status-${val}`;
            }
        });
    });

    // Boutons Actions
    const actionsDiv = editModal.querySelector('.form-actions, .modal-footer-actions');
    if (actionsDiv) {
        actionsDiv.className = 'modal-footer-actions';
        actionsDiv.innerHTML = `
            <button type="button" id="delete-student-btn" class="btn-danger-bento">Supprimer</button>
            <div class="main-actions">
                <button type="button" class="btn-main close-btn-action">Terminer</button>
            </div>
        `;

        document.getElementById('delete-student-btn').onclick = async () => {
            if (confirm(`Confirmer la suppression de ${student.name} ?`)) {
                if (await deleteStudent(student.id)) {
                    editModal.classList.add('hidden');
                    renderStudents();
                }
            }
        };

        actionsDiv.querySelector('.close-btn-action').onclick = () => {
            editModal.classList.add('hidden');
            renderStudents(); // On re-render à la fermeture pour mettre à jour les cartes
        };
    }

    editModal.classList.remove('hidden');
}

function setupEventListeners() {
    if (addStudentBtn) {
        addStudentBtn.addEventListener('click', () => {
            addModal.classList.remove('hidden');
        });
    }

    addStudentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('add-student-name').value;
        const unit = document.getElementById('add-student-unit').value;
        if (await addStudent(name, unit)) {
            addModal.classList.add('hidden');
            addStudentForm.reset();
            renderStudents();
        }
    });

    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            const data = getData();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `export-b3-follow-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
        });
    }

    closeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            editModal.classList.add('hidden');
            addModal.classList.add('hidden');
            renderStudents();
        });
    });

    window.addEventListener('click', (e) => {
        if (e.target === editModal) {
            editModal.classList.add('hidden');
            renderStudents();
        }
        if (e.target === addModal) addModal.classList.add('hidden');
    });

    // On supprime l'event submit de editForm car tout est géré par l'autosave
    editForm.onsubmit = (e) => e.preventDefault();
}
