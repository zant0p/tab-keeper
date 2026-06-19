// Tab Keeper - Background Service Worker (v2.0.0)
// AL and SNF variants with built-in credentials
// Timer in seconds, keeps both tabs alive, handles Chrome breach popup

// Configuration - choose variant before building
// Set to 'AL' for Assisted Living or 'SNF' for Skilled Nursing Facility
const VARIANT = 'AL'; // CHANGE THIS: 'AL' or 'SNF'

// Credentials per variant
const CREDENTIALS = {
  AL: {
    username: 'alstaff',
    password: 'alstaff'
  },
  SNF: {
    username: 'snf',
    password: 'snf'
  }
};

// URLs
const PRIMARY_URL = 'https://10.1.129.207/Arial/#/login';
const SECONDARY_URL = 'https://login.pointclickcare.com/poc/userLogin.xhtml';

// Timer in seconds (default 300 seconds = 5 minutes)
const DEFAULT_TIMER_SECONDS = 300;

// State
let isSwitchingBack = false;
let activityListenerInstalled = false;
let primaryTabId = null;
let secondaryTabId = null;

// Get credentials for current variant
function getCredentials() {
  return CREDENTIALS[VARIANT] || CREDENTIALS.AL;
}

// Storage helper: reads config from local storage
async function getConfig(keys = null) {
  return new Promise((resolve) => {
    chrome.storage.local.get(keys, (result) => {
      resolve(result);
    });
  });
}

// Storage helper: writes to local storage
async function setConfig(data) {
  return new Promise((resolve) => {
    chrome.storage.local.set(data, () => {
      resolve();
    });
  });
}

// Initialize on install
chrome.runtime.onInstalled.addListener(() => {
  console.log(`[Tab Keeper] Installed v2.0.0 (${VARIANT} variant)`);
  // Set defaults
  setConfig({
    timerSeconds: DEFAULT_TIMER_SECONDS,
    variant: VARIANT,
    primaryUrl: PRIMARY_URL,
    secondaryUrl: SECONDARY_URL
  });
});

// On startup - open target tabs
chrome.runtime.onStartup.addListener(async () => {
  console.log('[Tab Keeper] Extension started');
  await ensureTabsExist();
});

// Ensure target tabs exist (auto-reopen if closed)
async function ensureTabsExist() {
  const allTabs = await chrome.tabs.query({});
  
  // Check primary tab - exact URL match
  const primaryExists = allTabs.some(tab => tab.url === PRIMARY_URL || tab.url?.startsWith(PRIMARY_URL));
  if (!primaryExists) {
    console.log('[Tab Keeper] Primary tab not found - creating it');
    const newTab = await chrome.tabs.create({ url: PRIMARY_URL, active: false });
    primaryTabId = newTab.id;
  }
  
  // Check secondary tab
  const secondaryExists = allTabs.some(tab => tab.url === SECONDARY_URL || tab.url?.startsWith(SECONDARY_URL));
  if (!secondaryExists) {
    console.log('[Tab Keeper] Secondary tab not found - creating it');
    const newTab = await chrome.tabs.create({ url: SECONDARY_URL, active: false });
    secondaryTabId = newTab.id;
  }
}

// Listen for alarm events
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'switchBack') {
    console.log('[Tab Keeper] >>> ALARM FIRED - switching to primary <<<');
    await switchBackToPrimary();
  }
});

// Get timer duration in ms
async function getTimerMs() {
  const config = await getConfig(['timerSeconds']);
  return (config.timerSeconds || DEFAULT_TIMER_SECONDS) * 1000;
}

