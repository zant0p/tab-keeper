// Tab Keeper - Content Script
// Detects if user is logged out and requests auto-login
// Checks multiple times to handle slow-loading pages
// ONLY triggers auto-login on the configured target site

let loginCheckTimeout = null;
let loginAttempted = false;
let checkAttempts = 0;
const MAX_CHECK_ATTEMPTS = 5; // Check up to 5 times over 7 seconds
let targetUrl = null; // Store target URL to verify we're on the right site

// Extract base URL (domain + first path segment) for matching
function getBaseUrl(url) {
  try {
    const urlObj = new URL(url);
    const firstPath = urlObj.pathname.split('/')[1] || '';
    return urlObj.origin + (firstPath ? '/' + firstPath : '');
  } catch (e) {
    return url;
  }
}

// Check if a URL matches the target
function isTargetUrl(currentUrl, targetUrl) {
  if (!currentUrl || !targetUrl) return false;
  
  if (currentUrl === targetUrl) return true;
  if (currentUrl.startsWith(targetUrl)) return true;
  
  const currentBase = getBaseUrl(currentUrl);
  const targetBase = getBaseUrl(targetUrl);
  
  if (currentBase === targetBase) return true;
  
  try {
    const currentDomain = new URL(currentUrl).hostname;
    const targetDomain = new URL(targetUrl).hostname;
    if (currentDomain === targetDomain) return true;
  } catch (e) {}
  
  return false;
}

// Check for login status
function startLoginMonitoring() {
  console.log('Tab Keeper Content: Starting login monitoring');
  
  chrome.runtime.sendMessage({ action: 'getTargetUrl' }, (response) => {
    if (response && response.targetUrl) {
      targetUrl = response.targetUrl;
      console.log('Tab Keeper Content: Target URL:', targetUrl);
      checkLoginStatusDelayed();
    } else {
      console.log('Tab Keeper Content: No target URL configured, skipping login monitoring');
    }
  });
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
  
  // Verify we're on the target site before checking for login page
  if (targetUrl) {
    const currentUrl = window.location.href;
    const isTargetSite = isTargetUrl(currentUrl, targetUrl);
    
    if (!isTargetSite) {
      console.log('Tab Keeper Content: Not on target site, skipping auto-login');
      return;
    }
  }
  
  const hasPasswordField = document.querySelector('input[type="password"]') !== null;
  const hasLoginForm = document.querySelector('form[action*="login"], form[action*="signin"], .login-form, #login-form') !== null;
  const hasUsernameField = document.querySelector('input[name*="user"], input[name*="email"], #username, #email, [name="username"]') !== null;
  
  const bodyText = document.body.innerText.toLowerCase();
  const titleText = document.title.toLowerCase();
  const loginKeywords = ['sign in', 'log in', 'username', 'password', 'email address'];
  const hasKeywords = loginKeywords.some(word => bodyText.includes(word) || titleText.includes(word));

  const isLoginPage = hasPasswordField || hasLoginForm || (hasUsernameField && hasKeywords);

  if (isLoginPage && !loginAttempted) {
    console.log('Tab Keeper Content: Login page detected on target site, requesting auto-login');
    loginAttempted = true;
    
    chrome.runtime.sendMessage({ action: 'loginRequired' }, (response) => {
      if (response) {
        console.log('Tab Keeper Content: Auto-login initiated');
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
    // Wait a moment for page to stabilize, then check
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
