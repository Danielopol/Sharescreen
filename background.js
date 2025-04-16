// background.js with fixed region selection feature
console.log('Background script loaded');

// Create context menu on installation
chrome.runtime.onInstalled.addListener(() => {
  // Full page screenshot option
  chrome.contextMenus.create({
    id: "screenshot-share",
    title: "Share full page screenshot",
    contexts: ["all"]
  });
  
  // Region screenshot option
  chrome.contextMenus.create({
    id: "screenshot-region",
    title: "Share region screenshot",
    contexts: ["all"]
  });
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "screenshot-share") {
    captureFullPage(tab);
  } else if (info.menuItemId === "screenshot-region") {
    // Inject the region selection script
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['region-selector.js']
    }).catch(err => {
      console.error("Failed to inject region selector:", err);
    });
  }
});

// Capture full page screenshot
function captureFullPage(tab) {
  console.log("Taking screenshot of tab:", tab.id);
  
  // Capture the visible tab
  chrome.tabs.captureVisibleTab({ format: "png" }, (dataUrl) => {
    if (chrome.runtime.lastError) {
      console.error("Screenshot capture error:", chrome.runtime.lastError);
      return;
    }
    
    console.log("Screenshot captured");
    
    // Save to storage
    chrome.storage.local.set({ 
      "last_screenshot": {
        url: dataUrl,
        timestamp: Date.now()
      }
    });
    
    // Update badge to indicate a screenshot is ready
    chrome.action.setBadgeText({ text: "1" });
    chrome.action.setBadgeBackgroundColor({ color: "#4CAF50" });
    
    // Show notification
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: showNotificationOnPage,
      args: ["Screenshot captured! Click extension icon to view."]
    }).catch(err => {
      console.error("Execute script error:", err);
    });
  });
}

// This function will be injected to show notifications
function showNotificationOnPage(message) {
  // Create notification element
  const notification = document.createElement('div');
  notification.style.position = 'fixed';
  notification.style.top = '20px';
  notification.style.right = '20px';
  notification.style.zIndex = '999999';
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

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "capture-region") {
    const region = message.region;
    console.log("Received region coordinates:", region);
    
    // Capture visible tab
    chrome.tabs.captureVisibleTab({ format: "png" }, (dataUrl) => {
      // Since we can't use the Image constructor in the background script,
      // we'll inject a script into the tab to do the cropping
      chrome.scripting.executeScript({
        target: { tabId: sender.tab.id },
        func: cropAndSaveImage,
        args: [dataUrl, region]
      }).catch(err => {
        console.error("Error executing crop script:", err);
      });
    });
    
    sendResponse({status: "processing"});
    return true;
  }
});

// This function will be injected to crop the image
function cropAndSaveImage(dataUrl, region) {
  try {
    // Account for device pixel ratio
    const pixelRatio = window.devicePixelRatio || 1;
    const scaledLeft = Math.round(region.left * pixelRatio);
    const scaledTop = Math.round(region.top * pixelRatio);
    const scaledWidth = Math.round(region.width * pixelRatio);
    const scaledHeight = Math.round(region.height * pixelRatio);
    
    console.log("Cropping with scaled dimensions:", scaledLeft, scaledTop, scaledWidth, scaledHeight);
    
    // Create an image
    const img = new Image();
    
    img.onload = function() {
      console.log("Original image loaded with dimensions:", img.width, "x", img.height);
      
      // Create a canvas for cropping
      const canvas = document.createElement('canvas');
      canvas.width = scaledWidth;
      canvas.height = scaledHeight;
      
      // Draw only the selected region to the canvas
      const ctx = canvas.getContext('2d');
      ctx.drawImage(
        img,
        scaledLeft, scaledTop, scaledWidth, scaledHeight, // Source rectangle
        0, 0, scaledWidth, scaledHeight // Destination rectangle
      );
      
      // Get the cropped image as data URL
      const croppedDataUrl = canvas.toDataURL('image/png');
      
      // Send the cropped image back to background script for storage
      chrome.runtime.sendMessage({
        action: "save-cropped-image",
        croppedDataUrl: croppedDataUrl
      });
      
      // Show notification
      const notification = document.createElement('div');
      notification.style.position = 'fixed';
      notification.style.top = '20px';
      notification.style.right = '20px';
      notification.style.zIndex = '999999';
      notification.style.padding = '15px 20px';
      notification.style.borderRadius = '4px';
      notification.style.backgroundColor = '#4CAF50';
      notification.style.color = 'white';
      notification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
      notification.style.transition = 'opacity 0.3s ease-in-out';
      notification.style.fontSize = '14px';
      notification.textContent = "Region captured! Click extension icon to view.";
      
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 300);
      }, 5000);
    };
    
    img.onerror = function() {
      console.error("Error loading image for cropping");
      showErrorNotification("Error loading image for cropping");
    };
    
    // Load the image
    img.src = dataUrl;
    
    return true;
  } catch (err) {
    console.error("Error cropping image:", err);
    showErrorNotification("Error capturing region: " + err.message);
    return false;
  }
  
  // Function to show error notification
  function showErrorNotification(message) {
    const notification = document.createElement('div');
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.zIndex = '999999';
    notification.style.padding = '15px 20px';
    notification.style.borderRadius = '4px';
    notification.style.backgroundColor = '#f44336';
    notification.style.color = 'white';
    notification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
    notification.style.transition = 'opacity 0.3s ease-in-out';
    notification.style.fontSize = '14px';
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 5000);
  }
}

// Add listener for receiving the cropped image
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "save-cropped-image") {
    // Save the cropped image to storage
    chrome.storage.local.set({ 
      "last_screenshot": {
        url: message.croppedDataUrl,
        timestamp: Date.now(),
        isRegion: true
      }
    });
    
    // Update badge
    chrome.action.setBadgeText({ text: "1" });
    chrome.action.setBadgeBackgroundColor({ color: "#4CAF50" });
    
    console.log("Cropped screenshot saved to storage");
  }
});