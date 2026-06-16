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
        renderCommunityMods();
    }
}

// --- LOCAL STORAGE PROGRESS SYSTEM ---
window.addEventListener('DOMContentLoaded', () => {
    const savedData = localStorage.getItem('fnf_mod_project');
    if (savedData) {
        activeModData = JSON.parse(savedData);
        document.getElementById('bpm-input').value = activeModData.bpm || 150;
        console.log("🎒 Project parsed from internal browser memory. Total notes:", activeModData.notes.length);
    }
    // Fire up continuous timeline drawing engine loop
    updateVisualTimeline();
    setupMobileButtons();
});

function saveProjectToBrowser(manualClick = false) {
    localStorage.setItem('fnf_mod_project', JSON.stringify(activeModData));
    if (manualClick) {
        alert("💾 Progress successfully saved locally to your device browser!");
    }
}

// --- FNF LIVE RECORDER & ENGINE CORE ---
const audioPlayer = document.getElementById('song-audio');
const audioUpload = document.getElementById('audio-upload');
const timelineArea = document.getElementById('live-notes-area');

let activeModData = {
    bpm: 150,
    notes: [] // Array tracking: { time: ms, key: 0-3, length: ms }
};

audioUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        audioPlayer.src = URL.createObjectURL(file);
    }
});

document.getElementById('bpm-input').addEventListener('input', (e) => {
    activeModData.bpm = parseInt(e.target.value) || 150;
    saveProjectToBrowser();
});

// --- NEW V0.2 CONTROLS Scheme: WASD & Arrows ---
// 0: Left, 1: Down, 2: Up, 3: Right
const keyMap = {
    'a': 0, 'A': 0, 'ArrowLeft': 0,
    's': 1, 'S': 1, 'ArrowDown': 1,
    'w': 2, 'W': 2, 'ArrowUp': 2,
    'd': 3, 'D': 3, 'ArrowRight': 3
};

let activeHolds = {}; 

// Keyboard Down Handler
window.addEventListener('keydown', (e) => {
    if (e.key === ' ' && document.activeElement !== document.getElementById('bpm-input') && document.activeElement !== document.getElementById('mod-search')) {
        e.preventDefault();
        if (audioPlayer.paused) audioPlayer.play();
        else audioPlayer.pause();
        return;
    }

    const lane = keyMap[e.key];
    if (lane !== undefined && !activeHolds[lane]) {
        triggerInputPress(lane);
    }
});

// Keyboard Up Handler
window.addEventListener('keyup', (e) => {
    const lane = keyMap[e.key];
    if (lane !== undefined) {
        triggerInputRelease(lane);
    }
});

// --- MOBILE COMPATIBILITY HOOKS ---
function setupMobileButtons() {
    const mobileButtons = document.querySelectorAll('.mobile-hit-btn');
    
    mobileButtons.forEach(btn => {
        const lane = parseInt(btn.getAttribute('data-key'));
        
        // Mobile Tap Down
        btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            triggerInputPress(lane);
        });
        
        // Mobile Release
        btn.addEventListener('touchend', (e) => {
            e.preventDefault();
            triggerInputRelease(lane);
        });
    });
}

// Unified input trigger handlers for perfect synchronization
function triggerInputPress(lane) {
    const receptor = document.querySelector(`.receptor[data-key="${lane}"]`);
    if (receptor) receptor.classList.add('active');

    if (!audioPlayer.paused) {
        const pressTime = audioPlayer.currentTime * 1000;
        activeHolds[lane] = { startTime: pressTime, key: lane };
    }
}

function triggerInputRelease(lane) {
    const receptor = document.querySelector(`.receptor[data-key="${lane}"]`);
    if (receptor) receptor.classList.remove('active');

    if (activeHolds[lane] && !audioPlayer.paused) {
        const releaseTime = audioPlayer.currentTime * 1000;
        const holdLength = releaseTime - activeHolds[lane].startTime;

        const newNote = {
            time: Math.round(activeHolds[lane].startTime),
            key: lane,
            length: Math.round(holdLength > 150 ? holdLength : 0)
        };

        activeModData.notes.push(newNote);
        activeModData.notes.sort((a, b) => a.time - b.time);
        
        saveProjectToBrowser();
        spawnVisualNoteFeedback(lane);
        delete activeHolds[lane];
    }
}

// --- TIMELINE RENDERING LOOP ---
function updateVisualTimeline() {
    timelineArea.innerHTML = '';
    const currentTimeMs = audioPlayer.currentTime * 1000;
    const scrollSpeed = 0.35; 

    activeModData.notes.forEach(note => {
        const timeDifference = note.time - currentTimeMs;
        
        if (timeDifference > -200 && timeDifference < 1000) {
            const visualNote = document.createElement('div');
            visualNote.className = `live-note note-${note.key}`;
            
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
    visualNote.innerText = "⭐";
    container.appendChild(visualNote);
    setTimeout(() => { visualNote.remove(); }, 300);
}

// --- V0.2 COMMUNITY SEARCH ENGINE ---
// Static placeholder server mods for filtering tests
const mockCommunityMods = [
    { name: "Monarch Stickman Mod", author: "Morkrane Studio", difficulty: "Hard", weeks: 4 },
    { name: "Revenge Remastered", author: "EddieFBF", difficulty: "Expert", weeks: 1 },
    { name: "Forsaken Corruption", author: "Hacker_Twins", difficulty: "Insane", weeks: 2 },
    { name: "VibeCheck Test Beat", author: "PixelDev", difficulty: "Normal", weeks: 1 }
];

function renderCommunityMods(filterText = "") {
    const listContainer = document.getElementById('community-mods-list');
    listContainer.innerHTML = '';
    
    const filtered = mockCommunityMods.filter(mod => 
        mod.name.toLowerCase().includes(filterText.toLowerCase()) || 
        mod.author.toLowerCase().includes(filterText.toLowerCase())
    );

    if (filtered.length === 0) {
        listContainer.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #777;">No matching mods found.</p>`;
        return;
    }

    filtered.forEach(mod => {
        const card = document.createElement('div');
        card.className = 'menu-card';
        card.style.cursor = 'default';
        card.innerHTML = `
            <h3 style="color: #00ffff; margin-top: 0;">${mod.name}</h3>
            <p style="margin: 5px 0;"><strong>By:</strong> ${mod.author}</p>
            <p style="margin: 5px 0;"><strong>Weeks:</strong> ${mod.weeks} | <strong>Diff:</strong> ${mod.difficulty}</p>
            <button style="margin-top: 10px; width: 100%; background-color: #00b3b3;" onclick="alert('Downloading mod data packet... Ready!')">Play Mod</button>
        `;
        listContainer.appendChild(card);
    });
}

function filterCommunityMods() {
    const searchInput = document.getElementById('mod-search').value;
    renderCommunityMods(searchInput);
}

function loginWithGitHub() {
    const user = prompt("Enter your Dev Name / Team Studio Name:");
    if (user) {
        document.getElementById('login-btn').classList.add('hidden');
        document.getElementById('user-status').classList.remove('hidden');
        document.getElementById('username').innerText = user;
    }
}
