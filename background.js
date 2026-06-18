// Tab Keeper - Background Service Worker (v1.0.16)
// Supports Chrome Enterprise managed storage + local fallback
// Monitors primary + secondary tabs, auto-reopens if closed
// Timer only stops on primary tab (secondary is NOT a safe zone)

const DEFAULT_TIMER_MINUTES = 10;

// State
let isSwitchingBack = false;
let activityListenerInstalled = false;
let primaryTabId = null;
let secondaryTabId = null;

// Storage helper: reads from managed first, falls back to local
async function getConfig(keys = null) {
  return new Promise((resolve) => {
    // Try managed storage first (Enterprise policy)
    chrome.storage.managed.get(keys, (managedResult) => {
      const hasManagedConfig = managedResult && Object.keys(managedResult).length > 0;
      
      if (hasManagedConfig) {
        console.log('[Tab Keeper] Using managed storage (Enterprise policy)');
        resolve(managedResult);
      } else {
        // Fall back to local storage
        chrome.storage.local.get(keys, (localResult) => {
          console.log('[Tab Keeper] Using local storage');
          resolve(localResult);
        });
      }
    });
  });
}

// Storage helper: writes to local (managed is read-only for extension)
async function setConfig(data) {
  return new Promise((resolve) => {
    chrome.storage.local.set(data, () => {
      console.log('[Tab Keeper] Config saved to local storage');
      resolve();
    });
  });
}

// Initialize on install
chrome.runtime.onInstalled.addListener(() => {
  console.log('[Tab Keeper] Installed v1.0.16');
  // Set defaults if not configured
  getConfig(['timerMinutes']).then((config) => {
    if (!config.timerMinutes) {
      setConfig({ timerMinutes: DEFAULT_TIMER_MINUTES });
    }
  });
});

// On startup - load config and restore tabs if needed
chrome.runtime.onStartup.addListener(async () => {
  console.log('[Tab Keeper] Extension started');
  const config = await getConfig(['primaryUrl', 'secondaryUrl', 'username', 'password', 'enabled', 'timerMinutes']);
  console.log('[Tab Keeper] Loaded config:', {
    primaryUrl: config.primaryUrl ? config.primaryUrl.substring(0, 30) + '...' : 'none',
    secondaryUrl: config.secondaryUrl ? config.secondaryUrl.substring(0, 30) + '...' : 'none',
    hasUsername: !!config.username,
    hasPassword: !!config.password,
    enabled: config.enabled,
    timerMinutes: config.timerMinutes
  });
  
  // Auto-open target tabs if enabled and URLs configured
  if (config.enabled && config.primaryUrl) {
    await ensureTabsExist(config);
  }
});

// Ensure target tabs exist (auto-reopen if closed)
async function ensureTabsExist(config) {
  const allTabs = await chrome.tabs.query({});
  
  // Check primary tab - use exact matching
  const primaryExists = allTabs.some(tab => isTargetUrl(tab.url, config.primaryUrl, true));
  if (!primaryExists && config.primaryUrl) {
    console.log('[Tab Keeper] Primary tab not found - creating it');
    const newTab = await chrome.tabs.create({ url: config.primaryUrl, active: false });
    primaryTabId = newTab.id;
  }
  
  // Check secondary tab (if configured) - loose matching ok for secondary
  if (config.secondaryUrl) {
    const secondaryExists = allTabs.some(tab => isTargetUrl(tab.url, config.secondaryUrl, false));
    if (!secondaryExists) {
      console.log('[Tab Keeper] Secondary tab not found - creating it');
      const newTab = await chrome.tabs.create({ url: config.secondaryUrl, active: false });
      secondaryTabId = newTab.id;
    }
  }
}

