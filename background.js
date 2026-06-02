// Tab Keeper - Background Service Worker
// Monitors activity on non-target tabs, switches back after 10 min of INACTIVITY
// Uses chrome.alarms API for reliable timer that survives service worker restarts

const TIMER_MINUTES = 10;
let isSwitchingBack = false;
let targetTabId = null;
let activityListenerInstalled = false;

// Initialize on install
chrome.runtime.onInstalled.addListener(() => {
  console.log('[Tab Keeper] Installed');
  chrome.storage.local.get(['timerMinutes'], (result) => {
    if (!result.timerMinutes) {
      chrome.storage.local.set({ timerMinutes: TIMER_MINUTES });
    }
  });
});

// On startup, verify settings are loaded (they persist in chrome.storage.local automatically)
chrome.runtime.onStartup.addListener(async () => {
  console.log('[Tab Keeper] Extension started - settings persist in chrome.storage.local');
  const config = await chrome.storage.local.get(['targetUrl', 'username', 'password', 'enabled']);
  console.log('[Tab Keeper] Loaded config:', {
    targetUrl: config.targetUrl ? config.targetUrl.substring(0, 30) + '...' : 'none',
    hasUsername: !!config.username,
    hasPassword: !!config.password,
    enabled: config.enabled
  });
});

// Restore timer on service worker startup (not needed with alarms - they persist automatically!)
// chrome.alarms API handles persistence across service worker restarts

// Listen for alarm events - THIS IS THE KEY FOR RELIABLE SWITCHING!
chrome.alarms.onAlarm.addListener(async (alarm) => {
  console.log('[Tab Keeper] >>> ALARM EVENT RECEIVED: ' + alarm.name);
  if (alarm.name === 'switchBack') {
    console.log('[Tab Keeper] >>> ALARM FIRED - switching back to target <<<');
    try {
      await switchBackToTarget();
      console.log('[Tab Keeper] >>> switchBackToTarget completed after alarm');
    } catch (error) {
      console.error('[Tab Keeper] Error during alarm-triggered switch:', error);
    }
  } else {
    console.log('[Tab Keeper] Unknown alarm: ' + alarm.name);
  }
});

// Get timer duration in ms
async function getTimerMs() {
  const config = await chrome.storage.local.get(['timerMinutes']);
  return (config.timerMinutes || TIMER_MINUTES) * 60 * 1000;
}

// Start or restart the inactivity timer using chrome.alarms
async function startInactivityTimer() {
  const timerMinutes = await chrome.storage.local.get(['timerMinutes']);
  const minutes = timerMinutes.timerMinutes || TIMER_MINUTES;
  
  console.log('[Tab Keeper] Timer STARTED - ' + minutes + ' minutes');
  console.log('[Tab Keeper] Will fire at: ' + new Date(Date.now() + (minutes * 60000)).toLocaleTimeString());
  
  // Clear any existing alarm
  await chrome.alarms.clear('switchBack');
  
  // Create new alarm
  chrome.alarms.create('switchBack', {
    delayInMinutes: minutes
  });
  
  // Store state for popup
  const now = Date.now();
  chrome.storage.local.set({
    timerActive: true,
    lastActivity: now,
    timerDuration: minutes * 60000,
    timerStartTime: now
  });
  
  console.log('[Tab Keeper] Timer state saved to storage');
}

// Stop the timer
async function stopTimer() {
  await chrome.alarms.clear('switchBack');
  console.log('[Tab Keeper] Timer cleared');
  
  chrome.storage.local.set({
    timerActive: false,
    lastActivity: null,
    timerDuration: null,
    timerStartTime: null
  });
  
  console.log('[Tab Keeper] Timer STOPPED');
}

// Record user activity and reset timer
async function recordActivity(tabId) {
  const state = await chrome.storage.local.get(['timerActive', 'targetUrl']);
  
  if (!state.timerActive) {
    console.log('[Tab Keeper] Activity ignored - timer not active');
    return;
  }
  
  // Check if this activity is on the target tab
  if (tabId && state.targetUrl) {
    try {
      const tab = await chrome.tabs.get(tabId);
      console.log('[Tab Keeper] Activity from tab:', tabId, 'URL:', tab.url ? tab.url.substring(0, 50) : 'no URL');
      console.log('[Tab Keeper] Target URL:', state.targetUrl.substring(0, 50));
      
      if (tab.url && isTargetUrl(tab.url, state.targetUrl)) {
        console.log('[Tab Keeper] Activity ignored - on target tab');
        return; // Don't reset timer if activity is on target tab
      }
      console.log('[Tab Keeper] Activity on non-target tab - will reset timer');
    } catch (e) {
      // Tab might not exist, continue with activity recording
      console.log('[Tab Keeper] Could not get tab info:', e.message);
    }
  }
  
  console.log('[Tab Keeper] Activity recorded - resetting timer');
  // Clear and restart the alarm
  await startInactivityTimer();
}

