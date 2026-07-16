/**
 * Cookie Banner Component
 * Manejo de consentimiento de cookies con preferencias
 */

class CookieBanner {
  constructor() {
    this.banner = document.getElementById('cookie-banner');
    this.modal = document.getElementById('cookie-modal');
    this.acceptBtn = document.getElementById('cookie-accept');
    this.rejectBtn = document.getElementById('cookie-reject');
    this.configBtn = document.getElementById('cookie-config');
    this.modalClose = document.getElementById('cookie-modal-close');
    this.savePreferencesBtn = document.getElementById('cookie-save-preferences');
    this.acceptAllModalBtn = document.getElementById('cookie-accept-all-modal');
    
    this.cookies = {
      essential: true,
      analytics: false,
      marketing: false,
      functional: false
    };
    
    this.COOKIE_NAME = 'desbanwa_cookie_consent';
    this.COOKIE_EXPIRY_DAYS = 365;
    
    this.init();
  }

  init() {
    // Check if user already made a choice
    const savedConsent = this.getConsent();
    
    if (!savedConsent) {
      // Show banner after a short delay
      setTimeout(() => {
        this.showBanner();
      }, 1000);
    } else {
      this.cookies = savedConsent;
      this.initializeCookies();
    }

    this.bindEvents();
  }

  bindEvents() {
    // Banner buttons
    this.acceptBtn?.addEventListener('click', () => this.acceptAll());
    this.rejectBtn?.addEventListener('click', () => this.rejectAll());
    this.configBtn?.addEventListener('click', () => this.openModal());

    // Modal buttons
    this.modalClose?.addEventListener('click', () => this.closeModal());
    this.savePreferencesBtn?.addEventListener('click', () => this.savePreferences());
    this.acceptAllModalBtn?.addEventListener('click', () => this.acceptAllFromModal());

    // Close modal on backdrop click
    this.modal?.querySelector('.cookie-modal-backdrop')?.addEventListener('click', () => {
      this.closeModal();
    });

    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this.modal.hidden) {
        this.closeModal();
      }
    });
  }

  showBanner() {
    if (this.banner) {
      this.banner.hidden = false;
      document.body.style.paddingBottom = `${this.banner.offsetHeight}px`;
      
      // Announce to screen readers
      this.banner.setAttribute('aria-live', 'assertive');
    }
  }

  hideBanner() {
    if (this.banner) {
      this.banner.hidden = true;
      document.body.style.paddingBottom = '0';
    }
  }

  openModal() {
    if (this.modal) {
      this.modal.hidden = false;
      document.body.style.overflow = 'hidden';
      
      // Set checkbox states
      document.getElementById('cookie-analytics').checked = this.cookies.analytics;
      document.getElementById('cookie-marketing').checked = this.cookies.marketing;
      document.getElementById('cookie-functional').checked = this.cookies.functional;
      
      // Focus trap
      this.modalClose.focus();
    }
  }

  closeModal() {
    if (this.modal) {
      this.modal.hidden = true;
      document.body.style.overflow = '';
    }
  }

  acceptAll() {
    this.cookies = {
      essential: true,
      analytics: true,
      marketing: true,
      functional: true
    };
    
    this.saveConsent();
    this.hideBanner();
    this.initializeCookies();
    this.trackConsent('all');
  }

  acceptAllFromModal() {
    this.acceptAll();
    this.closeModal();
  }

  rejectAll() {
    this.cookies = {
      essential: true,
      analytics: false,
      marketing: false,
      functional: false
    };
    
    this.saveConsent();
    this.hideBanner();
    this.initializeCookies();
    this.trackConsent('none');
  }

  savePreferences() {
    this.cookies = {
      essential: true,
      analytics: document.getElementById('cookie-analytics').checked,
      marketing: document.getElementById('cookie-marketing').checked,
      functional: document.getElementById('cookie-functional').checked
    };
    
    this.saveConsent();
    this.hideBanner();
    this.closeModal();
    this.initializeCookies();
    this.trackConsent('custom');
  }

  saveConsent() {
    const consent = {
      cookies: this.cookies,
      timestamp: new Date().toISOString(),
      version: '1.0'
    };
    
    localStorage.setItem(this.COOKIE_NAME, JSON.stringify(consent));
  }

  getConsent() {
    const saved = localStorage.getItem(this.COOKIE_NAME);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.cookies;
      } catch (e) {
        console.error('Error parsing cookie consent:', e);
        return null;
      }
    }
    return null;
  }

  initializeCookies() {
    // Initialize Google Analytics if enabled
    if (this.cookies.analytics && typeof gtag === 'function') {
      this.enableAnalytics();
    }

    // Initialize Facebook Pixel if enabled
    if (this.cookies.marketing && typeof fbq === 'function') {
      this.enableMarketing();
    }

    // Initialize functional cookies
    if (this.cookies.functional) {
      this.enableFunctional();
    }
  }

  enableAnalytics() {
    // Google Analytics
    if (typeof gtag === 'function') {
      gtag('consent', 'update', {
        analytics_storage: 'granted'
      });
    }
    
    console.log('✅ Analytics cookies enabled');
  }

  enableMarketing() {
    // Facebook Pixel
    if (typeof fbq === 'function') {
      fbq('consent', 'grant');
    }
    
    console.log('✅ Marketing cookies enabled');
  }

  enableFunctional() {
    // Enable language preference, theme, etc.
    console.log('✅ Functional cookies enabled');
  }

  trackConsent(type) {
    // Track consent choice in analytics
    if (typeof gtag === 'function') {
      gtag('event', 'cookie_consent', {
        event_category: 'Privacy',
        event_label: type,
        cookies: this.cookies
      });
    }
    
    console.log(`📊 Cookie consent: ${type}`, this.cookies);
  }

  // Public method to open preferences modal
  showPreferences() {
    this.openModal();
  }

  // Public method to reset consent
  resetConsent() {
    localStorage.removeItem(this.COOKIE_NAME);
    location.reload();
  }

  // Public method to get current consent
  getConsentStatus() {
    return this.cookies;
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.cookieBanner = new CookieBanner();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CookieBanner;
}