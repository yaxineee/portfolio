/**
 * nav.js - YAXIS floating glass nav.
 * Mobile burger drawer + nav reveal/hide on hero scroll.
 */
(function () {
  'use strict';

  const nav = document.querySelector('.nav');
  const burger = document.querySelector('.nav-burger');
  const menu = document.getElementById('nav-mobile-menu');

  /* ============================================================
     1. Nav reveal — hidden until user scrolls past the hero.
     Uses IntersectionObserver on the .hero section.
     ============================================================ */
  function initNavReveal() {
    if (!nav) return;
    const hero = document.querySelector('.hero');
    if (!hero) {
      // No hero to observe against: just show the nav.
      nav.classList.add('is-revealed');
      return;
    }

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      // Reduced motion: always visible, no transition.
      nav.classList.add('is-revealed');
      return;
    }

    // Observer fires at threshold [0, 0.5] so we get a callback
    // both when the hero is fully out and when half of it is out.
    // Show the nav as soon as half of the hero has scrolled past.
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.intersectionRatio >= 0.5) {
            // 50%+ of the hero is still visible: user is in the hero. Hide nav.
            nav.classList.remove('is-revealed');
          } else {
            // Less than 50% of hero is visible. Show the nav only if
            // the user has actually scrolled past the hero top
            // (avoids showing the nav when the page first loads).
            const heroRect = entry.boundingClientRect;
            if (heroRect.top < 0) {
              nav.classList.add('is-revealed');
            } else {
              nav.classList.remove('is-revealed');
            }
          }
        });
      },
      {
        threshold: [0, 0.5],
        rootMargin: '0px 0px 0px 0px',
      }
    );

    observer.observe(hero);
  }

  /* ============================================================
     2. Mobile burger drawer
     ============================================================ */
  function initBurger() {
    if (!burger || !menu) return;

    burger.addEventListener('click', () => {
      const open = burger.getAttribute('aria-expanded') === 'true';
      burger.setAttribute('aria-expanded', open ? 'false' : 'true');
      burger.setAttribute('aria-label', open ? 'Open menu' : 'Close menu');
      if (open) {
        menu.setAttribute('hidden', '');
      } else {
        menu.removeAttribute('hidden');
      }
    });

    menu.querySelectorAll('a').forEach((a) => {
      a.addEventListener('click', () => {
        burger.setAttribute('aria-expanded', 'false');
        burger.setAttribute('aria-label', 'Open menu');
        menu.setAttribute('hidden', '');
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') {
        burger.setAttribute('aria-expanded', 'false');
        burger.setAttribute('aria-label', 'Open menu');
        menu.setAttribute('hidden', '');
      }
    });
  }

  /* Init */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initNavReveal();
      initBurger();
    });
  } else {
    initNavReveal();
    initBurger();
  }
})();
