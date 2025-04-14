// popup.js with improved server upload
document.addEventListener('DOMContentLoaded', function() {
    // Clear the badge when popup opens
    chrome.action.setBadgeText({ text: "" });
    
    // Load the latest screenshot
    chrome.storage.local.get('last_screenshot', function(data) {
      const noScreenshotDiv = document.getElementById('no-screenshot');
      const screenshotContainer = document.getElementById('screenshot-container');
      const screenshotPreview = document.getElementById('screenshot-preview');
      const timestampElement = document.getElementById('timestamp');
      
      if (data.last_screenshot) {
        // Show the screenshot
        noScreenshotDiv.style.display = 'none';
        screenshotContainer.style.display = 'block';
        
        // Set the image source
        screenshotPreview.src = data.last_screenshot.url;
        
        // Set the timestamp
        const date = new Date(data.last_screenshot.timestamp);
        timestampElement.textContent = `Taken on ${date.toLocaleDateString()} at ${date.toLocaleTimeString()}`;
        
        // Check if we already have a server URL
        if (data.last_screenshot.serverUrl) {
          showServerUrl(data.last_screenshot.serverUrl);
        }
        
        // Copy button
        document.getElementById('copy-btn').addEventListener('click', function() {
          // If we have a server URL, copy that, otherwise copy the image
          if (data.last_screenshot.serverUrl) {
            navigator.clipboard.writeText(data.last_screenshot.serverUrl);
            showStatus('URL copied to clipboard!');
          } else {
            copyImageToClipboard(data.last_screenshot.url);
          }
        });
        
        // Save button
        document.getElementById('save-btn').addEventListener('click', function() {
          saveScreenshot(data.last_screenshot.url);
        });
        
        // Upload button
        document.getElementById('upload-btn').addEventListener('click', function() {
          this.disabled = true;
          this.textContent = 'Uploading...';
          uploadToServer(data.last_screenshot.url);
        });
      } else {
        // No screenshot yet
        noScreenshotDiv.style.display = 'block';
        screenshotContainer.style.display = 'none';
      }
    });
  });
  
  // Function to show server URL
  function showServerUrl(url) {
    const urlContainer = document.getElementById('server-url-container');
    const urlElement = document.getElementById('server-url');
    
    if (urlContainer && urlElement) {
      urlContainer.style.display = 'block';
      urlElement.textContent = url;
      urlElement.href = url;
      
      // Update the upload button
      const uploadButton = document.getElementById('upload-btn');
      uploadButton.textContent = 'Re-Upload';
      uploadButton.disabled = false;
    }
  }
  
  // Function to show status message
  function showStatus(message, isError = false) {
    const statusElement = document.getElementById('status-message');
    if (statusElement) {
      statusElement.textContent = message;
      statusElement.style.color = isError ? '#f44336' : '#4CAF50';
      statusElement.style.display = 'block';
      
      // Hide after 3 seconds
      setTimeout(() => {
        statusElement.style.display = 'none';
      }, 3000);
    }
  }
  
  // Function to copy image to clipboard
  function copyImageToClipboard(dataUrl) {
    // Create a temporary canvas to get access to the image data
    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      
      // Use canvas to get blob that can be copied
      canvas.toBlob(function(blob) {
        try {
          // New way: Handle as a blob for image copy
          const item = new ClipboardItem({ "image/png": blob });
          navigator.clipboard.write([item]).then(function() {
            showStatus('Screenshot copied to clipboard!');
          }, function(error) {
            console.error('Error copying image:', error);
            // Fallback to copying as URL
            navigator.clipboard.writeText(dataUrl);
            showStatus('URL copied to clipboard (image copy not supported in this browser)');
          });
        } catch (e) {
          // Fallback for browsers not supporting ClipboardItem
          navigator.clipboard.writeText(dataUrl);
          showStatus('URL copied to clipboard (image copy not supported in this browser)');
        }
      });
    };
    img.src = dataUrl;
  }
  
  // Function to save screenshot to device
  function saveScreenshot(dataUrl) {
    // Create download link
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = 'screenshot_' + new Date().getTime() + '.png';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    showStatus('Screenshot saved!');
  }
  
  // Function to upload to server
  function uploadToServer(dataUrl) {
    showStatus('Uploading to server...');
    
    fetch('http://localhost:3000/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        image: dataUrl
      })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      if (data.success) {
        // Store the server URL in Chrome storage
        chrome.storage.local.get('last_screenshot', function(result) {
          if (result.last_screenshot) {
            result.last_screenshot.serverUrl = data.url;
            chrome.storage.local.set({ 'last_screenshot': result.last_screenshot });
          }
        });
        
        // Show the URL
        showServerUrl(data.url);
        showStatus('Screenshot uploaded successfully!');
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    })
    .catch(error => {
      console.error('Error uploading:', error);
      showStatus('Failed to upload. Is the server running?', true);
      
      // Re-enable the upload button
      const uploadButton = document.getElementById('upload-btn');
      if (uploadButton) {
        uploadButton.disabled = false;
        uploadButton.textContent = 'Upload to Server';
      }
    });
  }