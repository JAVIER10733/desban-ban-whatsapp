// Toggle Personal / Business
const toggleBtns = document.querySelectorAll('.toggle-btn');
const planCards = document.querySelectorAll('.plan-card');

toggleBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const type = btn.dataset.type;
    
    // Update active button
    toggleBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    // Filter plans with animation
    planCards.forEach(card => {
      const cardType = card.dataset.type;
      
      if (cardType === type) {
        card.style.display = 'flex';
        setTimeout(() => {
          card.style.opacity = '1';
          card.style.transform = 'scale(1)';
        }, 50);
      } else {
        card.style.opacity = '0';
        card.style.transform = 'scale(0.9)';
        setTimeout(() => {
          card.style.display = 'none';
        }, 300);
      }
    });
  });
});

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

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// Track plan selection
document.querySelectorAll('.plan-cta').forEach(cta => {
  cta.addEventListener('click', function() {
    const plan = this.closest('.plan-card').dataset.plan;
    
    // Analytics
    if (typeof gtag === 'function') {
      gtag('event', 'plan_select', {
        event_category: 'Planes',
        event_label: plan
      });
    }
    
    console.log('Plan seleccionado:', plan);
  });
});

// Animation on scroll
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.plan-card, .faq-item').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(20px)';
  el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  observer.observe(el);
});

// Add visible class styles
document.head.insertAdjacentHTML('beforeend', `
  <style>
    .plan-card.visible, .faq-item.visible {
      opacity: 1 !important;
      transform: translateY(0) !important;
    }
  </style>
`);