// Start or restart the inactivity timer
async function startInactivityTimer() {
  const config = await getConfig(['timerSeconds']);
  const seconds = config.timerSeconds || DEFAULT_TIMER_SECONDS;
  
  console.log(`[Tab Keeper] Timer STARTED - ${seconds} seconds`);
  console.log('[Tab Keeper] Will fire at: ' + new Date(Date.now() + (seconds * 1000)).toLocaleTimeString());
  
  // Clear any existing alarm
  await chrome.alarms.clear('switchBack');
  
  // Create new alarm (in seconds)
  chrome.alarms.create('switchBack', {
    delayInMinutes: Math.ceil(seconds / 60)
  });
  
  // Store state for popup
  const now = Date.now();
  await setConfig({
    timerActive: true,
    lastActivity: now,
    timerDuration: seconds * 1000,
    timerStartTime: now
  });
  
  console.log('[Tab Keeper] Timer state saved');
}

// Stop the timer
async function stopTimer() {
  await chrome.alarms.clear('switchBack');
  console.log('[Tab Keeper] Timer cleared');
  
  await setConfig({
    timerActive: false,
    lastActivity: null,
    timerDuration: null,
    timerStartTime: null
  });
  
  console.log('[Tab Keeper] Timer STOPPED');
}

// Record user activity and reset timer
async function recordActivity(tabId) {
  const state = await getConfig(['timerActive']);
  
  if (!state.timerActive) {
    console.log('[Tab Keeper] Activity ignored - timer not active');
    return;
  }
  
  // Check if this activity is on the primary tab (the only safe zone)
  if (tabId) {
    try {
      const tab = await chrome.tabs.get(tabId);
      const isOnPrimary = tab.url === PRIMARY_URL || tab.url?.startsWith(PRIMARY_URL);
      
      if (isOnPrimary) {
        console.log('[Tab Keeper] Activity on PRIMARY tab - ignoring (safe zone)');
        return; // Don't reset timer if on primary tab
      }
      
      console.log('[Tab Keeper] Activity on non-primary tab - resetting timer');
    } catch (e) {
      console.log('[Tab Keeper] Could not get tab info:', e.message);
    }
  }
  
  // Reset timer
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

// Monitor tab closure - auto-reopen target tabs
chrome.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
  // Check if closed tab was a target tab
  if (tabId === primaryTabId || tabId === secondaryTabId) {
    console.log('[Tab Keeper] Target tab closed:', tabId);
    
    // Reopen after a short delay
    setTimeout(async () => {
      if (tabId === primaryTabId) {
        // Double-check: make sure no other tab with this URL exists before reopening
        const allTabs = await chrome.tabs.query({});
        const primaryExists = allTabs.some(tab => tab.url === PRIMARY_URL || tab.url?.startsWith(PRIMARY_URL));
        
        if (!primaryExists) {
          console.log('[Tab Keeper] Reopening primary tab');
          const newTab = await chrome.tabs.create({ url: PRIMARY_URL, active: false });
          primaryTabId = newTab.id;
        } else {
          console.log('[Tab Keeper] Primary tab already exists - skipping reopen');
        }
      } else if (tabId === secondaryTabId) {
        const allTabs = await chrome.tabs.query({});
        const secondaryExists = allTabs.some(tab => tab.url === SECONDARY_URL || tab.url?.startsWith(SECONDARY_URL));
        
        if (!secondaryExists) {
          console.log('[Tab Keeper] Reopening secondary tab');
          const newTab = await chrome.tabs.create({ url: SECONDARY_URL, active: false });
          secondaryTabId = newTab.id;
        } else {
          console.log('[Tab Keeper] Secondary tab already exists - skipping reopen');
        }
      }
    }, 1000);
  }
});

// Monitor tab changes
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  console.log('[Tab Keeper] Tab activated: ' + activeInfo.tabId);
  
  // If this is the primary tab, trigger a login check
  if (activeInfo.tabId === primaryTabId) {
    console.log('[Tab Keeper] Primary tab activated - will check login status');
    setTimeout(() => {
      chrome.tabs.sendMessage(activeInfo.tabId, { action: 'checkLogin' }).catch(e => {
        console.log('[Tab Keeper] Could not send login check:', e.message);
      });
    }, 1000);
  }
  
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

