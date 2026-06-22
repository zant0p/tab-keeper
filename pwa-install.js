// Tab Keeper - PWA Install Handler
// Manages PWA installation and offline functionality

class PWAInstaller {
  constructor() {
    this.deferredPrompt = null;
    this.installButton = null;
    this.isInstalled = false;
    
    this.init();
  }

  async init() {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      this.isInstalled = true;
      console.log('[Tab Keeper PWA] Running as installed PWA');
      this.updateInstallStatus(true);
      return;
    }

    // Check if launched from standalone mode
    if (navigator.standalone === true) {
      this.isInstalled = true;
      console.log('[Tab Keeper PWA] Running in iOS standalone mode');
      this.updateInstallStatus(true);
      return;
    }

    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('[Tab Keeper PWA] Install prompt available');
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstallButton();
    });

    // Listen for successful install
    window.addEventListener('appinstalled', () => {
      console.log('[Tab Keeper PWA] Successfully installed');
      this.deferredPrompt = null;
      this.isInstalled = true;
      this.updateInstallStatus(true);
      this.hideInstallButton();
    });

    // Register service worker
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw-pwa.js', {
          scope: '/'
        });
        console.log('[Tab Keeper PWA] Service Worker registered:', registration.scope);
        
        // Check for updates periodically
        setInterval(() => {
          registration.update();
        }, 60000); // Check every minute
      } catch (error) {
        console.error('[Tab Keeper PWA] SW registration failed:', error);
      }
    }
  }

  showInstallButton() {
    // Create install button if it doesn't exist
    if (!this.installButton) {
      this.installButton = document.createElement('button');
      this.installButton.id = 'pwa-install-btn';
      this.installButton.textContent = '📲 Install Tab Keeper';
      this.installButton.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 14px 24px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        border-radius: 12px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        z-index: 10000;
        transition: all 0.3s ease;
      `;
      
      this.installButton.addEventListener('click', () => this.promptInstall());
      document.body.appendChild(this.installButton);
    }
  }

  hideInstallButton() {
    if (this.installButton) {
      this.installButton.style.display = 'none';
    }
  }

  async promptInstall() {
    if (!this.deferredPrompt) {
      console.log('[Tab Keeper PWA] No install prompt available');
      
      // Show manual install instructions
      this.showInstallInstructions();
      return;
    }

    // Show install prompt
    this.deferredPrompt.prompt();
    
    // Wait for user choice
    const { outcome } = await this.deferredPrompt.userChoice;
    console.log('[Tab Keeper PWA] User choice:', outcome);
    
    this.deferredPrompt = null;
    
    if (outcome === 'accepted') {
      console.log('[Tab Keeper PWA] User accepted install');
    } else {
      console.log('[Tab Keeper PWA] User declined install');
    }
  }

  showInstallInstructions() {
    // Create modal with manual install instructions
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10001;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
      background: white;
      padding: 30px;
      border-radius: 16px;
      max-width: 400px;
      text-align: center;
      color: #333;
    `;

    content.innerHTML = `
      <h2 style="margin-top: 0;">Install Tab Keeper</h2>
      <p>To install Tab Keeper as an app:</p>
      <ol style="text-align: left;">
        <li><strong>Chrome:</strong> Click the install icon in the address bar</li>
        <li><strong>Safari:</strong> Tap Share → Add to Home Screen</li>
        <li><strong>Edge:</strong> Click Apps → Install this site as an app</li>
      </ol>
      <button id="close-install-modal" style="
        margin-top: 20px;
        padding: 12px 24px;
        background: #667eea;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-size: 14px;
      ">Got it</button>
    `;

    modal.appendChild(content);
    document.body.appendChild(modal);

    document.getElementById('close-install-modal').addEventListener('click', () => {
      modal.remove();
    });
  }

  updateInstallStatus(installed) {
    // Dispatch custom event for other scripts to listen to
    window.dispatchEvent(new CustomEvent('pwa-install-status', { 
      detail: { installed } 
    }));

    // Update UI if needed
    const statusElement = document.getElementById('pwa-status');
    if (statusElement) {
      statusElement.textContent = installed ? '✅ Installed' : '📲 Not Installed';
    }
  }

  // Check if running in PWA mode
  isStandalone() {
    return this.isInstalled;
  }

  // Uninstall (clear cache and unregister SW)
  async uninstall() {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }
    }
    
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      for (const cacheName of cacheNames) {
        await caches.delete(cacheName);
      }
    }
    
    this.isInstalled = false;
    this.updateInstallStatus(false);
    console.log('[Tab Keeper PWA] Uninstalled');
  }
}

// Initialize PWA installer
const pwaInstaller = new PWAInstaller();

// Export for use in other scripts
window.TabKeeperPWA = pwaInstaller;
