/**
 * Footer Component
 * Funcionalidad del footer: back to top, año actual, smooth scroll
 */

class Footer {
  constructor() {
    this.backToTopBtn = document.getElementById('backToTop');
    this.currentYearEl = document.getElementById('current-year');
    this.scrollThreshold = 300;
    
    this.init();
  }

  init() {
    this.setCurrentYear();
    this.bindEvents();
    this.handleScroll();
  }

  setCurrentYear() {
    if (this.currentYearEl) {
      this.currentYearEl.textContent = new Date().getFullYear();
    }
  }

  bindEvents() {
    // Back to top button
    this.backToTopBtn?.addEventListener('click', () => {
      this.scrollToTop();
    });

    // Scroll event
    window.addEventListener('scroll', () => {
      this.handleScroll();
    }, { passive: true });

    // Smooth scroll for footer links
    document.querySelectorAll('.footer-links a[href^="#"]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        
        if (targetElement) {
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      });
    });

    // Track footer link clicks
    document.querySelectorAll('.footer-links a, .footer-contact a, .social-link').forEach(link => {
      link.addEventListener('click', (e) => {
        const linkText = e.currentTarget.textContent.trim();
        const linkCategory = e.currentTarget.closest('.footer-column')?.querySelector('.footer-title')?.textContent || 'Footer';
        
        this.trackEvent('footer_link_click', {
          link_text: linkText,
          category: linkCategory,
          href: e.currentTarget.href
        });
      });
    });
  }

  handleScroll() {
    // Show/hide back to top button
    if (this.backToTopBtn) {
      if (window.scrollY > this.scrollThreshold) {
        this.backToTopBtn.classList.add('visible');
      } else {
        this.backToTopBtn.classList.remove('visible');
      }
    }
  }

  scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });

    // Track event
    this.trackEvent('back_to_top_click', {
      category: 'Navigation'
    });
  }

  trackEvent(eventName, data) {
    // Google Analytics
    if (typeof gtag === 'function') {
      gtag('event', eventName, {
        event_category: 'Footer',
        ...data
      });
    }

    // Console log for development
    if (window.location.hostname === 'localhost') {
      console.log(`📊 [Footer] ${eventName}:`, data);
    }
  }

  // Public method to update footer dynamically
  updateFooter(data) {
    if (data.socialLinks) {
      this.updateSocialLinks(data.socialLinks);
    }
  }

  updateSocialLinks(links) {
    const socialContainer = document.querySelector('.footer-social');
    if (socialContainer) {
      socialContainer.innerHTML = links.map(link => `
        <a href="${link.url}" 
           class="social-link ${link.platform}" 
           aria-label="${link.label}" 
           target="_blank" 
           rel="noopener">
          ${link.icon}
        </a>
      `).join('');
    }
  }

  // Public method to add custom footer link
  addFooterLink(section, text, url) {
    const sectionEl = document.querySelector(`.footer-column:nth-child(${section}) .footer-links`);
    if (sectionEl) {
      const li = document.createElement('li');
      li.innerHTML = `<a href="${url}">${text}</a>`;
      sectionEl.appendChild(li);
    }
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.footer = new Footer();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Footer;
}