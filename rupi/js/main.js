/* ============================================================
   RuPi — Main JavaScript
   ============================================================ */

'use strict';

// ── Utility ──────────────────────────────────────────────────
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

// ── Navigation ───────────────────────────────────────────────
function initNav() {
  const nav = $('.nav');
  if (!nav) return;

  // Scroll behavior
  const onScroll = () => {
    nav.classList.toggle('scrolled', window.scrollY > 20);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Hamburger toggle
  const hamburger = $('.nav-hamburger');
  const mobileMenu = $('.nav-mobile');
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      const open = hamburger.classList.toggle('open');
      mobileMenu.classList.toggle('open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });

    // Close on link click
    $$('.nav-mobile .nav-link').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('open');
        mobileMenu.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  // Active link highlight
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  $$('.nav-link').forEach(link => {
    const href = link.getAttribute('href') || '';
    if (href === currentPath || href.endsWith(currentPath)) {
      link.classList.add('active');
    }
  });
}

// ── Scroll Fade-In ────────────────────────────────────────────
function initScrollObserver() {
  const elements = $$('.fade-in');
  if (!elements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        const delay = entry.target.dataset.delay || 0;
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, delay);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  elements.forEach((el, i) => {
    if (!el.dataset.delay) el.dataset.delay = i * 80;
    observer.observe(el);
  });
}

// ── Toast Notifications ───────────────────────────────────────
function showToast(message, type = 'info', duration = 3500) {
  let container = $('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = { success: '&#10003;', error: '&#10005;', info: '&#9432;', warning: '&#9888;' };
  const colors = {
    success: 'var(--accent)',
    error: 'var(--error)',
    info: 'var(--info)',
    warning: 'var(--warning)'
  };

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <span style="color: ${colors[type]}; font-size: 1rem; flex-shrink:0;">${icons[type]}</span>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'toast-in 0.3s ease reverse';
    setTimeout(() => toast.remove(), 280);
  }, duration);
}

window.showToast = showToast;

// ── Animated Counter ──────────────────────────────────────────
function animateCounter(el) {
  const target = parseFloat(el.dataset.target);
  const prefix = el.dataset.prefix || '';
  const suffix = el.dataset.suffix || '';
  const duration = parseInt(el.dataset.duration || '1800');
  const decimals = el.dataset.decimals ? parseInt(el.dataset.decimals) : 0;

  const start = performance.now();

  const tick = (now) => {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    // Ease out quart
    const eased = 1 - Math.pow(1 - progress, 4);
    const value = eased * target;
    el.textContent = prefix + value.toFixed(decimals) + suffix;
    if (progress < 1) requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
}

function initCounters() {
  const counters = $$('[data-target]');
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(c => observer.observe(c));
}

// ── Bar Chart Animation ───────────────────────────────────────
function initChartBars() {
  $$('.hcard-bar').forEach((bar, i) => {
    const h = bar.dataset.height || Math.random() * 70 + 20;
    bar.style.height = '0%';
    setTimeout(() => {
      bar.style.transition = `height 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)`;
      bar.style.height = h + '%';
    }, 400 + i * 80);
  });
}

// ── File Drop Zone ────────────────────────────────────────────
function initFileDropZones() {
  $$('.file-drop-zone').forEach(zone => {
    const input = zone.querySelector('input[type="file"]');
    const fileList = zone.closest('.file-upload-wrapper')?.querySelector('.file-list');

    const handleFiles = (files) => {
      if (!files || !files.length) return;
      Array.from(files).forEach(file => {
        addFileItem(file, fileList);
      });
    };

    // Click to open
    zone.addEventListener('click', () => input && input.click());

    // Input change
    if (input) {
      input.addEventListener('change', (e) => {
        handleFiles(e.target.files);
      });
    }

    // Drag & drop
    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      zone.classList.add('drag-over');
    });

    zone.addEventListener('dragleave', () => {
      zone.classList.remove('drag-over');
    });

    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('drag-over');
      handleFiles(e.dataTransfer.files);
    });
  });
}

function addFileItem(file, container) {
  if (!container) return;

  const size = file.size < 1024 * 1024
    ? (file.size / 1024).toFixed(1) + ' KB'
    : (file.size / 1024 / 1024).toFixed(1) + ' MB';

  const ext = file.name.split('.').pop().toUpperCase();

  const item = document.createElement('div');
  item.className = 'file-item';
  item.innerHTML = `
    <span class="badge badge-green" style="font-size:0.7rem;padding:2px 8px;">${ext}</span>
    <span class="file-item-name">${file.name}</span>
    <span class="file-item-size">${size}</span>
    <button class="file-remove-btn" title="Remove" aria-label="Remove file">&times;</button>
  `;

  item.querySelector('.file-remove-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    item.remove();
  });

  container.appendChild(item);
  showToast(`Added: ${file.name}`, 'success', 2000);
}

// ── Progress Steps ────────────────────────────────────────────
function initProgressSteps() {
  $$('.progress-steps[data-active]').forEach(stepsEl => {
    const activeIdx = parseInt(stepsEl.dataset.active || '0');
    $$('.progress-step', stepsEl).forEach((step, i) => {
      if (i < activeIdx) step.classList.add('completed');
      else if (i === activeIdx) step.classList.add('active');
    });
  });
}