// Install activity listeners on tabs
async function installActivityListener(tabId) {
  if (activityListenerInstalled) return;
  
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: () => {
        ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].forEach(event => {
          window.addEventListener(event, () => {
            if (!window.lastActivityTime || Date.now() - window.lastActivityTime > 5000) {
              window.lastActivityTime = Date.now();
              chrome.runtime.sendMessage({ action: 'userActivity' });
            }
          }, { passive: true });
        });
      }
    });
    
    activityListenerInstalled = true;
    console.log('[Tab Keeper] Activity listener installed');
  } catch (error) {
    console.log('[Tab Keeper] Could not install activity listener:', error.message);
  }
}

// Monitor tab changes
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  console.log('[Tab Keeper] Tab activated: ' + activeInfo.tabId);
  await handleTabSwitch(activeInfo.tabId);
});

// Monitor window focus changes
chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId !== chrome.windows.WINDOW_ID_NONE) {
    chrome.tabs.query({ active: true, windowId: windowId }, async (tabs) => {
      if (tabs[0]) {
        console.log('[Tab Keeper] Window focus changed, active tab: ' + tabs[0].id);
        await handleTabSwitch(tabs[0].id);
      }
    });
  }
});

// Extract base URL (domain + first path segment) for matching
function getBaseUrl(url) {
  try {
    const urlObj = new URL(url);
    // Match domain + first path segment (e.g., example.com/app)
    const firstPath = urlObj.pathname.split('/')[1] || '';
    return urlObj.origin + (firstPath ? '/' + firstPath : '');
  } catch (e) {
    return url;
  }
}

// Check if a tab URL matches the target (handles URL changes after login)
function isTargetUrl(tabUrl, targetUrl) {
  if (!tabUrl || !targetUrl) return false;
  
  // Exact match
  if (tabUrl === targetUrl) return true;
  
  // Starts with target
  if (tabUrl.startsWith(targetUrl)) return true;
  
  // Match by base URL (domain + first path)
  const tabBase = getBaseUrl(tabUrl);
  const targetBase = getBaseUrl(targetUrl);
  
  if (tabBase === targetBase) return true;
  
  // Match by domain only (most flexible)
  try {
    const tabDomain = new URL(tabUrl).hostname;
    const targetDomain = new URL(targetUrl).hostname;
    if (tabDomain === targetDomain) return true;
  } catch (e) {
    // URL parsing failed
  }
  
  return false;
}

// Handle tab switch logic
async function handleTabSwitch(newTabId) {
  if (isSwitchingBack) {
    console.log('[Tab Keeper] Ignoring switch (we triggered it)');
    isSwitchingBack = false;
    return;
  }

  const config = await chrome.storage.local.get(['targetUrl', 'enabled']);
  
  if (!config.enabled) {
    console.log('[Tab Keeper] Extension disabled');
    return;
  }
  
  if (!config.targetUrl) {
    console.log('[Tab Keeper] No target URL configured');
    return;
  }

  try {
    const tab = await chrome.tabs.get(newTabId);
    const tabUrl = tab.url || '';
    const isTargetTab = isTargetUrl(tabUrl, config.targetUrl);
    
    console.log('[Tab Keeper] Current tab URL: ' + tabUrl);
    console.log('[Tab Keeper] Target URL: ' + config.targetUrl);
    console.log('[Tab Keeper] Is target tab: ' + isTargetTab);
    
    if (isTargetTab) {
      console.log('[Tab Keeper] ON TARGET - stopping timer');
      targetTabId = newTabId;
      stopTimer();
    } else {
      console.log('[Tab Keeper] AWAY FROM TARGET - starting timer');
      await startInactivityTimer();
      
      // Install activity listener on this tab
      await installActivityListener(newTabId);
    }
  } catch (error) {
    console.error('[Tab Keeper] Error handling tab switch:', error);
  }
}

