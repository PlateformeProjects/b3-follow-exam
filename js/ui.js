import { getData, getStudentById, updateStudentStatus, importData, addStudent } from './api.js';
import { calculateProgress } from './utils.js';

// DOM Elements
const studentsGrid = document.getElementById('students-grid');
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');
const exportBtn = document.getElementById('export-btn');
const importBtn = document.getElementById('import-btn');
const importInput = document.getElementById('import-input');
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
            <h3>${student.name}</h3>
            ${student.projectTitle ? `<div class="project-title-info">Projet : ${student.projectTitle}</div>` : ''}
            ${student.techStack ? `<div class="tech-stack-info">Stack : ${student.techStack}</div>` : ''}
            <div class="progress-info">Progression : ${progress}%</div>
            <div class="progress-container">
                <div class="progress-bar" style="width: ${progress}%"></div>
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

    // Add Project Title field
    const titleDiv = document.createElement('div');
    titleDiv.className = 'step-item tech-stack-item';
    titleDiv.innerHTML = `
        <label for="edit-project-title">Titre du Projet :</label>
        <input type="text" id="edit-project-title" name="projectTitle" placeholder="Nom de votre application" value="${student.projectTitle || ''}" style="width:100%; padding:10px; border-radius:4px; border:1px solid var(--border-color); background:var(--card-bg); color:var(--text-color);">
    `;
    stepsContainer.appendChild(titleDiv);

    // Add Tech Stack field
    const techStackDiv = document.createElement('div');
    techStackDiv.className = 'step-item tech-stack-item';
    techStackDiv.innerHTML = `
        <label for="edit-tech-stack">Stack Technique :</label>
        <textarea id="edit-tech-stack" name="techStack" rows="3" placeholder="Ex: React, Node.js, MongoDB...">${student.techStack || ''}</textarea>
    `;
    stepsContainer.appendChild(techStackDiv);

    data.steps.forEach(step => {
        const currentStatus = student.stepsStatus[step.id] || "Non commencé";
        
        const stepDiv = document.createElement('div');
        stepDiv.className = 'step-item';
        
        const label = document.createElement('label');
        label.textContent = step.name;
        
        const select = document.createElement('select');
        select.name = step.id;
        
        const updateSelectClass = (sel) => {
            const val = sel.value.toLowerCase().replace(/\s+/g, '-');
            sel.className = `status-${val}`;
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
        stepsContainer.appendChild(stepDiv);
    });

    const saveBtn = document.getElementById('save-student-btn');
    saveBtn.classList.remove('hidden');

    editModal.classList.remove('hidden');
}

function setupEventListeners() {
    // Add Student
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
        } else {
            alert("Erreur lors de l'ajout de l'élève.");
        }
    });

    // Export Data
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

    // Import Data
    if (importBtn && importInput) {
        importBtn.addEventListener('click', () => {
            if (confirm("Attention : l'importation d'un nouveau fichier remplacera TOUTES vos données actuelles. Voulez-vous continuer ?")) {
                importInput.click();
            }
        });
        importInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async (event) => {
                const content = event.target.result;
                if (await importData(content)) {
                    alert('Importation réussie !');
                    window.location.reload(); 
                } else {
                    alert('Erreur lors de l\'importation. Vérifiez le format JSON.');
                }
            };
            reader.readAsText(file);
        });
    }

    // Modals Close
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

    // Edit Form
    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const studentId = document.getElementById('edit-student-id').value;
        const formData = new FormData(editForm);
        const newStatuses = {};
        let techStack = "";
        let projectTitle = "";
        
        for (let [key, value] of formData.entries()) {
            if (key === 'techStack') {
                techStack = value;
            } else if (key === 'projectTitle') {
                projectTitle = value;
            } else if (key !== 'id' && key !== 'student-id' && key !== '') {
                newStatuses[key] = value;
            }
        }

        if (await updateStudentStatus(studentId, newStatuses, techStack, projectTitle)) {
            editModal.classList.add('hidden');
            renderStudents();
        } else {
            alert('Erreur lors de la sauvegarde.');
        }
    });
}
