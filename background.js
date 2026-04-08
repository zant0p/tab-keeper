// Tab Keeper - Background Service Worker
// Monitors activity on non-target tabs, switches back after 10 min of INACTIVITY

const TIMER_MINUTES = 10;
let switchBackTimeout = null;
let lastActivityTime = null;
let isSwitchingBack = false;
let targetTabId = null;
let activityListenerInstalled = false;

// Initialize on install
chrome.runtime.onInstalled.addListener(() => {
  console.log('Tab Keeper installed');
  chrome.storage.local.get(['timerMinutes'], (result) => {
    if (!result.timerMinutes) {
      chrome.storage.local.set({ timerMinutes: TIMER_MINUTES });
    }
  });
});

// Get timer duration in ms
async function getTimerMs() {
  const config = await chrome.storage.local.get(['timerMinutes']);
  return (config.timerMinutes || TIMER_MINUTES) * 60 * 1000;
}

// Start or restart the inactivity timer
async function startInactivityTimer() {
  // Clear existing timer
  if (switchBackTimeout) {
    clearTimeout(switchBackTimeout);
  }
  
  const timerMs = await getTimerMs();
  lastActivityTime = Date.now();
  
  console.log(`Tab Keeper: Inactivity timer started - ${timerMs/60000} minutes`);
  
  // Set timeout
  switchBackTimeout = setTimeout(async () => {
    const timeSinceActivity = Date.now() - lastActivityTime;
    const timeSinceStart = Date.now() - lastActivityTime;
    
    console.log(`Tab Keeper: Timeout fired. Time since activity: ${timeSinceActivity/1000}s`);
    
    // Only switch back if truly inactive for full duration
    if (timeSinceActivity >= timerMs) {
      await switchBackToTarget();
    } else {
      console.log('Tab Keeper: Recent activity detected, not switching back');
    }
  }, timerMs);
  
  // Store state for popup
  chrome.storage.local.set({
    timerActive: true,
    lastActivity: lastActivityTime,
    timerDuration: timerMs
  });
}

// Stop the timer
function stopTimer() {
  if (switchBackTimeout) {
    clearTimeout(switchBackTimeout);
    switchBackTimeout = null;
  }
  lastActivityTime = null;
  targetTabId = null;
  
  chrome.storage.local.set({
    timerActive: false,
    lastActivity: null,
    timerDuration: null
  });
  
  console.log('Tab Keeper: Timer stopped');
}

// Record user activity
function recordActivity() {
  if (lastActivityTime) {
    lastActivityTime = Date.now();
    chrome.storage.local.set({ lastActivity: lastActivityTime });
  }
}

