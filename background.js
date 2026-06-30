// Tab Keeper SNF Call - Background Service Worker (v2.0.5)
// Single tab monitoring for Aria website only
// Timer in seconds, keeps primary tab alive, handles Chrome breach popup

// URLs - defaults can be overridden via chrome.storage.managed (enterprise policies)
const DEFAULT_PRIMARY_URL = 'https://10.1.129.207/Arial/#/login';

// Timer in seconds (default 600 seconds = 10 minutes)
const DEFAULT_TIMER_SECONDS = 600;

// Default credentials for SNF Call variant
const DEFAULT_USERNAME = 'snf';
const DEFAULT_PASSWORD = 'snf';

// Runtime state (no hardcoded variant - loaded from managed storage or URL detection)
let runtimeConfig = {
  primaryUrl: DEFAULT_PRIMARY_URL,
  timerSeconds: DEFAULT_TIMER_SECONDS,
  username: DEFAULT_USERNAME,
  password: DEFAULT_PASSWORD,
  variant: null
};

// State
let isSwitchingBack = false;
let activityListenerInstalled = false;
let primaryTabId = null;
let secondaryTabId = null;

// Load configuration from managed storage (enterprise policies) or use defaults
async function loadConfig() {
  return new Promise((resolve) => {
    chrome.storage.managed.get(null, (managedResult) => {
      if (chrome.runtime.lastError) {
        console.log('[Tab Keeper] Managed storage not available, using defaults');
      }
      
      // Detect variant from URL if not specified in managed storage
      let detectedVariant = null;
      if (managedResult && managedResult.primaryUrl) {
        if (managedResult.primaryUrl.includes('/AL/')) {
          detectedVariant = 'AL';
        } else if (managedResult.primaryUrl.includes('/SNF/')) {
          detectedVariant = 'SNF';
        }
      } else if (DEFAULT_PRIMARY_URL.includes('/AL/')) {
        detectedVariant = 'AL';
      }
      
      // Auto-set credentials based on variant if not provided in managed storage
      let username = (managedResult && managedResult.username) || DEFAULT_USERNAME;
      let password = (managedResult && managedResult.password) || DEFAULT_PASSWORD;
      
      // If no credentials in managed storage, use variant defaults
      if (!username || !password) {
        if (detectedVariant === 'AL') {
          console.log('[Tab Keeper] Using AL variant default credentials');
        } else if (detectedVariant === 'SNF') {
          console.log('[Tab Keeper] Using SNF variant default credentials');
        }
      }
      
      // Merge managed config with defaults
      runtimeConfig = {
        primaryUrl: (managedResult && managedResult.primaryUrl) || DEFAULT_PRIMARY_URL,
        timerSeconds: (managedResult && managedResult.timerMinutes) ? managedResult.timerMinutes * 60 : DEFAULT_TIMER_SECONDS,
        username: username,
        password: password,
        variant: detectedVariant
      };
      
      console.log('[Tab Keeper] Config loaded:', {
        primaryUrl: runtimeConfig.primaryUrl,
        timerSeconds: runtimeConfig.timerSeconds,
        variant: runtimeConfig.variant,
        hasCredentials: !!(runtimeConfig.username && runtimeConfig.password)
      });
      
      resolve(runtimeConfig);
    });
  });
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

// Initialize on install - load config from managed storage
chrome.runtime.onInstalled.addListener(async () => {
  console.log('[Tab Keeper] Installed v2.0.0 (Web Store compliant)');
  await loadConfig();
  // Set defaults
  setConfig({
    timerSeconds: runtimeConfig.timerSeconds,
    primaryUrl: runtimeConfig.primaryUrl,
  });
});

// On startup - open target tabs
chrome.runtime.onStartup.addListener(async () => {
  console.log('[Tab Keeper] Extension started');
  await loadConfig();
  await ensureTabsExist();
});

// Also open tabs when extension is first loaded/refreshed
(async () => {
  console.log('[Tab Keeper] Background script loaded');
  await loadConfig();
  await ensureTabsExist();
})();

// Ensure target tab exists (auto-reopen if closed)
async function ensureTabsExist() {
  const allTabs = await chrome.tabs.query({});
  
  // Match by domain/origin for primary (handles URL changes after login)
  const primaryOrigin = new URL(runtimeConfig.primaryUrl).origin;
  const allPrimaryTabs = allTabs.filter(tab => {
    if (!tab.url) return false;
    try {
      const tabOrigin = new URL(tab.url).origin;
      return tabOrigin === primaryOrigin;
    } catch (e) {
      return false;
    }
  });
  
  if (allPrimaryTabs.length > 0) {
    console.log('[Tab Keeper] Primary tab(s) already exist:', allPrimaryTabs.length);
    primaryTabId = allPrimaryTabs[0].id;
    
    if (allPrimaryTabs.length > 1) {
      console.log('[Tab Keeper] Closing duplicate primary tabs...');
      for (let i = 1; i < allPrimaryTabs.length; i++) {
        chrome.tabs.remove(allPrimaryTabs[i].id);
      }
    }
  } else {
    console.log('[Tab Keeper] Primary tab not found - PWA should open it');
    // Don't create tab - PWA handles opening initial tabs
    primaryTabId = null;
  }
  
  // Match by domain for secondary
    if (!tab.url) return false;
    try {
      const tabOrigin = new URL(tab.url).origin;
      return tabOrigin === secondaryOrigin;
    } catch (e) {
      return false;
    }
  });
  
    
      console.log('[Tab Keeper] Closing duplicate secondary tabs...');
      }
    }
  } else {
    // Don't create tab - PWA handles opening initial tabs
    secondaryTabId = null;
  }
  
}

