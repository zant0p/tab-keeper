// Tab Keeper - Background Service Worker
// Monitors active tab, enforces 10-min return timer, handles auto-login

const TIMER_MINUTES = 10;
let switchBackTimeout = null;
let timerStartTime = null;
let isSwitchingBack = false;
let targetTabId = null;

// Initialize on install
chrome.runtime.onInstalled.addListener(() => {
  console.log('Tab Keeper installed');
  chrome.storage.local.get(['timerMinutes'], (result) => {
    if (!result.timerMinutes) {
      chrome.storage.local.set({ timerMinutes: TIMER_MINUTES });
    }
  });
});

// Get current timer duration in ms
async function getTimerMs() {
  const config = await chrome.storage.local.get(['timerMinutes']);
  return (config.timerMinutes || TIMER_MINUTES) * 60 * 1000;
}

// Start or restart the timer
async function startTimer() {
  // Clear any existing timer
  if (switchBackTimeout) {
    clearTimeout(switchBackTimeout);
  }
  
  const timerMs = await getTimerMs();
  timerStartTime = Date.now();
  
  console.log(`Tab Keeper: Timer started - ${timerMs/60000} minutes`);
  
  switchBackTimeout = setTimeout(async () => {
    await switchBackToTarget();
  }, timerMs);
  
  // Store timer state for popup to display
  chrome.storage.local.set({
    timerActive: true,
    timerStarted: timerStartTime,
    timerDuration: timerMs
  });
}

// Stop the timer (when user is on target tab)
function stopTimer() {
  if (switchBackTimeout) {
    clearTimeout(switchBackTimeout);
    switchBackTimeout = null;
  }
  timerStartTime = null;
  targetTabId = null;
  
  chrome.storage.local.set({
    timerActive: false,
    timerStarted: null,
    timerDuration: null
  });
  
  console.log('Tab Keeper: Timer stopped');
}

// Monitor tab changes
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  await handleTabSwitch(activeInfo.tabId);
});

// Monitor window focus changes
chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId !== chrome.windows.WINDOW_ID_NONE) {
    chrome.tabs.query({ active: true, windowId: windowId }, async (tabs) => {
      if (tabs[0]) {
        await handleTabSwitch(tabs[0].id);
      }
    });
  }
});

// Handle tab switch logic
async function handleTabSwitch(newTabId) {
  if (isSwitchingBack) {
    console.log('Tab Keeper: Ignoring switch (we triggered it)');
    isSwitchingBack = false;
    return;
  }

  const config = await chrome.storage.local.get(['targetUrl', 'enabled']);
  
  if (!config.enabled || !config.targetUrl) {
    return;
  }

  try {
    const tab = await chrome.tabs.get(newTabId);
    const isTargetTab = tab.url && tab.url.startsWith(config.targetUrl);
    
    if (isTargetTab) {
      console.log('Tab Keeper: On target tab');
      targetTabId = newTabId;
      stopTimer();
    } else {
      console.log('Tab Keeper: Away from target tab - starting timer');
      if (!timerStartTime) {
        // Only start timer if not already running
        await startTimer();
      }
    }
  } catch (error) {
    console.error('Tab Keeper: Error handling tab switch:', error);
  }
}