// Listen for alarm events
chrome.alarms.onAlarm.addListener(async (alarm) => {
  console.log('[Tab Keeper] >>> ALARM EVENT: ' + alarm.name);
  if (alarm.name === 'switchBack') {
    console.log('[Tab Keeper] >>> ALARM FIRED - switching to primary <<<');
    try {
      await switchBackToPrimary();
      console.log('[Tab Keeper] >>> switchBackToPrimary completed');
    } catch (error) {
      console.error('[Tab Keeper] Error during alarm-triggered switch:', error);
    }
  }
});

// Get timer duration in ms
async function getTimerMs() {
  const config = await getConfig(['timerMinutes']);
  return (config.timerMinutes || DEFAULT_TIMER_MINUTES) * 60 * 1000;
}

// Start or restart the inactivity timer
async function startInactivityTimer() {
  const config = await getConfig(['timerMinutes']);
  const minutes = config.timerMinutes || DEFAULT_TIMER_MINUTES;
  
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
  
  console.log('[Tab Keeper] Timer state saved');
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
  const config = await getConfig(['primaryUrl', 'timerMinutes']);
  const state = await chrome.storage.local.get(['timerActive']);
  
  if (!state.timerActive) {
    console.log('[Tab Keeper] Activity ignored - timer not active');
    return;
  }
  
  // Check if this activity is on the primary tab (the only safe zone)
  if (tabId && config.primaryUrl) {
    try {
      const tab = await chrome.tabs.get(tabId);
      const isOnPrimary = isTargetUrl(tab.url, config.primaryUrl);
      
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
  const config = await getConfig(['primaryUrl', 'secondaryUrl', 'enabled']);
  
  if (!config.enabled || (!config.primaryUrl && !config.secondaryUrl)) {
    return;
  }
  
  // Check if closed tab was a target tab (use exact match for primary)
  if (tabId === primaryTabId || tabId === secondaryTabId) {
    console.log('[Tab Keeper] Target tab closed:', tabId);
    
    // Reopen after a short delay
    setTimeout(async () => {
      if (tabId === primaryTabId && config.primaryUrl) {
        // Double-check: make sure no other tab with this URL exists before reopening
        const allTabs = await chrome.tabs.query({});
        const primaryExists = allTabs.some(tab => isTargetUrl(tab.url, config.primaryUrl, true));
        
        if (!primaryExists) {
          console.log('[Tab Keeper] Reopening primary tab');
          const newTab = await chrome.tabs.create({ url: config.primaryUrl, active: false });
          primaryTabId = newTab.id;
        } else {
          console.log('[Tab Keeper] Primary tab already exists - skipping reopen');
        }
      } else if (tabId === secondaryTabId && config.secondaryUrl) {
        const allTabs = await chrome.tabs.query({});
        const secondaryExists = allTabs.some(tab => isTargetUrl(tab.url, config.secondaryUrl, false));
        
        if (!secondaryExists) {
          console.log('[Tab Keeper] Reopening secondary tab');
          const newTab = await chrome.tabs.create({ url: config.secondaryUrl, active: false });
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
  const config = await getConfig(['primaryUrl', 'username', 'password', 'enabled']);
  if (config.enabled && config.primaryUrl && config.username && config.password) {
    if (activeInfo.tabId === primaryTabId) {
      console.log('[Tab Keeper] Primary tab activated - will check login status');
      setTimeout(() => {
        chrome.tabs.sendMessage(activeInfo.tabId, { action: 'checkLogin' }).catch(e => {
          console.log('[Tab Keeper] Could not send login check:', e.message);
        });
      }, 1000);
    }
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

// Extract base URL for matching
function getBaseUrl(url) {
  try {
    const urlObj = new URL(url);
    const firstPath = urlObj.pathname.split('/')[1] || '';
    return urlObj.origin + (firstPath ? '/' + firstPath : '');
  } catch (e) {
    return url;
  }
}

// Check if a tab URL matches the target (EXACT match for primary tabs)
function isTargetUrl(tabUrl, targetUrl, exactMatch = false) {
  if (!tabUrl || !targetUrl) return false;
  
  // Exact match (used for primary tab - prevents duplicates)
  if (exactMatch) {
    if (tabUrl === targetUrl) return true;
    if (tabUrl.startsWith(targetUrl)) return true;
    // Also match if base paths are identical
    const tabBase = getBaseUrl(tabUrl);
    const targetBase = getBaseUrl(targetUrl);
    return tabBase === targetBase;
  }
  
  // Loose match (used for secondary tab monitoring)
  if (tabUrl === targetUrl) return true;
  if (tabUrl.startsWith(targetUrl)) return true;
  
  const tabBase = getBaseUrl(tabUrl);
  const targetBase = getBaseUrl(targetUrl);
  if (tabBase === targetBase) return true;
  
  try {
    const tabDomain = new URL(tabUrl).hostname;
    const targetDomain = new URL(targetUrl).hostname;
    if (tabDomain === targetDomain) return true;
  } catch (e) {}
  
  return false;
}

// Handle tab switch logic
async function handleTabSwitch(newTabId) {
  if (isSwitchingBack) {
    console.log('[Tab Keeper] Ignoring switch (we triggered it)');
    isSwitchingBack = false;
    return;
  }

  const config = await getConfig(['primaryUrl', 'secondaryUrl', 'enabled']);
  
  if (!config.enabled) {
    console.log('[Tab Keeper] Extension disabled');
    return;
  }
  
  if (!config.primaryUrl && !config.secondaryUrl) {
    console.log('[Tab Keeper] No target URLs configured');
    return;
  }

  try {
    const tab = await chrome.tabs.get(newTabId);
    const tabUrl = tab.url || '';
    
    // Check if this is the primary tab (the only safe zone) - use EXACT match
    const isPrimaryTab = config.primaryUrl && isTargetUrl(tabUrl, config.primaryUrl, true);
    const isSecondaryTab = config.secondaryUrl && isTargetUrl(tabUrl, config.secondaryUrl, false);
    
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
  
  const config = await getConfig(['primaryUrl', 'username', 'password']);
  
  if (!config.primaryUrl) {
    console.log('[Tab Keeper] No primary URL configured');
    stopTimer();
    return;
  }

  console.log('[Tab Keeper] === SWITCHING TO PRIMARY ===');
  console.log('[Tab Keeper] Primary URL: ' + config.primaryUrl);
  isSwitchingBack = true;
  stopTimer();

  try {
    const allTabs = await chrome.tabs.query({});
    
    let existingTab = null;
    let matchReason = '';
    
    // Strategy 1: Exact URL match (primary tab only - prevents duplicates)
    existingTab = allTabs.find(tab => tab.url === config.primaryUrl);
    if (existingTab) matchReason = 'exact URL match';
    
    // Strategy 2: URL starts with target
    if (!existingTab) {
      existingTab = allTabs.find(tab => tab.url && tab.url.startsWith(config.primaryUrl));
      if (existingTab) matchReason = 'URL starts with target';
    }
    
    // Strategy 3: Match by base URL (still exact path matching)
    if (!existingTab) {
      existingTab = allTabs.find(tab => tab.url && isTargetUrl(tab.url, config.primaryUrl, true));
      if (existingTab) matchReason = 'base URL match';
    }
    
    // DO NOT fall back to domain-only matching for primary tabs (prevents duplicates)
    
    if (existingTab) {
      console.log('[Tab Keeper] FOUND existing tab:', existingTab.id);
      console.log('[Tab Keeper] Match reason:', matchReason);
      
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
      const newTab = await chrome.tabs.create({ url: config.primaryUrl });
      primaryTabId = newTab.id;
      console.log('[Tab Keeper] ✓ Created new primary tab:', newTab.id);
    }
  } catch (error) {
    console.error('[Tab Keeper] Error switching to primary:', error);
  }
}

// Monitor tab updates - trigger auto-login check when page loads
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  const config = await getConfig(['primaryUrl', 'username', 'password', 'enabled']);
  
  if (!config.enabled || !config.primaryUrl || !config.username || !config.password) {
    return;
  }
  
  // Check if this is the primary tab and page just completed loading
  if (changeInfo.status === 'complete' && tabId === primaryTabId) {
    const isPrimaryUrl = config.primaryUrl && (
      tab.url === config.primaryUrl ||
      tab.url.startsWith(config.primaryUrl) ||
      tab.url.startsWith(new URL(config.primaryUrl).origin)
    );
    
    if (isPrimaryUrl) {
      console.log('[Tab Keeper] Primary tab loaded - triggering login check');
      // Wait a bit for page to fully render, then check for login
      setTimeout(() => {
        chrome.tabs.sendMessage(tabId, { action: 'checkLogin' }).catch(e => {
          console.log('[Tab Keeper] Could not send login check:', e.message);
        });
      }, 1500); // 1.5 second delay for page rendering
    }
  }
});

// Message handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Tab Keeper] Message received:', message.action);
  
  if (message.action === 'getStatus') {
    getConfig(['primaryUrl', 'secondaryUrl', 'enabled', 'username']).then((config) => {
      chrome.storage.local.get(['timerActive', 'lastActivity', 'timerDuration', 'timerStartTime'], (state) => {
        sendResponse({
          ...config,
          ...state
        });
      });
    });
    return true; // Keep channel open for async response
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
  
  // Get primary URL only (for auto-login content script)
  if (message.action === 'getTargetUrl') {
    getConfig(['primaryUrl']).then((config) => {
      sendResponse({ targetUrl: config.primaryUrl });
    });
    return true;
  }
  
  // Handle auto-login request - only for primary URL
  if (message.action === 'loginRequired') {
    getConfig(['primaryUrl', 'username', 'password']).then(async (config) => {
      if (!config.primaryUrl || !config.username || !config.password) {
        sendResponse({ success: false, reason: 'missing credentials' });
        return;
      }
      
      // Verify the sender tab is on the primary URL
      const senderUrl = sender.tab?.url;
      const isPrimaryTab = senderUrl && (
        senderUrl === config.primaryUrl ||
        senderUrl.startsWith(config.primaryUrl) ||
        senderUrl.startsWith(new URL(config.primaryUrl).origin)
      );
      
      if (!isPrimaryTab) {
        console.log('[Tab Keeper] Auto-login rejected - not on primary URL');
        sendResponse({ success: false, reason: 'not primary url' });
        return;
      }
      
      console.log('[Tab Keeper] Auto-login approved for primary URL');
      sendResponse({ success: true });
      
      // Wait for tab to be ready, then inject login script
      try {
        // First, ensure the tab is loaded
        await chrome.tabs.sendMessage(sender.tab.id, { action: 'ping' }).catch(async () => {
          // Tab not ready yet, wait and retry
          await new Promise(resolve => setTimeout(resolve, 500));
        });
        
        await chrome.scripting.executeScript({
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
              
              // Try clicking submit button first (triggers JS validation)
              const submitBtn = document.querySelector('button[type="submit"], input[type="submit"], button.submit, .submit-btn');
              if (submitBtn) {
                console.log('[Auto-Login] Clicking submit button');
                submitBtn.click();
              } else if (form) {
                // Fallback: submit the form directly
                console.log('[Auto-Login] Submitting form directly');
                form.submit();
              } else {
                console.log('[Auto-Login] No submit button or form found');
              }
            }, 300);
          },
          args: [config.username, config.password]
        });
        console.log('[Tab Keeper] Login script injected successfully');
      } catch (error) {
        console.error('[Tab Keeper] Auto-login injection failed:', error);
      }
        console.error('[Tab Keeper] Auto-login injection failed:', error);
      }
    });
    return true;
  }
});