// Handle tab switch logic
async function handleTabSwitch(newTabId) {
  if (isSwitchingBack) {
    console.log('[Tab Keeper] Ignoring switch (we triggered it)');
    isSwitchingBack = false;
    return;
  }

  try {
    const tab = await chrome.tabs.get(newTabId);
    const tabUrl = tab.url || '';
    
    // Check if this is the primary tab (the only safe zone)
    const isPrimaryTab = tabUrl === PRIMARY_URL || tabUrl?.startsWith(PRIMARY_URL);
    const isSecondaryTab = tabUrl === SECONDARY_URL || tabUrl?.startsWith(SECONDARY_URL);
    
    console.log('[Tab Keeper] Current tab URL:', tabUrl.substring(0, 80));
    console.log('[Tab Keeper] Is primary tab:', isPrimaryTab);
    console.log('[Tab Keeper] Is secondary tab:', isSecondaryTab);
    
    if (isPrimaryTab) {
      console.log('[Tab Keeper] ON PRIMARY - stopping timer');
      primaryTabId = newTabId;
      stopTimer();
    } else {
      console.log('[Tab Keeper] AWAY FROM PRIMARY - starting timer');
      await startInactivityTimer();
      await installActivityListener(newTabId);
    }
  } catch (error) {
    console.error('[Tab Keeper] Error handling tab switch:', error);
  }
}

// Switch back to primary tab
async function switchBackToPrimary() {
  console.log('[Tab Keeper] >>> switchBackToPrimary CALLED');
  
  console.log('[Tab Keeper] === SWITCHING TO PRIMARY ===');
  isSwitchingBack = true;
  stopTimer();

  try {
    const allTabs = await chrome.tabs.query({});
    
    let existingTab = allTabs.find(tab => tab.url === PRIMARY_URL || tab.url?.startsWith(PRIMARY_URL));
    
    if (existingTab) {
      console.log('[Tab Keeper] FOUND existing tab:', existingTab.id);
      
      await chrome.windows.update(existingTab.windowId, { focused: true });
      await chrome.tabs.update(existingTab.id, { active: true, highlighted: true });
      
      primaryTabId = existingTab.id;
      console.log('[Tab Keeper] ✓ SUCCESS - switched to tab', existingTab.id);
      
      // Reset login attempt flag
      setTimeout(() => {
        chrome.tabs.sendMessage(existingTab.id, { action: 'resetLoginAttempt' }).catch(e => {
          console.log('[Tab Keeper] Could not reset login attempt:', e.message);
        });
      }, 500);
    } else {
      console.log('[Tab Keeper] No existing tab found - creating new one');
      const newTab = await chrome.tabs.create({ url: PRIMARY_URL });
      primaryTabId = newTab.id;
      console.log('[Tab Keeper] ✓ Created new primary tab:', newTab.id);
    }
  } catch (error) {
    console.error('[Tab Keeper] Error switching to primary:', error);
  }
}

// Monitor tab updates - trigger auto-login check when page loads
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tabId === primaryTabId) {
    const isPrimaryUrl = tab.url === PRIMARY_URL || tab.url?.startsWith(PRIMARY_URL);
    
    if (isPrimaryUrl) {
      console.log('[Tab Keeper] Primary tab loaded - triggering login check');
      setTimeout(() => {
        chrome.tabs.sendMessage(tabId, { action: 'checkLogin' }).catch(e => {
          console.log('[Tab Keeper] Could not send login check:', e.message);
        });
      }, 1500);
    }
  }
});

