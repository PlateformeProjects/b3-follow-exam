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
            
            // Migration: S'assurer que chaque étudiant a un teamId
            let hasChanged = false;
            cachedData.students.forEach(student => {
                if (student.teamId === undefined) {
                    student.teamId = null;
                    hasChanged = true;
                }
            });

            // S'assurer que 'Web' est ajouté aux unités existantes
            if (cachedData.units && !cachedData.units.includes("Web")) {
                cachedData.units.push("Web");
                hasChanged = true;
            }

            if (hasChanged) {
                await setDoc(docRef, cachedData);
            }
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
                if (student.teamId === undefined) student.teamId = null;
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
        const student = data.students[studentIndex];
        
        // Mise à jour de l'étudiant actuel
        student.stepsStatus = stepsStatus;
        if (techStack !== undefined) student.techStack = techStack;
        if (projectTitle !== undefined) student.projectTitle = projectTitle;
        if (name !== undefined) student.name = name;
        if (unit !== undefined) student.unit = unit;
        if (comments !== undefined) student.comments = comments;
        
        // Si l'étudiant fait partie d'une équipe, synchroniser les informations du projet
        if (student.teamId) {
            data.students.forEach(s => {
                if (s.teamId === student.teamId && s.id !== student.id) {
                    s.stepsStatus = stepsStatus;
                    s.techStack = techStack;
                    s.projectTitle = projectTitle;
                    // On ne synchronise pas le nom ni les commentaires individuels
                }
            });
        }

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
        teamId: null,
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

export async function setPartner(studentId, partnerId) {
    if (!cachedData) return false;

    const data = { ...cachedData };
    const student = data.students.find(s => s.id === parseInt(studentId));
    
    // Si partnerId est null, l'étudiant quitte son équipe
    if (partnerId === null) {
        const oldTeamId = student.teamId;
        student.teamId = null;
        
        // Vérifier si l'ancienne équipe n'a plus qu'un seul membre
        if (oldTeamId) {
            const remainingMembers = data.students.filter(s => s.teamId === oldTeamId);
            if (remainingMembers.length === 1) {
                remainingMembers[0].teamId = null;
            }
        }
    } else {
        const partner = data.students.find(s => s.id === parseInt(partnerId));
        if (!partner) return false;

        // Définir ou réutiliser un teamId
        const teamId = partner.teamId || `team_${Date.now()}`;
        
        student.teamId = teamId;
        partner.teamId = teamId;

        // Synchroniser les données du projet (on prend celles du partenaire par défaut)
        student.projectTitle = partner.projectTitle;
        student.techStack = partner.techStack;
        student.stepsStatus = { ...partner.stepsStatus };
    }

    try {
        const docRef = doc(db, "projects", DOC_ID);
        await setDoc(docRef, data);
        cachedData = data;
        return true;
    } catch (error) {
        console.error("Erreur mise à jour partenaire:", error);
        return false;
    }
}
