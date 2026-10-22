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

  if (!('IntersectionObserver' in window)) {
    targets.forEach(reveal);                 // no observer support: show everything
  } else {
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
    sweep();
  }

  /* ---------- Jump table: highlight the section you're in ----------
     Reads the links fresh each run, so when a panel switch swaps one
     table of contents for another the spy follows it.                       */

  const visibleTocLinks = () =>
    Array.from(document.querySelectorAll('.toc nav:not([hidden]) .toc-link'));

  let tocTicking = false;
  const spy = () => {
    tocTicking = false;
    const links = visibleTocLinks();
    if (!links.length) return;

    const sections = links
      .map((a) => document.querySelector(a.getAttribute('href')))
      .filter(Boolean);
    if (!sections.length) return;

    const line = window.innerHeight * 0.3;
    let current = sections[0];
    sections.forEach((s) => {
      if (s.getBoundingClientRect().top <= line) current = s;
    });
    if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 2) {
      current = sections[sections.length - 1];
    }
    links.forEach((a) => {
      a.classList.toggle('is-active', a.getAttribute('href') === '#' + current.id);
    });
  };

  if (document.querySelector('.toc-link')) {
    window.addEventListener('scroll', () => {
      if (!tocTicking) { tocTicking = true; requestAnimationFrame(spy); }
    }, { passive: true });
    window.addEventListener('resize', spy, { passive: true });
    spy();
  }

  /* ---------- Section switches (Work/Research, Main/Annexure) ---------- */

  const switchItems = document.querySelectorAll('.switch-item');

  if (switchItems.length) {
    const panelFor = (btn) => document.getElementById(btn.getAttribute('aria-controls'));

    const activate = (btn) => {
      if (btn.classList.contains('is-active')) return;

      const group = btn.closest('[role="tablist"]');
      const siblings = Array.from(group.querySelectorAll('.switch-item'));
      const next = panelFor(btn);
      const current = siblings.map(panelFor).find((p) => p && !p.hidden);
      if (!next || next === current) return;

      siblings.forEach((b) => {
        const on = b === btn;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-selected', on ? 'true' : 'false');
      });

      // a panel may own a table of contents; swap it with the panel
      document.querySelectorAll('[data-toc-for]').forEach((nav) => {
        nav.hidden = nav.getAttribute('data-toc-for') !== next.id;
      });

      const show = () => {
        if (current) {
          current.hidden = true;
          current.classList.remove('is-switching');
        }
        next.hidden = false;
        next.classList.add('is-switching');

        // rAF gives the smooth result but is suspended in background tabs;
        // the timer guarantees the panel is never stranded at opacity 0.
        let done = false;
        const settle = () => {
          if (done) return;
          done = true;
          next.classList.remove('is-switching');
          reveal(next);
          spy();                              // re-point the jump table
        };
        requestAnimationFrame(() => requestAnimationFrame(settle));
        setTimeout(settle, 80);
      };

      if (current) {
        current.classList.add('is-switching');
        setTimeout(show, 220);
      } else {
        show();
      }
    };

    // A link straight to #sources (inside the Annexure) must open that panel,
    // otherwise the target sits in a hidden panel and the page looks empty.
    const openPanelForHash = () => {
      if (location.hash.length <= 1) return;
      let target;
      try { target = document.querySelector(location.hash); } catch (e) { return; }
      const owner = target && target.closest('[role="tabpanel"]');
      if (!owner || !owner.hidden) return;

      const opener = Array.from(switchItems)
        .find((b) => b.getAttribute('aria-controls') === owner.id);
      if (!opener) return;

      activate(opener);
      setTimeout(() => target.scrollIntoView(), 360);
    };

    openPanelForHash();                       // deep link on arrival
    window.addEventListener('hashchange', openPanelForHash);
    window.addEventListener('load', openPanelForHash);  // hash applied late

    switchItems.forEach((btn) => {
      btn.addEventListener('click', () => activate(btn));
      btn.addEventListener('keydown', (e) => {
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
        e.preventDefault();
        const group = btn.closest('[role="tablist"]');
        const list = Array.from(group.querySelectorAll('.switch-item'));
        const i = list.indexOf(btn);
        const nextBtn = list[(i + (e.key === 'ArrowRight' ? 1 : -1) + list.length) % list.length];
        nextBtn.focus();
        activate(nextBtn);
      });
    });
  }

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
