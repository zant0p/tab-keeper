// Tab Keeper - Options Page Script

// Load saved settings
async function loadSettings() {
  const config = await chrome.storage.local.get([
    'enabled',
    'targetUrl',
    'timerMinutes',
    'username',
    'password'
  ]);

  document.getElementById('enabled').checked = config.enabled !== false;
  document.getElementById('targetUrl').value = config.targetUrl || '';
  document.getElementById('timerMinutes').value = config.timerMinutes || 10;
  document.getElementById('username').value = config.username || '';
  document.getElementById('password').value = config.password || '';
}

// Save settings
async function saveSettings() {
  const enabled = document.getElementById('enabled').checked;
  const targetUrl = document.getElementById('targetUrl').value.trim();
  const timerMinutes = parseInt(document.getElementById('timerMinutes').value) || 10;
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  // Validate
  if (enabled && !targetUrl) {
    showMessage('⚠️ Target URL is required when enabled', 'error');
    return;
  }

  if (timerMinutes < 1 || timerMinutes > 60) {
    showMessage('⚠️ Timer must be between 1 and 60 minutes', 'error');
    return;
  }

  // Save
  await chrome.storage.local.set({
    enabled,
    targetUrl,
    timerMinutes,
    username,
    password
  });

  showMessage('✅ Settings saved successfully!', 'success');
  
  // Auto-hide success message after 3 seconds
  setTimeout(() => {
    document.getElementById('message').className = 'message';
  }, 3000);
}

// Clear credentials
async function clearCredentials() {
  if (confirm('Are you sure you want to clear the stored username and password?')) {
    await chrome.storage.local.remove(['username', 'password']);
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    showMessage('🗑️ Credentials cleared', 'success');
    
    setTimeout(() => {
      document.getElementById('message').className = 'message';
    }, 3000);
  }
}

// Test auto-login (opens target URL in new tab)
async function testLogin() {
  const targetUrl = document.getElementById('targetUrl').value.trim();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  if (!targetUrl) {
    showMessage('⚠️ Please enter a target URL first', 'error');
    return;
  }

  if (!username || !password) {
    showMessage('⚠️ Please enter credentials to test auto-login', 'error');
    return;
  }

  // Save temporarily
  await chrome.storage.local.set({
    targetUrl,
    username,
    password
  });

  // Open in new tab
  const tab = await chrome.tabs.create({ url: targetUrl });
  
  showMessage(`🧪 Opening ${targetUrl} - auto-login will trigger if login page is detected`, 'success');
  
  // Send message to check login after tab loads
  setTimeout(() => {
    chrome.tabs.sendMessage(tab.id, { action: 'checkLogin' }).catch(() => {
      // Tab might not be ready yet
    });
  }, 2000);
}

// Show message
function showMessage(text, type) {
  const msgEl = document.getElementById('message');
  msgEl.textContent = text;
  msgEl.className = `message ${type}`;
}

// Event listeners
document.getElementById('save').addEventListener('click', saveSettings);
document.getElementById('clearCredentials').addEventListener('click', clearCredentials);
document.getElementById('testLogin').addEventListener('click', testLogin);

// Load settings on page load
loadSettings();
