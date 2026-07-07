// Tab Keeper - Popup Script (v2.0.6) - Kiosk Mode

let countdownInterval = null;

async function updateUI() {
  const statusEl = document.getElementById('status');
  const primaryUrlEl = document.getElementById('primaryUrl');
  const timerDisplay = document.getElementById('timerDisplay');
  const countdownEl = document.getElementById('countdown');
  const variantEl = document.getElementById('variant');

  // Get status from background script
  chrome.runtime.sendMessage({ action: 'getStatus' }, (response) => {
    const config = response || {};
    
    // Show variant
    if (variantEl) {
      variantEl.textContent = config.variant || 'Unknown';
    }
    
    // Show config
    primaryUrlEl.textContent = config.primaryUrl || 'Not configured';

    if (!config.primaryUrl) {
      statusEl.className = 'status inactive';
      statusEl.textContent = 'No primary URL configured';
      timerDisplay.style.display = 'none';
      stopCountdown();
      return;
    }

    // Check current tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const currentTab = tabs[0];
      const isOnPrimary = currentTab && currentTab.url && 
        (currentTab.url === config.primaryUrl || currentTab.url.startsWith(config.primaryUrl));

      if (isOnPrimary) {
        statusEl.className = 'status active';
        statusEl.textContent = '✅ On primary tab (safe zone)';
        timerDisplay.style.display = 'none';
        stopCountdown();
      } else if (config.timerActive && config.lastActivity) {
        const mins = Math.floor(config.timerDuration / 60000);
        const secs = Math.floor((config.timerDuration % 60000) / 1000);
        statusEl.className = 'status waiting';
        statusEl.textContent = `⏰ Away from tab (returning in ~${mins}m ${secs}s)`;
        timerDisplay.style.display = 'block';
        startCountdown(config.lastActivity, config.timerDuration);
      } else {
        statusEl.className = 'status waiting';
        statusEl.textContent = 'Timer not started yet';
        timerDisplay.style.display = 'block';
        countdownEl.textContent = '--:--';
      }
    });
  });
}

function startCountdown(startTime, duration) {
  stopCountdown();
  
  const countdownEl = document.getElementById('countdown');
  
  function update() {
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, duration - elapsed);
    
    const mins = Math.floor(remaining / 60000);
    const secs = Math.floor((remaining % 60000) / 1000);
    countdownEl.textContent = String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
    
    if (remaining > 0) {
      countdownInterval = setTimeout(update, 1000);
    } else {
      countdownEl.textContent = 'Switching...';
    }
  }
  
  update();
}

function stopCountdown() {
  if (countdownInterval) {
    clearTimeout(countdownInterval);
    countdownInterval = null;
  }
}

// Event listeners
document.getElementById('openOptions').addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

document.getElementById('launchPages').addEventListener('click', () => {
  console.log('[Popup] Launch tab button clicked');
  chrome.runtime.sendMessage({ action: 'launchPages' }, (response) => {
    console.log('[Popup] Launch response:', response);
    if (response && response.status === 'launched') {
      window.close();
    }
  });
  return false;
});

// Update UI on load
updateUI();

// Notify background script that popup was opened
chrome.runtime.sendMessage({ action: 'popupOpened' });

// Clean up when popup closes
window.addEventListener('unload', stopCountdown);
