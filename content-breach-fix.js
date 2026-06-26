// AGGRESSIVE Chrome Breach Popup Handler for Kiosk Mode
// This runs every 500ms to detect and dismiss Chrome's password breach dialog

(function() {
  'use strict';
  
  let breachPopupClosed = false;
  
  function closeBreachPopup() {
    if (breachPopupClosed) return; // Already handled
    
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
  
  // Check every 500ms for first 10 seconds
  const checkInterval = setInterval(() => {
    closeBreachPopup();
  }, 500);
  
  // Stop after 10 seconds
  setTimeout(() => {
    clearInterval(checkInterval);
    console.log('[Tab Keeper] Stopped breach popup detection');
  }, 10000);
  
  // Also run when page becomes visible
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && !breachPopupClosed) {
      setTimeout(closeBreachPopup, 100);
    }
  });
  
})();
