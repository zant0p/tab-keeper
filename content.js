// Tab Keeper ALF - Content Script (v2.0.0)
// Detects login page, auto-fills credentials, handles Chrome breach popup
// HARDCODED CREDENTIALS FOR ALF KIOSK

const KIOSK_CONFIG = {
  username: 'alfstaff',
  password: 'alfstaff',
  variant: 'ALF'
};

let loginCheckTimeout = null;
let loginAttempted = false;
let checkAttempts = 0;
const MAX_CHECK_ATTEMPTS = 5;
let currentPrimaryUrl = '';

// Get primary URL from background script
async function getPrimaryUrl() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ action: 'getStatus' }, (response) => {
      if (response && response.primaryUrl) {
        currentPrimaryUrl = response.primaryUrl;
        resolve(response.primaryUrl);
      } else {
        // Fallback default
        resolve('https://10.1.129.207/Arial/#/login');
      }
    });
  });
}

// Check for login status
async function startLoginMonitoring() {
  console.log('Tab Keeper Content: Starting login monitoring');
  
  const primaryUrl = await getPrimaryUrl();
  const currentUrl = window.location.href;
  
  // Extract origin from primary URL for matching
  let primaryOrigin = '';
  try {
    primaryOrigin = new URL(primaryUrl).origin;
  } catch (e) {
    primaryOrigin = 'https://10.1.129.207';
  }
  
  if (!currentUrl.startsWith(primaryOrigin)) {
    console.log('Tab Keeper Content: Not on primary URL, skipping auto-login');
    return;
  }
  
  checkLoginStatusDelayed();
}

function checkLoginStatusDelayed() {
  if (loginCheckTimeout) {
    clearTimeout(loginCheckTimeout);
  }
  
  const delay = checkAttempts === 0 ? 1000 : (checkAttempts < 2 ? 1500 : 2000);
  
  loginCheckTimeout = setTimeout(() => {
    checkLoginStatus();
  }, delay);
}

function checkLoginStatus() {
  checkAttempts++;
  console.log(`Tab Keeper Content: Login check attempt ${checkAttempts}/${MAX_CHECK_ATTEMPTS}`);
  
  const hasPasswordField = document.querySelector('input[type="password"]') !== null;
  const hasLoginForm = document.querySelector('form[action*="login"], form[action*="signin"], .login-form, #login-form') !== null;
  const hasUsernameField = document.querySelector('input[name*="user"], input[name*="email"], #username, #email, [name="username"]') !== null;
  
  const bodyText = document.body.innerText.toLowerCase();
  const titleText = document.title.toLowerCase();
  const loginKeywords = ['sign in', 'log in', 'username', 'password', 'email address'];
  const hasKeywords = loginKeywords.some(word => bodyText.includes(word) || titleText.includes(word));

  const isLoginPage = hasPasswordField || hasLoginForm || (hasUsernameField && hasKeywords);

  if (isLoginPage && !loginAttempted) {
    console.log('Tab Keeper Content: Login page detected, requesting auto-login');
    loginAttempted = true;
    
    chrome.runtime.sendMessage({ action: 'loginRequired' }, (response) => {
      if (response && response.success) {
        console.log('Tab Keeper Content: Auto-login initiated');
        
        // Wait for breach popup and close it after login attempt
        setTimeout(() => {
          closeBreachPopup();
        }, 3000); // Wait 3 seconds after login attempt
      } else {
        console.log('Tab Keeper Content: No response from background, will retry');
        loginAttempted = false;
      }
    });
  } else if (!isLoginPage) {
    console.log('Tab Keeper Content: Not a login page');
    return;
  } else if (loginAttempted) {
    console.log('Tab Keeper Content: Already attempted login');
    return;
  } else {
    console.log('Tab Keeper Content: Login fields not found yet, will check again');
    if (checkAttempts < MAX_CHECK_ATTEMPTS) {
      checkLoginStatusDelayed();
    }
  }
}

