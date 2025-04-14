// Fixed content.js - removed problematic openPopup
console.log("Content script loaded");

// Set up message listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Content script received message:", message);
  
  if (message.action === "upload_screenshot") {
    console.log("Processing screenshot upload request");
    uploadScreenshot(message.dataUrl);
    sendResponse({status: "uploading"});
  }
  return true;
});

// Test if content script is working
console.log("Content script active on:", window.location.href);

async function uploadScreenshot(dataUrl) {
  console.log("Starting upload process");
  
  try {
    // Show uploading status notification
    showNotification('Uploading screenshot...', false, 'uploading');
    console.log("Upload notification shown");
    
    // Upload to local server
    console.log("Sending to server at http://localhost:3000/upload");
    const response = await fetch('http://localhost:3000/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        image: dataUrl
      })
    });
    
    console.log("Server response received:", response.status);
    
    // Remove the uploading notification
    removeNotification('uploading');
    
    // Process the response
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log("Response data:", data);
    
    if (data.success) {
      // Store the URL in Chrome storage
      chrome.storage.local.set({ 
        "last_screenshot": {
          url: data.url,
          timestamp: Date.now()
        }
      }, () => {
        console.log("Screenshot URL saved to storage");
      });
      
      // Show success notification with URL
      showNotification(`Screenshot uploaded: ${data.url}`, false, 'success');
      
      // We don't try to open the popup directly from content script anymore
      // Instead, send a message to the background script
      chrome.runtime.sendMessage({
        action: "screenshot_success",
        url: data.url
      });
      
      console.log("Success process complete");
    } else {
      throw new Error(data.error || 'Upload failed');
    }
  } catch (error) {
    console.error('Error uploading screenshot:', error);
    showNotification('Failed to upload screenshot: ' + error.message, true, 'error');
  }
}

// Improved notification function with ID for removal
function showNotification(message, isError = false, id = 'notification') {
  console.log(`Showing notification (${id}):`, message);
  
  // Remove any existing notification with the same ID
  removeNotification(id);
  
  // Create a temporary notification element
  const notification = document.createElement('div');
  notification.id = 'screenshot-notification-' + id;
  notification.style.position = 'fixed';
  notification.style.top = '20px';
  notification.style.right = '20px';
  notification.style.zIndex = '9999';
  notification.style.padding = '12px 20px';
  notification.style.borderRadius = '4px';
  notification.style.backgroundColor = isError ? '#f44336' : '#4CAF50';
  notification.style.color = 'white';
  notification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
  notification.style.transition = 'opacity 0.3s ease-in-out';
  notification.style.maxWidth = '300px';
  
  if (isError) {
    notification.textContent = message;
  } else {
    notification.innerHTML = `<div>${message}</div>`;
    
    // Only add URL if it's in the message
    if (message.includes('http')) {
      const url = message.match(/(https?:\/\/[^\s]+)/g)[0];
      notification.innerHTML += `
        <div style="font-size: 12px; margin-top: 5px; word-break: break-all;">
          <a href="${url}" target="_blank" style="color: white; text-decoration: underline;">${url}</a>
        </div>
        <div style="margin-top: 8px;">
          <button style="background: white; color: #4CAF50; border: none; padding: 3px 8px; border-radius: 3px; cursor: pointer; font-size: 12px;" 
            onclick="navigator.clipboard.writeText('${url}')">
            Copy URL
          </button>
        </div>
      `;
    }
  }
  
  document.body.appendChild(notification);
  console.log(`Notification element added to DOM (${id})`);
  
  // Remove after 10 seconds for success/error messages (not for 'uploading')
  if (id !== 'uploading') {
    setTimeout(() => {
      removeNotification(id);
    }, 10000);
  }
}

// Function to remove a notification by ID
function removeNotification(id) {
  console.log(`Attempting to remove notification (${id})`);
  
  const existingNotification = document.getElementById('screenshot-notification-' + id);
  if (existingNotification) {
    console.log(`Found notification to remove (${id})`);
    existingNotification.style.opacity = '0';
    setTimeout(() => {
      if (existingNotification.parentNode) {
        existingNotification.parentNode.removeChild(existingNotification);
        console.log(`Notification removed from DOM (${id})`);
      }
    }, 300);
  } else {
    console.log(`No notification found to remove (${id})`);
  }
}

// Add a test function that can be called from the console
window.testScreenshotExtension = function() {
  console.log("Manual test function called");
  showNotification("Extension test notification", false, "test");
};