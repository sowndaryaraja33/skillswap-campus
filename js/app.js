/* ============================================================
   SkillSwap Campus — Core App Logic
   Auth state · Navbar · Scroll · Reveal · Toast
   ============================================================ */

// ── Auth helpers ─────────────────────────────────────────────
const Auth = {
  key: 'skillswap_user',

  getUser() {
    try { return JSON.parse(localStorage.getItem(this.key)); }
    catch { return null; }
  },

  setUser(data) {
    localStorage.setItem(this.key, JSON.stringify(data));
  },

  logout() {
    localStorage.removeItem(this.key);
    window.location.href = 'index.html';
  },

  isLoggedIn() {
    return !!this.getUser();
  },
};

// ── DOM Ready ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initAuthState();
  initReveal();
  initMobileNav();
  initScrollHighlight();
  animateCounters();
});

// ── Navbar scroll effect ─────────────────────────────────────
function initNavbar() {
  const nav = document.querySelector('.navbar');
  if (!nav) return;

  function onScroll() {
    nav.classList.toggle('scrolled', window.scrollY > 20);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

// ── Auth state → show/hide nav elements ─────────────────────
function initAuthState() {
  const user = Auth.getUser();
  const guestEl = document.querySelectorAll('[data-nav="guest"]');
  const userEl = document.querySelectorAll('[data-nav="user"]');
  const avatarEls = document.querySelectorAll('[data-user-avatar]');

  if (user) {
    guestEl.forEach(el => el.classList.add('hidden'));
    userEl.forEach(el => el.classList.remove('hidden'));
    const initials = getInitials(user.name || user.email || 'U');
    avatarEls.forEach(el => { el.textContent = initials; });
  } else {
    guestEl.forEach(el => el.classList.remove('hidden'));
    userEl.forEach(el => el.classList.add('hidden'));
  }

  // Logout buttons
  document.querySelectorAll('[data-action="logout"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      Auth.logout();
    });
  });
}

function getInitials(name) {
  return name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

// ── Mobile nav toggle ────────────────────────────────────────
function initMobileNav() {
  const toggle = document.querySelector('.nav-toggle');
  const mobileNav = document.getElementById('mobile-nav');
  if (!toggle || !mobileNav) return;

  toggle.addEventListener('click', () => {
    mobileNav.classList.toggle('open');
    const isOpen = mobileNav.classList.contains('open');
    toggle.setAttribute('aria-expanded', isOpen);
  });

  // Close on link click
  mobileNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => mobileNav.classList.remove('open'));
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!toggle.contains(e.target) && !mobileNav.contains(e.target)) {
      mobileNav.classList.remove('open');
    }
  });
}

// ── Reveal on scroll ─────────────────────────────────────────
function initReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  els.forEach(el => observer.observe(el));
}

// ── Active nav link by scroll position ───────────────────────
function initScrollHighlight() {
  const sections = document.querySelectorAll('section[id]');
  const links = document.querySelectorAll('.nav-link[href*="#"]');
  if (!sections.length || !links.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = '#' + entry.target.id;
          links.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href').endsWith(id));
          });
        }
      });
    },
    { threshold: 0.4 }
  );

  sections.forEach(s => observer.observe(s));
}

// ── Counter animation ────────────────────────────────────────
function animateCounters() {
  const counters = document.querySelectorAll('.stat-value');
  if (!counters.length) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const rawText = el.textContent.trim();
      const numMatch = rawText.match(/[\d,]+/);
      if (!numMatch) return;

      const target = parseInt(numMatch[0].replace(/,/g, ''), 10);
      const suffix = rawText.replace(numMatch[0], '');
      const duration = 1600;
      const start = performance.now();

      function tick(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(target * ease);
        el.textContent = current.toLocaleString() + suffix;
        if (progress < 1) requestAnimationFrame(tick);
      }

      requestAnimationFrame(tick);
      observer.unobserve(el);
    });
  }, { threshold: 0.5 });

  counters.forEach(c => observer.observe(c));
}