// Close Chrome's password breach notification popup
function closeBreachPopup() {
  console.log('Tab Keeper Content: Attempting to close breach popup');
  
  // Method 1: Click buttons with specific text (case-insensitive, exact match)
  const allButtons = document.querySelectorAll('button');
  allButtons.forEach(btn => {
    const text = btn.textContent.toLowerCase().trim();
    if (text === 'ok' || text === 'dismiss' || text === 'ignore' || text === 'cancel' || 
        text.includes('not now') || text.includes('change password')) {
      console.log('Tab Keeper Content: Clicking button:', text);
      btn.click();
    }
  });
  
  // Method 2: Press Escape key multiple times
  for (let i = 0; i < 3; i++) {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    document.dispatchEvent(new KeyboardEvent('keyup', { key: 'Escape', bubbles: true }));
  }
  
  // Method 3: Look for dialog elements and click their buttons
  const dialogs = document.querySelectorAll('div[role="dialog"], .mdc-dialog, [aria-label*="password"], [aria-label*="breach"], [aria-label*="compromised"]');
  dialogs.forEach(dialog => {
    // Try to find any button in the dialog
    const buttons = dialog.querySelectorAll('button, [role="button"]');
    buttons.forEach(btn => {
      console.log('Tab Keeper Content: Clicking dialog button');
      btn.click();
    });
    
    // If no buttons found, try clicking the dialog backdrop
    if (buttons.length === 0 && dialog.parentElement) {
      console.log('Tab Keeper Content: Clicking dialog backdrop');
      dialog.parentElement.click();
    }
  });
  
  // Method 4: Click on any overlay/backdrop
  const overlays = document.querySelectorAll('.backdrop, .overlay, [class*="backdrop"], [class*="overlay"]');
  overlays.forEach(overlay => {
    if (overlay.offsetHeight > window.innerHeight * 0.8) {
      console.log('Tab Keeper Content: Clicking overlay');
      overlay.click();
    }
  });
  
  // Method 5: Try to find and click any visible modal close button
  const closeIcons = document.querySelectorAll('[aria-label="Close"], .close-icon, [class*="close"]');
  closeIcons.forEach(icon => {
    if (icon.offsetWidth > 0 && icon.offsetHeight > 0) {
      console.log('Tab Keeper Content: Clicking close icon');
      icon.click();
    }
  });
  
  // Notify background that we tried to close it
  try {
    chrome.runtime.sendMessage({ action: 'closeBreachPopup' });
  } catch (e) {
    // Background might not be available, that's ok
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'checkLogin') {
    console.log('Tab Keeper Content: Manual login check triggered');
    checkAttempts = 0; // Reset counter for fresh checks
    checkLoginStatus();
    sendResponse({ status: 'checked' });
  }
  
  if (request.action === 'resetLoginAttempt') {
    loginAttempted = false;
    console.log('Tab Keeper Content: Login attempt reset');
    sendResponse({ status: 'reset' });
  }
  
  return true;
});

// Listen for visibility changes - recheck when tab becomes visible
let hiddenTimeout = null;
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    console.log('Tab Keeper Content: Tab became visible');
    if (hiddenTimeout) clearTimeout(hiddenTimeout);
    hiddenTimeout = setTimeout(() => {
      if (!loginAttempted) {
        checkAttempts = 0;
        checkLoginStatus();
      }
    }, 1000);
  }
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startLoginMonitoring);
} else {
  startLoginMonitoring();
}

window.addEventListener('beforeunload', () => {
  if (loginCheckTimeout) {
    clearTimeout(loginCheckTimeout);
  }
});
// AGGRESSIVE Chrome Breach Popup Handler for Kiosk Mode
// This runs every 500ms to detect and dismiss Chrome's password breach dialog
// Also handles "License Inactive" popup and auto-clicks success buttons

