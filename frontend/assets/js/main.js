/**
 * main.js - LODEV motion layer.
 * GSAP + ScrollTrigger for hero, manifesto, process, and drag-to-scroll rails.
 */
(function () {
  'use strict';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (typeof gsap === 'undefined') {
    return;
  }

  if (typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
  }

  if (prefersReduced) {
    document.querySelectorAll('.hero-word').forEach((w) => w.classList.add('is-revealed'));
    return;
  }

  /* ============================================================
     1. Hero - words animate via pure CSS now (see base.css).
     JS only adds the .is-revealed class to mark completion and
     to handle subhead / CTAs / stats with explicit fromTo +
     clearProps so inline styles never get stuck.
     ============================================================ */
  function initHero() {
    const words = document.querySelectorAll('.hero-word');
    if (!words.length) return;

    // Mark the words as revealed so any class-based fallbacks engage
    // (CSS already animates the transform; this is just a marker).
    words.forEach((w, i) => {
      setTimeout(() => w.classList.add('is-revealed'), 200 + i * 100);
    });

    const sub = document.querySelector('.hero-sub');
    const ctas = document.querySelectorAll('.hero-ctas > *');
    const stats = document.querySelectorAll('.hero-stats > *');

    if (sub) {
      gsap.fromTo(sub,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, delay: 0.9, ease: 'expo.out', clearProps: 'transform,opacity' }
      );
    }

    if (ctas.length) {
      gsap.fromTo(ctas,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, delay: 1.1, ease: 'expo.out', stagger: 0.08, clearProps: 'transform,opacity' }
      );
    }

    if (stats.length) {
      gsap.fromTo(stats,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, delay: 1.3, ease: 'expo.out', stagger: 0.1, clearProps: 'transform,opacity' }
      );
    }
  }

  /* ============================================================
     2. Hero background fade-in
     ============================================================ */
  function initHeroBg() {
    const bg = document.querySelector('.hero-bg');
    if (!bg) return;
    gsap.fromTo(bg,
      { scale: 1.08, opacity: 0 },
      { scale: 1, opacity: 0.35, duration: 2.5, ease: 'power2.out' }
    );
  }

  /* ============================================================
     3. Manifesto scrub text reveal (gpt-taste)
     Each word starts at opacity 0.1. As the user scrolls, opacity
     scrubs to 1.0 sequentially — the next word doesn't start
     revealing until the previous one has nearly finished.
     ============================================================ */
  function initManifesto() {
    if (typeof ScrollTrigger === 'undefined') return;

    const words = document.querySelectorAll('.manifesto-word .word');
    if (!words.length) return;

    // Set the initial dimmed state (the words "exist" but are barely visible)
    gsap.set(words, { opacity: 0.1 });

    // Each word has its own ScrollTrigger with stagger built into
    // the start/end values. As the user scrolls, the first word
    // reaches opacity 1.0 first, then the second, then the third, etc.
    words.forEach((word, i) => {
      gsap.to(word, {
        opacity: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: '.manifesto',
          start: `top ${90 - i * 8}%`,
          end:   `top ${50 - i * 8}%`,
          scrub: true,
        },
      });
    });
  }

  /* ============================================================
     4. Process step reveal
     ============================================================ */
  function initProcess() {
    if (typeof ScrollTrigger === 'undefined') return;
    const steps = document.querySelectorAll('.process-step');
    steps.forEach((step) => {
      const num = step.querySelector('.process-step-num');
      const title = step.querySelector('.process-step-title');
      const text = step.querySelector('.process-step-text');

      const tl = gsap.timeline({
        scrollTrigger: { trigger: step, start: 'top 85%' },
        defaults: { ease: 'expo.out', duration: 0.7 },
      });

      if (num) tl.from(num, { y: 20, opacity: 0 }, 0);
      if (title) tl.from(title, { y: 20, opacity: 0 }, 0.05);
      if (text) tl.from(text, { y: 16, opacity: 0 }, 0.15);
    });
  }

  /* ============================================================
     5. Testimonial bubbles reveal
     ============================================================ */
  function initTestimonials() {
    if (typeof ScrollTrigger === 'undefined') return;
    const bubbles = document.querySelectorAll('.wa-bubble');
    if (!bubbles.length) return;

    gsap.from(bubbles, {
      y: 30,
      opacity: 0,
      duration: 0.8,
      ease: 'expo.out',
      stagger: 0.1,
      scrollTrigger: {
        trigger: '.testimonials-scroller',
        start: 'top 80%',
      },
    });
  }

  /* ============================================================
     6. h2 scroll reveal (gpt-taste)
     Every h2 fades up + slides into place as it enters the viewport.
     Words inside the h2 reveal sequentially as the user scrolls past
     (opacity scrubs 0.1 → 1.0 with stagger).
     ============================================================ */
  function initH2ScrubReveal() {
    if (typeof ScrollTrigger === 'undefined') return;

    // All h2s in the page
    const headings = document.querySelectorAll('h2');

    headings.forEach((h2) => {
      if (h2.dataset.scrubReady === '1') return;
      h2.dataset.scrubReady = '1';

      // 1) Fade-up the h2 itself when it enters the viewport
      gsap.from(h2, {
        opacity: 0,
        y: 32,
        duration: 0.9,
        ease: 'expo.out',
        scrollTrigger: {
          trigger: h2,
          start: 'top 88%',
          toggleActions: 'play none none reverse',
        },
      });

      // 2) Skip the per-word scrub if the h2 has child structure
      //    (manifesto uses .manifesto-word, hero uses .hero-word, etc.)
      if (h2.querySelector('.bleed, .word, .manifesto-word, .hero-word')) return;

      // 3) Per-word scrub: each word starts at opacity 0.1 and
      //    scrubs to 1.0 sequentially as the user scrolls past.
      const tmp = document.createElement('div');
      tmp.innerHTML = h2.innerHTML;
      const text = tmp.textContent.trim();
      if (!text) return;

      const words = text.split(/\s+/);
      h2.innerHTML = '';
      const spans = [];
      words.forEach((word) => {
        const span = document.createElement('span');
        span.textContent = word + ' ';
        span.style.opacity = '0.1';
        span.style.display = 'inline-block';
        span.style.willChange = 'opacity';
        h2.appendChild(span);
        spans.push(span);
      });

      spans.forEach((span, i) => {
        gsap.to(span, {
          opacity: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: h2,
            start: `top ${90 - i * 4}%`,
            end: `top ${60 - i * 4}%`,
            scrub: true,
          },
        });
      });
    });
  }

  /* ============================================================
     7. Project card enter animation
     Fade up as the card enters the viewport
     ============================================================ */
  function initProjectEnter() {
    if (typeof ScrollTrigger === 'undefined') return;
    const cards = document.querySelectorAll('.project-scene');
    if (!cards.length) return;

    cards.forEach((card, i) => {
      gsap.from(card, {
        opacity: 0,
        y: 40,
        scale: 0.96,
        duration: 0.9,
        delay: (i % 3) * 0.1,
        ease: 'expo.out',
        scrollTrigger: {
          trigger: card,
          start: 'top 88%',
          toggleActions: 'play none none reverse',
        },
      });
    });
  }

  /* ============================================================
     8. Testimonial card enter animation
     ============================================================ */
  function initTestimonialEnter() {
    if (typeof ScrollTrigger === 'undefined') return;
    const cards = document.querySelectorAll('.testimonials-track .wa-bubble');
    if (!cards.length) return;

    cards.forEach((card, i) => {
      gsap.from(card, {
        opacity: 0,
        y: 40,
        scale: 0.96,
        duration: 0.8,
        delay: (i % 3) * 0.08,
        ease: 'expo.out',
        scrollTrigger: {
          trigger: card,
          start: 'top 88%',
          toggleActions: 'play none none reverse',
        },
      });
    });
  }

  /* ============================================================
     6. Drag-to-scroll for showcase and testimonials
     ============================================================ */
  function initDragScroll() {
    const scrollers = document.querySelectorAll('[data-showcase-scroller], [data-testimonials-scroller]');
    scrollers.forEach((scroller) => {
      let isDown = false;
      let startX = 0;
      let scrollLeft = 0;
      let moved = false;

      scroller.addEventListener('mousedown', (e) => {
        isDown = true;
        scroller.classList.add('is-dragging');
        startX = e.pageX - scroller.offsetLeft;
        scrollLeft = scroller.scrollLeft;
        moved = false;
      });

      scroller.addEventListener('mouseleave', () => {
        isDown = false;
        scroller.classList.remove('is-dragging');
      });

      scroller.addEventListener('mouseup', () => {
        isDown = false;
        scroller.classList.remove('is-dragging');
      });

      scroller.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - scroller.offsetLeft;
        const walk = (x - startX) * 1.5;
        if (Math.abs(walk) > 5) moved = true;
        scroller.scrollLeft = scrollLeft - walk;
      });

      // Block link clicks that resulted from a drag
      scroller.querySelectorAll('a').forEach((a) => {
        a.addEventListener('click', (e) => {
          if (moved) {
            e.preventDefault();
          }
        });
      });
    });
  }

  /* ============================================================
     9. Hero stat counter-up (GSAP ScrollTrigger)
     Each .hero-stat-num counts from 0 to its final value when
     the hero enters the viewport. Final values are read from the
     existing DOM (no hardcoded values, no localhost URLs).
     ============================================================ */
  function initStatCounters() {
    if (typeof ScrollTrigger === 'undefined') return;

    const stats = document.querySelectorAll('.hero-stat-num');
    if (!stats.length) return;

    // Collect targets: read final value from DOM, reset display to 0.
    const targets = [];
    stats.forEach((el) => {
      const finalValue = parseInt(el.textContent.trim(), 10);
      if (isNaN(finalValue)) return;
      targets.push({ el, finalValue });
      el.textContent = '0';
    });

    if (!targets.length) return;

    // Fire once when the hero enters the viewport. Each stat gets
    // its own tween of a { val: 0 } proxy that counts up to 1;
    // onUpdate multiplies the final value by the current ratio.
    ScrollTrigger.create({
      trigger: '.hero',
      start: 'top 70%',
      once: true,
      onEnter: () => {
        targets.forEach((t, i) => {
          const counter = { val: 0 };
          gsap.to(counter, {
            val: 1,
            duration: 1.8,
            delay: i * 0.12,
            ease: 'power2.out',
            onUpdate: () => {
              t.el.textContent = Math.round(t.finalValue * counter.val);
            },
            onComplete: () => {
              t.el.textContent = t.finalValue;
            },
          });
        });
      },
    });
  }

  /* ============================================================
     Init
     ============================================================ */
  function init() {
    initHero();
    initHeroBg();
    initManifesto();
    initProcess();
    initH2ScrubReveal();
    initProjectEnter();
    initStatCounters();
    initDragScroll();

    if (typeof ScrollTrigger !== 'undefined') {
      ScrollTrigger.refresh();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
