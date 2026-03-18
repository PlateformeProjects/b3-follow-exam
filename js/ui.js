import { getData, getStudentById, updateStudentStatus, addStudent, deleteStudent } from './api.js';
import { calculateProgress } from './utils.js';

// DOM Elements
const studentsGrid = document.getElementById('students-grid');
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');
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
    themeIcon.textContent = savedTheme === 'light' ? '🌙' : '☀️';

    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        themeIcon.textContent = newTheme === 'light' ? '🌙' : '☀️';
    });
}

function setupUnitSelector() {
    const data = getData();
    const unitSelector = document.getElementById('unit-selector');
    const addStudentUnit = document.getElementById('add-student-unit');
    if (!unitSelector) return;

    const units = (data && data.units && data.units.length > 0) 
        ? data.units 
        : ["Logiciels", "JVSI", "IA"];

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
        
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="card-header">
                <h3>${student.name}</h3>
                <span class="badge">${student.unit}</span>
            </div>
            <div class="card-body">
                ${student.projectTitle ? `<div class="project-title-info">🚀 ${student.projectTitle}</div>` : ''}
                ${student.techStack ? `<div class="tech-stack-info">🛠️ ${student.techStack}</div>` : ''}
                <div class="progress-wrapper">
                    <div class="progress-text">
                        <span>Progression</span>
                        <span>${progress}%</span>
                    </div>
                    <div class="progress-container">
                        <div class="progress-bar" style="width: ${progress}%"></div>
                    </div>
                </div>
                ${student.comments ? `<div class="comment-preview">💬 ${student.comments.substring(0, 60)}${student.comments.length > 60 ? '...' : ''}</div>` : ''}
            </div>
        `;
        
        card.addEventListener('click', () => openEditModal(student.id));
        studentsGrid.appendChild(card);
    });
}

function openEditModal(studentId) {
    const student = getStudentById(studentId);
    if (!student) return;

    const data = getData();
    document.getElementById('edit-student-id').value = student.id;
    document.getElementById('edit-student-name').textContent = student.name;

    const stepsContainer = document.getElementById('steps-container');
    stepsContainer.innerHTML = '';

    // Basic Info Section
    const basicInfoDiv = document.createElement('div');
    basicInfoDiv.className = 'edit-section';
    basicInfoDiv.innerHTML = `
        <div class="section-header">
            <span class="section-icon">👤</span>
            <h3>Informations de base</h3>
        </div>
        <div class="form-grid">
            <div class="step-item">
                <label>Nom de l'élève</label>
                <input type="text" name="studentName" value="${student.name}" required>
            </div>
            <div class="step-item">
                <label>Filière</label>
                <select name="studentUnit">
                    ${data.units.map(u => `<option value="${u}" ${u === student.unit ? 'selected' : ''}>${u}</option>`).join('')}
                </select>
            </div>
        </div>
    `;
    stepsContainer.appendChild(basicInfoDiv);

    // Project Details Section
    const projectSection = document.createElement('div');
    projectSection.className = 'edit-section';
    projectSection.innerHTML = `
        <div class="section-header">
            <span class="section-icon">🚀</span>
            <h3>Détails du projet</h3>
        </div>
        <div class="step-item">
            <label for="edit-project-title">Titre du Projet</label>
            <input type="text" id="edit-project-title" name="projectTitle" placeholder="Nom de l'application" value="${student.projectTitle || ''}">
        </div>
        <div class="step-item">
            <label for="edit-tech-stack">Stack Technique</label>
            <textarea id="edit-tech-stack" name="techStack" rows="2" placeholder="Ex: React, Node.js...">${student.techStack || ''}</textarea>
        </div>
    `;
    stepsContainer.appendChild(projectSection);

    // Comments Section
    const commentsSection = document.createElement('div');
    commentsSection.className = 'edit-section';
    commentsSection.innerHTML = `
        <div class="section-header">
            <span class="section-icon">💬</span>
            <h3>Commentaires & Notes</h3>
        </div>
        <div class="step-item">
            <textarea name="comments" rows="4" placeholder="Ajoutez vos observations ici...">${student.comments || ''}</textarea>
        </div>
    `;
    stepsContainer.appendChild(commentsSection);

    // Steps Section
    const stepsSection = document.createElement('div');
    stepsSection.className = 'edit-section';
    stepsSection.innerHTML = `
        <div class="section-header">
            <span class="section-icon">✅</span>
            <h3>Étapes du projet</h3>
        </div>
        <div class="steps-grid-layout"></div>
    `;
    
    const gridLayout = stepsSection.querySelector('.steps-grid-layout');
    data.steps.forEach(step => {
        const currentStatus = student.stepsStatus[step.id] || "Non commencé";
        const stepDiv = document.createElement('div');
        stepDiv.className = 'step-item-compact';
        
        const label = document.createElement('label');
        label.textContent = step.name;
        
        const select = document.createElement('select');
        select.name = `step_${step.id}`;
        
        const updateSelectClass = (sel) => {
            const val = sel.value.toLowerCase().replace(/\s+/g, '-');
            sel.className = `status-select status-${val}`;
        };

        data.statusOptions.forEach(option => {
            const opt = document.createElement('option');
            opt.value = option;
            opt.textContent = option;
            if (option === currentStatus) opt.selected = true;
            select.appendChild(opt);
        });

        updateSelectClass(select);
        select.addEventListener('change', () => updateSelectClass(select));

        stepDiv.appendChild(label);
        stepDiv.appendChild(select);
        gridLayout.appendChild(stepDiv);
    });
    stepsContainer.appendChild(stepsSection);

    // Actions
    const actionsDiv = editModal.querySelector('.form-actions');
    if (actionsDiv) {
        actionsDiv.innerHTML = `
            <button type="button" id="delete-student-btn" class="btn btn-danger-outline">Supprimer l'élève</button>
            <div style="display:flex; gap:10px;">
                <button type="button" class="btn btn-secondary close-btn-action">Annuler</button>
                <button type="submit" class="btn btn-primary" id="save-student-btn">Enregistrer</button>
            </div>
        `;

        document.getElementById('delete-student-btn').addEventListener('click', async () => {
            if (confirm(`Êtes-vous sûr de vouloir supprimer ${student.name} ? Cette action est irréversible.`)) {
                if (await deleteStudent(student.id)) {
                    editModal.classList.add('hidden');
                    renderStudents();
                }
            }
        });

        actionsDiv.querySelector('.close-btn-action').addEventListener('click', () => {
            editModal.classList.add('hidden');
        });
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
            a.download = `suivi-projets-b3-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
        });
    }

    closeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            editModal.classList.add('hidden');
            addModal.classList.add('hidden');
        });
    });

    window.addEventListener('click', (e) => {
        if (e.target === editModal) editModal.classList.add('hidden');
        if (e.target === addModal) addModal.classList.add('hidden');
    });

    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const studentId = document.getElementById('edit-student-id').value;
        const formData = new FormData(editForm);
        const newStatuses = {};
        let techStack = "";
        let projectTitle = "";
        let studentName = "";
        let studentUnit = "";
        let comments = "";
        
        for (let [key, value] of formData.entries()) {
            if (key === 'techStack') {
                techStack = value;
            } else if (key === 'projectTitle') {
                projectTitle = value;
            } else if (key === 'studentName') {
                studentName = value;
            } else if (key === 'studentUnit') {
                studentUnit = value;
            } else if (key === 'comments') {
                comments = value;
            } else if (key.startsWith('step_')) {
                const stepId = key.replace('step_', '');
                newStatuses[stepId] = value;
            }
        }

        if (await updateStudentStatus(studentId, newStatuses, techStack, projectTitle, studentName, studentUnit, comments)) {
            editModal.classList.add('hidden');
            renderStudents();
        }
    });
}
