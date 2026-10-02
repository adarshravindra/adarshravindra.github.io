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

  /* ---------- Work / Reads switch ---------- */

  const switchItems = document.querySelectorAll('.switch-item');

  if (switchItems.length) {
    const panels = {};
    switchItems.forEach((btn) => {
      panels[btn.id] = document.getElementById(btn.getAttribute('aria-controls'));
    });

    const activate = (btn) => {
      if (btn.classList.contains('is-active')) return;
      const next = panels[btn.id];
      const current = Object.values(panels).find((p) => p && !p.hidden);
      if (!next || next === current) return;

      switchItems.forEach((b) => {
        const on = b === btn;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-selected', on ? 'true' : 'false');
      });

      const show = () => {
        if (current) {
          current.hidden = true;
          current.classList.remove('is-switching');
        }
        next.hidden = false;
        next.classList.add('is-switching');

        // Let it paint hidden, then fade in. rAF gives the smooth result, but it
        // is suspended in background tabs — the timer guarantees the panel can
        // never be left stranded at opacity 0.
        let done = false;
        const settle = () => {
          if (done) return;
          done = true;
          next.classList.remove('is-switching');
          reveal(next);   // stagger the rows, same as a scroll reveal
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

    switchItems.forEach((btn) => {
      btn.addEventListener('click', () => activate(btn));
      // left/right arrows move between the two, standard tablist behaviour
      btn.addEventListener('keydown', (e) => {
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
        e.preventDefault();
        const list = Array.from(switchItems);
        const i = list.indexOf(btn);
        const nextBtn = list[(i + (e.key === 'ArrowRight' ? 1 : -1) + list.length) % list.length];
        nextBtn.focus();
        activate(nextBtn);
      });
    });
  }

  /* ---------- Jump table: highlight the section you're in ---------- */

  const tocLinks = Array.from(document.querySelectorAll('.toc-link'));

  if (tocLinks.length) {
    const sections = tocLinks
      .map((a) => document.querySelector(a.getAttribute('href')))
      .filter(Boolean);

    const setActive = (id) => {
      tocLinks.forEach((a) => {
        a.classList.toggle('is-active', a.getAttribute('href') === '#' + id);
      });
    };

    let tocTicking = false;
    const spy = () => {
      tocTicking = false;
      // the section whose top is closest to (but still above) the reading line
      const line = window.innerHeight * 0.3;
      let current = sections[0];
      sections.forEach((s) => {
        if (s.getBoundingClientRect().top <= line) current = s;
      });
      // at the very bottom, always light the last one
      if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 2) {
        current = sections[sections.length - 1];
      }
      if (current) setActive(current.id);
    };

    window.addEventListener('scroll', () => {
      if (!tocTicking) { tocTicking = true; requestAnimationFrame(spy); }
    }, { passive: true });
    window.addEventListener('resize', spy, { passive: true });
    spy();
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
