import { getData, getStudentById, updateStudentStatus } from './api.js';
import { calculateProgress } from './utils.js';

// DOM Elements
const studentsGrid = document.getElementById('students-grid');
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');
const unitSelector = document.getElementById('unit-selector');

// Modals
const editModal = document.getElementById('edit-modal');
const closeBtns = document.querySelectorAll('.close-btn');

// Forms
const editForm = document.getElementById('edit-form');

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
    if (!data || !data.units) return;

    unitSelector.innerHTML = '';
    data.units.forEach(unit => {
        const option = document.createElement('option');
        option.value = unit;
        option.textContent = unit;
        unitSelector.appendChild(option);
    });

    unitSelector.addEventListener('change', () => {
        renderStudents();
    });
}

function renderStudents() {
    const data = getData();
    if (!data) return;

    const selectedUnit = unitSelector.value;
    studentsGrid.innerHTML = '';
    const stepsLength = data.steps.length;

    const filteredStudents = data.students.filter(student => student.unit === selectedUnit);

    filteredStudents.forEach(student => {
        const progress = calculateProgress(student.stepsStatus, stepsLength);
        
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <h3>${student.name}</h3>
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

    data.steps.forEach(step => {
        const currentStatus = student.stepsStatus[step.id] || "Non commencé";
        
        const stepDiv = document.createElement('div');
        stepDiv.className = 'step-item';
        
        const label = document.createElement('label');
        label.textContent = step.name;
        
        const select = document.createElement('select');
        select.name = step.id;

        data.statusOptions.forEach(option => {
            const opt = document.createElement('option');
            opt.value = option;
            opt.textContent = option;
            if (option === currentStatus) opt.selected = true;
            select.appendChild(opt);
        });

        stepDiv.appendChild(label);
        stepDiv.appendChild(select);
        stepsContainer.appendChild(stepDiv);
    });

    const saveBtn = document.getElementById('save-student-btn');
    saveBtn.classList.remove('hidden');

    editModal.classList.remove('hidden');
}

function setupEventListeners() {
    // Modals Close
    closeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            editModal.classList.add('hidden');
        });
    });

    window.addEventListener('click', (e) => {
        if (e.target === editModal) editModal.classList.add('hidden');
    });

    // Edit Form
    editForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const studentId = document.getElementById('edit-student-id').value;
        const formData = new FormData(editForm);
        const newStatuses = {};
        
        for (let [key, value] of formData.entries()) {
            if (key !== 'id' && key !== 'student-id') { // "edit-student-id" is in hidden input, but FormData might capture it if it has a 'name' attribute
                // The hidden input has id="edit-student-id" but no 'name' attribute currently, let's be safe.
                if (key !== '') newStatuses[key] = value;
            }
        }

        if (updateStudentStatus(studentId, newStatuses)) {
            editModal.classList.add('hidden');
            renderStudents();
        } else {
            alert('Erreur lors de la sauvegarde.');
        }
    });
}
