// Tab Keeper - Popup Script

let countdownInterval = null;

async function updateUI() {
  const statusEl = document.getElementById('status');
  const targetUrlEl = document.getElementById('targetUrl');
  const usernameEl = document.getElementById('username');
  const timerDisplay = document.getElementById('timerDisplay');
  const countdownEl = document.getElementById('countdown');

  // Get status from background script
  chrome.runtime.sendMessage({ action: 'getStatus' }, (response) => {
    const config = response || {};
    
    // Show config
    targetUrlEl.textContent = config.targetUrl || 'Not configured';
    usernameEl.textContent = config.username ? config.username : 'Not configured';

    if (!config.enabled) {
      statusEl.className = 'status inactive';
      statusEl.textContent = '⏸️ Tab Keeper is disabled';
      timerDisplay.style.display = 'none';
      stopCountdown();
      return;
    }

    if (!config.targetUrl) {
      statusEl.className = 'status inactive';
      statusEl.textContent = '⚠️ No target URL configured';
      timerDisplay.style.display = 'none';
      stopCountdown();
      return;
    }

    // Check current tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const currentTab = tabs[0];
      const isOnTarget = currentTab.url && currentTab.url.startsWith(config.targetUrl);

      if (isOnTarget) {
        statusEl.className = 'status active';
        statusEl.textContent = '✅ On target tab';
        timerDisplay.style.display = 'none';
        stopCountdown();
      } else if (config.timerActive && config.timerStarted) {
        statusEl.className = 'status waiting';
        const minutes = Math.round(config.timerDuration / 60000);
        statusEl.textContent = `⏱️ Away from target (returning in ~${minutes} min)`;
        timerDisplay.style.display = 'block';
        startCountdown(config.timerStarted, config.timerDuration);
      } else {
        statusEl.className = 'status waiting';
        statusEl.textContent = '⏱️ Timer not started yet';
        timerDisplay.style.display = 'block';
        countdownEl.textContent = '--:--';
      }
    });
  });
}

function startCountdown(startTime, duration) {
  stopCountdown(); // Clear any existing timer
  
  const countdownEl = document.getElementById('countdown');
  
  function update() {
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, duration - elapsed);
    
    const mins = Math.floor(remaining / 60000);
    const secs = Math.floor((remaining % 60000) / 1000);
    countdownEl.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    
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

document.getElementById('switchNow').addEventListener('click', async () => {
  const config = await chrome.storage.local.get(['targetUrl']);
  
  if (!config.targetUrl) {
    alert('No target URL configured!');
    return;
  }

  const tabs = await chrome.tabs.query({});
  const existingTab = tabs.find(tab => tab.url && tab.url.startsWith(config.targetUrl));

  if (existingTab) {
    await chrome.tabs.update(existingTab.id, { active: true });
    await chrome.windows.update(existingTab.windowId, { focused: true });
  } else {
    await chrome.tabs.create({ url: config.targetUrl });
  }
  
  window.close();
});

// Update UI on load
updateUI();

// Clean up when popup closes
window.addEventListener('unload', stopCountdown);
