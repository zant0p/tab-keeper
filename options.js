// Tab Keeper - Options Page Script (v2.0.6) - Kiosk Mode

// Get the current variant from background script
async function loadSettings() {
  console.log('[Options] Loading settings');
  
  // Get variant info from background
  const status = await chrome.runtime.sendMessage({ action: 'getStatus' });
  
  // Set read-only credential fields based on variant
  const usernameField = document.getElementById('username');
  const passwordField = document.getElementById('password');
  
  if (status && status.variant) {
    if (status.variant === 'ALF') {
      usernameField.value = 'alfstaff';
      passwordField.value = 'alfstaff';
    } else {
      usernameField.value = 'Auto-configured';
      passwordField.value = 'Auto-configured';
    }
  } else {
    // Fallback: try to detect from URL
    const primaryUrl = await chrome.runtime.sendMessage({ action: 'getStatus' }).then(s => s?.primaryUrl || '');
    if (primaryUrl.includes('/AL/')) {
      usernameField.value = 'alfstaff';
      passwordField.value = 'alfstaff';
    } else {
      usernameField.value = 'Auto-configured';
      passwordField.value = 'Auto-configured';
    }
  }
  
  // Load timer setting from local storage
  const config = await chrome.storage.local.get(['timerSeconds']);
  const timerSeconds = config.timerSeconds || 600; // Default 600 seconds (10 minutes)
  
  document.getElementById('timerSeconds').value = timerSeconds;
  
  // URLs are hardcoded, show them for reference
  document.getElementById('primaryUrl').value = 'https://10.1.129.207/Arial/#/login';
  
  // Disable URL field (hardcoded)
  document.getElementById('primaryUrl').disabled = true;
  
  console.log('[Options] Settings loaded, variant:', status?.variant);
}

// Save timer settings to local storage
async function saveSettings() {
  const timerSeconds = parseInt(document.getElementById('timerSeconds').value) || 300;

  // Validate
  if (timerSeconds < 10 || timerSeconds > 3600) {
    showMessage('⚠️ Timer must be between 10 and 3600 seconds', 'error');
    return;
  }

  // Save
  await chrome.storage.local.set({
    timerSeconds
  });

  showMessage('✅ Settings saved successfully! Timer set to ' + timerSeconds + ' seconds (' + 
              Math.floor(timerSeconds / 60) + 'm ' + (timerSeconds % 60) + 's)', 'success');
  
  // Auto-hide success message after 3 seconds
  setTimeout(() => {
    document.getElementById('message').className = 'message';
  }, 3000);
}

// Show message
function showMessage(text, type) {
  const msgEl = document.getElementById('message');
  msgEl.textContent = text;
  msgEl.className = `message ${type}`;
}

// Event listeners
document.getElementById('save').addEventListener('click', saveSettings);

// Load settings on page load
loadSettings();
