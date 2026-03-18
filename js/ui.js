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
    themeIcon.textContent = savedTheme === 'light' ? 'Mode sombre' : 'Mode clair';

    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        themeIcon.textContent = newTheme === 'light' ? 'Mode sombre' : 'Mode clair';
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
                <span class="unit-tag">${student.unit}</span>
            </div>
            <div class="card-body">
                ${student.projectTitle ? `<div class="info-line"><strong>Projet :</strong> ${student.projectTitle}</div>` : ''}
                ${student.techStack ? `<div class="info-line"><strong>Stack :</strong> ${student.techStack}</div>` : ''}
                <div class="progress-section">
                    <div class="progress-labels">
                        <span>Avancement</span>
                        <span>${progress}%</span>
                    </div>
                    <div class="progress-track">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                </div>
                ${student.comments ? `<div class="comment-line">${student.comments.substring(0, 80)}${student.comments.length > 80 ? '...' : ''}</div>` : ''}
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

    // Section : Informations Générales
    const generalSection = document.createElement('div');
    generalSection.className = 'form-section';
    generalSection.innerHTML = `
        <h4 class="section-title">Informations générales</h4>
        <div class="form-row">
            <div class="form-group">
                <label>Nom de l'élève</label>
                <input type="text" name="studentName" value="${student.name}" required>
            </div>
            <div class="form-group">
                <label>Filière</label>
                <select name="studentUnit">
                    ${data.units.map(u => `<option value="${u}" ${u === student.unit ? 'selected' : ''}>${u}</option>`).join('')}
                </select>
            </div>
        </div>
        <div class="form-group">
            <label>Titre du projet</label>
            <input type="text" name="projectTitle" value="${student.projectTitle || ''}" placeholder="Saisir le nom du projet">
        </div>
        <div class="form-group">
            <label>Stack technique</label>
            <input type="text" name="techStack" value="${student.techStack || ''}" placeholder="Technologies utilisées">
        </div>
    `;
    stepsContainer.appendChild(generalSection);

    // Section : Commentaires
    const commentsSection = document.createElement('div');
    commentsSection.className = 'form-section';
    commentsSection.innerHTML = `
        <h4 class="section-title">Commentaires et observations</h4>
        <div class="form-group">
            <textarea name="comments" rows="3" placeholder="Notes de suivi...">${student.comments || ''}</textarea>
        </div>
    `;
    stepsContainer.appendChild(commentsSection);

    // Section : Suivi des étapes
    const stepsSection = document.createElement('div');
    stepsSection.className = 'form-section';
    stepsSection.innerHTML = `<h4 class="section-title">État d'avancement des étapes</h4>`;
    
    const stepsGrid = document.createElement('div');
    stepsGrid.className = 'steps-form-grid';
    
    data.steps.forEach(step => {
        const currentStatus = student.stepsStatus[step.id] || "Non commencé";
        const stepGroup = document.createElement('div');
        stepGroup.className = 'form-group-compact';
        
        stepGroup.innerHTML = `
            <label>${step.name}</label>
            <select name="step_${step.id}" class="status-select-pro">
                ${data.statusOptions.map(opt => `<option value="${opt}" ${opt === currentStatus ? 'selected' : ''}>${opt}</option>`).join('')}
            </select>
        `;
        stepsGrid.appendChild(stepGroup);
    });
    stepsSection.appendChild(stepsGrid);
    stepsContainer.appendChild(stepsSection);

    // Boutons d'action
    const actionsDiv = editModal.querySelector('.form-actions');
    if (actionsDiv) {
        actionsDiv.innerHTML = `
            <button type="button" id="delete-student-btn" class="btn btn-outline-danger">Supprimer l'élève</button>
            <div class="main-actions">
                <button type="button" class="btn btn-secondary close-btn-action">Fermer</button>
                <button type="submit" class="btn btn-primary">Enregistrer les modifications</button>
            </div>
        `;

        document.getElementById('delete-student-btn').addEventListener('click', async () => {
            if (confirm(`Confirmer la suppression définitive de l'élève : ${student.name} ?`)) {
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
            a.download = `export-suivi-${new Date().toISOString().split('T')[0]}.json`;
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

        if (await updateStudentStatus(studentId, newStatuses, techStack, projectTitle, studentName, studentUnit, comments)) {
            editModal.classList.add('hidden');
            renderStudents();
        }
    });
}
