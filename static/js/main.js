(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Theme toggle (follows the system until the visitor picks) ---------- */
  const root = document.documentElement;
  const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const themeBtn = document.getElementById('themeBtn');
  const currentTheme = () => root.getAttribute('data-theme') || (darkQuery.matches ? 'dark' : 'light');

  function syncThemeBtn() {
    if (!themeBtn) return;
    const mode = currentTheme();
    themeBtn.dataset.mode = mode;
    themeBtn.setAttribute('aria-label', mode === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
  }

  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const next = currentTheme() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('sd-theme', next); } catch (e) { /* storage unavailable */ }
      syncThemeBtn();
    });
    if (darkQuery.addEventListener) darkQuery.addEventListener('change', syncThemeBtn);
    syncThemeBtn();
  }

  /* ---------- Nav hairline once the page scrolls ---------- */
  const nav = document.querySelector('.nav');
  if (nav) {
    const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Cards lean toward the pointer ---------- */
  if (!reduceMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.querySelectorAll('.card').forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        card.classList.add('is-tilting');
        card.style.setProperty('--rx', ((0.5 - y) * 2.4).toFixed(2) + 'deg');
        card.style.setProperty('--ry', ((x - 0.5) * 3.2).toFixed(2) + 'deg');
        card.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
        card.style.setProperty('--my', (y * 100).toFixed(1) + '%');
      });
      card.addEventListener('pointerleave', () => {
        card.classList.remove('is-tilting');
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
      });
    });
  }

  /* ---------- Figure viewer ---------- */
  const lightbox = document.getElementById('lightbox');
  const figButtons = Array.from(document.querySelectorAll('.card__fig[data-full]'));

  if (lightbox && typeof lightbox.showModal === 'function' && figButtons.length) {
    const img = lightbox.querySelector('.lightbox__img');
    const title = lightbox.querySelector('.lightbox__title');
    const cap = lightbox.querySelector('.lightbox__cap');
    const open = lightbox.querySelector('.lightbox__open');
    let index = 0;

    const show = (k) => {
      index = (k + figButtons.length) % figButtons.length;
      const btn = figButtons[index];
      const card = btn.closest('.card');
      const hue = card ? getComputedStyle(card).getPropertyValue('--hue').trim() : '';
      if (hue) lightbox.style.setProperty('--hue', hue);
      else lightbox.style.removeProperty('--hue');
      const thumb = btn.querySelector('img');
      img.src = btn.dataset.full;
      img.alt = thumb ? thumb.alt : '';
      title.textContent = btn.dataset.title || '';
      cap.textContent = btn.dataset.caption || '';
      open.href = btn.dataset.full;
    };

    figButtons.forEach((btn, k) => {
      btn.addEventListener('click', () => {
        show(k);
        lightbox.showModal();
      });
    });

    lightbox.addEventListener('click', (e) => {
      const action = e.target.closest('[data-lb]');
      if (action) {
        const a = action.dataset.lb;
        if (a === 'prev') show(index - 1);
        else if (a === 'next') show(index + 1);
        else lightbox.close();
        return;
      }
      if (e.target === lightbox) lightbox.close();
    });

    lightbox.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); show(index - 1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); show(index + 1); }
    });
  }

  /* ---------- Share: QR code + copy link ---------- */
  const shareDlg = document.getElementById('share');
  const shareBtn = document.getElementById('shareBtn');

  if (shareDlg && shareBtn && typeof shareDlg.showModal === 'function') {
    const pageUrl = window.location.href.split('#')[0];
    const urlEl = document.getElementById('share-url');
    const qrEl = document.getElementById('qr');
    const copyBtn = document.getElementById('copyLink');
    const copyLabel = copyBtn.querySelector('span');
    urlEl.textContent = pageUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');

    const drawQR = () => {
      if (qrEl.childElementCount || typeof window.qrcode !== 'function') return;
      try {
        const q = window.qrcode(0, 'M');
        q.addData(pageUrl);
        q.make();
        const n = q.getModuleCount();
        let d = '';
        for (let r = 0; r < n; r++) {
          for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += 'M' + c + ' ' + r + 'h1v1h-1z';
        }
        const s = n + 8;
        qrEl.innerHTML =
          '<svg viewBox="-4 -4 ' + s + ' ' + s + '" shape-rendering="crispEdges" role="img" aria-label="QR code that opens this page">' +
          '<rect x="-4" y="-4" width="' + s + '" height="' + s + '" fill="#FFFFFF"/>' +
          '<path d="' + d + '" fill="#0E2236"/></svg>';
      } catch (e) {
        qrEl.textContent = '';
      }
    };

    shareBtn.addEventListener('click', () => {
      drawQR();
      copyLabel.textContent = 'Copy link';
      shareDlg.showModal();
    });

    shareDlg.addEventListener('click', (e) => {
      if (e.target === shareDlg || e.target.closest('[data-share="close"]')) shareDlg.close();
    });

    copyBtn.addEventListener('click', () => {
      const selectUrl = () => {
        const range = document.createRange();
        range.selectNodeContents(urlEl);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        copyLabel.textContent = 'Link selected, copy it now';
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(pageUrl).then(() => { copyLabel.textContent = 'Link copied'; }, selectUrl);
      } else {
        selectUrl();
      }
    });
  }

  /* ---------- Fig. 1: phase portrait of the Schnackenberg system ---------- */
  const flowCanvas = document.getElementById('flow');
  if (flowCanvas && flowCanvas.getContext) initPlate(flowCanvas);

  function initPlate(canvas) {
    const ctx = canvas.getContext('2d');

    // dx0/dt = a + x0^2 x1 - x0,  dx1/dt = b - x0^2 x1   (a = 0.24, b = 1.43)
    const A = 0.24;
    const B = 1.43;
    const FX = A + B;
    const FY = B / (FX * FX);
    const X0 = 0, X1 = 3.4, Y0 = 0, Y1 = 2.9;
    const INK = '207, 230, 245';
    const GOLD = '241, 180, 76';
    const field = (x, y) => {
      const q = x * x * y;
      return [A + q - x, B - q];
    };

    let W = 0, H = 0, dpr = 1, L = 0, R = 0, T = 0, Bt = 0, sx = 1, sy = 1;
    let lines = [], comets = [], base = null, full = null;
    let raf = 0, visible = true, introStart = 0, introDone = reduceMotion, ready = false, lastW = 0, lastH = 0;

    const toX = (x) => L + (x - X0) * sx;
    const toY = (y) => T + (Y1 - y) * sy;

    // one RK4 step that moves about 1.5 px on screen, forward (dir = 1) or backward (dir = -1) in time
    function rk4(x, y, dir) {
      const k1 = field(x, y);
      const speed = Math.hypot(k1[0] * sx, k1[1] * sy);
      if (!(speed > 1e-3)) return null;
      const h = (dir * 1.5) / speed;
      const k2 = field(x + 0.5 * h * k1[0], y + 0.5 * h * k1[1]);
      const k3 = field(x + 0.5 * h * k2[0], y + 0.5 * h * k2[1]);
      const k4 = field(x + h * k3[0], y + h * k3[1]);
      return [
        x + (h * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0])) / 6,
        y + (h * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1])) / 6,
        speed,
      ];
    }

    // evenly spaced streamlines (Jobard and Lefer style)
    function traceAll() {
      const sep = Math.max(11, Math.min(W, H) / 27);
      const test = sep * 0.5;
      const cell = sep;
      const gw = Math.ceil(W / cell) + 1;
      const gh = Math.ceil(H / cell) + 1;
      const grid = [];
      for (let i = 0; i < gw * gh; i++) grid.push([]);
      const fpx = toX(FX), fpy = toY(FY);

      const near = (x, y, d) => {
        const ci = Math.floor(x / cell), cj = Math.floor(y / cell), d2 = d * d;
        for (let a = ci - 1; a <= ci + 1; a++) {
          if (a < 0 || a >= gw) continue;
          for (let b = cj - 1; b <= cj + 1; b++) {
            if (b < 0 || b >= gh) continue;
            const c = grid[b * gw + a];
            for (let k = 0; k < c.length; k += 2) {
              const dx = c[k] - x, dy = c[k + 1] - y;
              if (dx * dx + dy * dy < d2) return true;
            }
          }
        }
        return false;
      };

      const mark = (pts) => {
        for (let k = 0; k < pts.length; k += 3) {
          const a = Math.floor(pts[k] / cell), b = Math.floor(pts[k + 1] / cell);
          if (a >= 0 && b >= 0 && a < gw && b < gh) grid[b * gw + a].push(pts[k], pts[k + 1]);
        }
      };

      const trace = (x, y, dir) => {
        const out = [];
        for (let n = 0; n < 1600; n++) {
          const s = rk4(x, y, dir);
          if (!s) break;
          x = s[0];
          y = s[1];
          if (x < X0 || x > X1 || y < Y0 || y > Y1) break;
          const qx = toX(x), qy = toY(y);
          if (Math.hypot(qx - fpx, qy - fpy) < 8) break;
          if (near(qx, qy, test)) break;
          out.push(qx, qy, s[2]);
        }
        return out;
      };

      let seed = 7;
      const rand = () => {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
      };

      const seeds = [];
      const step = sep * 0.75;
      for (let gx = L + step / 2; gx < R; gx += step) {
        for (let gy = T + step / 2; gy < Bt; gy += step) {
          seeds.push([gx + (rand() - 0.5) * step * 0.8, gy + (rand() - 0.5) * step * 0.8]);
        }
      }
      for (let i = seeds.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        const t = seeds[i];
        seeds[i] = seeds[j];
        seeds[j] = t;
      }

      lines = [];
      for (const [qx, qy] of seeds) {
        if (qx < L || qx > R || qy < T || qy > Bt) continue;
        if (Math.hypot(qx - fpx, qy - fpy) < sep) continue;
        if (near(qx, qy, sep)) continue;
        const x = X0 + (qx - L) / sx;
        const y = Y1 - (qy - T) / sy;
        const back = trace(x, y, -1);
        const fwd = trace(x, y, 1);
        const count = back.length / 3 + 1 + fwd.length / 3;
        if (count < 16) continue;
        const pts = new Float32Array(count * 3);
        let o = 0;
        for (let k = back.length - 3; k >= 0; k -= 3) {
          pts[o++] = back[k];
          pts[o++] = back[k + 1];
          pts[o++] = back[k + 2];
        }
        const v = field(x, y);
        pts[o++] = qx;
        pts[o++] = qy;
        pts[o++] = Math.hypot(v[0] * sx, v[1] * sy);
        for (let k = 0; k < fwd.length; k++) pts[o++] = fwd[k];
        mark(pts);
        lines.push(pts);
      }
    }

    function layer() {
      const c = document.createElement('canvas');
      c.width = canvas.width;
      c.height = canvas.height;
      c.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
      return c;
    }

    function axisName(g, x, y, sub, alignRight) {
      g.font = 'italic 16px "STIX Two Text", "Times New Roman", serif';
      const w = g.measureText('x').width;
      g.font = '10.5px "STIX Two Text", "Times New Roman", serif';
      const ws = g.measureText(sub).width;
      const left = alignRight ? x - (w + ws + 1) : x;
      g.fillStyle = 'rgba(' + INK + ', 0.9)';
      g.textAlign = 'left';
      g.textBaseline = 'alphabetic';
      g.font = 'italic 16px "STIX Two Text", "Times New Roman", serif';
      g.fillText('x', left, y);
      g.font = '10.5px "STIX Two Text", "Times New Roman", serif';
      g.fillText(sub, left + w + 1, y + 4);
    }

    function drawBase(g) {
      g.clearRect(0, 0, W, H);
      g.lineWidth = 1;

      // graph paper
      for (let v = 0; v <= X1 + 1e-6; v += 0.25) {
        const major = Math.abs(v - Math.round(v)) < 1e-6;
        g.strokeStyle = 'rgba(' + INK + ', ' + (major ? 0.1 : 0.045) + ')';
        const x = Math.round(toX(v)) + 0.5;
        g.beginPath(); g.moveTo(x, T); g.lineTo(x, Bt); g.stroke();
      }
      for (let v = 0; v <= Y1 + 1e-6; v += 0.25) {
        const major = Math.abs(v - Math.round(v)) < 1e-6;
        g.strokeStyle = 'rgba(' + INK + ', ' + (major ? 0.1 : 0.045) + ')';
        const y = Math.round(toY(v)) + 0.5;
        g.beginPath(); g.moveTo(L, y); g.lineTo(R, y); g.stroke();
      }

      // axes, ticks, labels
      g.strokeStyle = 'rgba(' + INK + ', 0.5)';
      g.beginPath();
      g.moveTo(L + 0.5, T);
      g.lineTo(L + 0.5, Bt + 0.5);
      g.lineTo(R, Bt + 0.5);
      g.stroke();

      g.fillStyle = 'rgba(' + INK + ', 0.62)';
      g.font = '500 10px "IBM Plex Mono", ui-monospace, monospace';
      g.textAlign = 'center';
      g.textBaseline = 'top';
      for (let v = 0; v <= X1 + 1e-6; v += 1) {
        const x = Math.round(toX(v)) + 0.5;
        g.beginPath(); g.moveTo(x, Bt + 0.5); g.lineTo(x, Bt + 5); g.stroke();
        g.fillText(String(v), x, Bt + 8);
      }
      g.textAlign = 'right';
      g.textBaseline = 'middle';
      for (let v = 1; v <= Y1 + 1e-6; v += 1) {
        const y = Math.round(toY(v)) + 0.5;
        g.beginPath(); g.moveTo(L - 4, y); g.lineTo(L + 0.5, y); g.stroke();
        g.fillText(String(v), L - 8, y);
      }

      axisName(g, R, H - 12, '0', true);
      axisName(g, L - 30, T + 10, '1', false);
    }

    function drawLines(g, frac) {
      g.lineWidth = 1;
      g.lineCap = 'round';
      g.lineJoin = 'round';
      g.strokeStyle = 'rgba(' + INK + ', 0.34)';
      g.beginPath();
      for (const pts of lines) {
        const n = pts.length / 3;
        const m = frac >= 1 ? n : Math.max(2, Math.floor(n * frac));
        g.moveTo(pts[0], pts[1]);
        for (let k = 1; k < m; k++) g.lineTo(pts[k * 3], pts[k * 3 + 1]);
      }
      g.stroke();
    }

    function drawArrows(g) {
      g.fillStyle = 'rgba(' + INK + ', 0.62)';
      for (const pts of lines) {
        const n = pts.length / 3;
        if (n < 44) continue;
        const m = Math.floor(n * 0.5);
        const i0 = (m - 2) * 3, i1 = (m + 2) * 3;
        const ang = Math.atan2(pts[i1 + 1] - pts[i0 + 1], pts[i1] - pts[i0]);
        g.save();
        g.translate(pts[m * 3], pts[m * 3 + 1]);
        g.rotate(ang);
        g.beginPath();
        g.moveTo(3.6, 0);
        g.lineTo(-2.6, 2.7);
        g.lineTo(-1.2, 0);
        g.lineTo(-2.6, -2.7);
        g.closePath();
        g.fill();
        g.restore();
      }
    }

    function drawFixedPoint(g, now) {
      const x = toX(FX), y = toY(FY);
      const pulse = reduceMotion ? 0.5 : 0.5 + 0.5 * Math.sin(now / 650);
      const glow = g.createRadialGradient(x, y, 0, x, y, 32);
      glow.addColorStop(0, 'rgba(' + GOLD + ', ' + (0.34 + 0.16 * pulse) + ')');
      glow.addColorStop(1, 'rgba(' + GOLD + ', 0)');
      g.fillStyle = glow;
      g.beginPath(); g.arc(x, y, 32, 0, Math.PI * 2); g.fill();
      g.strokeStyle = 'rgba(' + GOLD + ', ' + (0.8 - 0.4 * pulse) + ')';
      g.lineWidth = 1;
      g.beginPath(); g.arc(x, y, 8 + 3 * pulse, 0, Math.PI * 2); g.stroke();
      g.fillStyle = 'rgb(' + GOLD + ')';
      g.beginPath(); g.arc(x, y, 3.6, 0, Math.PI * 2); g.fill();
      g.font = '500 10.5px "IBM Plex Mono", ui-monospace, monospace';
      g.textAlign = 'left';
      g.textBaseline = 'middle';
      g.fillStyle = 'rgba(' + GOLD + ', 0.95)';
      g.fillText('x* = (1.67, 0.51)', x + 16, y + 16);
    }

    function resetComet(c, anywhere) {
      c.pts = lines[Math.floor(Math.random() * lines.length)];
      c.n = c.pts.length / 3;
      c.start = anywhere ? Math.random() * c.n * 0.85 : Math.random() * Math.min(c.n * 0.3, 40);
      c.p = c.start;
      c.gold = Math.random() < 0.12;
    }

    function spawnComets() {
      comets = [];
      if (reduceMotion || !lines.length) return;
      const count = Math.min(110, Math.max(30, Math.round(lines.length * 0.75)));
      for (let i = 0; i < count; i++) {
        const c = {};
        resetComet(c, true);
        comets.push(c);
      }
    }

    function drawComets(g) {
      for (const c of comets) {
        const speed = c.pts[Math.floor(c.p) * 3 + 2];
        c.p += Math.min(2.6, 0.32 + 0.5 * Math.log1p(speed / 50));
        if (c.p >= c.n - 1) { resetComet(c, false); continue; }
        const head = Math.floor(c.p);
        const tail = Math.max(Math.floor(c.start), head - 28);
        if (head - tail < 2) continue;
        const fade = Math.min(1, (c.n - 1 - c.p) / 14);
        const hx = c.pts[head * 3], hy = c.pts[head * 3 + 1];
        const tx = c.pts[tail * 3], ty = c.pts[tail * 3 + 1];
        const col = c.gold ? GOLD : '236, 246, 253';
        const grad = g.createLinearGradient(tx, ty, hx, hy);
        grad.addColorStop(0, 'rgba(' + col + ', 0)');
        grad.addColorStop(1, 'rgba(' + col + ', ' + (c.gold ? 0.95 : 0.8) * fade + ')');
        g.strokeStyle = grad;
        g.lineWidth = c.gold ? 1.8 : 1.35;
        g.beginPath();
        g.moveTo(tx, ty);
        for (let k = tail + 1; k <= head; k++) g.lineTo(c.pts[k * 3], c.pts[k * 3 + 1]);
        g.stroke();
        g.fillStyle = 'rgba(' + col + ', ' + fade + ')';
        g.beginPath(); g.arc(hx, hy, c.gold ? 1.9 : 1.4, 0, Math.PI * 2); g.fill();
      }
    }

    function build() {
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 40 || rect.height < 40) return false;
      W = rect.width;
      H = rect.height;
      lastW = W;
      lastH = H;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      const compact = W < 420;
      L = compact ? 40 : 50;
      R = W - (compact ? 14 : 20);
      T = compact ? 16 : 20;
      Bt = H - (compact ? 34 : 42);
      sx = (R - L) / (X1 - X0);
      sy = (Bt - T) / (Y1 - Y0);

      traceAll();
      base = layer();
      drawBase(base.getContext('2d'));
      full = layer();
      const g = full.getContext('2d');
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.drawImage(base, 0, 0);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawLines(g, 1);
      drawArrows(g);
      spawnComets();
      return true;
    }

    function paint(src) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(src, 0, 0);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function still() {
      paint(full);
      drawFixedPoint(ctx, 0);
    }

    function intro(now) {
      raf = 0;
      if (!introStart) introStart = now;
      const t = Math.min(1, (now - introStart) / 2000);
      const e = 1 - Math.pow(1 - t, 3);
      paint(base);
      drawLines(ctx, e);
      ctx.globalAlpha = e;
      drawFixedPoint(ctx, now);
      ctx.globalAlpha = 1;
      if (t >= 1) introDone = true;
      schedule();
    }

    function frame(now) {
      raf = 0;
      paint(full);
      drawComets(ctx);
      drawFixedPoint(ctx, now);
      schedule();
    }

    function schedule() {
      if (!raf && ready && visible && !document.hidden) raf = requestAnimationFrame(introDone ? frame : intro);
    }

    function start() {
      if (!build()) return;
      ready = true;
      if (reduceMotion) still();
      else schedule();
    }

    let resizeTimer = 0;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (!ready) return;
        const r = canvas.getBoundingClientRect();
        if (Math.abs(r.width - lastW) < 1 && Math.abs(r.height - lastH) < 1) return;
        if (!build()) return;
        if (reduceMotion || introDone) still();
        schedule();
      }, 120);
    };
    if ('ResizeObserver' in window) new ResizeObserver(onResize).observe(canvas);
    else window.addEventListener('resize', onResize);

    if ('IntersectionObserver' in window) {
      new IntersectionObserver((entries) => {
        visible = entries[entries.length - 1].isIntersecting;
        schedule();
      }, { rootMargin: '80px' }).observe(canvas);
    }
    document.addEventListener('visibilitychange', schedule);

    const fontsReady = document.fonts && document.fonts.ready
      ? Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1500))])
      : Promise.resolve();
    fontsReady.then(start);
  }
})();
