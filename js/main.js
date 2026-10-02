(() => {
  document.documentElement.classList.add('js');

  // Sticky header state
  const header = document.querySelector('.site-header');
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 12);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Collapse mobile nav after choosing a link
  document.querySelectorAll('#primaryNav a').forEach((link) => {
    link.addEventListener('click', () => {
      const nav = document.getElementById('primaryNav');
      if (nav.classList.contains('show') && window.bootstrap) {
        window.bootstrap.Collapse.getOrCreateInstance(nav).hide();
      }
    });
  });

  // Highlight the nav link for the section in view
  const navLinks = [...document.querySelectorAll('.navbar .nav-link')];
  const sections = navLinks
    .map((l) => document.querySelector(l.getAttribute('href')))
    .filter(Boolean);
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((l) => {
        const on = l.getAttribute('href') === `#${entry.target.id}`;
        l.classList.toggle('active', on);
        if (on) l.setAttribute('aria-current', 'page'); else l.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach((s) => spy.observe(s));

  // Reveal on scroll (CSS disables motion under prefers-reduced-motion)
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
          // drop the stagger delay once revealed so it doesn't lag parallax
          setTimeout(() => { entry.target.style.transitionDelay = ''; }, 900);
        }
      });
    }, { threshold: 0.12 });
    reveals.forEach((el, i) => {
      el.style.transitionDelay = `${(i % 3) * 60}ms`;
      io.observe(el);
    });
  } else {
    reveals.forEach((el) => el.classList.add('is-visible'));
  }

  // Inquiry form: client-side validation only (no backend wired up yet)
  const form = document.getElementById('inquiryForm');
  const status = document.getElementById('formStatus');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fields = [...form.querySelectorAll('[required]')];
    let firstInvalid = null;
    fields.forEach((f) => {
      const ok = f.checkValidity();
      f.classList.toggle('is-invalid', !ok);
      f.setAttribute('aria-invalid', String(!ok));
      if (!ok && !firstInvalid) firstInvalid = f;
    });
    if (firstInvalid) {
      status.textContent = 'Please fix the highlighted fields.';
      firstInvalid.focus();
      return;
    }
    // TODO: connect to email service / form handler
    status.textContent = 'Thanks. We’ll be in touch shortly.';
    form.reset();
  });
  form.querySelectorAll('[required]').forEach((f) =>
    f.addEventListener('blur', () => {
      if (f.value) f.classList.toggle('is-invalid', !f.checkValidity());
    })
  );

  // Cursor parallax: [data-parallax="N"] drifts up to N px opposite the cursor.
  // JS only sets the target (max once per frame); the CSS translate transition
  // does the easing on the compositor. Mouse/trackpad only; off under reduced motion.
  const layers = [...document.querySelectorAll('[data-parallax]')];
  const canParallax = matchMedia('(hover: hover) and (pointer: fine)').matches &&
    !matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (layers.length && canParallax) {
    const depth = layers.map((el) => parseFloat(el.dataset.parallax) || 0);
    let tx = 0, ty = 0, raf = 0;
    const apply = () => {
      raf = 0;
      layers.forEach((el, i) => {
        el.style.translate = `${(-tx * depth[i]).toFixed(1)}px ${(-ty * depth[i]).toFixed(1)}px`;
      });
    };
    const aim = (x, y) => {
      tx = x; ty = y;
      if (!raf) raf = requestAnimationFrame(apply);
    };
    window.addEventListener('mousemove', (e) => {
      aim((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
    }, { passive: true });
    document.documentElement.addEventListener('mouseleave', () => aim(0, 0));
  }

  document.getElementById('year').textContent = new Date().getFullYear();
})();
