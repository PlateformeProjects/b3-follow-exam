// api.js - Gère l'accès aux données (localStorage / fetch initial)

const DB_KEY = 'b3_projects_db';

export async function initData() {
    let data = localStorage.getItem(DB_KEY);
    if (!data) {
        try {
            const response = await fetch('data/db.json');
            if (!response.ok) throw new Error('Erreur chargement json');
            const jsonData = await response.json();
            
            // Initialize empty statuses if not present
            jsonData.students.forEach(student => {
                if (!student.stepsStatus) student.stepsStatus = {};
                jsonData.steps.forEach(step => {
                    if (!student.stepsStatus[step.id]) {
                        student.stepsStatus[step.id] = "Non commencé";
                    }
                });
            });

            localStorage.setItem(DB_KEY, JSON.stringify(jsonData));
            data = jsonData;
        } catch (error) {
            console.error("Impossible de charger les données initiales", error);
            return null;
        }
    } else {
        data = JSON.parse(data);
    }
    return data;
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