// Switch back to target tab
async function switchBackToTarget() {
  const config = await chrome.storage.local.get(['targetUrl', 'username', 'password']);
  
  if (!config.targetUrl) {
    console.log('Tab Keeper: No target URL configured');
    stopTimer();
    return;
  }

  console.log('Tab Keeper: ⏰ Timer expired - switching back to target');
  isSwitchingBack = true;
  stopTimer();

  try {
    // Find existing tab with target URL
    const tabs = await chrome.tabs.query({});
    const existingTab = tabs.find(tab => tab.url && tab.url.startsWith(config.targetUrl));

    if (existingTab) {
      console.log('Tab Keeper: Found existing tab:', existingTab.id);
      
      // Focus the window first
      await chrome.windows.update(existingTab.windowId, { focused: true });
      
      // Then activate the tab
      await chrome.tabs.update(existingTab.id, { active: true });
      
      targetTabId = existingTab.id;
      
      // Wait a moment then check for login
      setTimeout(async () => {
        try {
          await chrome.tabs.sendMessage(existingTab.id, { action: 'checkLogin' });
        } catch (e) {
          console.log('Tab Keeper: Could not send message, will retry');
        }
      }, 1000);
      
    } else {
      console.log('Tab Keeper: Creating new tab');
      const newTab = await chrome.tabs.create({ url: config.targetUrl });
      targetTabId = newTab.id;
    }
    
  } catch (error) {
    console.error('Tab Keeper: Error switching back:', error);
    isSwitchingBack = false;
  }
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'loginRequired') {
    console.log('Tab Keeper: Login required - performing auto-login');
    performAutoLogin(sender.tab);
    sendResponse({ status: 'ok' });
  }
  
  if (request.action === 'checkLogin') {
    // Content script is checking if login is needed
    sendResponse({ status: 'checked' });
  }
  
  if (request.action === 'resetLoginAttempt') {
    sendResponse({ status: 'reset' });
  }
  
  if (request.action === 'getStatus') {
    // Popup requesting status
    chrome.storage.local.get(['timerActive', 'timerStarted', 'timerDuration', 'targetUrl', 'enabled']).then((result) => {
      sendResponse(result);
    });
    return true; // Keep channel open for async response
  }
});

// Auto-login function
async function performAutoLogin(tab) {
  if (!tab || !tab.id) {
    console.log('Tab Keeper: No valid tab for auto-login');
    return;
  }
  
  const config = await chrome.storage.local.get(['username', 'password']);
  
  if (!config.username || !config.password) {
    console.log('Tab Keeper: No credentials configured');
    return;
  }

  console.log('Tab Keeper: Auto-login for:', config.username);

  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: autoLoginFunction,
      args: [{ username: config.username, password: config.password }]
    });
    console.log('Tab Keeper: Auto-login executed');
  } catch (error) {
    console.error('Tab Keeper: Auto-login failed:', error);
  }
}

// Injected function for auto-login
function autoLoginFunction(creds) {
  console.log('Auto-login: Starting');
  
  const usernameSelectors = [
    'input[type="email"]',
    'input[type="text"]',
    'input[name*="user"]',
    'input[name*="email"]',
    '#username', '#user', '#email',
    '[name="username"]', '[name="email"]'
  ];
  
  const passwordSelectors = [
    'input[type="password"]',
    'input[name*="pass"]',
    '#password', '[name="password"]'
  ];
  
  const submitSelectors = [
    'button[type="submit"]',
    'input[type="submit"]',
    '.login-button', '#login-btn',
    'button.submit', '[type="submit"]'
  ];
  
  let usernameField = null;
  let passwordField = null;
  let submitButton = null;
  
  for (const selector of usernameSelectors) {
    usernameField = document.querySelector(selector);
    if (usernameField) break;
  }
  
  for (const selector of passwordSelectors) {
    passwordField = document.querySelector(selector);
    if (passwordField) break;
  }
  
  for (const selector of submitSelectors) {
    submitButton = document.querySelector(selector);
    if (submitButton) break;
  }
  
  if (usernameField && passwordField) {
    console.log('Auto-login: Found fields');
    
    usernameField.value = creds.username;
    passwordField.value = creds.password;
    
    // Trigger events
    ['input', 'change'].forEach(eventType => {
      usernameField.dispatchEvent(new Event(eventType, { bubbles: true }));
      passwordField.dispatchEvent(new Event(eventType, { bubbles: true }));
    });
    
    if (submitButton) {
      console.log('Auto-login: Clicking submit');
      submitButton.click();
    } else {
      const form = usernameField.closest('form');
      if (form) {
        console.log('Auto-login: Submitting form');
        form.submit();
      }
    }
  } else {
    console.log('Auto-login: Fields not found');
  }
}

// Periodic check to ensure timer is still running
chrome.alarms.create('timerCheck', { periodInMinutes: 1 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'timerCheck' && timerStartTime) {
    // Verify timer is still active
    const config = await chrome.storage.local.get(['targetUrl']);
    const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (currentTab && config.targetUrl && !currentTab.url?.startsWith(config.targetUrl)) {
      console.log('Tab Keeper: Timer check - still away from target');
      // Restart timer to ensure it's still counting
      await startTimer();
    }
  }
});
