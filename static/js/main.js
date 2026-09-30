(() => {
  'use strict';

  /* ---------- Nav hairline once the page scrolls ---------- */
  const nav = document.querySelector('.nav');
  if (nav) {
    const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
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
          '<path d="' + d + '" fill="#1e293b"/></svg>';
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
})();