(function() {
  'use strict';
  
  let breachPopupClosed = false;
  let licensePopupClosed = false;
  let iconButtonPushed = false;
  
  function closeBreachPopup() {
    if (breachPopupClosed && licensePopupClosed && iconButtonPushed) return; // Already handled
    
    console.log('[Tab Keeper] Checking for breach popup...');
    
    // Method 1: Find and click any button with these exact texts
    const buttonTexts = ['ok', 'dismiss', 'ignore', 'cancel', 'not now', 'change password', 'details'];
    document.querySelectorAll('button').forEach(btn => {
      const text = btn.textContent.toLowerCase().trim();
      if (buttonTexts.some(t => text === t || text.includes(t))) {
        console.log('[Tab Keeper] Clicking button:', text);
        btn.click();
        breachPopupClosed = true;
      }
    });
    
    // Method 2: Press Escape key multiple times
    for (let i = 0; i < 5; i++) {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
      document.dispatchEvent(new KeyboardEvent('keyup', { key: 'Escape', bubbles: true, cancelable: true }));
    }
    
    // Method 3: Find dialog overlays and click them
    const selectors = [
      'div[role="dialog"]',
      '.mdc-dialog',
      '[aria-label*="password"]',
      '[aria-label*="breach"]',
      '[aria-label*="compromised"]',
      '[aria-label*="security"]',
      '.cr-toast-message',
      '.password-breaches'
    ];
    
    selectors.forEach(selector => {
      const dialogs = document.querySelectorAll(selector);
      dialogs.forEach(dialog => {
        console.log('[Tab Keeper] Found dialog:', selector);
        // Click any button inside
        dialog.querySelectorAll('button, [role="button"]').forEach(btn => btn.click());
        // Click the dialog itself to dismiss
        dialog.click();
        // Click parent (backdrop)
        if (dialog.parentElement) dialog.parentElement.click();
        breachPopupClosed = true;
      });
    });
    
    // Method 4: Click any overlay/backdrop
    document.querySelectorAll('.backdrop, .overlay, [class*="backdrop"], [class*="overlay"]').forEach(overlay => {
      if (overlay.offsetWidth > window.innerWidth * 0.5 && overlay.offsetHeight > window.innerHeight * 0.5) {
        console.log('[Tab Keeper] Clicking overlay');
        overlay.click();
        breachPopupClosed = true;
      }
    });
    
    // Method 6: Handle "License Inactive" popup from Arial (Ionic dialog)
  if (!licensePopupClosed) {
    // Arial-specific Ionic alert selectors
    const licenseSelectors = [
      'ion-alert',
      'ion-alert.sc-ion-alert-md',
      'ion-alert.sc-ion-alert-ios',
      '.alert-wrapper',
      '.alert-backdrop',
      '[aria-label*="license"]',
      '[aria-label*="inactive"]',
      '[class*="license"]',
      '[class*="inactive"]'
    ];
    
    licenseSelectors.forEach(selector => {
      const dialogs = document.querySelectorAll(selector);
      dialogs.forEach(dialog => {
        console.log('[Tab Keeper] Found Arial license popup:', selector);
        
        // Look for OK button inside Ionic alert
        const okButtons = dialog.querySelectorAll('ion-button, button, .alert-button');
        okButtons.forEach(btn => {
          const text = (btn.textContent || btn.getAttribute('aria-label') || '').toLowerCase().trim();
          const buttonText = text;
          
          // Match OK, Close, Dismiss, or any single-word short button in license popup
          if (text === 'ok' || text === 'close' || text === 'dismiss' || 
              text.includes('ok') || (buttonText.length <= 4 && text !== 'cancel')) {
            console.log('[Tab Keeper] Clicking OK button in license popup:', text);
            if (btn.tagName === 'ION-BUTTON') {
              // Handle Ionic shadow DOM
              const shadowBtn = btn.shadowRoot?.querySelector('button');
              if (shadowBtn) {
                shadowBtn.click();
                console.log('[Tab Keeper] Clicked shadow DOM button');
              } else {
                // Try clicking the native button inside ion-button
                const nativeBtn = btn.querySelector('button');
                if (nativeBtn) {
                  nativeBtn.click();
                  console.log('[Tab Keeper] Clicked native button inside ion-button');
                } else {
                  btn.click();
                  console.log('[Tab Keeper] Clicked ion-button directly');
                }
              }
            } else {
              btn.click();
              console.log('[Tab Keeper] Clicked regular button');
            }
            licensePopupClosed = true;
          }
        });
        
        // If no specific OK button found, try clicking the first button in the alert
        if (okButtons.length > 0 && !licensePopupClosed) {
          const firstBtn = okButtons[0];
          console.log('[Tab Keeper] Clicking first button in license popup');
          if (firstBtn.tagName === 'ION-BUTTON') {
            const shadowBtn = firstBtn.shadowRoot?.querySelector('button');
            if (shadowBtn) shadowBtn.click();
            else firstBtn.click();
          } else {
            firstBtn.click();
          }
          licensePopupClosed = true;
        }
        
        // Last resort: click the alert wrapper itself
        if (!licensePopupClosed) {
          console.log('[Tab Keeper] Clicking alert wrapper');
          dialog.click();
          licensePopupClosed = true;
        }
      });
    });
  }
  
  // Method 7: Auto-click iconic/success button after login (Arial Ionic button)
  if (!iconButtonPushed) {
    // Look for success/confirmation buttons that appear after login in Arial
    const successSelectors = [
      'ion-button[class*="success"]',
      'ion-button[class*="confirm"]',
      'ion-button[class*="enter"]',
      'ion-button[class*="home"]',
      'ion-button[class*="dashboard"]',
      'ion-button[class*="menu"]',
      'ion-button[class*="nav"]',
      '[class*="iconic-button"]',
      '[class*="nav-button"]',
      'button[class*="success"]',
      'button[class*="confirm"]',
      // Arial-specific: buttons with icons
      'ion-button ion-icon',
      'ion-toolbar ion-button',
      'ion-header ion-button'
    ];
    
    successSelectors.forEach(selector => {
      const buttons = document.querySelectorAll(selector);
      buttons.forEach(btn => {
        // Get the actual button element (handle ion-icon children)
        const actualBtn = btn.closest('ion-button, button, [role="button"]') || btn;
        
        if (actualBtn.offsetWidth > 0 && actualBtn.offsetHeight > 0) { // Only visible buttons
          const text = (actualBtn.textContent || '').toLowerCase().trim();
          
          // Skip login/submit buttons, look for navigation/action buttons
          if (text !== 'login' && text !== 'sign in' && text !== 'submit' && text !== 'cancel') {
            console.log('[Tab Keeper] Auto-clicking iconic/success button:', selector);
            if (actualBtn.tagName === 'ION-BUTTON') {
              // Handle Ionic shadow DOM properly
              const shadowBtn = actualBtn.shadowRoot?.querySelector('button');
              if (shadowBtn) {
                shadowBtn.click();
                console.log('[Tab Keeper] Clicked shadow DOM button');
              } else {
                const nativeBtn = actualBtn.querySelector('button');
                if (nativeBtn) {
                  nativeBtn.click();
                  console.log('[Tab Keeper] Clicked native button inside ion-button');
                } else {
                  actualBtn.click();
                  console.log('[Tab Keeper] Clicked ion-button directly');
                }
              }
            } else {
              actualBtn.click();
              console.log('[Tab Keeper] Clicked regular button');
            }
            iconButtonPushed = true;
          }
        }
      });
    });
    
    // Also check for any visible Ionic buttons in toolbar/header (likely navigation)
    const toolbarButtons = document.querySelectorAll('ion-toolbar ion-button, ion-header ion-button, ion-footer ion-button');
    toolbarButtons.forEach(btn => {
      if (btn.offsetWidth > 0 && btn.offsetHeight > 0 && !iconButtonPushed) {
        const text = (btn.textContent || '').toLowerCase().trim();
        if (text !== 'login' && text !== 'sign in' && text !== 'submit') {
          console.log('[Tab Keeper] Auto-clicking toolbar ion-button');
          if (btn.tagName === 'ION-BUTTON') {
            const shadowBtn = btn.shadowRoot?.querySelector('button');
            if (shadowBtn) shadowBtn.click();
            else btn.click();
          } else {
            btn.click();
          }
          iconButtonPushed = true;
        }
      }
    });
  }
  
  // Method 5: Simulate clicking anywhere on screen (last resort)
    if (!breachPopupClosed) {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      
      document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: centerX, clientY: centerY }));
      document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: centerX, clientY: centerY }));
      document.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: centerX, clientY: centerY }));
      
      console.log('[Tab Keeper] Simulated center-screen click');
    }
  }
  
  // Run immediately
  closeBreachPopup();
  
  // Check every 500ms for first 30 seconds (extended to catch delayed popups)
  const checkInterval = setInterval(() => {
    closeBreachPopup();
  }, 500);
  
  // Stop after 30 seconds
  setTimeout(() => {
    clearInterval(checkInterval);
    console.log('[Tab Keeper] Stopped breach popup detection');
  }, 30000);
  
  // Also run when page becomes visible
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && !breachPopupClosed) {
      setTimeout(closeBreachPopup, 100);
    }
  });
  
})();
