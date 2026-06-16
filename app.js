// Simple View Switcher
function switchView(workspaceId) {
    // Hide all workspaces
    document.querySelectorAll('.workspace, #dashboard').forEach(section => {
        section.classList.add('hidden');
    });
    
    // Show the selected workspace
    document.getElementById(workspaceId).classList.remove('hidden');
    
    // If opening the notes workspace, initialize the live listener
    if (workspaceId === 'notes-workspace') {
        startLiveNoteListener();
    }
}

// Mock GitHub Auth for now
function loginWithGitHub() {
    // We will later replace this with real OAuth logic
    const dummyUsername = "FunkinCreator42";
    document.getElementById('login-btn').classList.add('hidden');
    document.getElementById('user-status').classList.remove('hidden');
    document.getElementById('username').innerText = dummyUsername;
    alert(`Successfully synced with GitHub account: ${dummyUsername}! Your progress will auto-save.`);
}

// Global data structure holding the mod progress
let currentModData = {
    songName: "Untitled Track",
    bpm: 150,
    notes: [], // Will hold objects like { time: 1200, key: 0, holdLength: 300 }
    vocals: null,
    inst: null
};

// Placeholder for live recording feature
function startLiveNoteListener() {
    console.log("Live note recording initialized...");
    // Future home of the performance.now() event listeners!
}