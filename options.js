let currentShortcuts = [];
let recordedCombo = "";

const recorderEl = document.getElementById("key-recorder");
const addBtn = document.getElementById("add-btn");
const actionSelect = document.getElementById("action-select");
const container = document.getElementById("shortcuts-container");
const statusMsg = document.getElementById("status-msg");

// Load shortcuts
function refreshList() {
    chrome.storage.local.get("shortcuts", (data) => {
        currentShortcuts = data.shortcuts || [];
        renderShortcuts();
    });
}

function renderShortcuts() {
    container.innerHTML = "";
    currentShortcuts.forEach((s, index) => {
        const card = document.createElement("div");
        card.className = "shortcut-card";
        card.innerHTML = `
      <div class="info">
        <span class="action-label">${s.label}</span>
        <div><span class="combo-tag">${s.combo}</span></div>
      </div>
      <button class="del-btn" data-index="${index}">&times;</button>
    `;
        container.appendChild(card);
    });
}

// Recording logic
recorderEl.addEventListener("click", () => {
    recorderEl.classList.add("recording");
    recorderEl.innerText = "Recording... Press keys";
    recorderEl.focus();
});

recorderEl.addEventListener("keydown", (e) => {
    if (!recorderEl.classList.contains("recording")) return;

    e.preventDefault();
    e.stopPropagation();

    const parts = [];
    if (e.ctrlKey) parts.push("Ctrl");
    if (e.shiftKey) parts.push("Shift");
    if (e.altKey) parts.push("Alt");
    if (e.metaKey) parts.push("Meta");

    // Use code to be layout-independent
    if (!["Control", "Shift", "Alt", "Meta"].includes(e.key)) {
        parts.push(e.code);
        recordedCombo = parts.join("+");
        recorderEl.innerText = recordedCombo;
        recorderEl.classList.remove("recording");
    }
});

recorderEl.addEventListener("blur", () => {
    if (recorderEl.classList.contains("recording")) {
        recorderEl.classList.remove("recording");
        recorderEl.innerText = recordedCombo || "Click & Press keys...";
    }
});

// Add shortcut logic
function handleAddShortcut() {
    if (!recordedCombo) {
        showStatus("Please record a shortcut first!");
        return;
    }

    const action = actionSelect.value;
    const label = actionSelect.options[actionSelect.selectedIndex].text;

    // 1. Check if this combo is already used by ANOTHER action
    const existingComboIndex = currentShortcuts.findIndex(s => s.combo === recordedCombo && s.action !== action);
    if (existingComboIndex !== -1) {
        showStatus(`Already used for: ${currentShortcuts[existingComboIndex].label}`);
        return;
    }

    // 2. Check if this ACTION already has a shortcut
    const existingActionIndex = currentShortcuts.findIndex(s => s.action === action);

    if (existingActionIndex !== -1) {
        // Override
        currentShortcuts[existingActionIndex].combo = recordedCombo;
        showStatus("Shortcut updated!");
    } else {
        // Add new
        currentShortcuts.push({
            combo: recordedCombo,
            action: action,
            label: label
        });
        showStatus("Shortcut saved!");
    }

    chrome.storage.local.set({ shortcuts: currentShortcuts }, () => {
        recordedCombo = "";
        recorderEl.innerText = "Click & Press keys...";
        refreshList();
    });
}

addBtn.addEventListener("click", handleAddShortcut);

// Global listener for Enter key
window.addEventListener("keydown", (e) => {
    // Check if Enter is pressed and we are NOT in recording mode
    if (e.key === "Enter" && !recorderEl.classList.contains("recording")) {
        handleAddShortcut();
    }
});

// Delete shortcut
container.addEventListener("click", (e) => {
    if (e.target.classList.contains("del-btn")) {
        const index = parseInt(e.target.getAttribute("data-index"));
        currentShortcuts.splice(index, 1);
        chrome.storage.local.set({ shortcuts: currentShortcuts }, () => {
            refreshList();
            showStatus("Shortcut removed.");
        });
    }
});

function showStatus(msg) {
    statusMsg.innerText = msg;
    setTimeout(() => {
        if (statusMsg.innerText === msg) statusMsg.innerText = "";
    }, 3000);
}

// Initial load
refreshList();
