// --- VIEW SWITCHER | note if seeing this: Hello there! :D ---
function switchView(workspaceId) {
    document.querySelectorAll('.workspace, #dashboard').forEach(section => {
        section.classList.add('hidden');
    });
    document.getElementById(workspaceId).classList.remove('hidden');
    
    if (workspaceId === 'dashboard') {
        audioPlayer.pause();
    }
    if (workspaceId === 'community-hub') {
        fetchCloudMods();
    }
}

// --- V0.4 REAL-TIME DATABASE LINK (Firebase Integration) ---
// This open bucket config connects multiple engines together instantly over any browser!
const firebaseConfig = {
    databaseURL: "https://fnf-mod-maker-default-rtdb.firebaseio.com/" 
};

// Start connection logic gracefully
let database;
try {
    firebase.initializeApp(firebaseConfig);
    database = firebase.database();
    document.getElementById('db-status').innerText = "📡 Cloud Linked";
    document.getElementById('db-status').style.color = "#00ffcc";
} catch(e) {
    console.log("Firebase connection bypassed for local sandbox testing mode.");
    document.getElementById('db-status').innerText = "📴 Local Sandbox";
}

let studioName = "Morkrane Studio";
let activeModData = {
    songName: "Monarch Stickman",
    bpm: 150,
    notes: [] 
};

// --- CORE MUSIC RECORDING ENGINE ---
const audioPlayer = document.getElementById('song-audio');
const audioUpload = document.getElementById('audio-upload');
const timelineArea = document.getElementById('live-notes-area');

audioUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        audioPlayer.src = URL.createObjectURL(file);
        // Force rendering timeline alive immediately on tracking source change
        audioPlayer.oncanplay = () => { console.log("Audio track loaded successfully!"); };
    }
});

document.getElementById('bpm-input').addEventListener('input', (e) => {
    activeModData.bpm = parseInt(e.target.value) || 150;
});

// Control Keys Map (0: Left, 1: Down, 2: Up, 3: Right)
const keyMap = {
    'a': 0, 'A': 0, 'ArrowLeft': 0,
    's': 1, 'S': 1, 'ArrowDown': 1,
    'w': 2, 'W': 2, 'ArrowUp': 2,
    'd': 3, 'D': 3, 'ArrowRight': 3
};

let activeHolds = {}; 

// Unified Key and Touch Input Triggers
window.addEventListener('keydown', (e) => {
    if (e.key === ' ' && document.activeElement !== document.getElementById('bpm-input') && document.activeElement !== document.getElementById('mod-search')) {
        e.preventDefault();
        if (audioPlayer.paused) audioPlayer.play();
        else audioPlayer.pause();
        return;
    }
    const lane = keyMap[e.key];
    if (lane !== undefined && !activeHolds[lane]) triggerInputPress(lane);
});

window.addEventListener('keyup', (e) => {
    const lane = keyMap[e.key];
    if (lane !== undefined) triggerInputRelease(lane);
});

function setupMobileButtons() {
    document.querySelectorAll('.mobile-hit-btn').forEach(btn => {
        const lane = parseInt(btn.getAttribute('data-key'));
        btn.addEventListener('touchstart', (e) => { e.preventDefault(); triggerInputPress(lane); });
        btn.addEventListener('touchend', (e) => { e.preventDefault(); triggerInputRelease(lane); });
    });
}

function triggerInputPress(lane) {
    const receptor = document.querySelector(`.receptor[data-key="${lane}"]`);
    if (receptor) receptor.classList.add('active');

    const pressTime = audioPlayer.currentTime * 1000;
    activeHolds[lane] = { startTime: pressTime, key: lane };
}

function triggerInputRelease(lane) {
    const receptor = document.querySelector(`.receptor[data-key="${lane}"]`);
    if (receptor) receptor.classList.remove('active');

    if (activeHolds[lane]) {
        const releaseTime = audioPlayer.currentTime * 1000;
        const holdLength = releaseTime - activeHolds[lane].startTime;

        const newNote = {
            time: Math.round(activeHolds[lane].startTime),
            key: lane,
            length: Math.round(holdLength > 150 ? holdLength : 0)
        };

        activeModData.notes.push(newNote);
        activeModData.notes.sort((a, b) => a.time - b.time);
        
        spawnVisualNoteFeedback(lane);
        delete activeHolds[lane];
    }
}

