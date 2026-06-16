// --- VIEW SWITCHER ---
function switchView(workspaceId) {
    document.querySelectorAll('.workspace, #dashboard').forEach(section => {
        section.classList.add('hidden');
    });
    document.getElementById(workspaceId).classList.remove('hidden');
    
    // Stop audio if leaving workspace
    if (workspaceId === 'dashboard') {
        audioPlayer.pause();
    }
}

// --- LOCAL STORAGE PROGRESS SYSTEM ---
// Automatically loads your project when the page opens!
window.addEventListener('DOMContentLoaded', () => {
    const savedData = localStorage.getItem('fnf_mod_project');
    if (savedData) {
        activeModData = JSON.parse(savedData);
        document.getElementById('bpm-input').value = activeModData.bpm;
        console.log("🎒 Loaded your saved project safely from browser storage! Total notes:", activeModData.notes.length);
    }
    // Start our animation rendering loop
    updateVisualTimeline();
});

function saveProjectToBrowser() {
    localStorage.setItem('fnf_mod_project', JSON.stringify(activeModData));
    console.log("💾 Project auto-saved to browser cache!");
}


// --- FNF LIVE RECORDER & ENGINE CORE ---
const audioPlayer = document.getElementById('song-audio');
const audioUpload = document.getElementById('audio-upload');
const timelineArea = document.getElementById('live-notes-area');

let activeModData = {
    bpm: 150,
    notes: [] // Dynamic array tracking: { time: ms, key: 0-3, length: ms }
};

// Handle picking an audio file from your Mac
audioUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        audioPlayer.src = URL.createObjectURL(file);
    }
});

// Sync BPM box
document.getElementById('bpm-input').addEventListener('input', (e) => {
    activeModData.bpm = parseInt(e.target.value) || 150;
    saveProjectToBrowser();
});

// Control Keys Map (0: Left, 1: Down, 2: Up, 3: Right)
const keyMap = {
    'd': 0, 'ArrowLeft': 0,
    'f': 1, 'ArrowDown': 1,
    'j': 2, 'ArrowUp': 2,
    'k': 3, 'ArrowRight': 3
};

let activeHolds = {}; 

// --- DETECT INPUTS & MEASURE HOLD TIME ---
window.addEventListener('keydown', (e) => {
    if (e.key === ' ' && document.activeElement !== document.getElementById('bpm-input')) {
        e.preventDefault();
        if (audioPlayer.paused) audioPlayer.play();
        else audioPlayer.pause();
        return;
    }

    const lane = keyMap[e.key];
    if (lane !== undefined && !activeHolds[lane]) {
        const receptor = document.querySelector(`.receptor[data-key="${lane}"]`);
        if (receptor) receptor.classList.add('active');

        // Only record note data if music is running
        if (!audioPlayer.paused) {
            const pressTime = audioPlayer.currentTime * 1000;
            activeHolds[lane] = { startTime: pressTime, key: lane };
        }
    }
});

window.addEventListener('keyup', (e) => {
    const lane = keyMap[e.key];
    if (lane !== undefined) {
        const receptor = document.querySelector(`.receptor[data-key="${lane}"]`);
        if (receptor) receptor.classList.remove('active');

        if (activeHolds[lane] && !audioPlayer.paused) {
            const releaseTime = audioPlayer.currentTime * 1000;
            const holdLength = releaseTime - activeHolds[lane].startTime;

            const newNote = {
                time: Math.round(activeHolds[lane].startTime),
                key: lane,
                length: Math.round(holdLength > 150 ? holdLength : 0) // Registers hold if held over 150ms
            };

            activeModData.notes.push(newNote);
            
            // Sort notes chronological so engine plays them cleanly
            activeModData.notes.sort((a, b) => a.time - b.time);
            
            saveProjectToBrowser(); // Save instantly!
            delete activeHolds[lane];
        }
    }
});


// --- REAL-TIME VISUAL SCROLLING ENGINE ---
// This loop constantly clears and recalculates where your arrows belong on screen based on audio track time
function updateVisualTimeline() {
    // Clear last frame's rendering
    timelineArea.innerHTML = '';

    if (activeModData.notes.length > 0) {
        const currentTimeMs = audioPlayer.currentTime * 1000;
        
        // FNF Scroll Speed Multiplier
        const scrollSpeed = 0.35; 

        activeModData.notes.forEach(note => {
            // Distance calculations between note time and music current playback point
            const timeDifference = note.time - currentTimeMs;
            
            // Render window: show upcoming notes up to 1000ms ahead, and past notes up to 200ms behind
            if (timeDifference > -200 && timeDifference < 1000) {
                const visualNote = document.createElement('div');
                visualNote.className = `live-note note-${note.key}`;
                
                // Target line is at top: 20px. Upcoming notes spawn below and slide UP.
                // As timeDifference hits 0, top position hits exactly 20px!
                const calculatedTop = 20 + (timeDifference * scrollSpeed);
                visualNote.style.top = `${calculatedTop}px`;
                
                // If it's a long hold note, draw the sustain tail!
                if (note.length > 0) {
                    visualNote.style.height = `${note.length * scrollSpeed}px`;
                    visualNote.style.borderRadius = '4px';
                }

                timelineArea.appendChild(visualNote);
            }
        });
    }

    // Keep loop running seamlessly alongside browser screen refresh rate
    requestAnimationFrame(updateVisualTimeline);
}

// Real GitHub login system requires backend servers, so let's tie this button to your cloud profile profile name for now!
function loginWithGitHub() {
    const user = prompt("Enter your Dev Name / Team Studio Name:");
    if (user) {
        document.getElementById('login-btn').classList.add('hidden');
        document.getElementById('user-status').classList.remove('hidden');
        document.getElementById('username').innerText = user;
    }
}
