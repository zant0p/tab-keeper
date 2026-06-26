// Tab Keeper - Content Script (v2.0.0)
// Detects login page, auto-fills credentials, handles Chrome breach popup
// No hardcoded URLs - receives config from background script

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
  
  // Method 1: Click buttons with specific text (case-insensitive)
  const allButtons = document.querySelectorAll('button');
  allButtons.forEach(btn => {
    const text = btn.textContent.toLowerCase().trim();
    if (text === 'ok' || text.includes('dismiss') || text.includes('ignore') || text.includes('close') || text.includes('cancel')) {
      console.log('Tab Keeper Content: Clicking button:', text);
      btn.click();
    }
  });
  
  // Method 2: Press Escape key (works on some dialogs)
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  
  // Method 3: Look for dialog elements and click their buttons
  const dialogs = document.querySelectorAll('div[role="dialog"], .mdc-dialog, [aria-label*="password"], [aria-label*="breach"]');
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
