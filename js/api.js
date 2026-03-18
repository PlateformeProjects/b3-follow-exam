// api.js - Gère l'accès aux données (Firebase Firestore)
import { 
    doc, 
    getDoc, 
    setDoc, 
    onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { db } from './firebase-config.js';

const DOC_ID = 'current_projects';
let cachedData = null;

export async function initData() {
    try {
        const docRef = doc(db, "projects", DOC_ID);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            cachedData = docSnap.data();
        } else {
            // Premier chargement : initialisation depuis db.json
            const response = await fetch('data/db.json');
            const jsonData = await response.json();
            
            // Initialisation des statuts
            jsonData.students.forEach(student => {
                if (!student.stepsStatus) student.stepsStatus = {};
                if (student.techStack === undefined) student.techStack = "";
                if (student.projectTitle === undefined) student.projectTitle = "";
                if (student.comments === undefined) student.comments = "";
                jsonData.steps.forEach(step => {
                    if (!student.stepsStatus[step.id]) {
                        student.stepsStatus[step.id] = "Non commencé";
                    }
                });
                if (!student.unit) student.unit = "Logiciels";
            });

            await setDoc(docRef, jsonData);
            cachedData = jsonData;
        }
        return cachedData;
    } catch (error) {
        console.error("Erreur Firestore Init:", error);
        return null;
    }
}

// Pour écouter les mises à jour en temps réel
export function subscribeToData(callback) {
    const docRef = doc(db, "projects", DOC_ID);
    return onSnapshot(docRef, (doc) => {
        if (doc.exists()) {
            cachedData = doc.data();
            callback(cachedData);
        }
    });
}

export function getData() {
    return cachedData;
}

export function getStudentById(id) {
    if (!cachedData) return null;
    return cachedData.students.find(s => s.id === parseInt(id));
}

export async function updateStudentStatus(studentId, stepsStatus, techStack, projectTitle, name, unit, comments) {
    if (!cachedData) return false;

    const data = { ...cachedData };
    const studentIndex = data.students.findIndex(s => s.id === parseInt(studentId));
    
    if (studentIndex !== -1) {
        data.students[studentIndex].stepsStatus = stepsStatus;
        if (techStack !== undefined) data.students[studentIndex].techStack = techStack;
        if (projectTitle !== undefined) data.students[studentIndex].projectTitle = projectTitle;
        if (name !== undefined) data.students[studentIndex].name = name;
        if (unit !== undefined) data.students[studentIndex].unit = unit;
        if (comments !== undefined) data.students[studentIndex].comments = comments;
        
        try {
            const docRef = doc(db, "projects", DOC_ID);
            await setDoc(docRef, data);
            cachedData = data;
            return true;
        } catch (error) {
            console.error("Erreur mise à jour Firestore:", error);
            return false;
        }
    }
    return false;
}

export async function deleteStudent(studentId) {
    if (!cachedData) return false;

    const data = { ...cachedData };
    data.students = data.students.filter(s => s.id !== parseInt(studentId));

    try {
        const docRef = doc(db, "projects", DOC_ID);
        await setDoc(docRef, data);
        cachedData = data;
        return true;
    } catch (error) {
        console.error("Erreur suppression Firestore:", error);
        return false;
    }
}

export async function addStudent(name, unit) {
    if (!cachedData) return false;

    const newStudent = {
        id: Date.now(), // ID unique basé sur le timestamp
        name: name,
        unit: unit,
        techStack: "",
        projectTitle: "",
        comments: "",
        stepsStatus: {}
    };

    // Initialiser les étapes à "Non commencé"
    cachedData.steps.forEach(step => {
        newStudent.stepsStatus[step.id] = "Non commencé";
    });

    const data = { ...cachedData };
    data.students.push(newStudent);

    try {
        const docRef = doc(db, "projects", DOC_ID);
        await setDoc(docRef, data);
        cachedData = data;
        return true;
    } catch (error) {
        console.error("Erreur ajout élève Firestore:", error);
        return false;
    }
}
