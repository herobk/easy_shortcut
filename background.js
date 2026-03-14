// Default shortcuts
const defaultShortcuts = [
  { combo: "Shift+KeyP", action: "pin_tab", label: "Pin/Unpin Tab" },
  { combo: "Alt+KeyD", action: "duplicate_tab", label: "Duplicate Tab" }
];

// Initialize storage with defaults if empty
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get("shortcuts", (data) => {
    if (!data.shortcuts) {
      chrome.storage.local.set({ shortcuts: defaultShortcuts });
    }
  });
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "EXECUTE_ACTION") {
    handleAction(message.action, sender.tab);
  }
});

async function handleAction(action, tab) {
  if (!tab) return;

  switch (action) {
    case "pin_tab":
      chrome.tabs.update(tab.id, { pinned: !tab.pinned });
      break;
    case "duplicate_tab":
      chrome.tabs.duplicate(tab.id);
      break;
    case "close_other_tabs":
      chrome.tabs.query({ windowId: tab.windowId }, (tabs) => {
        const otherTabIds = tabs
          .filter(t => t.id !== tab.id && !t.pinned) // Don't close current or pinned tabs
          .map(t => t.id);
        chrome.tabs.remove(otherTabIds);
      });
      break;
    default:
      console.warn("Unknown action:", action);
  }
}
