/* ============================================================
   SkillSwap Campus — Animated Canvas Background
   Floating orbs + particle network effect
   ============================================================ */

(function () {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  // ── Config ─────────────────────────────────────────────────
  const CONFIG = {
    particleCount: 60,
    orbCount: 4,
    connectionDistance: 140,
    connectionOpacityMax: 0.15,
    particleSpeed: 0.4,
    orbSpeed: 0.18,
    colors: {
      primary: '99, 102, 241',   // indigo
      secondary: '45, 212, 191', // teal
      accent: '245, 158, 11',    // amber
    },
  };

  let W, H, dpr;
  let particles = [];
  let orbs = [];
  let rafId;

  // ── Resize ──────────────────────────────────────────────────
  function resize() {
    dpr = window.devicePixelRatio || 1;
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.scale(dpr, dpr);
    init();
  }

  // ── Particle factory ────────────────────────────────────────
  function makeParticle() {
    const colorKeys = Object.keys(CONFIG.colors);
    const color = CONFIG.colors[colorKeys[Math.floor(Math.random() * colorKeys.length)]];
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * CONFIG.particleSpeed * 2,
      vy: (Math.random() - 0.5) * CONFIG.particleSpeed * 2,
      r: Math.random() * 1.5 + 0.5,
      color,
      opacity: Math.random() * 0.5 + 0.2,
    };
  }

  // ── Orb factory ─────────────────────────────────────────────
  function makeOrb(i) {
    const colorKeys = Object.keys(CONFIG.colors);
    const color = CONFIG.colors[colorKeys[i % colorKeys.length]];
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * CONFIG.orbSpeed,
      vy: (Math.random() - 0.5) * CONFIG.orbSpeed,
      r: Math.random() * 180 + 120,
      color,
      opacity: 0.045 + Math.random() * 0.03,
      pulsePhase: Math.random() * Math.PI * 2,
      pulseSpeed: 0.005 + Math.random() * 0.008,
    };
  }

  // ── Init ────────────────────────────────────────────────────
  function init() {
    particles = Array.from({ length: CONFIG.particleCount }, makeParticle);
    orbs = Array.from({ length: CONFIG.orbCount }, (_, i) => makeOrb(i));
  }

  // ── Mouse parallax ──────────────────────────────────────────
  let mouse = { x: W / 2, y: H / 2 };
  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  // ── Draw helpers ────────────────────────────────────────────
  function drawOrb(orb, t) {
    const pulse = 1 + 0.06 * Math.sin(orb.pulsePhase + t * orb.pulseSpeed);
    const r = orb.r * pulse;

    const grad = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, r);
    grad.addColorStop(0, `rgba(${orb.color}, ${orb.opacity})`);
    grad.addColorStop(1, `rgba(${orb.color}, 0)`);

    ctx.beginPath();
    ctx.arc(orb.x, orb.y, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
  }

  function drawParticle(p) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${p.color}, ${p.opacity})`;
    ctx.fill();
  }

  function drawConnections() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i];
        const b = particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONFIG.connectionDistance) {
          const opacity = CONFIG.connectionOpacityMax * (1 - dist / CONFIG.connectionDistance);
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(${a.color}, ${opacity})`;
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }
    }
  }

  // ── Update ──────────────────────────────────────────────────
  function update() {
    // Update particles
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;

      // Subtle mouse attraction
      const mdx = mouse.x - p.x;
      const mdy = mouse.y - p.y;
      const md = Math.sqrt(mdx * mdx + mdy * mdy);
      if (md < 200) {
        p.vx += (mdx / md) * 0.005;
        p.vy += (mdy / md) * 0.005;
      }

      // Clamp speed
      const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      if (speed > CONFIG.particleSpeed * 2) {
        p.vx = (p.vx / speed) * CONFIG.particleSpeed * 2;
        p.vy = (p.vy / speed) * CONFIG.particleSpeed * 2;
      }

      // Wrap
      if (p.x < -10) p.x = W + 10;
      if (p.x > W + 10) p.x = -10;
      if (p.y < -10) p.y = H + 10;
      if (p.y > H + 10) p.y = -10;
    });

    // Update orbs with mouse parallax
    orbs.forEach((orb, i) => {
      const factor = (i + 1) * 0.012;
      orb.x += orb.vx + (mouse.x - W / 2) * factor * 0.001;
      orb.y += orb.vy + (mouse.y - H / 2) * factor * 0.001;

      // Bounce at edges (soft)
      if (orb.x < -orb.r) orb.x = W + orb.r;
      if (orb.x > W + orb.r) orb.x = -orb.r;
      if (orb.y < -orb.r) orb.y = H + orb.r;
      if (orb.y > H + orb.r) orb.y = -orb.r;
    });
  }

  // ── Render loop ─────────────────────────────────────────────
  let t = 0;
  function render() {
    ctx.clearRect(0, 0, W, H);

    // Draw orbs (background layer)
    orbs.forEach((orb) => drawOrb(orb, t));

    // Draw connections
    drawConnections();

    // Draw particles on top
    particles.forEach(drawParticle);

    update();
    t++;
    rafId = requestAnimationFrame(render);
  }

  // ── Lifecycle ───────────────────────────────────────────────
  window.addEventListener('resize', () => {
    cancelAnimationFrame(rafId);
    resize();
    render();
  });

  resize();
  render();
})();
