// Tab Keeper - Options Page Script (v1.0.16)

let managedConfig = {};

// Load settings from managed or local storage
async function loadSettings() {
  // Try managed storage first
  const managed = await chrome.storage.managed.get([
    'primaryUrl', 'secondaryUrl', 'timerMinutes', 'username', 'password', 'autoLoginEnabled'
  ]);
  
  const hasManaged = managed && Object.keys(managed).length > 0;
  
  if (hasManaged) {
    console.log('[Options] Managed config detected');
    managedConfig = managed;
    
    // Show managed notice
    document.getElementById('managedNotice').style.display = 'block';
    
    // Load managed values (read-only)
    document.getElementById('enabled').checked = managed.autoLoginEnabled !== false;
    document.getElementById('primaryUrl').value = managed.primaryUrl || '';
    document.getElementById('secondaryUrl').value = managed.secondaryUrl || '';
    document.getElementById('timerMinutes').value = managed.timerMinutes || 10;
    document.getElementById('username').value = managed.username || '';
    document.getElementById('password').value = managed.password || '';
    
    // Disable fields that are managed
    ['enabled', 'primaryUrl', 'secondaryUrl', 'timerMinutes', 'username', 'password'].forEach(id => {
      if (managedConfig[id] !== undefined) {
        document.getElementById(id).disabled = true;
      }
    });
  } else {
    // Load from local storage
    console.log('[Options] Loading local config');
    const config = await chrome.storage.local.get([
      'enabled', 'primaryUrl', 'secondaryUrl', 'timerMinutes', 'username', 'password'
    ]);

    document.getElementById('enabled').checked = config.enabled !== false;
    document.getElementById('primaryUrl').value = config.primaryUrl || '';
    document.getElementById('secondaryUrl').value = config.secondaryUrl || '';
    document.getElementById('timerMinutes').value = config.timerMinutes || 10;
    document.getElementById('username').value = config.username || '';
    document.getElementById('password').value = config.password || '';
  }
}

// Save settings to local storage
async function saveSettings() {
  // Check if managed - can't save locally if managed
  if (Object.keys(managedConfig).length > 0) {
    showMessage('⚠️ Settings are managed by your organization and cannot be changed locally', 'error');
    return;
  }
  
  const enabled = document.getElementById('enabled').checked;
  const primaryUrl = document.getElementById('primaryUrl').value.trim();
  const secondaryUrl = document.getElementById('secondaryUrl').value.trim();
  const timerMinutes = parseInt(document.getElementById('timerMinutes').value) || 10;
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  // Validate
  if (enabled && !primaryUrl) {
    showMessage('⚠️ Primary URL is required when enabled', 'error');
    return;
  }

  if (timerMinutes < 1 || timerMinutes > 60) {
    showMessage('⚠️ Timer must be between 1 and 60 minutes', 'error');
    return;
  }

  // Save
  await chrome.storage.local.set({
    enabled,
    primaryUrl,
    secondaryUrl,
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
  if (Object.keys(managedConfig).length > 0 && managedConfig.username) {
    showMessage('⚠️ Credentials are managed by your organization', 'error');
    return;
  }
  
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

// Test auto-login
async function testLogin() {
  const primaryUrl = document.getElementById('primaryUrl').value.trim();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  if (!primaryUrl) {
    showMessage('⚠️ Please enter a primary URL first', 'error');
    return;
  }

  if (!username || !password) {
    showMessage('⚠️ Please enter credentials to test auto-login', 'error');
    return;
  }

  // Save temporarily
  await chrome.storage.local.set({
    primaryUrl,
    username,
    password
  });

  // Open in new tab
  const tab = await chrome.tabs.create({ url: primaryUrl });
  
  showMessage(`🧪 Opening ${primaryUrl} - auto-login will trigger if login page is detected`, 'success');
  
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