// Periodic check - ensure both target tab exists (runs every 10 seconds)
async function ensureTargetTabsExist() {
  console.log('[Tab Keeper] Periodic check - verifying target tab exists');
  
  const allTabs = await chrome.tabs.query({});
  
  // Check primary tab
  const primaryUrl = new URL(runtimeConfig.primaryUrl);
  const primaryExists = allTabs.some(tab => {
    if (!tab.url) return false;
    try {
      const tabUrl = new URL(tab.url);
      return tabUrl.origin === primaryUrl.origin && tabUrl.pathname.startsWith(primaryUrl.pathname);
    } catch (e) {
      return false;
    }
  });
  
  if (!primaryExists) {
    console.log('[Tab Keeper] Primary tab missing - reopening');
    const newTab = await chrome.tabs.create({ url: runtimeConfig.primaryUrl, active: false });
    primaryTabId = newTab.id;
  }
  
  // Check secondary tab
  const secondaryExists = allTabs.some(tab => {
    if (!tab.url) return false;
    try {
      const tabUrl = new URL(tab.url);
    } catch (e) {
      return false;
    }
  });
  
  if (!secondaryExists) {
    secondaryTabId = newTab.id;
  }
  
  // Schedule next check
  setTimeout(ensureTargetTabsExist, 10000);
}

