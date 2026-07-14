/**
 * tipos-grid.js — Componente de grid de tipos de baneo
 * VERSIÓN MEJORADA con búsqueda, ordenamiento, vista lista/grid, modal
 */
'use strict';

class TiposGrid {
  constructor(container) {
    this.container = container;
    this.cards = Array.from(container.querySelectorAll('.tipo-card'));
    this.filters = container.querySelectorAll('.filter-btn');
    this.searchInput = container.querySelector('#tipos-search');
    this.searchClear = container.querySelector('.search-clear');
    this.sortSelect = container.querySelector('#tipos-sort');
    this.resultsInfo = container.querySelector('.results-info');
    this.emptyState = container.querySelector('#empty-state');
    this.loadingState = container.querySelector('#loading-state');
    this.grid = container.querySelector('#tipos-grid');
    this.modal = container.querySelector('#tipo-modal');
    this.viewBtns = container.querySelectorAll('.view-btn');
    
    this.activeFilter = 'all';
    this.searchQuery = '';
    this.sortBy = 'default';
    this.currentView = 'grid';
    this.visibleCount = this.cards.length;
    this.totalCount = this.cards.length;
    
    this.init();
  }

  init() {
    this.bindEvents();
    this.setupKeyboardNav();
    this.animateOnScroll();
    this.updateFilterCounts();
    this.animateStats();
  }

