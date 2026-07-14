/**
 * garantia.js — Módulo Desbaneo / Garantía
 * Versión PRO: Integración completa con sección de planes mejorada
 */
'use strict';

(() => {
  // ========================================
  // CONFIGURACIÓN GLOBAL
  // ========================================
  const CONFIG = {
    scrollOffset: 40,
    revealThreshold: 0.1,
    cardThreshold: 0.4,
    counterDuration: 1400,
    faqAnimationDuration: 300,
    debounceDelay: 100,
    planHighlightDuration: 2000,
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    breakpoints: { mobile: 600, tablet: 900, desktop: 1200 }
  };

  // ========================================
  // UTILIDADES
  // ========================================
  const Utils = {
    debounce: (fn, delay) => {
      let timeout;
      return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn.apply(this, args), delay);
      };
    },

    throttle: (fn, limit) => {
      let inThrottle;
      return (...args) => {
        if (!inThrottle) {
          fn.apply(this, args);
          inThrottle = true;
          setTimeout(() => inThrottle = false, limit);
        }
      };
    },

    easeOutQuad: (t) => t * (2 - t),

    isElementInViewport: (el) => {
      const rect = el.getBoundingClientRect();
      return rect.top <= window.innerHeight && rect.bottom >= 0;
    },

    getScrollPosition: () => ({
      top: window.pageYOffset || document.documentElement.scrollTop,
      left: window.pageXOffset || document.documentElement.scrollLeft
    }),

    scrollTo: (el, offset = 0) => {
      const target = typeof el === 'string' ? document.querySelector(el) : el;
      if (!target) return;
      const y = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: y, behavior: CONFIG.reducedMotion ? 'auto' : 'smooth' });
    },

    copyToClipboard: async (text) => {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        // Fallback para navegadores antiguos
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        return true;
      }
    },

    formatPrice: (price, currency = 'USD') => 
      new Intl.NumberFormat('es-EC', { style: 'currency', currency }).format(price)
  };

  // ========================================
  // MÓDULO: NAV SCROLL + STICKY
  // ========================================
  const NavModule = {
    init() {
      const nav = document.getElementById('nav');
      if (!nav) return;

      const handleScroll = Utils.debounce(() => {
        const scrolled = window.scrollY > CONFIG.scrollOffset;
        nav.classList.toggle('scrolled', scrolled);
        
        // Sombra progresiva basada en scroll
        const intensity = Math.min(window.scrollY / 200, 1);
        nav.style.boxShadow = `0 ${2 + intensity * 4}px ${8 + intensity * 8}px rgba(0,0,0,${0.1 + intensity * 0.2})`;
      }, CONFIG.debounceDelay);

      window.addEventListener('scroll', handleScroll, { passive: true });
      handleScroll(); // Estado inicial
    }
  };

  // ========================================
  // MÓDULO: REVEAL ON SCROLL (Mejorado)
  // ========================================
  const RevealModule = {
    observers: new Map(),

    init() {
      if (CONFIG.reducedMotion) {
        document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
        return;
      }

      // Observer principal para elementos .reveal
      const mainObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const el = entry.target;
              const siblings = Array.from(el.parentNode.children);
              const index = siblings.indexOf(el);
              el.style.transitionDelay = `${(index % 4) * 0.1}s`;
              el.classList.add('visible');
              mainObserver.unobserve(el);
            }
          });
        },
        { threshold: CONFIG.revealThreshold, rootMargin: '0px 0px -50px 0px' }
      );

      document.querySelectorAll('.reveal').forEach(el => mainObserver.observe(el));
      this.observers.set('main', mainObserver);

      // Observer especial para tarjetas de planes (stagger effect)
      const planObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const cards = entry.target.querySelectorAll('.pg-card');
              cards.forEach((card, i) => {
                setTimeout(() => card.classList.add('visible'), i * 100);
              });
              planObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.2 }
      );

      const plansSection = document.querySelector('.planes-garantia-section');
      if (plansSection) planObserver.observe(plansSection);
      this.observers.set('plans', planObserver);
    },

    destroy() {
      this.observers.forEach(observer => observer?.disconnect());
      this.observers.clear();
    }
  };

  // ========================================
  // MÓDULO: FAQ ACCORDION (Doble sección)
  // ========================================
  const FAQModule = {
    selectors: ['.faq-q', '.pgf-item h4'], // FAQ principal + FAQ de planes

    init() {
      // FAQ Principal
      document.querySelectorAll('.faq-q').forEach((btn, index) => {
        this.setupAccordion(btn, `faq-answer-${index}`, 'faq-a');
      });

      // FAQ de Planes (pg-faq)
      document.querySelectorAll('.pg-faq .pgf-item').forEach((item, index) => {
        const question = item.querySelector('h4');
        const answer = item.querySelector('p');
        if (question && answer) {
          item.style.cursor = 'pointer';
          item.setAttribute('tabindex', '0');
          item.setAttribute('role', 'button');
          item.setAttribute('aria-expanded', 'false');
          
          const toggle = () => {
            const isOpen = item.getAttribute('aria-expanded') === 'true';
            item.setAttribute('aria-expanded', !isOpen);
            answer.style.maxHeight = isOpen ? null : `${answer.scrollHeight + 20}px`;
            answer.style.opacity = isOpen ? '0' : '1';
            answer.style.padding = isOpen ? '0' : '0.5rem 0 0';
          };

          item.addEventListener('click', (e) => {
            if (!e.target.closest('a')) {
              e.preventDefault();
              toggle();
            }
          });
          
          item.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              toggle();
            }
          });
        }
      });
    },

    setupAccordion(btn, answerId, answerClass) {
      const answer = btn.nextElementSibling;
      if (answer?.classList.contains(answerClass)) {
        btn.setAttribute('aria-controls', answerId);
        btn.setAttribute('aria-expanded', 'false');
        answer.setAttribute('id', answerId);
        answer.setAttribute('hidden', '');
      }

      const toggle = () => {
        const isOpen = btn.getAttribute('aria-expanded') === 'true';
        
        // Cerrar todos los del mismo grupo
        const group = btn.closest('.faq-right, .pg-faq');
        group?.querySelectorAll('[aria-expanded="true"]').forEach(b => {
          b.setAttribute('aria-expanded', 'false');
          const ans = b.nextElementSibling || b.closest('.pgf-item')?.querySelector('p');
          if (ans) {
            ans.classList.remove('open');
            ans.style.maxHeight = null;
            ans.setAttribute('hidden', '');
          }
        });

        if (!isOpen) {
          btn.setAttribute('aria-expanded', 'true');
          if (answer) {
            answer.classList.add('open');
            answer.removeAttribute('hidden');
            if (!CONFIG.reducedMotion) {
              answer.style.maxHeight = answer.scrollHeight + 'px';
              setTimeout(() => answer.style.maxHeight = null, CONFIG.faqAnimationDuration);
            }
          }
        }
      };

      btn.addEventListener('click', (e) => { e.preventDefault(); toggle(); });
      btn.addEventListener('keydown', (e) => {
        if (['Enter', ' '].includes(e.key)) { e.preventDefault(); toggle(); }
        if (e.key === 'ArrowDown') this.focusNext(btn);
        if (e.key === 'ArrowUp') this.focusPrev(btn);
      });
    },

    focusNext(current) {
      const items = Array.from(document.querySelectorAll('.faq-q, .pg-faq .pgf-item'));
      const idx = items.indexOf(current);
      items[idx + 1]?.focus();
    },

    focusPrev(current) {
      const items = Array.from(document.querySelectorAll('.faq-q, .pg-faq .pgf-item'));
      const idx = items.indexOf(current);
      items[idx - 1]?.focus();
    }
  };

  // ========================================
  // MÓDULO: COUNTER ANIMATION
  // ========================================
  const CounterModule = {
    init() {
      const counters = document.querySelectorAll('.gc-stat-num[data-target]');
      if (!counters.length) return;

      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            counters.forEach(el => this.animate(el));
            observer.disconnect();
          }
        },
        { threshold: CONFIG.cardThreshold }
      );

      const card = document.querySelector('.garantia-card');
      if (card) observer.observe(card);
    },

    animate(el) {
      const target = parseInt(el.dataset.target, 10);
      const suffix = el.dataset.suffix || '';
      
      if (CONFIG.reducedMotion) {
        el.textContent = target + suffix;
        return;
      }

      const duration = CONFIG.counterDuration;
      const start = performance.now();

      const tick = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = Utils.easeOutQuad(progress);
        el.textContent = Math.floor(target * eased) + suffix;
        if (progress < 1) requestAnimationFrame(tick);
      };

      requestAnimationFrame(tick);
    }
  };

  // ========================================
  // MÓDULO: PLANES INTERACTIVOS
  // ========================================
  const PlansModule = {
    selectedPlan: null,

    init() {
      // Highlight del plan desde URL
      this.highlightFromURL();
      
      // Efectos hover en tarjetas
      this.setupCardEffects();
      
      // CTAs de planes con tracking
      this.setupPlanCTAs();
      
      // Toggle de features en mobile
      this.setupMobileFeatures();
      
      // Comparativa: sticky header en tabla
      this.setupComparisonTable();
      
      // Copy link del plan
      this.setupCopyPlanLink();
    },

    highlightFromURL() {
      const plan = new URLSearchParams(window.location.search).get('plan');
      if (!plan) return;

      const card = document.querySelector(`.pg-card a[href*="plan=${plan}"]`)?.closest('.pg-card');
      if (!card) return;

      this.selectedPlan = plan;
      card.classList.add('selected', 'reveal', 'visible');
      
      // Efecto de pulso suave
      if (!CONFIG.reducedMotion) {
        card.style.animation = 'pulse 2s ease-in-out';
        setTimeout(() => {
          card.style.animation = '';
          // Scroll suave hacia el plan
          Utils.scrollTo(card, 100);
        }, CONFIG.planHighlightDuration);
      }

      // Actualizar URL sin recarga
      history.replaceState(null, null, window.location.pathname);
    },

    setupCardEffects() {
      document.querySelectorAll('.pg-card').forEach(card => {
        // Efecto tilt sutil en desktop
        if (window.innerWidth > CONFIG.breakpoints.tablet && !CONFIG.reducedMotion) {
          card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = (y - centerY) / 20;
            const rotateY = (centerX - x) / 20;
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
          });

          card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0)';
          });
        }

        // Click para "seleccionar" visualmente
        card.addEventListener('click', (e) => {
          if (e.target.closest('a')) return; // Dejar que los links funcionen
          
          document.querySelectorAll('.pg-card').forEach(c => c.classList.remove('selected'));
          card.classList.add('selected');
          
          // Feedback visual
          const badge = card.querySelector('.pg-guarantee-mini');
          if (badge && !CONFIG.reducedMotion) {
            badge.style.transform = 'scale(1.05)';
            setTimeout(() => badge.style.transform = '', 200);
          }
        });
      });
    },

    setupPlanCTAs() {
      document.querySelectorAll('.pg-cta').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const plan = btn.href?.match(/plan=([^&]+)/)?.[1] || 'unknown';
          
          // Tracking (si existe analytics)
          if (typeof gtag === 'function') {
            gtag('event', 'plan_select', {
              event_category: 'Garantia',
              event_label: plan,
              value: parseInt(btn.closest('.pg-card')?.querySelector('.pg-precio')?.textContent || 0)
            });
          }

          // Efecto de loading en el botón
          if (!CONFIG.reducedMotion) {
            const original = btn.innerHTML;
            btn.innerHTML = '<span>Procesando...</span>';
            btn.style.pointerEvents = 'none';
            btn.style.opacity = '0.8';
            
            // Simular delay mínimo para UX
            setTimeout(() => {
              btn.innerHTML = original;
              btn.style.pointerEvents = '';
              btn.style.opacity = '';
            }, 800);
          }
        });
      });
    },

    setupMobileFeatures() {
      // En mobile, permitir expandir features si son muchas
      if (window.innerWidth <= CONFIG.breakpoints.mobile) {
        document.querySelectorAll('.pg-features').forEach(features => {
          const items = features.querySelectorAll('.pgf-item');
          if (items.length > 8) {
            const toggle = document.createElement('button');
            toggle.className = 'pg-features-toggle';
            toggle.innerHTML = '<span>Ver más características ↓</span>';
            toggle.style.cssText = 'width:100%;background:none;border:none;color:var(--green);font-size:0.8rem;padding:0.5rem 0;cursor:pointer;margin-top:0.5rem;';
            
            let expanded = false;
            toggle.addEventListener('click', () => {
              expanded = !expanded;
              features.style.maxHeight = expanded ? '1000px' : '280px';
              toggle.querySelector('span').textContent = expanded ? 'Ver menos ↑' : 'Ver más características ↓';
            });
            
            features.style.maxHeight = '280px';
            features.style.overflow = 'hidden';
            features.style.transition = 'max-height 0.3s ease';
            features.parentNode.insertBefore(toggle, features.nextSibling);
          }
        });
      }
    },

    setupComparisonTable() {
      const table = document.querySelector('.pg-comparison-table table');
      if (!table) return;

      // Sticky header en scroll horizontal
      const ths = table.querySelectorAll('thead th');
      ths.forEach(th => {
        th.style.position = 'sticky';
        th.style.top = '0';
        th.style.zIndex = '2';
        th.style.background = 'var(--bg2)';
      });

      // Primera columna sticky en scroll horizontal
      const firstCells = table.querySelectorAll('tbody td:first-child, thead th:first-child');
      firstCells.forEach(cell => {
        cell.style.position = 'sticky';
        cell.style.left = '0';
        cell.style.zIndex = '1';
        cell.style.background = 'var(--bg2)';
        cell.style.boxShadow = '2px 0 8px rgba(0,0,0,0.2)';
      });
    },

    setupCopyPlanLink() {
      // Permitir copiar enlace directo del plan (doble click en precio)
      document.querySelectorAll('.pg-precio-container').forEach(container => {
        container.style.cursor = 'copy';
        container.title = 'Doble click para copiar enlace de este plan';
        
        container.addEventListener('dblclick', async (e) => {
          e.preventDefault();
          const card = container.closest('.pg-card');
          const planLink = card?.querySelector('.pg-cta')?.href;
          
          if (planLink && await Utils.copyToClipboard(planLink)) {
            // Feedback visual
            const original = container.innerHTML;
            container.innerHTML = '<span style="color:var(--green);font-size:0.8rem">✓ Copiado</span>';
            setTimeout(() => container.innerHTML = original, 1500);
          }
        });
      });
    }
  };

  // ========================================
  // MÓDULO: TESTIMONIALS (Opcional - Carousel)
  // ========================================
  const TestimonialsModule = {
    init() {
      const container = document.querySelector('.pg-testimonials .pgf-grid');
      if (!container) return;

      const items = container.querySelectorAll('.pgf-item');
      if (items.length <= 4) return; // No necesita carousel si caben todos

      // Simple auto-scroll horizontal en mobile
      if (window.innerWidth <= CONFIG.breakpoints.mobile) {
        container.style.overflowX = 'auto';
        container.style.scrollSnapType = 'x mandatory';
        container.style.webkitOverflowScrolling = 'touch';
        
        items.forEach(item => {
          item.style.scrollSnapAlign = 'start';
          item.style.minWidth = '85%';
          item.style.marginRight = '1rem';
        });

        // Indicadores de scroll
        const indicators = document.createElement('div');
        indicators.className = 'pg-testimonial-indicators';
        indicators.style.cssText = 'display:flex;gap:0.3rem;justify-content:center;margin-top:1rem;';
        items.forEach((_, i) => {
          const dot = document.createElement('span');
          dot.style.cssText = `width:8px;height:8px;border-radius:50%;background:${i===0?'var(--green)':'var(--border)'};transition:background 0.2s;`;
          indicators.appendChild(dot);
        });
        container.parentNode.insertBefore(indicators, container.nextSibling);

        // Actualizar indicadores al scroll
        container.addEventListener('scroll', Utils.debounce(() => {
          const scrollPos = container.scrollLeft / (container.scrollWidth - container.clientWidth);
          const dots = indicators.children;
          Array.from(dots).forEach((dot, i) => {
            const active = Math.round(scrollPos * (dots.length - 1)) === i;
            dot.style.background = active ? 'var(--green)' : 'var(--border)';
          });
        }, 100));
      }
    }
  };

  // ========================================
  // MÓDULO: TRUST BADGES HOVER
  // ========================================
  const TrustBadgesModule = {
    init() {
      document.querySelectorAll('.ptb-item').forEach(badge => {
        badge.addEventListener('mouseenter', function() {
          if (CONFIG.reducedMotion) return;
          this.style.transform = 'translateY(-2px)';
          this.style.transition = 'transform 0.2s ease';
        });
        badge.addEventListener('mouseleave', function() {
          this.style.transform = '';
        });
      });
    }
  };

  // ========================================
  // MÓDULO: PAYMENT METHODS ANIMATION
  // ========================================
  const PaymentModule = {
    init() {
      const icons = document.querySelectorAll('.ppm-icon');
      
      // Efecto secuencial al entrar en viewport
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            icons.forEach((icon, i) => {
              setTimeout(() => {
                icon.style.opacity = '1';
                icon.style.transform = 'translateY(0)';
              }, i * 80);
            });
            observer.disconnect();
          }
        },
        { threshold: 0.3 }
      );

      const section = document.querySelector('.pg-payment-methods');
      if (section) {
        icons.forEach(icon => {
          icon.style.opacity = '0';
          icon.style.transform = 'translateY(10px)';
          icon.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        });
        observer.observe(section);
      }
    }
  };

  // ========================================
  // MÓDULO: EXIT INTENT (Opcional - Lead Capture)
  // ========================================
  const ExitIntentModule = {
    triggered: false,

    init() {
      // Solo en desktop y si no se ha mostrado antes
      if (window.innerWidth <= CONFIG.breakpoints.tablet) return;
      if (sessionStorage.getItem('exitIntentShown')) return;

      document.addEventListener('mouseleave', (e) => {
        if (e.clientY <= 0 && !this.triggered) {
          this.triggered = true;
          this.showModal();
        }
      });
    },

    showModal() {
      // Modal simple de "¿Necesitas ayuda para elegir?"
      const modal = document.createElement('div');
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.style.cssText = `
        position:fixed;inset:0;background:rgba(0,0,0,0.8);display:flex;
        align-items:center;justify-content:center;z-index:1000;padding:1rem;
      `;
      modal.innerHTML = `
        <div style="background:var(--bg2);border:1px solid var(--border-green);
          border-radius:var(--radius);padding:2rem;max-width:400px;text-align:center;
          box-shadow:var(--shadow-lg);animation:${CONFIG.reducedMotion?'':'fadeUp 0.3s ease'}">
          <div style="font-size:2rem;margin-bottom:1rem">🤔</div>
          <h3 style="font-family:var(--font-display);font-size:1.3rem;margin-bottom:0.5rem">
            ¿Necesitas ayuda para elegir?
          </h3>
          <p style="color:var(--text-muted);font-size:0.9rem;margin-bottom:1.5rem">
            Nuestros especialistas te asesoran gratis para encontrar el plan perfecto.
          </p>
          <a href="../../../../modules/shared/pages/contacto/" 
             style="display:inline-block;background:var(--green);color:#000;
             padding:0.8rem 2rem;border-radius:8px;font-weight:600;text-decoration:none">
            Hablar con un experto →
          </a>
          <button id="exitIntentClose" 
                  style="display:block;margin:1rem auto 0;background:none;border:none;
                  color:var(--text-muted);font-size:0.8rem;cursor:pointer">
            No, gracias
          </button>
        </div>
      `;

      const close = () => {
        modal.style.opacity = '0';
        modal.style.transition = 'opacity 0.2s ease';
        setTimeout(() => modal.remove(), 200);
        sessionStorage.setItem('exitIntentShown', 'true');
      };

      modal.querySelector('#exitIntentClose').addEventListener('click', close);
      modal.addEventListener('click', (e) => {
        if (e.target === modal) close();
      });

      document.body.appendChild(modal);
      
      // Analytics
      if (typeof gtag === 'function') {
        gtag('event', 'exit_intent_show', { event_category: 'Garantia' });
      }
    }
  };

  // ========================================
  // MÓDULO: SMOOTH SCROLL + ANCHOR TRACKING
  // ========================================
  const SmoothScrollModule = {
    init() {
      // Anchors internos
      document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', (e) => {
          const target = document.querySelector(link.getAttribute('href'));
          if (target) {
            e.preventDefault();
            Utils.scrollTo(target, 80);
            history.pushState(null, null, link.getAttribute('href'));
          }
        });
      });

      // Tracking de sección visible para highlight en nav (si se implementa)
      if ('IntersectionObserver' in window) {
        const sections = document.querySelectorAll('section[id]');
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach(entry => {
              if (entry.isIntersecting) {
                // Aquí podrías actualizar el estado activo del nav
                // console.log('Sección visible:', entry.target.id);
              }
            });
          },
          { threshold: 0.4, rootMargin: '-20% 0px -60% 0px' }
        );
        sections.forEach(sec => observer.observe(sec));
      }
    }
  };

  // ========================================
  // MÓDULO: ANALYTICS ENHANCED
  // ========================================
  const AnalyticsModule = {
    trackEvent(category, action, params = {}) {
      if (typeof gtag !== 'function') return;
      gtag('event', action, { event_category: category, ...params });
    },

    init() {
      // CTAs principales
      document.querySelectorAll('.btn-primary, .pg-cta').forEach(btn => {
        btn.addEventListener('click', () => {
          const plan = btn.href?.match(/plan=([^&]+)/)?.[1] || 'unknown';
          const price = btn.closest('.pg-card')?.querySelector('.pg-precio')?.textContent || '0';
          this.trackEvent('Garantia', 'cta_click', { 
            plan, 
            price: parseInt(price.replace(/\D/g,'')),
            location: btn.closest('section')?.className || 'unknown'
          });
        });
      });

      // FAQ interactions
      document.querySelectorAll('.faq-q, .pg-faq .pgf-item').forEach(el => {
        el.addEventListener('click', () => {
          const question = el.textContent?.trim().substring(0, 60) || 'unknown';
          this.trackEvent('Garantia', 'faq_interaction', { question });
        });
      });

      // Plan card views (cuando entran en viewport)
      if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach(entry => {
              if (entry.isIntersecting) {
                const plan = entry.target.querySelector('.pg-nombre')?.textContent || 'unknown';
                this.trackEvent('Garantia', 'plan_view', { plan });
                observer.unobserve(entry.target);
              }
            });
          },
          { threshold: 0.5 }
        );
        document.querySelectorAll('.pg-card').forEach(card => observer.observe(card));
      }

      // Copy plan link
      document.querySelectorAll('.pg-precio-container').forEach(el => {
        el.addEventListener('dblclick', () => {
          this.trackEvent('Garantia', 'plan_link_copy', {});
        });
      });
    }
  };

  // ========================================
  // MÓDULO: FORM HINTS + PLAN SELECTION
  // ========================================
  const FormHintsModule = {
    init() {
      // Si hay parámetro de plan, preparar para formulario de solicitud
      const plan = new URLSearchParams(window.location.search).get('plan');
      if (!plan) return;

      // Guardar en sessionStorage para que el formulario lo use
      sessionStorage.setItem('selectedPlan', plan);
      
      // Mostrar mensaje contextual si estamos en la página de solicitud
      if (window.location.pathname.includes('solicitud')) {
        const form = document.querySelector('form');
        if (form) {
          const notice = document.createElement('div');
          notice.style.cssText = 'background:rgba(37,211,102,0.1);border:1px solid var(--border-green);border-radius:8px;padding:1rem;margin-bottom:1.5rem;font-size:0.9rem;color:var(--text)';
          notice.innerHTML = `✓ Plan <strong>${plan}</strong> seleccionado. <a href="#" onclick="this.parentElement.remove();return false" style="color:var(--green);margin-left:0.5rem">Cambiar</a>`;
          form.insertBefore(notice, form.firstChild);
        }
      }
    }
  };

  // ========================================
  // MÓDULO: PERFORMANCE + CORE WEB VITALS
  // ========================================
  const PerformanceModule = {
    init() {
      // LCP (Largest Contentful Paint)
      if ('PerformanceObserver' in window) {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lcp = entries[entries.length - 1];
          // console.log(`📊 LCP: ${lcp?.startTime.toFixed(0)}ms`);
          
          // Enviar a analytics si está configurado
          if (typeof gtag === 'function' && lcp) {
            gtag('event', 'performance', {
              event_category: 'CoreWebVitals',
              event_label: 'LCP',
              value: Math.round(lcp.startTime)
            });
          }
        }).observe({ entryTypes: ['largest-contentful-paint'] });
      }

      // CLS (Cumulative Layout Shift) - detectar shifts
      let clsValue = 0;
      if ('PerformanceObserver' in window) {
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
        }).observe({ entryTypes: ['layout-shift'] });
      }

      // FID simulado (First Input Delay)
      let fid = null;
      const onInput = (e) => {
        fid = performance.now() - e.timeStamp;
        // console.log(`📊 FID: ${fid.toFixed(0)}ms`);
        document.removeEventListener('click', onInput, true);
        document.removeEventListener('touchstart', onInput, true);
      };
      document.addEventListener('click', onInput, { capture: true, once: true });
      document.addEventListener('touchstart', onInput, { capture: true, once: true });
    }
  };

  // ========================================
  // MÓDULO: KEYBOARD NAVIGATION GLOBAL
  // ========================================
  const KeyboardNavModule = {
    init() {
      // Navegación con flechas entre tarjetas de planes
      document.addEventListener('keydown', (e) => {
        if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
        
        const active = document.activeElement;
        const isPlanCard = active?.closest('.pg-card');
        if (!isPlanCard) return;

        e.preventDefault();
        const cards = Array.from(document.querySelectorAll('.pg-card'));
        const currentIdx = cards.indexOf(isPlanCard);
        const nextIdx = e.key === 'ArrowRight' ? currentIdx + 1 : currentIdx - 1;
        const nextCard = cards[nextIdx];
        
        if (nextCard) {
          nextCard.querySelector('.pg-cta')?.focus();
          Utils.scrollTo(nextCard, 100);
        }
      });

      // Escape para cerrar modales o tooltips
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          document.querySelectorAll('[role="dialog"]').forEach(modal => modal.remove());
        }
      });
    }
  };

  // ========================================
  // INICIALIZACIÓN PRINCIPAL
  // ========================================
  const App = {
    modules: [
      NavModule,
      RevealModule,
      FAQModule,
      CounterModule,
      PlansModule,
      TestimonialsModule,
      TrustBadgesModule,
      PaymentModule,
      ExitIntentModule,
      SmoothScrollModule,
      AnalyticsModule,
      FormHintsModule,
      PerformanceModule,
      KeyboardNavModule
    ],

    init() {
      console.log('🚀 DesbanWA Garantía PRO Module initialized');
      
      // Inicializar módulos con error handling
      this.modules.forEach(module => {
        try {
          module.init?.();
        } catch (error) {
          console.error(`❌ Error en módulo ${module.constructor?.name || 'unknown'}:`, error);
          // No detener la ejecución por un módulo fallido
        }
      });

      // Cleanup en unload
      window.addEventListener('beforeunload', () => this.destroy(), { once: true });
    },

    destroy() {
      // Limpieza de observers para evitar memory leaks
      RevealModule.destroy?.();
      
      // Remover event listeners globales si es necesario
      // (implementar según necesidad)
    }
  };

  // ========================================
  // BOOTSTRAP
  // ========================================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init(), { once: true });
  } else {
    App.init();
  }

  // Debug global en desarrollo
  if (window.location.hostname === 'localhost') {
    window.DesbanWA = { App, CONFIG, Utils, Modules: {
      Plans: PlansModule,
      FAQ: FAQModule,
      Analytics: AnalyticsModule
    }};
    console.log('🔧 Debug mode: window.DesbanWA disponible');
  }

})();