// Install activity listeners on tabs
async function installActivityListener(tabId) {
  if (activityListenerInstalled) return;
  
  try {
    // Inject content script that reports activity
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: () => {
        // Track activity events
        ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].forEach(event => {
          window.addEventListener(event, () => {
            // Debounce - don't spam messages
            if (!window.lastActivityTime || Date.now() - window.lastActivityTime > 5000) {
              window.lastActivityTime = Date.now();
              chrome.runtime.sendMessage({ action: 'userActivity' });
            }
          }, { passive: true });
        });
      }
    });
    
    activityListenerInstalled = true;
    console.log('Tab Keeper: Activity listener installed');
  } catch (error) {
    console.log('Tab Keeper: Could not install activity listener:', error.message);
  }
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
      console.log('Tab Keeper: On target tab - stopping timer');
      targetTabId = newTabId;
      stopTimer();
    } else {
      console.log('Tab Keeper: Away from target tab - starting inactivity timer');
      lastActivityTime = Date.now();
      await startInactivityTimer();
      
      // Install activity listener on this tab
      await installActivityListener(newTabId);
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

  console.log('Tab Keeper: ⏰ INACTIVITY TIMEOUT - switching back to target');
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

// Listen for messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'loginRequired') {
    console.log('Tab Keeper: Login required - performing auto-login');
    performAutoLogin(sender.tab);
    sendResponse({ status: 'ok' });
  }
  
  if (request.action === 'checkLogin') {
    sendResponse({ status: 'checked' });
  }
  
  if (request.action === 'resetLoginAttempt') {
    sendResponse({ status: 'reset' });
  }
  
  if (request.action === 'userActivity') {
    // User was active on a non-target tab
    recordActivity();
    sendResponse({ status: 'recorded' });
  }
  
  if (request.action === 'getStatus') {
    chrome.storage.local.get(['timerActive', 'lastActivity', 'timerDuration', 'targetUrl', 'enabled']).then((result) => {
      sendResponse(result);
    });
    return true;
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
    '[name="username"]', '[name="email"]',
    'ion-input[type="email"]',
    'ion-input[type="text"]'
  ];
  
  const passwordSelectors = [
    'input[type="password"]',
    'input[name*="pass"]',
    '#password', '[name="password"]',
    'ion-input[type="password"]'
  ];
  
  const submitSelectors = [
    'button[type="submit"]',
    'input[type="submit"]',
    '.login-button', '#login-btn',
    'button.submit', '[type="submit"]',
    'ion-button[name="button-login"]',
    'ion-button[type="submit"]',
    '[name="button-login"]'
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
    
    // Handle regular input fields
    if (usernameField.tagName === 'INPUT') {
      usernameField.value = creds.username;
      usernameField.dispatchEvent(new Event('input', { bubbles: true }));
      usernameField.dispatchEvent(new Event('change', { bubbles: true }));
    } else if (usernameField.tagName === 'ION-INPUT') {
      // Ionic input - set value and trigger event
      usernameField.value = creds.username;
      usernameField.dispatchEvent(new CustomEvent('ionInput', { bubbles: true, detail: { value: creds.username } }));
      usernameField.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    if (passwordField.tagName === 'INPUT') {
      passwordField.value = creds.password;
      passwordField.dispatchEvent(new Event('input', { bubbles: true }));
      passwordField.dispatchEvent(new Event('change', { bubbles: true }));
    } else if (passwordField.tagName === 'ION-INPUT') {
      passwordField.value = creds.password;
      passwordField.dispatchEvent(new CustomEvent('ionInput', { bubbles: true, detail: { value: creds.password } }));
      passwordField.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    console.log('Auto-login: Fields filled, waiting for button to enable...');
    
    // Wait for button to become enabled (Ionic buttons disable until form is valid)
    setTimeout(() => {
      // Try regular button first
      if (submitButton) {
        if (submitButton.tagName === 'ION-BUTTON') {
          // Ionic button - need to click the native button inside shadow DOM
          console.log('Auto-login: Ionic button detected');
          
          // Try to enable it first by removing disabled attribute
          submitButton.removeAttribute('disabled');
          submitButton.removeAttribute('aria-disabled');
          
          // Click the native button inside shadow DOM
          const nativeButton = submitButton.shadowRoot?.querySelector('button');
          if (nativeButton) {
            console.log('Auto-login: Clicking native button in shadow DOM');
            nativeButton.click();
          } else {
            // Fallback: click the ion-button itself
            console.log('Auto-login: Clicking ion-button directly');
            submitButton.click();
          }
        } else {
          // Regular button
          console.log('Auto-login: Clicking submit button');
          submitButton.click();
        }
      } else {
        // No button found, try to submit form directly
        const form = usernameField.closest('form');
        if (form) {
          console.log('Auto-login: Submitting form directly');
          form.submit();
        } else {
          console.log('Auto-login: No form found, trying Enter key');
          // Try pressing Enter on the password field
          passwordField.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
        }
      }
    }, 500); // Wait 500ms for button to enable
    
  } else {
    console.log('Auto-login: Fields not found');
    console.log('Username:', !!usernameField, 'Password:', !!passwordField);
  }
}
