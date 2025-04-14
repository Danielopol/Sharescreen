// background.js with content script injection
console.log('Background script loaded');

// Create context menu on installation
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "screenshot-share",
    title: "Share screenshot",
    contexts: ["all"]
  });
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "screenshot-share") {
    console.log("Taking screenshot of tab:", tab.id);
    
    // Capture the visible tab
    chrome.tabs.captureVisibleTab({ format: "png" }, (dataUrl) => {
      if (chrome.runtime.lastError) {
        console.error("Screenshot capture error:", chrome.runtime.lastError);
        return;
      }
      
      console.log("Screenshot captured");
      
      // Save to storage first
      chrome.storage.local.set({ 
        "last_screenshot": {
          url: dataUrl,
          timestamp: Date.now()
        }
      });
      
      // Update badge to indicate a screenshot is ready
      chrome.action.setBadgeText({ text: "1" });
      chrome.action.setBadgeBackgroundColor({ color: "#4CAF50" });
      
      // Now use executeScript to show a notification directly
      // This approach doesn't require a pre-loaded content script
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: showNotificationOnPage,
        args: ["Screenshot captured! Click extension icon to view."]
      }).catch(err => {
        console.error("Execute script error:", err);
      });
    });
  }
});

// This function will be injected into the page
function showNotificationOnPage(message) {
  // Create notification element
  const notification = document.createElement('div');
  notification.style.position = 'fixed';
  notification.style.top = '20px';
  notification.style.right = '20px';
  notification.style.zIndex = '9999';
  notification.style.padding = '15px 20px';
  notification.style.borderRadius = '4px';
  notification.style.backgroundColor = '#4CAF50';
  notification.style.color = 'white';
  notification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
  notification.style.transition = 'opacity 0.3s ease-in-out';
  notification.style.fontSize = '14px';
  notification.textContent = message;
  
  // Add to page
  document.body.appendChild(notification);
  
  // Remove after 5 seconds
  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 5000);
  
  return "Notification shown";
}