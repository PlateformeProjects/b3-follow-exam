// api.js - Gère l'accès aux données (localStorage / fetch initial)

const DB_KEY = 'b3_projects_db';

export async function initData() {
    let storedData = localStorage.getItem(DB_KEY);
    let data;

    try {
        // Add cache-buster to ensure we get the latest db.json in production
        const response = await fetch(`data/db.json?v=${new Date().getTime()}`);
        if (!response.ok) throw new Error('Erreur chargement json');
        const jsonData = await response.json();
        
        if (!storedData) {
            data = jsonData;
        } else {
            data = JSON.parse(storedData);
            
            // ALWAYS update units, steps, and options from the latest db.json
            data.units = jsonData.units || ["Logiciels", "JVSI", "IA"];
            data.steps = jsonData.steps;
            data.statusOptions = jsonData.statusOptions;

            // Add new students from db.json if they don't exist
            jsonData.students.forEach(newStudent => {
                const existing = data.students.find(s => s.id === newStudent.id);
                if (!existing) {
                    data.students.push(newStudent);
                } else {
                    // Update unit for existing students if they don't have one
                    if (!existing.unit && newStudent.unit) {
                        existing.unit = newStudent.unit;
                    }
                }
            });
        }

        // Initialize empty statuses for all students
        data.students.forEach(student => {
            if (!student.stepsStatus) student.stepsStatus = {};
            data.steps.forEach(step => {
                if (!student.stepsStatus[step.id]) {
                    student.stepsStatus[step.id] = "Non commencé";
                }
            });
            if (!student.unit) student.unit = "Logiciels";
        });

        localStorage.setItem(DB_KEY, JSON.stringify(data));
        return data;
    } catch (error) {
        console.error("Erreur lors de l'initialisation des données:", error);
        if (storedData) {
            data = JSON.parse(storedData);
            // Fallback units if missing in localStorage
            if (!data.units) data.units = ["Logiciels", "JVSI", "IA"];
            return data;
        }
        return null;
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
