document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Reveal on scroll ----------
     .reveal        — element fades up on its own
     .reveal-group  — direct children fade up one after another

     An IntersectionObserver drives the normal case. A rAF-throttled scroll
     sweep backs it up: IO batches its callbacks, so anything that crosses the
     viewport between deliveries — fast scrolling, or an anchor jump straight
     to #contact — would otherwise stay invisible for good.                   */

  const STAGGER_MS = 90;
  const targets = Array.from(document.querySelectorAll('.reveal, .reveal-group'));

  const reveal = (el) => {
    if (el.dataset.revealed) return;
    el.dataset.revealed = '1';

    if (el.classList.contains('reveal-group')) {
      Array.from(el.children).forEach((child, i) => {
        child.style.animationDelay = (i * STAGGER_MS) + 'ms';
        child.classList.add('is-visible');
      });
    }
    el.classList.add('is-visible');
  };

  // No observer support: show everything rather than hide it.
  if (!('IntersectionObserver' in window)) {
    targets.forEach(reveal);
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        reveal(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

  targets.forEach((el) => observer.observe(el));

  // Safety sweep: anything at or above the fold gets revealed regardless.
  let ticking = false;
  const sweep = () => {
    ticking = false;
    const limit = window.innerHeight * 0.94;
    let remaining = false;

    targets.forEach((el) => {
      if (el.dataset.revealed) return;
      if (el.getBoundingClientRect().top < limit) {
        reveal(el);
        observer.unobserve(el);
      } else {
        remaining = true;
      }
    });

    if (!remaining) window.removeEventListener('scroll', onScrollSweep);
  };

  const onScrollSweep = () => {
    if (!ticking) { ticking = true; requestAnimationFrame(sweep); }
  };

  window.addEventListener('scroll', onScrollSweep, { passive: true });
  window.addEventListener('resize', onScrollSweep, { passive: true });
  sweep();  // catch whatever is already on screen at load

  /* ---------- Nav hairline on scroll ---------- */

  const nav = document.querySelector('.nav');
  if (nav && !nav.classList.contains('scrolled')) {
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- Scroll cue ---------- */

  const scrollCue = document.querySelector('.scroll-cue');
  if (scrollCue) {
    scrollCue.addEventListener('click', () => {
      document.querySelector('#intro')?.scrollIntoView({ behavior: 'smooth' });
    });
  }
});