// Switch back to target tab
async function switchBackToTarget() {
  console.log('[Tab Keeper] >>> switchBackToTarget CALLED');
  
  const config = await chrome.storage.local.get(['targetUrl', 'username', 'password']);
  
  if (!config.targetUrl) {
    console.log('[Tab Keeper] No target URL configured');
    stopTimer();
    return;
  }

  console.log('[Tab Keeper] === SWITCHING BACK TO TARGET ===');
  console.log('[Tab Keeper] Target URL: ' + config.targetUrl);
  isSwitchingBack = true;
  stopTimer();

  try {
    // Find existing tab with target URL (handles URL changes after login)
    console.log('[Tab Keeper] Querying all tabs...');
    const allTabs = await chrome.tabs.query({});
    
    console.log('[Tab Keeper] Total tabs found: ' + allTabs.length);
    
    let existingTab = null;
    let matchReason = '';
    
    // Strategy 1: Exact URL match
    existingTab = allTabs.find(tab => tab.url === config.targetUrl);
    if (existingTab) matchReason = 'exact URL match';
    
    // Strategy 2: URL starts with target
    if (!existingTab) {
      existingTab = allTabs.find(tab => tab.url && tab.url.startsWith(config.targetUrl));
      if (existingTab) matchReason = 'URL starts with target';
    }
    
    // Strategy 3: Match by base URL (domain + first path) - BEST FOR LOGIN FLOWS
    if (!existingTab) {
      existingTab = allTabs.find(tab => tab.url && isTargetUrl(tab.url, config.targetUrl));
      if (existingTab) matchReason = 'base URL match (domain)';
    }
    
    // Strategy 4: Match by domain only
    if (!existingTab) {
      try {
        const targetDomain = new URL(config.targetUrl).hostname;
        existingTab = allTabs.find(tab => {
          if (!tab.url) return false;
          try {
            return new URL(tab.url).hostname === targetDomain;
          } catch (e) {
            return false;
          }
        });
        if (existingTab) matchReason = 'domain match only';
      } catch (e) {
        console.log('[Tab Keeper] URL parsing failed:', e);
      }
    }
    
    if (existingTab) {
      console.log('[Tab Keeper] FOUND existing tab: ' + existingTab.id);
      console.log('[Tab Keeper] Tab URL: ' + existingTab.url);
      console.log('[Tab Keeper] Match reason: ' + matchReason);
      console.log('[Tab Keeper] Tab windowId: ' + existingTab.windowId);
      
      try {
        // Focus the window first
        console.log('[Tab Keeper] Focusing window ' + existingTab.windowId);
        await chrome.windows.update(existingTab.windowId, { focused: true });
        console.log('[Tab Keeper] Window focused successfully');
        
        // Activate the tab
        console.log('[Tab Keeper] Activating tab ' + existingTab.id);
        await chrome.tabs.update(existingTab.id, { active: true, highlighted: true });
        console.log('[Tab Keeper] Tab activated successfully');
        
        targetTabId = existingTab.id;
        
        console.log('[Tab Keeper] ✓✓✓ SUCCESS - switched to tab ' + existingTab.id + ' ✓✓✓');
        
        // Reset login attempt flag so content script can try auto-login again
        setTimeout(() => {
          chrome.tabs.sendMessage(existingTab.id, { action: 'resetLoginAttempt' }).catch(e => {
            console.log('[Tab Keeper] Could not reset login attempt:', e.message);
          });
        }, 500);
      } catch (switchError) {
        console.error('[Tab Keeper] Failed to focus/activate tab:', switchError);
        console.error('[Tab Keeper] Error details:', switchError.message);
      }
      
      // Wait then check for login
      setTimeout(async () => {
        try {
          await chrome.tabs.sendMessage(existingTab.id, { action: 'checkLogin' });
          console.log('[Tab Keeper] Sent login check message');
        } catch (e) {
          console.log('[Tab Keeper] Could not send login check: ' + e.message);
        }
      }, 1500);
      
    } else {
      console.log('[Tab Keeper] NO existing tab found - CREATING NEW TAB');
      console.log('[Tab Keeper] Creating tab with URL: ' + config.targetUrl);
      try {
        const newTab = await chrome.tabs.create({ 
          url: config.targetUrl, 
          active: true 
        });
        targetTabId = newTab.id;
        console.log('[Tab Keeper] ✓✓✓ Created new tab: ' + newTab.id + ' ✓✓✓');
      } catch (createError) {
        console.error('[Tab Keeper] Failed to create new tab:', createError);
        console.error('[Tab Keeper] Error details:', createError.message);
      }
    }
    
  } catch (error) {
    console.error('[Tab Keeper] ERROR switching back:', error);
    console.error('[Tab Keeper] Error details:', error.message);
    console.error('[Tab Keeper] Stack:', error.stack);
  } finally {
    isSwitchingBack = false;
    console.log('[Tab Keeper] <<< switchBackToTarget COMPLETE');
  }
}