// Start periodic check after a 5-second delay
setTimeout(ensureTargetTabsExist, 5000);
console.log('[Tab Keeper] Periodic tab check scheduled (every 10 seconds)');

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
    delayInMinutes: seconds / 60
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
      const isOnPrimary = tab.url === runtimeConfig.primaryUrl || tab.url?.startsWith(runtimeConfig.primaryUrl);
      
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
  console.log('[Tab Keeper] Tab closed:', tabId);
  
  // Reopen after a short delay
  setTimeout(async () => {
    const allTabs = await chrome.tabs.query({});
    
    // Check if primary tab needs reopening (match by origin)
    const primaryUrl = new URL(runtimeConfig.primaryUrl);
    const primaryExists = allTabs.some(tab => {
      if (!tab.url) return false;
      try {
        const tabUrl = new URL(tab.url);
        return tabUrl.origin === primaryUrl.origin && tabUrl.pathname.startsWith(primaryUrl.pathname);
      } catch (e) {
        return false;
      }
    });
    
    if (!primaryExists) {
      console.log('[Tab Keeper] Primary tab closed - reopening');
      const newTab = await chrome.tabs.create({ url: runtimeConfig.primaryUrl, active: false });
      primaryTabId = newTab.id;
    } else {
      console.log('[Tab Keeper] Primary tab still exists - skipping reopen');
    }
    
    // Check if secondary tab needs reopening (match by origin + path)
    const secondaryExists = allTabs.some(tab => {
      if (!tab.url) return false;
      try {
        const tabUrl = new URL(tab.url);
        // Match origin and ensure path contains the key part
      } catch (e) {
        return false;
      }
    });
    
    if (!secondaryExists) {
      secondaryTabId = newTab.id;
      console.log('[Tab Keeper] ✓ Created secondary tab:', newTab.id);
    } else {
      // Log which tab exists
        if (!tab.url) return false;
        try {
          const tabUrl = new URL(tab.url);
        } catch (e) {
          return false;
        }
      });
      }
    }
  }, 1000);
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
    const isPrimaryTab = tabUrl === runtimeConfig.primaryUrl || tabUrl?.startsWith(runtimeConfig.primaryUrl);
    
    console.log('[Tab Keeper] Current tab URL:', tabUrl.substring(0, 80));
    console.log('[Tab Keeper] Is primary tab:', isPrimaryTab);
    
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
    
    // Match by origin (handles URL changes after login/navigation)
    const primaryOrigin = new URL(runtimeConfig.primaryUrl).origin;
    let existingTab = allTabs.find(tab => {
      if (!tab.url) return false;
      try {
        return new URL(tab.url).origin === primaryOrigin;
      } catch (e) {
        return false;
      }
    });
    
    if (existingTab) {
      console.log('[Tab Keeper] FOUND existing primary tab:', existingTab.id, 'URL:', existingTab.url);
      
      await chrome.windows.update(existingTab.windowId, { focused: true });
      await chrome.tabs.update(existingTab.id, { active: true, highlighted: true });
      
      primaryTabId = existingTab.id;
      console.log('[Tab Keeper] ✓ SUCCESS - switched to tab', existingTab.id);
      
      setTimeout(() => {
        chrome.tabs.sendMessage(existingTab.id, { action: 'resetLoginAttempt' }).catch(e => {
          console.log('[Tab Keeper] Could not reset login attempt:', e.message);
        });
      }, 500);
    } else {
      console.log('[Tab Keeper] No existing primary tab found - creating new one');
      const newTab = await chrome.tabs.create({ url: runtimeConfig.primaryUrl });
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
    const isPrimaryUrl = tab.url === runtimeConfig.primaryUrl || tab.url?.startsWith(runtimeConfig.primaryUrl);
    
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
  
  if (message.action === 'launchPages') {
    console.log('[Tab Keeper] Launch pages requested');
    ensureTabsExist().then(() => {
      sendResponse({ status: 'launched' });
    });
    return true;
  }
  
  if (message.action === 'getStatus') {
    getConfig(['timerActive', 'lastActivity', 'timerDuration', 'timerStartTime', 'timerSeconds']).then((state) => {
      sendResponse({
        primaryUrl: runtimeConfig.primaryUrl,
        timerSeconds: runtimeConfig.timerSeconds,
        variant: runtimeConfig.variant,
        hasCredentials: !!(runtimeConfig.username && runtimeConfig.password),
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
    // Credentials must come from managed storage or local storage (user-configured)
    const creds = {
      username: runtimeConfig.username,
      password: runtimeConfig.password
    };
    
    if (!creds.username || !creds.password) {
      console.log('[Tab Keeper] No credentials configured for auto-login');
      sendResponse({ 
        success: false,
        reason: 'no credentials configured'
      });
      return true;
    }
    
    sendResponse({ 
      success: true,
      username: creds.username,
      password: creds.password
    });
    return true;
  }
  
  // Handle auto-login request - ONLY for primary URL
  if (message.action === 'loginRequired') {
    const creds = { username: runtimeConfig.username, password: runtimeConfig.password };
    
    // Verify sender is on primary URL (not secondary)
    const senderUrl = sender.tab?.url;
    const isPrimaryTab = senderUrl && (senderUrl === runtimeConfig.primaryUrl || senderUrl.startsWith(runtimeConfig.primaryUrl));
    
    if (!isPrimaryTab) {
      console.log('[Tab Keeper] Auto-login REJECTED - not on primary URL:', senderUrl);
      sendResponse({ success: false, reason: 'not primary url' });
      return true;
    }
    
    if (!creds.username || !creds.password) {
      console.log('[Tab Keeper] Auto-login REJECTED - no credentials configured');
      sendResponse({ success: false, reason: 'no credentials' });
      return true;
    }
    
    console.log('[Tab Keeper] Auto-login approved for primary URL');
    sendResponse({ success: true });
    
    // Wait for tab to be ready, then inject login script
    try {
      chrome.scripting.executeScript({
        target: { tabId: sender.tab.id },
        func: (username, password) => {
          console.log('[Auto-Login] Starting login process...');
          console.log('[Auto-Login] Username length:', username?.length);
          console.log('[Auto-Login] Password length:', password?.length);
          
          // Find and fill login form - try multiple selectors
          const usernameSelectors = [
            'input[name*="user"]',
            'input[name*="email"]',
            'input[name*="username"]',
            '#username',
            '#email',
            '[name="username"]',
            'input[type="email"]',
            'ion-input[type="email"]',
            'input[id*="user"]',
            'ion-input[id*="user"]'
          ];
          
          const passwordSelectors = [
            'input[type="password"]',
            'ion-input[type="password"]',
            'input[name*="password"]',
            '#password',
            '[name="password"]',
            'input[id*="pass"]',
            'ion-input[id*="pass"]'
          ];
          
          let usernameField = null;
          let passwordField = null;
          
          for (const selector of usernameSelectors) {
            usernameField = document.querySelector(selector);
            if (usernameField) {
              console.log('[Auto-Login] Found username field with:', selector);
              break;
            }
          }
          
          for (const selector of passwordSelectors) {
            passwordField = document.querySelector(selector);
            if (passwordField) {
              console.log('[Auto-Login] Found password field with:', selector);
              break;
            }
          }
          
          const form = document.querySelector('form');
          
          if (!usernameField) {
            console.error('[Auto-Login] Username field not found. Available inputs:', 
              Array.from(document.querySelectorAll('input')).map(i => i.type + ':' + (i.name||i.id)));
            return;
          }
          
          if (!passwordField) {
            console.error('[Auto-Login] Password field not found. Available inputs:', 
              Array.from(document.querySelectorAll('input')).map(i => i.type + ':' + (i.name||i.id)));
            return;
          }
          
          console.log('[Auto-Login] Found login fields, filling credentials...');
          console.log('[Auto-Login] Username field type:', usernameField.tagName);
          console.log('[Auto-Login] Password field type:', passwordField.tagName);
          
          // Handle both regular inputs and Ionic ion-input
          if (usernameField.tagName === 'ION-INPUT') {
            usernameField.value = username;
            const nativeInput = usernameField.shadowRoot?.querySelector('input') || usernameField.querySelector('input');
            if (nativeInput) nativeInput.value = username;
          } else {
            usernameField.value = username;
          }
          
          if (passwordField.tagName === 'ION-INPUT') {
            passwordField.value = password;
            const nativeInput = passwordField.shadowRoot?.querySelector('input') || passwordField.querySelector('input');
            if (nativeInput) nativeInput.value = password;
          } else {
            passwordField.value = password;
          }
          
          // Trigger input events for React/modern frameworks and Ionic
          ['input', 'change', 'ionChange'].forEach(evt => {
            usernameField.dispatchEvent(new Event(evt, { bubbles: true }));
            passwordField.dispatchEvent(new Event(evt, { bubbles: true }));
            
            // Also dispatch on native input if it's an ion-input
            const nativeUser = usernameField.shadowRoot?.querySelector('input') || usernameField.querySelector('input');
            const nativePass = passwordField.shadowRoot?.querySelector('input') || passwordField.querySelector('input');
            if (nativeUser) nativeUser.dispatchEvent(new Event(evt, { bubbles: true }));
            if (nativePass) nativePass.dispatchEvent(new Event(evt, { bubbles: true }));
          });
          
          // Focus and blur to trigger validation
          passwordField.focus();
          setTimeout(() => {
            passwordField.blur();
            
            console.log('[Auto-Login] Looking for login button...');
            
            // Helper function to click buttons (handles both regular and Ionic)
            function clickButton(btn) {
              console.log('[Auto-Login] Clicking button:', btn.tagName);
              if (btn.tagName === 'ION-BUTTON') {
                const shadowBtn = btn.shadowRoot?.querySelector('button');
                if (shadowBtn) {
                  console.log('[Auto-Login] Clicking shadow DOM button');
                  shadowBtn.click();
                } else {
                  console.log('[Auto-Login] Clicking ion-button directly');
                  btn.click();
                }
              } else {
                btn.click();
              }
            }
            
            // Strategy 1: Target by name attribute (PointClickCare specific)
            const namedButton = document.querySelector('ion-button[name="button-login"], button[name="button-login"]');
            if (namedButton) {
              console.log('[Auto-Login] Found button by name:', namedButton.tagName);
              clickButton(namedButton);
              return;
            }
            
            // Strategy 2: Target ion-button with login text
            const allIonButtons = document.querySelectorAll('ion-button');
            for (const btn of allIonButtons) {
              const text = (btn.textContent || '').toLowerCase().trim();
              if (text === 'login' || text === 'sign in') {
                console.log('[Auto-Login] Found ion-button by text:', text);
                clickButton(btn);
                return;
              }
            }
            
            // Strategy 3: Standard submit buttons
            const submitBtn = document.querySelector('button[type="submit"], input[type="submit"]');
            if (submitBtn) {
              console.log('[Auto-Login] Found standard submit button');
              submitBtn.click();
              return;
            }
            
            // Strategy 4: Any button with login text
            const allButtons = document.querySelectorAll('button, [role="button"]');
            for (const btn of allButtons) {
              const text = (btn.textContent || btn.getAttribute('aria-label') || '').toLowerCase().trim();
              if (text === 'login' || text === 'sign in') {
                console.log('[Auto-Login] Found button by text:', text);
                btn.click();
                return;
              }
            }
            
            // Strategy 5: Submit form directly
            if (form) {
              console.log('[Auto-Login] Submitting form directly');
              form.submit();
            } else {
              console.log('[Auto-Login] No login method found');
            }
          }, 500);
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
    console.log('[Tab Keeper] Closing breach popup');
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
    sendResponse({ status: 'ok' });
    return true;
  }
});