  bindEvents() {
    // Filter clicks
    this.filters.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const filter = e.currentTarget.dataset.filter;
        this.setFilter(filter);
      });
    });

    // Search
    if (this.searchInput) {
      this.searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.trim().toLowerCase();
        this.searchClear.hidden = !this.searchQuery;
        this.applyFilters();
      });

      this.searchClear.addEventListener('click', () => {
        this.searchInput.value = '';
        this.searchQuery = '';
        this.searchClear.hidden = true;
        this.searchInput.focus();
        this.applyFilters();
      });
    }

    // Sort
    if (this.sortSelect) {
      this.sortSelect.addEventListener('change', (e) => {
        this.sortBy = e.target.value;
        this.sortCards();
      });
    }

    // Reset filters
    const resetBtn = this.resultsInfo?.querySelector('.reset-filters');
    resetBtn?.addEventListener('click', () => this.reset());

    // Empty state reset
    this.emptyState?.querySelector('.empty-reset')?.addEventListener('click', () => this.reset());

    // Card clicks
    this.cards.forEach(card => {
      card.addEventListener('click', (e) => {
        if (!e.target.closest('.card-cta') && !e.target.closest('.card-details')) {
          const link = card.querySelector('.card-cta');
          if (link && window.innerWidth > 768) {
            setTimeout(() => {
              window.location.href = link.href;
            }, 200);
          }
        }
      });

      // Details button
      const detailsBtn = card.querySelector('.card-details');
      detailsBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openModal(card);
      });

      // Keyboard
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          if (e.target.classList.contains('card-details')) return;
          e.preventDefault();
          const link = card.querySelector('.card-cta');
          if (link) window.location.href = link.href;
        }
      });
    });

    // Modal
    const modalClose = this.modal?.querySelector('.modal-close');
    const modalOverlay = this.modal?.querySelector('.modal-overlay');
    
    modalClose?.addEventListener('click', () => this.closeModal());
    modalOverlay?.addEventListener('click', () => this.closeModal());

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal && !this.modal.hidden) {
        this.closeModal();
      }
    });

    // View toggle
    this.viewBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const view = btn.dataset.view;
        this.setView(view);
      });
    });
  }

  setFilter(filter) {
    this.activeFilter = filter;

    this.filters.forEach(btn => {
      const isActive = btn.dataset.filter === filter;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-pressed', isActive);
    });

    this.applyFilters();

    // Analytics
    if (typeof gtag === 'function') {
      gtag('event', 'filter_tipos', {
        event_category: 'TiposGrid',
        event_label: filter
      });
    }
  }

  applyFilters() {
    this.showLoading();

    setTimeout(() => {
      let visibleCards = 0;

      this.cards.forEach(card => {
        const categoria = card.dataset.categoria;
        const title = card.querySelector('.card-title')?.textContent.toLowerCase() || '';
        const desc = card.querySelector('.card-desc')?.textContent.toLowerCase() || '';
        
        const matchesFilter = this.activeFilter === 'all' || categoria === this.activeFilter;
        const matchesSearch = !this.searchQuery || 
          title.includes(this.searchQuery) || 
          desc.includes(this.searchQuery);

        if (matchesFilter && matchesSearch) {
          card.classList.remove('hidden');
          card.style.display = 'flex';
          setTimeout(() => card.classList.add('filtered'), 50);
          visibleCards++;
        } else {
          card.classList.remove('filtered');
          card.style.opacity = '0';
          card.style.transform = 'scale(0.9)';
          setTimeout(() => {
            card.classList.add('hidden');
            card.style.display = 'none';
          }, 300);
        }
      });

      this.visibleCount = visibleCards;
      this.updateResultsInfo();
      this.hideLoading();

      // Show empty state
      if (this.emptyState) {
        this.emptyState.hidden = visibleCards > 0;
        this.grid.hidden = visibleCards === 0;
      }
    }, 300);
  }

  sortCards() {
    const cardsArray = [...this.cards];

    switch (this.sortBy) {
      case 'time-asc':
        cardsArray.sort((a, b) => 
          parseInt(a.dataset.time || 999) - parseInt(b.dataset.time || 999)
        );
        break;
      case 'time-desc':
        cardsArray.sort((a, b) => 
          parseInt(b.dataset.time || 0) - parseInt(a.dataset.time || 0)
        );
        break;
      case 'severity':
        cardsArray.sort((a, b) => 
          parseInt(b.dataset.severity || 0) - parseInt(a.dataset.severity || 0)
        );
        break;
      case 'name':
        cardsArray.sort((a, b) => {
          const nameA = a.querySelector('.card-title')?.textContent || '';
          const nameB = b.querySelector('.card-title')?.textContent || '';
          return nameA.localeCompare(nameB);
        });
        break;
      default:
        // Default order (DOM order)
        break;
    }

    // Reordenar en el DOM
    cardsArray.forEach(card => this.grid.appendChild(card));
    
    // Re-animar
    this.cards.forEach((card, index) => {
      card.style.animationDelay = `${index * 0.1}s`;
    });
  }

  updateResultsInfo() {
    if (this.resultsInfo) {
      document.getElementById('visible-count').textContent = this.visibleCount;
      document.getElementById('total-count').textContent = this.totalCount;
      this.resultsInfo.hidden = this.visibleCount === this.totalCount && !this.searchQuery;
    }
  }

  updateFilterCounts() {
    const counts = {
      all: this.cards.length,
      temporal: this.cards.filter(c => c.dataset.categoria === 'temporal').length,
      permanente: this.cards.filter(c => c.dataset.categoria === 'permanente').length,
      suspension: this.cards.filter(c => c.dataset.categoria === 'suspension').length
    };

    this.filters.forEach(btn => {
      const count = counts[btn.dataset.filter];
      const countEl = btn.querySelector('.filter-count');
      if (countEl) countEl.textContent = count;
    });
  }

  setView(view) {
    this.currentView = view;

    this.viewBtns.forEach(btn => {
      const isActive = btn.dataset.view === view;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-pressed', isActive);
    });

    this.grid.classList.toggle('view-list', view === 'list');

    // Analytics
    if (typeof gtag === 'function') {
      gtag('event', 'view_change', {
        event_category: 'TiposGrid',
        event_label: view
      });
    }
  }

  openModal(card) {
    if (!this.modal) return;

    const title = card.querySelector('.card-title')?.textContent || '';
    const desc = card.querySelector('.card-desc')?.textContent || '';
    const features = card.querySelectorAll('.feature-text');
    const time = card.querySelector('.meta-text')?.textContent || '';
    const ctaLink = card.querySelector('.card-cta')?.href || '../solicitud/';

    document.getElementById('modal-title').textContent = title;
    
    let featuresHTML = '';
    features.forEach(f => {
      featuresHTML += `<li>✓ ${f.textContent}</li>`;
    });

    document.getElementById('modal-body').innerHTML = `
      <p style="color: var(--tipos-text-muted); margin-bottom: 1.5rem; line-height: 1.6;">${desc}</p>
      <div style="background: rgba(255,255,255,0.02); padding: 1.5rem; border-radius: 8px; margin-bottom: 1.5rem;">
        <h4 style="color: var(--tipos-text); margin-bottom: 1rem; font-size: 1rem;">Características:</h4>
        <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.5rem;">
          ${featuresHTML}
        </ul>
      </div>
      <div style="display: flex; align-items: center; gap: 0.5rem; color: var(--tipos-green); font-weight: 600;">
        <span aria-hidden="true">⚡</span>
        <span>${time}</span>
      </div>
    `;

    document.getElementById('modal-cta').href = ctaLink;

    this.modal.hidden = false;
    document.body.style.overflow = 'hidden';

    // Focus trap
    const focusable = this.modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    this.firstFocusable = focusable[0];
    this.lastFocusable = focusable[focusable.length - 1];
    this.firstFocusable.focus();

    // Analytics
    if (typeof gtag === 'function') {
      gtag('event', 'modal_open', {
        event_category: 'TiposGrid',
        event_label: title
      });
    }
  }

  closeModal() {
    if (!this.modal) return;
    this.modal.hidden = true;
    document.body.style.overflow = '';
  }

  showLoading() {
    if (this.loadingState) {
      this.loadingState.hidden = false;
    }
  }

  hideLoading() {
    if (this.loadingState) {
      this.loadingState.hidden = true;
    }
  }

  reset() {
    this.setFilter('all');
    this.searchInput.value = '';
    this.searchQuery = '';
    this.searchClear.hidden = true;
    this.sortSelect.value = 'default';
    this.sortBy = 'default';
    this.applyFilters();
  }

  setupKeyboardNav() {
    this.container.addEventListener('keydown', (e) => {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;

      const visibleCards = this.cards.filter(card => 
        !card.classList.contains('hidden') && card.style.display !== 'none'
      );

      const currentIndex = visibleCards.indexOf(document.activeElement);
      if (currentIndex === -1) return;

      e.preventDefault();
      
      let nextIndex;
      const isGrid = window.innerWidth > 768;
      
      if (e.key === 'ArrowRight' || (isGrid && e.key === 'ArrowDown') || (!isGrid && e.key === 'ArrowDown')) {
        nextIndex = (currentIndex + 1) % visibleCards.length;
      } else {
        nextIndex = (currentIndex - 1 + visibleCards.length) % visibleCards.length;
      }

      visibleCards[nextIndex]?.focus();
      visibleCards[nextIndex]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }

  animateOnScroll() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    this.cards.forEach(card => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(30px)';
      card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      observer.observe(card);
    });
  }

  animateStats() {
    const statValues = this.container.querySelectorAll('.stat-value[data-count]');
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          statValues.forEach(stat => {
            const target = parseInt(stat.dataset.count, 10);
            const duration = 2000;
            const start = performance.now();
            
            const animate = (now) => {
              const progress = Math.min((now - start) / duration, 1);
              const eased = 1 - Math.pow(1 - progress, 4);
              const current = Math.floor(target * eased);
              stat.textContent = current.toLocaleString();
              
              if (progress < 1) {
                requestAnimationFrame(animate);
              } else {
                stat.textContent = target.toLocaleString() + '+';
              }
            };
            
            requestAnimationFrame(animate);
          });
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );

    const statsSection = this.container.querySelector('.header-stats');
    if (statsSection) observer.observe(statsSection);
  }

  // Método público para filtrar programáticamente
  filterBy(categoria) {
    this.setFilter(categoria);
  }

  // Buscar programáticamente
  search(query) {
    this.searchInput.value = query;
    this.searchQuery = query.toLowerCase();
    this.searchClear.hidden = !query;
    this.applyFilters();
  }

  // Obtener cards visibles
  getVisibleCards() {
    return this.cards.filter(card => 
      !card.classList.contains('hidden') && card.style.display !== 'none'
    );
  }

  // Destruir instancia
  destroy() {
    this.cards = null;
    this.filters = null;
  }
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  const gridContainer = document.querySelector('.tipos-grid-section');
  if (gridContainer) {
    window.tiposGrid = new TiposGrid(gridContainer);
  }
});

// Exponer globalmente en desarrollo
if (window.location.hostname === 'localhost') {
  window.TiposGrid = TiposGrid;
}