// Tab Keeper - Background Service Worker
// Monitors active tab, enforces 10-min return timer, handles auto-login

const TIMER_MINUTES = 10;
let switchBackTimer = null;
let isSwitchingBack = false;

// Initialize on install
chrome.runtime.onInstalled.addListener(() => {
  console.log('Tab Keeper installed');
  // Set default timer if not set
  chrome.storage.local.get(['timerMinutes'], (result) => {
    if (!result.timerMinutes) {
      chrome.storage.local.set({ timerMinutes: TIMER_MINUTES });
    }
  });
});

// Monitor tab changes
chrome.tabs.onActivated.addListener((activeInfo) => {
  handleTabSwitch(activeInfo.tabId);
});

// Also monitor window changes (in case user switches windows)
chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId !== chrome.windows.WINDOW_ID_NONE) {
    chrome.tabs.query({ active: true, windowId: windowId }, (tabs) => {
      if (tabs[0]) {
        handleTabSwitch(tabs[0].id);
      }
    });
  }
});

async function handleTabSwitch(newTabId) {
  if (isSwitchingBack) {
    isSwitchingBack = false;
    return; // Don't restart timer when we're the ones switching
  }

  // Clear existing timer
  if (switchBackTimer) {
    clearTimeout(switchBackTimer);
    switchBackTimer = null;
  }

  // Check if this is our designated tab
  const config = await chrome.storage.local.get(['targetUrl', 'enabled']);
  
  if (!config.enabled || !config.targetUrl) {
    return; // Extension disabled or no target configured
  }

  // Get the new active tab's URL
  const tab = await chrome.tabs.get(newTabId);
  
  if (tab.url && tab.url.startsWith(config.targetUrl)) {
    // User is on the target tab - no timer needed
    console.log('On target tab, timer cleared');
    return;
  }

  // User switched away - start timer
  console.log(`User switched away from target tab. Starting ${TIMER_MINUTES} min timer...`);
  
  switchBackTimer = setTimeout(async () => {
    await switchBackToTarget();
  }, TIMER_MINUTES * 60 * 1000);
}

async function switchBackToTarget() {
  const config = await chrome.storage.local.get(['targetUrl', 'username', 'password']);
  
  if (!config.targetUrl) {
    console.log('No target URL configured');
    return;
  }

  console.log('Timer expired - switching back to target tab');
  isSwitchingBack = true;

  // Find existing tab with target URL
  const tabs = await chrome.tabs.query({});
  const existingTab = tabs.find(tab => tab.url && tab.url.startsWith(config.targetUrl));

  if (existingTab) {
    // Switch to existing tab
    await chrome.tabs.update(existingTab.id, { active: true });
    await chrome.windows.update(existingTab.windowId, { focused: true });
    console.log('Switched to existing target tab:', existingTab.id);
  } else {
    // Create new tab
    await chrome.tabs.create({ url: config.targetUrl });
    console.log('Created new target tab');
  }

  // Check if login is needed (will be handled by content script)
  // Send message to check login status
  if (existingTab) {
    chrome.tabs.sendMessage(existingTab.id, { action: 'checkLogin' }).catch(() => {
      // Tab might not be ready yet, will retry on load
    });
  }
}

// Listen for login status checks from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'loginRequired') {
    performAutoLogin(sender.tab);
  }
  if (request.action === 'getCredentials') {
    chrome.storage.local.get(['username', 'password'], (result) => {
      sendResponse(result);
    });
    return true; // Keep channel open for async response
  }
});

async function performAutoLogin(tab) {
  const config = await chrome.storage.local.get(['username', 'password', 'targetUrl']);
  
  if (!config.username || !config.password) {
    console.log('No credentials configured for auto-login');
    return;
  }

  console.log('Performing auto-login for:', config.username);

  // Inject login script
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: (creds) => {
      // Find login form and fill it
      const usernameField = document.querySelector('input[type="email"], input[type="text"], input[name*="user"], input[name*="email"], #username, #user');
      const passwordField = document.querySelector('input[type="password"], input[name*="pass"], #password');
      const submitButton = document.querySelector('button[type="submit"], input[type="submit"], .login-button, #login-btn');

      if (usernameField && passwordField) {
        usernameField.value = creds.username;
        passwordField.value = creds.password;
        
        // Trigger input events (some sites need this)
        usernameField.dispatchEvent(new Event('input', { bubbles: true }));
        passwordField.dispatchEvent(new Event('input', { bubbles: true }));

        if (submitButton) {
          submitButton.click();
        } else {
          // Try submitting the form directly
          const form = usernameField.closest('form');
          if (form) {
            form.submit();
          }
        }
      }
    },
    args: [{ username: config.username, password: config.password }]
  });
}

// Alarm for periodic checks (optional backup)
chrome.alarms.create('checkTab', { periodInMinutes: 1 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'checkTab') {
    // Verify we're still on target tab if timer is running
    if (switchBackTimer) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.storage.local.get(['targetUrl'], (config) => {
            if (config.targetUrl && tabs[0].url && !tabs[0].url.startsWith(config.targetUrl)) {
              console.log('Periodic check: still away from target tab');
            }
          });
        }
      });
    }
  }
});
