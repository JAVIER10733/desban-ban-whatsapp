/**
 * Sidebar Component
 * Filtros, búsqueda, y controles de sidebar
 */

class Sidebar {
  constructor() {
    this.sidebar = document.getElementById('sidebar');
    this.overlay = document.getElementById('sidebarOverlay');
    this.closeBtn = document.getElementById('sidebarClose');
    this.resetBtn = document.getElementById('btnReset');
    this.applyBtn = document.getElementById('btnApply');
    this.filterCount = document.getElementById('filterCount');
    
    this.activeFilters = new Set();
    this.isOpen = false;
    
    this.init();
  }

  init() {
    this.bindEvents();
    this.updateFilterCount();
  }

  bindEvents() {
    // Close button
    this.closeBtn?.addEventListener('click', () => {
      this.close();
    });

    // Overlay click
    this.overlay?.addEventListener('click', () => {
      this.close();
    });

    // Reset button
    this.resetBtn?.addEventListener('click', () => {
      this.resetFilters();
    });

    // Apply button
    this.applyBtn?.addEventListener('click', () => {
      this.applyFilters();
    });

    // Checkboxes
    this.sidebar?.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        this.handleCheckboxChange(checkbox);
      });
    });

    // Radio buttons
    this.sidebar?.querySelectorAll('input[type="radio"]').forEach(radio => {
      radio.addEventListener('change', () => {
        this.handleRadioChange(radio);
      });
    });

    // Tags
    this.sidebar?.querySelectorAll('.tag').forEach(tag => {
      tag.addEventListener('click', () => {
        this.handleTagClick(tag);
      });
    });

    // Date buttons
    this.sidebar?.querySelectorAll('.date-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.handleDateClick(btn);
      });
    });

    // Search input
    const searchInput = this.sidebar?.querySelector('.search-input');
    searchInput?.addEventListener('input', (e) => {
      this.handleSearch(e.target.value);
    });

    // Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
  }

  open() {
    if (this.sidebar && this.overlay) {
      this.sidebar.classList.add('open');
      this.overlay.classList.add('visible');
      this.overlay.hidden = false;
      this.isOpen = true;
      document.body.style.overflow = 'hidden';
      
      this.trackEvent('sidebar_opened');
    }
  }

  close() {
    if (this.sidebar && this.overlay) {
      this.sidebar.classList.remove('open');
      this.overlay.classList.remove('visible');
      setTimeout(() => {
        this.overlay.hidden = true;
      }, 300);
      this.isOpen = false;
      document.body.style.overflow = '';
      
      this.trackEvent('sidebar_closed');
    }
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  handleCheckboxChange(checkbox) {
    const label = checkbox.closest('label');
    const value = checkbox.id || label.textContent.trim();
    
    if (checkbox.checked) {
      this.activeFilters.add(value);
      label.closest('.sidebar-list-item')?.classList.add('active');
    } else {
      this.activeFilters.delete(value);
      label.closest('.sidebar-list-item')?.classList.remove('active');
    }
    
    this.updateFilterCount();
    this.trackEvent('filter_changed', {
      type: 'checkbox',
      value,
      checked: checkbox.checked
    });
  }

  handleRadioChange(radio) {
    const value = radio.value;
    const groupName = radio.name;
    
    // Remove other filters from same group
    this.sidebar.querySelectorAll(`input[name="${groupName}"]`).forEach(r => {
      if (r !== radio) {
        this.activeFilters.delete(r.value);
        r.closest('.radio-label')?.classList.remove('active');
      }
    });
    
    // Add current filter
    this.activeFilters.add(value);
    radio.closest('.radio-label')?.classList.add('active');
    
    this.updateFilterCount();
    this.trackEvent('filter_changed', {
      type: 'radio',
      group: groupName,
      value
    });
  }

  handleTagClick(tag) {
    tag.classList.toggle('active');
    const value = tag.textContent.trim();
    
    if (tag.classList.contains('active')) {
      this.activeFilters.add(`tag:${value}`);
    } else {
      this.activeFilters.delete(`tag:${value}`);
    }
    
    this.updateFilterCount();
    this.trackEvent('filter_changed', {
      type: 'tag',
      value,
      active: tag.classList.contains('active')
    });
  }

  handleDateClick(btn) {
    // Remove active from all date buttons
    this.sidebar.querySelectorAll('.date-btn').forEach(b => {
      b.classList.remove('active');
    });
    
    // Add active to clicked button
    btn.classList.add('active');
    
    const value = btn.textContent.trim();
    this.activeFilters.add(`date:${value}`);
    
    this.updateFilterCount();
    this.trackEvent('filter_changed', {
      type: 'date',
      value
    });
  }

  handleSearch(query) {
    this.trackEvent('search_performed', {
      query,
      length: query.length
    });
    
    // Emit search event for parent to handle
    const event = new CustomEvent('sidebarSearch', {
      detail: { query }
    });
    document.dispatchEvent(event);
  }

  updateFilterCount() {
    const count = this.activeFilters.size;
    if (this.filterCount) {
      this.filterCount.textContent = count;
      this.filterCount.style.display = count > 0 ? 'inline-block' : 'none';
    }
  }

  resetFilters() {
    // Reset checkboxes
    this.sidebar.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
      checkbox.checked = false;
      checkbox.closest('.sidebar-list-item')?.classList.remove('active');
    });

    // Reset radio buttons (select first option)
    this.sidebar.querySelectorAll('.sidebar-radio-group').forEach(group => {
      const firstRadio = group.querySelector('input[type="radio"]');
      if (firstRadio) {
        firstRadio.checked = true;
        group.querySelectorAll('.radio-label').forEach(label => {
          label.classList.remove('active');
        });
        firstRadio.closest('.radio-label')?.classList.add('active');
      }
    });

    // Reset tags
    this.sidebar.querySelectorAll('.tag').forEach(tag => {
      tag.classList.remove('active');
    });

    // Reset date buttons
    this.sidebar.querySelectorAll('.date-btn').forEach(btn => {
      btn.classList.remove('active');
    });

    // Reset search
    const searchInput = this.sidebar.querySelector('.search-input');
    if (searchInput) {
      searchInput.value = '';
    }

    // Clear active filters
    this.activeFilters.clear();
    this.updateFilterCount();

    this.trackEvent('filters_reset');
  }

  applyFilters() {
    const filters = {
      activeFilters: Array.from(this.activeFilters),
      search: this.sidebar.querySelector('.search-input')?.value || '',
      priceMin: document.getElementById('price-min')?.value || null,
      priceMax: document.getElementById('price-max')?.value || null
    };

    // Emit apply event
    const event = new CustomEvent('sidebarApply', {
      detail: filters
    });
    document.dispatchEvent(event);

    this.trackEvent('filters_applied', {
      count: filters.activeFilters.length,
      filters
    });

    // Close sidebar after applying
    setTimeout(() => {
      this.close();
    }, 300);
  }

  getActiveFilters() {
    return Array.from(this.activeFilters);
  }

  trackEvent(eventName, data = {}) {
    // Google Analytics
    if (typeof gtag === 'function') {
      gtag('event', eventName, {
        event_category: 'Sidebar',
        ...data
      });
    }

    // Console log for development
    if (window.location.hostname === 'localhost') {
      console.log(`📊 [Sidebar] ${eventName}:`, data);
    }
  }

  // Public method to add filter programmatically
  addFilter(filter) {
    this.activeFilters.add(filter);
    this.updateFilterCount();
  }

  // Public method to remove filter
  removeFilter(filter) {
    this.activeFilters.delete(filter);
    this.updateFilterCount();
  }

  // Public method to check if filter is active
  hasFilter(filter) {
    return this.activeFilters.has(filter);
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.sidebar = new Sidebar();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Sidebar;
}