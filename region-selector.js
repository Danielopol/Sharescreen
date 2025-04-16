// region-selector.js - separate file for the region selection functionality
(function() {
  console.log("Region selector activated");
  
  // Remove existing selector if any
  const existingSelector = document.getElementById('screenshot-region-selector');
  if (existingSelector) {
    document.body.removeChild(existingSelector);
  }
  
  // Create overlay and instructions
  const overlay = document.createElement('div');
  overlay.id = 'screenshot-region-selector';
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
  overlay.style.zIndex = '999998';
  overlay.style.cursor = 'crosshair';
  
  // Instructions
  const instructions = document.createElement('div');
  instructions.style.position = 'fixed';
  instructions.style.top = '20px';
  instructions.style.left = '50%';
  instructions.style.transform = 'translateX(-50%)';
  instructions.style.padding = '10px 20px';
  instructions.style.backgroundColor = '#333';
  instructions.style.color = 'white';
  instructions.style.borderRadius = '4px';
  instructions.style.fontSize = '14px';
  instructions.style.zIndex = '999999';
  instructions.textContent = 'Click and drag to select region. Press Esc to cancel.';
  
  document.body.appendChild(overlay);
  document.body.appendChild(instructions);
  
  // Variables to track selection
  let isSelecting = false;
  let startX = 0;
  let startY = 0;
  let endX = 0;
  let endY = 0;
  let selectionBox = null;
  
  // Handle mouse down
  overlay.addEventListener('mousedown', (e) => {
    isSelecting = true;
    startX = e.clientX;
    startY = e.clientY;
    
    // Create selection box
    selectionBox = document.createElement('div');
    selectionBox.style.position = 'fixed';
    selectionBox.style.border = '2px dashed white';
    selectionBox.style.backgroundColor = 'rgba(66, 133, 244, 0.2)';
    selectionBox.style.zIndex = '999999';
    document.body.appendChild(selectionBox);
  });
  
  // Handle mouse move
  overlay.addEventListener('mousemove', (e) => {
    if (!isSelecting) return;
    
    endX = e.clientX;
    endY = e.clientY;
    
    // Update selection box
    const left = Math.min(startX, endX);
    const top = Math.min(startY, endY);
    const width = Math.abs(endX - startX);
    const height = Math.abs(endY - startY);
    
    selectionBox.style.left = left + 'px';
    selectionBox.style.top = top + 'px';
    selectionBox.style.width = width + 'px';
    selectionBox.style.height = height + 'px';
  });
  
  // Handle mouse up
  overlay.addEventListener('mouseup', () => {
    if (!isSelecting) return;
    isSelecting = false;
    
    // Calculate the selection rectangle
    const left = Math.min(startX, endX);
    const top = Math.min(startY, endY);
    const width = Math.abs(endX - startX);
    const height = Math.abs(endY - startY);
    
    // Minimum size check
    if (width < 10 || height < 10) {
      showNotification('Selection too small. Please select a larger area.');
      cleanup();
      return;
    }
    
    // Capture the region
    captureSelectedRegion(left, top, width, height);
  });
  
  // Handle escape key
  document.addEventListener('keydown', function escHandler(e) {
    if (e.key === 'Escape') {
      cleanup();
      document.removeEventListener('keydown', escHandler);
    }
  });
  
  // Clean up elements
  function cleanup() {
    if (overlay && overlay.parentNode) {
      document.body.removeChild(overlay);
    }
    if (instructions && instructions.parentNode) {
      document.body.removeChild(instructions);
    }
    if (selectionBox && selectionBox.parentNode) {
      document.body.removeChild(selectionBox);
    }
  }
  
  // Show notification
  function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.zIndex = '999999';
    notification.style.padding = '15px 20px';
    notification.style.borderRadius = '4px';
    notification.style.backgroundColor = message.includes('error') ? '#f44336' : '#4CAF50';
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
  
  // Capture the selected region
  function captureSelectedRegion(left, top, width, height) {
    // Clean up selection elements
    cleanup();
    
    // Show capturing notification
    showNotification('Capturing selected region...');
    
    console.log("Sending region data to background script:", { left, top, width, height });
    
    // Send message to background script with region coordinates
    chrome.runtime.sendMessage({
      action: "capture-region",
      region: { left, top, width, height }
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("Error sending region data:", chrome.runtime.lastError);
        showNotification('Error: Failed to capture region. Please try again.');
      } else {
        console.log("Background received region data:", response);
      }
    });
  }
})();