// Listen for messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[Tab Keeper] Message received: ' + (request ? request.action : 'unknown'));
  
  if (request.action === 'loginRequired') {
    console.log('[Tab Keeper] Login required - performing auto-login');
    performAutoLogin(sender.tab);
    sendResponse({ status: 'ok' });
  }
  
  if (request.action === 'checkLogin') {
    sendResponse({ status: 'checked' });
  }
  
  if (request.action === 'getTargetUrl') {
    chrome.storage.local.get(['targetUrl']).then((result) => {
      sendResponse({ targetUrl: result.targetUrl || null });
    });
    return true;
  }
  
  if (request.action === 'resetLoginAttempt') {
    sendResponse({ status: 'reset' });
  }
  
  if (request.action === 'userActivity') {
    // Pass the sender's tab ID so we can check if activity is on target tab
    console.log('[Tab Keeper] userActivity message received from tab:', sender.tab ? sender.tab.id : 'unknown');
    recordActivity(sender.tab ? sender.tab.id : null);
    sendResponse({ status: 'recorded' });
  }
  
  if (request.action === 'getStatus') {
    chrome.storage.local.get(['timerActive', 'lastActivity', 'timerDuration', 'targetUrl', 'enabled', 'timerStartTime']).then((result) => {
      console.log('[Tab Keeper] getStatus response:', result);
      sendResponse(result);
    });
    return true;
  }
  
  if (request.action === 'manualSwitch') {
    console.log('[Tab Keeper] Manual switch requested');
    switchBackToTarget();
    sendResponse({ status: 'switching' });
    return true;
  }
  
  if (request.action === 'popupOpened') {
    // Track when popup is opened to detect interference patterns
    popupOpenCount++;
    console.log('[Tab Keeper] Popup opened (count:', popupOpenCount + ')');
    sendResponse({ status: 'tracked' });
  }
  
  if (request.action === 'debug') {
    // Debug command - return current state
    chrome.storage.local.get(null).then((allData) => {
      sendResponse({ state: allData, timerRunning: true, popupOpenCount: popupOpenCount });
    });
    return true;
  }
});

// Auto-login function
async function performAutoLogin(tab) {
  if (!tab || !tab.id) {
    console.log('[Tab Keeper] No valid tab for auto-login');
    return;
  }
  
  const config = await chrome.storage.local.get(['username', 'password']);
  
  if (!config.username || !config.password) {
    console.log('[Tab Keeper] No credentials configured');
    return;
  }

  console.log('[Tab Keeper] Auto-login for: ' + config.username);

  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: autoLoginFunction,
      args: [{ username: config.username, password: config.password }]
    });
    console.log('[Tab Keeper] Auto-login executed');
  } catch (error) {
    console.error('[Tab Keeper] Auto-login failed:', error);
  }
}

// Injected function for auto-login
function autoLoginFunction(creds) {
  console.log('[Auto-login] Starting');
  
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
    '[name="button-login"]',
    'app-root ion-app ion-router-outlet app-login ion-content ion-card > ion-button',
    'body > app-root > ion-app > ion-router-outlet > app-login > ion-content > ion-card > div:nth-child(4) > ion-button'
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
    console.log('[Auto-login] Found fields');
    
    // Handle regular input fields
    if (usernameField.tagName === 'INPUT') {
      usernameField.value = creds.username;
      usernameField.dispatchEvent(new Event('input', { bubbles: true }));
      usernameField.dispatchEvent(new Event('change', { bubbles: true }));
    } else if (usernameField.tagName === 'ION-INPUT') {
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
    
    console.log('[Auto-login] Fields filled, waiting for button to enable...');
    
    // Wait for button to become enabled
    setTimeout(() => {
      if (submitButton) {
        if (submitButton.tagName === 'ION-BUTTON') {
          console.log('[Auto-login] Ionic button detected');
          
          // Enable the button
          submitButton.removeAttribute('disabled');
          submitButton.removeAttribute('aria-disabled');
          
          // Click native button in shadow DOM
          const nativeButton = submitButton.shadowRoot?.querySelector('button');
          if (nativeButton) {
            console.log('[Auto-login] Clicking native button in shadow DOM');
            nativeButton.click();
          } else {
            console.log('[Auto-login] Clicking ion-button directly');
            submitButton.click();
          }
        } else {
          console.log('[Auto-login] Clicking submit button');
          submitButton.click();
        }
      } else {
        const form = usernameField.closest('form');
        if (form) {
          console.log('[Auto-login] Submitting form directly');
          form.submit();
        } else {
          console.log('[Auto-login] No button found, trying Enter key');
          passwordField.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
        }
      }
    }, 500);
    
  } else {
    console.log('[Auto-login] Fields not found');
    console.log('[Auto-login] Username field:', !!usernameField, 'Password field:', !!passwordField);
  }
}
