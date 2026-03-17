// api.js - Gère l'accès aux données (localStorage / fetch initial)

const DB_KEY = 'b3_projects_db';

export async function initData() {
    let storedData = localStorage.getItem(DB_KEY);
    let data;

    try {
        const response = await fetch('data/db.json');
        if (!response.ok) throw new Error('Erreur chargement json');
        const jsonData = await response.json();
        
        if (!storedData) {
            // First time loading
            data = jsonData;
        } else {
            // Merge existing data with potentially new students/units from db.json
            data = JSON.parse(storedData);
            
            // Add missing units
            if (jsonData.units) {
                data.units = jsonData.units;
            }

            // Add new students from db.json if they don't exist in localStorage
            jsonData.students.forEach(newStudent => {
                const existing = data.students.find(s => s.id === newStudent.id);
                if (!existing) {
                    data.students.push(newStudent);
                } else if (!existing.unit && newStudent.unit) {
                    existing.unit = newStudent.unit;
                }
            });

            // Update steps and options just in case
            data.steps = jsonData.steps;
            data.statusOptions = jsonData.statusOptions;
        }

        // Initialize empty statuses for all students
        data.students.forEach(student => {
            if (!student.stepsStatus) student.stepsStatus = {};
            data.steps.forEach(step => {
                if (!student.stepsStatus[step.id]) {
                    student.stepsStatus[step.id] = "Non commencé";
                }
            });
            // Ensure every student has a unit (default to Logiciels if missing)
            if (!student.unit) student.unit = "Logiciels";
        });

        localStorage.setItem(DB_KEY, JSON.stringify(data));
        return data;
    } catch (error) {
        console.error("Impossible de charger les données", error);
        return storedData ? JSON.parse(storedData) : null;
    }
}

export function getData() {
    const data = localStorage.getItem(DB_KEY);
    return data ? JSON.parse(data) : null;
}

export function getStudentById(id) {
    const data = getData();
    if (!data) return null;
    return data.students.find(s => s.id === parseInt(id));
}

export function updateStudentStatus(studentId, stepsStatus) {
    const data = getData();
    if (!data) return false;

    const studentIndex = data.students.findIndex(s => s.id === parseInt(studentId));
    if (studentIndex !== -1) {
        data.students[studentIndex].stepsStatus = stepsStatus;
        localStorage.setItem(DB_KEY, JSON.stringify(data));
        return true;
    }
    return false;
}