// Message handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Tab Keeper] Message received:', message.action);
  
  if (message.action === 'getStatus') {
    getConfig(['timerActive', 'lastActivity', 'timerDuration', 'timerStartTime', 'timerSeconds']).then((state) => {
      sendResponse({
        variant: VARIANT,
        primaryUrl: PRIMARY_URL,
        secondaryUrl: SECONDARY_URL,
        ...state
      });
    });
    return true;
  }
  
  if (message.action === 'manualSwitch') {
    switchBackToPrimary().then(() => {
      sendResponse({ status: 'switching' });
    });
    return true;
  }
  
  if (message.action === 'userActivity') {
    recordActivity(sender.tab?.id).then(() => {
      sendResponse({ status: 'ok' });
    });
    return true;
  }
  
  if (message.action === 'popupOpened') {
    sendResponse({ status: 'ok' });
  }
  
  // Get credentials for auto-login
  if (message.action === 'getCredentials') {
    const creds = getCredentials();
    sendResponse({ 
      success: true,
      username: creds.username,
      password: creds.password,
      variant: VARIANT
    });
    return true;
  }
  
  // Handle auto-login request
  if (message.action === 'loginRequired') {
    const creds = getCredentials();
    
    console.log('[Tab Keeper] Auto-login approved for primary URL');
    sendResponse({ success: true });
    
    // Wait for tab to be ready, then inject login script
    try {
      chrome.scripting.executeScript({
        target: { tabId: sender.tab.id },
        func: (username, password) => {
          console.log('[Auto-Login] Starting login process...');
          
          // Find and fill login form
          const usernameField = document.querySelector('input[name*="user"], input[name*="email"], #username, #email, [name="username"], input[type="email"]');
          const passwordField = document.querySelector('input[type="password"]');
          const form = document.querySelector('form');
          
          if (!usernameField || !passwordField) {
            console.log('[Auto-Login] Login fields not found');
            return;
          }
          
          console.log('[Auto-Login] Found login fields, filling credentials...');
          usernameField.value = username;
          passwordField.value = password;
          
          // Trigger input events for React/modern frameworks
          ['input', 'change'].forEach(evt => {
            usernameField.dispatchEvent(new Event(evt, { bubbles: true }));
            passwordField.dispatchEvent(new Event(evt, { bubbles: true }));
          });
          
          // Focus and blur to trigger validation
          passwordField.focus();
          setTimeout(() => {
            passwordField.blur();
            
            // Try clicking submit button first
            const submitBtn = document.querySelector('button[type="submit"], input[type="submit"], button.submit, .submit-btn');
            if (submitBtn) {
              console.log('[Auto-Login] Clicking submit button');
              submitBtn.click();
            } else if (form) {
              console.log('[Auto-Login] Submitting form directly');
              form.submit();
            } else {
              console.log('[Auto-Login] No submit button or form found');
            }
          }, 300);
        },
        args: [creds.username, creds.password]
      });
      console.log('[Tab Keeper] Login script injected successfully');
    } catch (error) {
      console.error('[Tab Keeper] Auto-login injection failed:', error);
    }
    return true;
  }
  
  // Handle Chrome breach popup dismissal (AL variant only)
  if (message.action === 'closeBreachPopup') {
    if (VARIANT === 'AL') {
      console.log('[Tab Keeper] Closing breach popup for AL variant');
      chrome.scripting.executeScript({
        target: { tabId: sender.tab.id },
        func: () => {
          // Look for Chrome's password breach notification dialog
          const dialogs = document.querySelectorAll('div[role="dialog"], .mdc-dialog, [aria-label*="password"], [aria-label*="breach"]');
          dialogs.forEach(dialog => {
            const closeBtn = dialog.querySelector('button') || dialog.querySelector('[role="button"]');
            if (closeBtn) {
              console.log('[Breach Popup] Closing dialog');
              closeBtn.click();
            }
          });
          
          // Also try to find by text content
          const allButtons = document.querySelectorAll('button');
          allButtons.forEach(btn => {
            const text = btn.textContent.toLowerCase();
            if (text.includes('dismiss') || text.includes('close') || text.includes('cancel')) {
              btn.click();
            }
          });
        }
      });
    }
    sendResponse({ status: 'ok' });
    return true;
  }
});
