// Tab Keeper - Content Script
// Detects if user is logged out and requests auto-login
// Checks multiple times to handle slow-loading pages

let loginCheckTimeout = null;
let loginAttempted = false;
let checkAttempts = 0;
const MAX_CHECK_ATTEMPTS = 5; // Check up to 5 times over 7 seconds

// Check for login status
function startLoginMonitoring() {
  console.log('Tab Keeper Content: Starting login monitoring');
  checkLoginStatusDelayed();
}

function checkLoginStatusDelayed() {
  // Clear any existing timeout
  if (loginCheckTimeout) {
    clearTimeout(loginCheckTimeout);
  }
  
  // Delay increases with each attempt: 1s, 1.5s, 2s, 2s, 2s
  const delay = checkAttempts === 0 ? 1000 : (checkAttempts < 2 ? 1500 : 2000);
  
  loginCheckTimeout = setTimeout(() => {
    checkLoginStatus();
  }, delay);
}

function checkLoginStatus() {
  checkAttempts++;
  console.log(`Tab Keeper Content: Login check attempt ${checkAttempts}/${MAX_CHECK_ATTEMPTS}`);
  
  // Look for password field (strongest indicator)
  const hasPasswordField = document.querySelector('input[type="password"]') !== null;
  
  // Look for login form
  const hasLoginForm = document.querySelector('form[action*="login"], form[action*="signin"], .login-form, #login-form') !== null;
  
  // Look for common login input names/ids
  const hasUsernameField = document.querySelector('input[name*="user"], input[name*="email"], #username, #email, [name="username"]') !== null;
  
  // Check page text for login keywords
  const bodyText = document.body.innerText.toLowerCase();
  const titleText = document.title.toLowerCase();
  
  const loginKeywords = ['sign in', 'log in', 'username', 'password', 'email address'];
  const hasKeywords = loginKeywords.some(word => bodyText.includes(word) || titleText.includes(word));

  const isLoginPage = hasPasswordField || hasLoginForm || (hasUsernameField && hasKeywords);

  if (isLoginPage && !loginAttempted) {
    console.log('Tab Keeper Content: Login page detected, requesting auto-login');
    loginAttempted = true;
    
    chrome.runtime.sendMessage({ action: 'loginRequired' }, (response) => {
      if (response) {
        console.log('Tab Keeper Content: Auto-login initiated');
      } else {
        console.log('Tab Keeper Content: No response from background, will retry');
        loginAttempted = false; // Allow retry
      }
    });
  } else if (!isLoginPage) {
    console.log('Tab Keeper Content: Not a login page');
    // Not a login page, no need to keep checking
    return;
  } else if (loginAttempted) {
    console.log('Tab Keeper Content: Already attempted login');
    return;
  } else {
    console.log('Tab Keeper Content: Login fields not found yet, will check again');
    // Keep trying if we haven't hit max attempts
    if (checkAttempts < MAX_CHECK_ATTEMPTS) {
      checkLoginStatusDelayed();
    }
  }
}

// Listen for messages from background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'checkLogin') {
    checkLoginStatus();
    sendResponse({ status: 'checked' });
  }
  
  if (request.action === 'resetLoginAttempt') {
    loginAttempted = false;
    console.log('Tab Keeper Content: Login attempt reset');
    sendResponse({ status: 'reset' });
  }
  
  return true; // Keep channel open
});

// Start when page is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startLoginMonitoring);
} else {
  startLoginMonitoring();
}

// Cleanup
window.addEventListener('beforeunload', () => {
  if (loginCheckTimeout) {
    clearTimeout(loginCheckTimeout);
  }
});