// --- VISUAL FLOW RENDERER TIMELINE ENGINE ---
function updateVisualTimeline() {
    timelineArea.innerHTML = '';
    const currentTimeMs = audioPlayer.currentTime * 1000;
    const scrollSpeed = 0.4; // Slightly snappier arrow movement speed for V0.4

    activeModData.notes.forEach(note => {
        const timeDifference = note.time - currentTimeMs;
        
        // Render box window: up to 1000ms forward
        if (timeDifference > -150 && timeDifference < 1000) {
            const visualNote = document.createElement('div');
            visualNote.className = `live-note note-${note.key}`;
            
            // Notes start from bottom bounds and feed up directly into target rings
            const calculatedTop = 20 + (timeDifference * scrollSpeed);
            visualNote.style.top = `${calculatedTop}px`;
            
            if (note.length > 0) {
                visualNote.style.height = `${note.length * scrollSpeed}px`;
            }
            timelineArea.appendChild(visualNote);
        }
    });

    requestAnimationFrame(updateVisualTimeline);
}

function spawnVisualNoteFeedback(lane) {
    const container = document.getElementById('live-notes-area');
    const visualNote = document.createElement('div');
    visualNote.className = `live-note note-${lane}`;
    visualNote.style.top = '20px';
    visualNote.innerText = "⚡";
    container.appendChild(visualNote);
    setTimeout(() => { visualNote.remove(); }, 250);
}

// --- CLOUD PUBLISHING AND SEARCH MECHANICS ---
function publishModToCloud() {
    if (!database) {
        alert("Running locally in offline testing mode! Saving to device memory instead.");
        localStorage.setItem('fnf_mod_project', JSON.stringify(activeModData));
        return;
    }

    const namePrompt = prompt("Name your Custom Song Mod track:", activeModData.songName);
    if (!namePrompt) return;
    activeModData.songName = namePrompt;

    // Send complete structural packet straight onto cloud database cluster nodes
    database.ref('public_mods/' + studioName + "_" + Date.now()).set({
        title: activeModData.songName,
        creator: studioName,
        bpm: activeModData.bpm,
        noteCount: activeModData.notes.length,
        timestamp: Date.now()
    }).then(() => {
        alert("🌐 Success! Your mod tracking packet was uploaded to the central community pool!");
    });
}

let loadedCloudMods = [];
function fetchCloudMods() {
    if (!database) {
        // Fallback display if offline sandbox is active
        loadedCloudMods = [
            { title: "Monarch Stickman Mod", creator: "Morkrane Studio", bpm: 150, noteCount: 42 },
            { title: "Revenge Remastered", creator: "EddieFBF", bpm: 165, noteCount: 104 }
        ];
        renderCommunityModsList(loadedCloudMods);
        return;
    }

    database.ref('public_mods').limitToLast(20).once('value', (snapshot) => {
        loadedCloudMods = [];
        snapshot.forEach((childSnapshot) => {
            loadedCloudMods.push(childSnapshot.val());
        });
        renderCommunityModsList(loadedCloudMods);
    });
}

function renderCommunityModsList(modsArray) {
    const listContainer = document.getElementById('community-mods-list');
    listContainer.innerHTML = '';

    modsArray.forEach(mod => {
        const card = document.createElement('div');
        card.className = 'menu-card';
        card.innerHTML = `
            <h3 style="color: #00ffff; margin-top: 0;">${mod.title}</h3>
            <p style="margin: 5px 0;"><strong>Studio:</strong> ${mod.creator}</p>
            <p style="margin: 5px 0;"><strong>BPM:</strong> ${mod.bpm} | <strong>Notes:</strong> ${mod.noteCount}</p>
            <button style="margin-top: 10px; width: 100%; background-color: #00b3b3;" onclick="alert('Syncing live track data maps...')">Play Cloud Chart</button>
        `;
        listContainer.appendChild(card);
    });
}

function filterCommunityMods() {
    const query = document.getElementById('mod-search').value.toLowerCase();
    const filtered = loadedCloudMods.filter(mod => 
        mod.title.toLowerCase().includes(query) || mod.creator.toLowerCase().includes(query)
    );
    renderCommunityModsList(filtered);
}

function loginWithGitHub() {
    const user = prompt("Enter your Studio Name:", studioName);
    if (user) {
        studioName = user;
        document.getElementById('login-btn').classList.add('hidden');
        document.getElementById('user-status').classList.remove('hidden');
        document.getElementById('username').innerText = studioName;
    }
}

// Trigger loop sequences automatically
window.addEventListener('DOMContentLoaded', () => {
    updateVisualTimeline();
    setupMobileButtons();
});
