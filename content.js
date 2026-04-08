// Tab Keeper - Content Script
// Detects if user is logged out and requests auto-login

let loginCheckInterval = null;

// Check for login status periodically
function startLoginMonitoring() {
  // Check immediately
  checkLoginStatus();
  
  // Then check every 30 seconds
  loginCheckInterval = setInterval(checkLoginStatus, 30000);
}

function checkLoginStatus() {
  // Detect common logout indicators
  const logoutIndicators = [
    /login/i,
    /sign in/i,
    /log in/i,
    /username/i,
    /password/i,
    /\.login/,
    #login-form,
    [data-testid="login"],
    .auth-required,
    .not-logged-in
  ];

  const bodyText = document.body.innerText.toLowerCase();
  const hasLoginForm = document.querySelector('input[type="password"]') !== null;
  const hasLoginKeywords = logoutIndicators.some(indicator => {
    if (typeof indicator === 'string') {
      return document.querySelector(indicator) !== null;
    }
    if (indicator instanceof RegExp) {
      return indicator.test(bodyText) || indicator.test(document.title);
    }
    return false;
  });

  if (hasLoginForm || hasLoginKeywords) {
    console.log('Tab Keeper: Login page detected, requesting auto-login');
    chrome.runtime.sendMessage({ action: 'loginRequired' });
  }
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'checkLogin') {
    checkLoginStatus();
    sendResponse({ status: 'checked' });
  }
  
  if (request.action === 'getCredentials') {
    // This is handled by background script storage
    sendResponse({});
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
