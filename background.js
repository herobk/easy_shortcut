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
  console.log("Background handling action:", action, "for tab:", tab.id);

  try {
    switch (action) {
      case "pin_tab":
        await chrome.tabs.update(tab.id, { pinned: !tab.pinned });
        break;
      case "duplicate_tab":
        await chrome.tabs.duplicate(tab.id);
        break;
      case "close_other_tabs": {
        const tabs = await chrome.tabs.query({ windowId: tab.windowId });
        const otherTabIds = tabs
          .filter(t => t.id !== tab.id && !t.pinned) // Don't close current or pinned tabs
          .map(t => t.id);

        console.log("Tabs to remove:", otherTabIds);
        if (otherTabIds.length > 0) {
          await chrome.tabs.remove(otherTabIds);
        }
        break;
      }
      default:
        console.warn("Unknown action:", action);
    }
  } catch (error) {
    console.error("Error executing action:", action, error);
  }
}
