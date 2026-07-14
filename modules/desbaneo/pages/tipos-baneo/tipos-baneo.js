// Tipos de Baneo - Funcionalidad
class TiposBaneo {
  constructor(container) {
    this.container = container;
    this.cards = Array.from(container.querySelectorAll('.tipo-card'));
    this.filters = container.querySelectorAll('.filter-btn');
    this.searchInput = container.querySelector('#search-baneo');
    this.resultsInfo = container.querySelector('.results-info');
    this.emptyState = container.querySelector('#empty-state');
    this.grid = container.querySelector('#tipos-grid');
    
    this.activeFilter = 'all';
    this.searchQuery = '';
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
        this.applyFilters();
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
        this.openDetails(card);
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
        event_category: 'TiposBaneo',
        event_label: filter
      });
    }
  }

  applyFilters() {
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

    // Show empty state
    if (this.emptyState) {
      this.emptyState.hidden = visibleCards > 0;
      this.grid.hidden = visibleCards === 0;
    }
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

  openDetails(card) {
    const title = card.querySelector('.card-title')?.textContent || '';
    const desc = card.querySelector('.card-desc')?.textContent || '';
    const features = card.querySelectorAll('.feature-text');
    const time = card.querySelector('.meta-text')?.textContent || '';
    
    // Create modal dynamically
    const modal = document.createElement('div');
    modal.className = 'tipo-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'modal-title');
    
    let featuresHTML = '';
    features.forEach(f => {
      featuresHTML += `<li>✓ ${f.textContent}</li>`;
    });

    modal.innerHTML = `
      <div class="modal-overlay" aria-hidden="true"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h3 id="modal-title">${title}</h3>
          <button class="modal-close" aria-label="Cerrar modal">&times;</button>
        </div>
        <div class="modal-body">
          <p style="color: var(--text-muted); margin-bottom: 1.5rem; line-height: 1.6;">${desc}</p>
          <div style="background: rgba(255,255,255,0.02); padding: 1.5rem; border-radius: 8px; margin-bottom: 1.5rem;">
            <h4 style="color: var(--text); margin-bottom: 1rem; font-size: 1rem;">Características:</h4>
            <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.5rem;">
              ${featuresHTML}
            </ul>
          </div>
          <div style="display: flex; align-items: center; gap: 0.5rem; color: var(--green); font-weight: 600;">
            <span aria-hidden="true">⚡</span>
            <span>${time}</span>
          </div>
        </div>
        <div class="modal-footer">
          <a href="../solicitud/?tipo=${card.dataset.categoria}" class="btn btn-primary">Iniciar recuperación</a>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Close handlers
    const closeModal = () => {
      modal.style.opacity = '0';
      setTimeout(() => modal.remove(), 300);
      document.body.style.overflow = '';
    };

    modal.querySelector('.modal-close').addEventListener('click', closeModal);
    modal.querySelector('.modal-overlay').addEventListener('click', closeModal);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.parentNode) closeModal();
    });

    // Analytics
    if (typeof gtag === 'function') {
      gtag('event', 'modal_open', {
        event_category: 'TiposBaneo',
        event_label: title
      });
    }
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
    const statNumbers = this.container.querySelectorAll('.stat-number[data-count]');
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          statNumbers.forEach(stat => {
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
                stat.textContent = target.toLocaleString() + (target > 100 ? '+' : '');
              }
            };
            
            requestAnimationFrame(animate);
          });
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );

    const statsSection = this.container.querySelector('.stats-section');
    if (statsSection) observer.observe(statsSection);
  }

  reset() {
    this.setFilter('all');
    if (this.searchInput) {
      this.searchInput.value = '';
      this.searchQuery = '';
    }
    this.applyFilters();
  }

  // Public method to filter programmatically
  filterBy(categoria) {
    this.setFilter(categoria);
  }

  // Search programmatically
  search(query) {
    if (this.searchInput) {
      this.searchInput.value = query;
      this.searchQuery = query.toLowerCase();
      this.applyFilters();
    }
  }

  // Get visible cards
  getVisibleCards() {
    return this.cards.filter(card => 
      !card.classList.contains('hidden') && card.style.display !== 'none'
    );
  }

  // Destroy instance
  destroy() {
    this.cards = null;
    this.filters = null;
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('.tipos-section');
  if (container) {
    window.tiposBaneo = new TiposBaneo(container);
  }
});

// Nav scroll effect
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 50);
}, { passive: true });

// Expose globally for development
if (window.location.hostname === 'localhost') {
  window.TiposBaneo = TiposBaneo;
}