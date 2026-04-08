// Tab Keeper - Content Script
// Detects if user is logged out and requests auto-login

let loginCheckTimeout = null;
let loginAttempted = false;

// Check for login status
function startLoginMonitoring() {
  console.log('Tab Keeper Content: Starting login monitoring');
  
  // Check after page loads
  loginCheckTimeout = setTimeout(checkLoginStatus, 1500);
}

function checkLoginStatus() {
  // Look for password field (strongest indicator)
  const hasPasswordField = document.querySelector('input[type="password"]') !== null;
  
  // Look for login form
  const hasLoginForm = document.querySelector('form[action*="login"], form[action*="signin"], .login-form, #login-form') !== null;
  
  // Check page text for login keywords
  const bodyText = document.body.innerText.toLowerCase();
  const titleText = document.title.toLowerCase();
  
  const loginKeywords = ['sign in', 'log in', 'username', 'password', 'email address'];
  const hasKeywords = loginKeywords.some(word => bodyText.includes(word) || titleText.includes(word));

  if ((hasPasswordField || hasLoginForm || hasKeywords) && !loginAttempted) {
    console.log('Tab Keeper Content: Login detected, requesting auto-login');
    loginAttempted = true;
    
    chrome.runtime.sendMessage({ action: 'loginRequired' }, (response) => {
      if (response) {
        console.log('Tab Keeper Content: Auto-login initiated');
      }
    });
  } else {
    console.log('Tab Keeper Content: Not a login page or already attempted');
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