// ── Toast system ─────────────────────────────────────────────
const Toast = {
  container: null,

  _getContainer() {
    if (this.container) return this.container;
    this.container = document.createElement('div');
    this.container.id = 'toast-container';
    this.container.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
    `;
    document.body.appendChild(this.container);
    return this.container;
  },

  show(message, type = 'info', duration = 3500) {
    const container = this._getContainer();
    const toast = document.createElement('div');

    const colors = {
      info:    { bg: 'rgba(99,102,241,0.15)',  border: 'rgba(99,102,241,0.3)',  color: '#a5b4fc' },
      success: { bg: 'rgba(34,197,94,0.12)',   border: 'rgba(34,197,94,0.25)', color: '#4ade80' },
      error:   { bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.3)',  color: '#f87171' },
      warning: { bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.3)', color: '#fbbf24' },
    };

    const c = colors[type] || colors.info;
    toast.style.cssText = `
      background: ${c.bg};
      border: 1px solid ${c.border};
      color: ${c.color};
      padding: 12px 18px;
      border-radius: 12px;
      font-size: 0.88rem;
      font-weight: 500;
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      pointer-events: auto;
      transform: translateX(100px);
      opacity: 0;
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      max-width: 320px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      font-family: 'Inter', system-ui, sans-serif;
    `;
    toast.textContent = message;
    container.appendChild(toast);

    requestAnimationFrame(() => {
      toast.style.transform = 'translateX(0)';
      toast.style.opacity = '1';
    });

    setTimeout(() => {
      toast.style.transform = 'translateX(100px)';
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },
};

// ── Form validation helpers ──────────────────────────────────
const Form = {
  setError(fieldEl, message) {
    fieldEl.classList.add('error');
    const errEl = fieldEl.querySelector('.field-error');
    if (errEl) errEl.textContent = message;
  },

  clearError(fieldEl) {
    fieldEl.classList.remove('error');
  },

  clearAll(formEl) {
    formEl.querySelectorAll('.field').forEach(f => this.clearError(f));
    const alert = formEl.querySelector('.alert');
    if (alert) alert.classList.remove('show');
  },

  showAlert(formEl, message, type = 'error') {
    const alert = formEl.querySelector('.alert');
    if (!alert) return;
    alert.className = `alert alert-${type} show`;
    alert.textContent = message;
  },

  validate(rules) {
    let valid = true;
    rules.forEach(({ field, value, checks }) => {
      for (const check of checks) {
        const err = check(value);
        if (err) {
          this.setError(field, err);
          valid = false;
          break;
        } else {
          this.clearError(field);
        }
      }
    });
    return valid;
  },
};

// ── Password visibility toggle ───────────────────────────────
document.querySelectorAll('.toggle-visibility').forEach(btn => {
  btn.addEventListener('click', () => {
    const wrap = btn.closest('.input-wrap');
    const input = wrap.querySelector('input');
    if (!input) return;
    const isHidden = input.type === 'password';
    input.type = isHidden ? 'text' : 'password';
    btn.innerHTML = isHidden
      ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`
      : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
  });
});

// ── Password strength meter ──────────────────────────────────
function initPasswordStrength(inputEl, containerEl) {
  if (!inputEl || !containerEl) return;

  const segments = containerEl.querySelectorAll('.strength-segment');
  const label = containerEl.querySelector('.strength-label');

  inputEl.addEventListener('input', () => {
    const val = inputEl.value;
    let score = 0;
    if (val.length >= 8) score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;

    const levels = [
      { class: '', text: '' },
      { class: 'active-weak', text: 'Weak' },
      { class: 'active-fair', text: 'Fair' },
      { class: 'active-strong', text: 'Good' },
      { class: 'active-strong', text: 'Strong' },
    ];

    segments.forEach((seg, i) => {
      seg.className = 'strength-segment';
      if (i < score && score > 0) seg.classList.add(levels[score].class);
    });

    if (label) label.textContent = val.length > 0 ? levels[score].text : '';
  });
}

// Export globals for use in page scripts
window.Auth = Auth;
window.Toast = Toast;
window.Form = Form;
window.getInitials = getInitials;
window.initPasswordStrength = initPasswordStrength;
