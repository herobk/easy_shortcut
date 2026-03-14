let shortcuts = [];

// Load shortcuts from storage
chrome.storage.local.get("shortcuts", (data) => {
    if (data.shortcuts) {
        shortcuts = data.shortcuts;
    }
});

// Listen for storage changes to keep shortcuts updated
chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.shortcuts) {
        shortcuts = changes.shortcuts.newValue;
    }
});

// Key listener
window.addEventListener("keydown", (event) => {
    // Ignore if user is typing in an input field
    const activeElement = document.activeElement;
    if (activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA" || activeElement.isContentEditable) {
        return;
    }

    const pressedCombo = getComboString(event);
    const match = shortcuts.find(s => s.combo === pressedCombo);

    if (match) {
        event.preventDefault();
        event.stopPropagation();
        chrome.runtime.sendMessage({ type: "EXECUTE_ACTION", action: match.action });
    }
}, true);

function getComboString(event) {
    const parts = [];
    if (event.ctrlKey) parts.push("Ctrl");
    if (event.shiftKey) parts.push("Shift");
    if (event.altKey) parts.push("Alt");
    if (event.metaKey) parts.push("Meta");

    // Use code instead of key to avoid issues with different layouts/caps lock
    parts.push(event.code);

    return parts.join("+");
}