// ── Tabs ─────────────────────────────────────────────────────
function initTabs() {
  $$('[data-tabs]').forEach(tabGroup => {
    const tabButtons = $$('[data-tab-btn]', tabGroup);
    const tabPanels  = $$('[data-tab-panel]', tabGroup);

    const switchTab = (targetId) => {
      tabButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tabBtn === targetId);
        btn.setAttribute('aria-selected', btn.dataset.tabBtn === targetId);
      });
      tabPanels.forEach(panel => {
        const visible = panel.dataset.tabPanel === targetId;
        panel.style.display = visible ? '' : 'none';
        if (visible) {
          panel.style.animation = 'none';
          panel.offsetHeight; // reflow
          panel.style.animation = 'tab-fade 0.25s ease';
        }
      });
    };

    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tabBtn));
    });

    // Activate first
    if (tabButtons.length) switchTab(tabButtons[0].dataset.tabBtn);
  });
}

// ── Tooltip ───────────────────────────────────────────────────
function initTooltips() {
  $$('[data-tooltip]').forEach(el => {
    const tip = document.createElement('div');
    tip.className = 'tooltip';
    tip.textContent = el.dataset.tooltip;
    tip.style.cssText = `
      position:absolute; background:var(--bg-card); border:1px solid var(--border-default);
      padding:6px 10px; border-radius:var(--radius-sm); font-size:0.78rem; color:var(--text-secondary);
      white-space:nowrap; pointer-events:none; z-index:9999; opacity:0;
      transition:opacity 0.15s ease; box-shadow:var(--shadow-card);
    `;
    document.body.appendChild(tip);

    const show = (e) => {
      const rect = el.getBoundingClientRect();
      tip.style.left = rect.left + rect.width / 2 - tip.offsetWidth / 2 + 'px';
      tip.style.top  = rect.top - tip.offsetHeight - 8 + window.scrollY + 'px';
      tip.style.opacity = '1';
    };
    const hide = () => { tip.style.opacity = '0'; };

    el.addEventListener('mouseenter', show);
    el.addEventListener('mouseleave', hide);
  });
}

// ── Mini Sparkline ────────────────────────────────────────────
function drawSparkline(canvas, data, color = '#3ddc52') {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;

  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * w,
    y: h - ((v - min) / range) * (h - 8) - 4
  }));

  ctx.clearRect(0, 0, w, h);

  // Fill
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, color + '33');
  grad.addColorStop(1, color + '00');

  ctx.beginPath();
  ctx.moveTo(pts[0].x, h);
  pts.forEach(p => ctx.lineTo(p.x, p.y));
  ctx.lineTo(pts[pts.length - 1].x, h);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Line
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  pts.forEach(p => ctx.lineTo(p.x, p.y));
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.stroke();
}

window.drawSparkline = drawSparkline;

// ── Smooth Scroll ─────────────────────────────────────────────
function initSmoothScroll() {
  $$('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (target) {
        e.preventDefault();
        const top = target.getBoundingClientRect().top + window.scrollY - 90;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });
}

// ── Typing animation ──────────────────────────────────────────
function initTypingEffect() {
  $$('[data-typewriter]').forEach(el => {
    const words = el.dataset.typewriter.split('|');
    let wordIndex = 0, charIndex = 0, deleting = false;

    const tick = () => {
      const word = words[wordIndex];
      if (deleting) {
        el.textContent = word.slice(0, --charIndex);
        if (charIndex === 0) {
          deleting = false;
          wordIndex = (wordIndex + 1) % words.length;
          setTimeout(tick, 400);
          return;
        }
      } else {
        el.textContent = word.slice(0, ++charIndex);
        if (charIndex === word.length) {
          setTimeout(() => { deleting = true; tick(); }, 2200);
          return;
        }
      }
      setTimeout(tick, deleting ? 40 : 70);
    };

    tick();
  });
}

// ── Copy to Clipboard ─────────────────────────────────────────
function initCopyBtns() {
  $$('[data-copy]').forEach(btn => {
    btn.addEventListener('click', () => {
      const text = btn.dataset.copy;
      navigator.clipboard.writeText(text).then(() => {
        const orig = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(() => { btn.textContent = orig; }, 1500);
      });
    });
  });
}

// ── Init All ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initScrollObserver();
  initCounters();
  initChartBars();
  initFileDropZones();
  initProgressSteps();
  initTabs();
  initTooltips();
  initSmoothScroll();
  initTypingEffect();
  initCopyBtns();
});

// CSS Keyframes injection for tab fade
const style = document.createElement('style');
style.textContent = `
@keyframes tab-fade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
`;
document.head.appendChild(style);

// ── Auth State Manager ────────────────────────────────────────
function initAuthNav() {
  const token = localStorage.getItem('rupi_token');
  const userStr = localStorage.getItem('rupi_user');
  let user = null;
  try { user = userStr ? JSON.parse(userStr) : null; } catch(e) {}

  // Only applies to landing page (index.html)
  const getStartedBtn = document.querySelector('.nav-actions a[href="#cta"]');
  const mobileGetStarted = document.querySelector('.nav-mobile .nav-actions a[href="#cta"]');

  if (!getStartedBtn) return; // Not on landing page

  if (token && user) {
    const displayName = user.name || user.email || 'My Profile';
    const initial = displayName.charAt(0).toUpperCase();

    // Replace desktop CTA
    getStartedBtn.outerHTML = `
      <a href="pages/auth/user-profile.html" class="btn btn-primary btn-sm nav-user-btn">
        <span class="nav-avatar">${initial}</span>
        ${displayName.split(' ')[0]}
      </a>`;

    // Replace mobile CTA
    if (mobileGetStarted) {
      mobileGetStarted.outerHTML = `
        <a href="pages/auth/user-profile.html" class="btn btn-primary nav-user-btn">
          <span class="nav-avatar">${initial}</span>
          My Profile
        </a>`;
    }
  }
}

document.addEventListener('DOMContentLoaded', initAuthNav);
