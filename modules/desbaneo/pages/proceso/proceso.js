// FAQ Accordion
const faqQuestions = document.querySelectorAll('.faq-question');

faqQuestions.forEach(question => {
  question.addEventListener('click', () => {
    const expanded = question.getAttribute('aria-expanded') === 'true';
    const answer = question.nextElementSibling;
    
    // Close all
    faqQuestions.forEach(q => {
      q.setAttribute('aria-expanded', 'false');
      q.nextElementSibling.hidden = true;
    });
    
    // Open clicked if was closed
    if (!expanded) {
      question.setAttribute('aria-expanded', 'true');
      answer.hidden = false;
    }
  });
});

// Nav scroll effect
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 50);
}, { passive: true });

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// Animation on scroll
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

// Observe elements
document.querySelectorAll('.step-card, .timeline-item, .faq-item').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(20px)';
  el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  observer.observe(el);
});

// Add visible class styles
document.head.insertAdjacentHTML('beforeend', `
  <style>
    .step-card.visible,
    .timeline-item.visible,
    .faq-item.visible {
      opacity: 1 !important;
      transform: translateY(0) !important;
    }
  </style>
`);

// Track CTA clicks
document.querySelectorAll('.btn-primary, .plan-cta').forEach(cta => {
  cta.addEventListener('click', function() {
    // Analytics
    if (typeof gtag === 'function') {
      gtag('event', 'cta_click', {
        event_category: 'Proceso',
        event_label: this.textContent.trim()
      });
    }
    
    console.log('CTA clicked:', this.textContent.trim());
  });
});

// Track FAQ interactions
document.querySelectorAll('.faq-question').forEach(faq => {
  faq.addEventListener('click', function() {
    const question = this.textContent.trim();
    
    if (typeof gtag === 'function') {
      gtag('event', 'faq_expand', {
        event_category: 'Proceso',
        event_label: question
      });
    }
  });
});