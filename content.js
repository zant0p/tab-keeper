// Tab Keeper - Content Script
// Detects if user is logged out and requests auto-login

let loginCheckInterval = null;
let loginAttempted = false;

// Check for login status periodically
function startLoginMonitoring() {
  console.log('Tab Keeper: Starting login monitoring');
  // Check immediately after a short delay (let page load)
  setTimeout(checkLoginStatus, 1000);
  
  // Then check every 30 seconds
  loginCheckInterval = setInterval(checkLoginStatus, 30000);
}

function checkLoginStatus() {
  // Detect common logout indicators
  const hasLoginForm = document.querySelector('input[type="password"]') !== null;
  
  // Check for login-related text in the page
  const bodyText = document.body.innerText.toLowerCase();
  const titleText = document.title.toLowerCase();
  
  const loginKeywords = [
    'sign in', 'signin', 'log in', 'login',
    'username', 'password', 'email',
    'welcome back', 'account access'
  ];
  
  const hasKeywords = loginKeywords.some(keyword => 
    bodyText.includes(keyword) || titleText.includes(keyword)
  );
  
  // Check for common login form selectors
  const loginSelectors = [
    'form[action*="login"]',
    'form[action*="signin"]',
    '.login-form',
    '#login-form',
    '[data-testid="login"]',
    '.auth-form',
    'form[name="login"]'
  ];
  
  const hasLoginFormSelector = loginSelectors.some(selector => 
    document.querySelector(selector) !== null
  );

  // If we detect a login page and haven't attempted login yet
  if ((hasLoginForm || hasKeywords || hasLoginFormSelector) && !loginAttempted) {
    console.log('Tab Keeper: Login page detected, requesting auto-login');
    loginAttempted = true;
    chrome.runtime.sendMessage({ action: 'loginRequired' });
  }
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'checkLogin') {
    checkLoginStatus();
    sendResponse({ status: 'checked' });
  }
  
  if (request.action === 'resetLoginAttempt') {
    loginAttempted = false;
    sendResponse({ status: 'reset' });
  }
});

// Start monitoring when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startLoginMonitoring);
} else {
  startLoginMonitoring();
}

// Clean up on page unload
window.addEventListener('beforeunload', () => {
  if (loginCheckInterval) {
    clearInterval(loginCheckInterval);
  }
});
