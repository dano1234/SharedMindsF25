// QuickVibe - Minimal spatial chat powered by Firebase Firestore (modular SDK)
// Students: Paste your own Firebase config below where indicated.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
    getFirestore,
    collection,
    addDoc,
    serverTimestamp,
    onSnapshot,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// =====================
// 1) Firebase Setup
// =====================
// Replace the below placeholder object with YOUR Firebase project's web config.
// How to get it:
// - Go to Firebase console → Your project → Project settings → General → Your apps (Web)
// - Click "+ Add app" if you don't have one, then copy the config
// - Paste it here replacing every value (apiKey, authDomain, projectId, etc.)

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDHOrU4Lrtlmk-Af2svvlP8RiGsGvBLb_Q",
    authDomain: "sharedmindss24.firebaseapp.com",
    databaseURL: "https://sharedmindss24-default-rtdb.firebaseio.com",
    projectId: "sharedmindss24",
    storageBucket: "sharedmindss24.appspot.com",
    messagingSenderId: "1039430447930",
    appId: "1:1039430447930:web:edf98d7d993c21017ad603"
};
// Initialize Firebase and Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// =====================
// 2) DOM Elements
// =====================
const stage = document.getElementById('stage');
const input = document.getElementById('floating-input');

// =====================
// 3) Input positioning
// =====================
let pendingPosition = null; // { x, y } for the next message

stage.addEventListener('click', (ev) => {
    const x = ev.clientX;
    const y = ev.clientY;
    pendingPosition = { x, y };

    // Position and show the floating input
    input.style.left = `${x}px`;
    input.style.top = `${y}px`;
    input.style.display = 'block';
    input.value = '';
    input.focus();
});

// Submit on Enter
input.addEventListener('keydown', async (ev) => {
    if (ev.key !== 'Enter') return;
    const text = input.value.trim();
    if (!text || !pendingPosition) {
        input.style.display = 'none';
        return;
    }

    try {
        await addDoc(collection(db, 'quickvibe_messages'), {
            text,
            x: pendingPosition.x,
            y: pendingPosition.y,
            createdAt: serverTimestamp()
        });
    } catch (e) {
        console.error('Error adding document:', e);
    }

    // Hide input and clear position
    input.style.display = 'none';
    pendingPosition = null;
});

// =====================
// 4) Live Rendering
// =====================
// Render one chat bubble
function renderBubble(id, data) {
    let el = document.querySelector(`[data-id="${id}"]`);
    if (!el) {
        el = document.createElement('div');
        el.className = 'bubble pointer-none';
        el.dataset.id = id;
        stage.appendChild(el);
    }
    el.textContent = data.text || '';
    el.style.left = `${data.x || 0}px`;
    el.style.top = `${data.y || 0}px`;
}

function removeBubble(id) {
    const el = document.querySelector(`[data-id="${id}"]`);
    if (el && el.parentElement) {
        el.parentElement.removeChild(el);
    }
}

// Subscribe to collection changes, newest last
const q = query(collection(db, 'quickvibe_messages'), orderBy('createdAt', 'asc'));
onSnapshot(q, (snap) => {
    // Strategy: render all documents present in the snapshot; remove those not present
    const seen = new Set();
    snap.forEach((doc) => {
        const id = doc.id;
        const data = doc.data();
        seen.add(id);
        renderBubble(id, data);
    });

    // Remove any stale bubbles that aren't in the latest snapshot
    const existing = Array.from(stage.querySelectorAll('.bubble'));
    existing.forEach((el) => {
        const id = el.getAttribute('data-id');
        if (id && !seen.has(id)) {
            removeBubble(id);
        }
    });
});


