// Projects Page Interactive Animations & Logic (Resilient & Fault-Isolated)
(function () {
  'use strict';

  function initProjectsPage() {
    const cards = document.querySelectorAll('.project-card');
    if (!cards.length) return;

    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 1. Intersection Observer for Scroll Entrance Animations
    if (!prefersReducedMotion && 'IntersectionObserver' in window) {
      try {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
              setTimeout(() => {
                entry.target.classList.add('in-view');
              }, index * 80);
              observer.unobserve(entry.target);
            }
          });
        }, {
          root: null,
          threshold: 0.05,
          rootMargin: '100px 0px 40px 0px'
        });

        cards.forEach(card => observer.observe(card));
      } catch (e) {
        cards.forEach(card => card.classList.add('in-view'));
      }
    } else {
      cards.forEach(card => card.classList.add('in-view'));
    }

    // Safety fallback: reveal all project cards within 500ms
    setTimeout(() => {
      cards.forEach(card => card.classList.add('in-view'));
    }, 500);

    // 2. Subtle 3D Mouse Parallax on Desktop
    const isPointerDevice = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    if (isPointerDevice && !prefersReducedMotion) {
      cards.forEach(card => {
        const img = card.querySelector('.project-card-img');
        const body = card.querySelector('.project-card-body');
        let rafId = null;

        card.addEventListener('mousemove', (e) => {
          if (rafId) cancelAnimationFrame(rafId);
          rafId = requestAnimationFrame(() => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = ((y - centerY) / centerY) * -2.5;
            const rotateY = ((x - centerX) / centerX) * 2.5;

            const moveX = ((x - centerX) / centerX) * -4;
            const moveY = ((y - centerY) / centerY) * -4;

            card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-5px)`;
            if (img) {
              img.style.transform = `scale(1.035) translate3d(${moveX.toFixed(1)}px, ${moveY.toFixed(1)}px, 0)`;
            }
            if (body) {
              body.style.transform = `translateZ(8px)`;
            }
          });
        }, { passive: true });

        card.addEventListener('mouseleave', () => {
          if (rafId) cancelAnimationFrame(rafId);
          card.style.transform = '';
          if (img) img.style.transform = '';
          if (body) body.style.transform = '';
        }, { passive: true });
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProjectsPage);
  } else {
    initProjectsPage();
  }
})();

// 3. Smooth Project Filter Functionality
function filterProjects(category, btn) {
  const buttons = document.querySelectorAll('.filter-btn');
  buttons.forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  const cards = document.querySelectorAll('.project-card');
  cards.forEach(card => {
    const cardCat = card.getAttribute('data-category');
    if (category === 'all' || cardCat === category) {
      card.classList.remove('filter-hide');
      card.classList.add('filter-show');
    } else {
      card.classList.remove('filter-show');
      card.classList.add('filter-hide');
    }
  });
}