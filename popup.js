// Tab Keeper - Popup Script

async function updateUI() {
  const config = await chrome.storage.local.get(['targetUrl', 'username', 'enabled', 'timerMinutes']);
  const statusEl = document.getElementById('status');
  const targetUrlEl = document.getElementById('targetUrl');
  const usernameEl = document.getElementById('username');
  const timerDisplay = document.getElementById('timerDisplay');
  const countdownEl = document.getElementById('countdown');

  // Show config
  targetUrlEl.textContent = config.targetUrl || 'Not configured';
  usernameEl.textContent = config.username ? config.username : 'Not configured';

  // Check current tab
  const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (!config.enabled) {
    statusEl.className = 'status inactive';
    statusEl.textContent = '⏸️ Tab Keeper is disabled';
    timerDisplay.style.display = 'none';
    return;
  }

  if (!config.targetUrl) {
    statusEl.className = 'status inactive';
    statusEl.textContent = '⚠️ No target URL configured';
    timerDisplay.style.display = 'none';
    return;
  }

  if (currentTab.url && currentTab.url.startsWith(config.targetUrl)) {
    statusEl.className = 'status active';
    statusEl.textContent = '✅ On target tab';
    timerDisplay.style.display = 'none';
  } else {
    statusEl.className = 'status waiting';
    statusEl.textContent = `⏱️ Away from target (returning in ${config.timerMinutes || 10} min)`;
    timerDisplay.style.display = 'block';
    
    // Start countdown (approximate, since we don't know when timer started)
    startCountdown(config.timerMinutes || 10);
  }
}

function startCountdown(minutes) {
  const countdownEl = document.getElementById('countdown');
  let secondsRemaining = minutes * 60;
  
  function update() {
    const mins = Math.floor(secondsRemaining / 60);
    const secs = secondsRemaining % 60;
    countdownEl.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    
    if (secondsRemaining > 0) {
      secondsRemaining--;
      setTimeout(update, 1000);
    }
  }
  
  update();
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

// Update UI on load and when storage changes
updateUI();
chrome.storage.onChanged.addListener(updateUI);
