/**
 * iOS scroll assist for Philip & Liezl's embedded Google Apps Script pages.
 *
 * The child form/gallery stays on this website. Safari sometimes consumes
 * vertical swipes inside cross-origin frames even when their height is correct.
 * These unobtrusive native-page controls always work without needing a new
 * Apps Script deployment, and the inner-page scroll bridge handles normal
 * swipes when the deployed Apps Script supports it.
 */
(function () {
  'use strict';

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (!isIOS) return;

  const frame = document.querySelector('.share-frame');
  if (!frame) return;

  const css = document.createElement('style');
  css.textContent = `
    .ios-scroll-assist {
      position: fixed;
      right: max(6px, env(safe-area-inset-right));
      bottom: calc(19px + env(safe-area-inset-bottom));
      z-index: 45;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1px;
      width: 40px;
      padding: 4px 3px;
      border: 1px solid rgba(199,158,73,.46);
      border-radius: 24px;
      background: rgba(255,250,240,.94);
      box-shadow: 0 6px 22px rgba(36,23,38,.16);
      -webkit-backdrop-filter: blur(8px);
      backdrop-filter: blur(8px);
    }
    .ios-scroll-assist[hidden] { display: none !important; }
    .ios-scroll-assist button {
      display: grid;
      place-items: center;
      width: 34px;
      height: 35px;
      padding: 0;
      border: 0;
      border-radius: 19px;
      background: none;
      color: #4b245f;
      font: 700 19px/1 Arial,sans-serif;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
    }
    .ios-scroll-assist button:focus-visible {
      outline: 2px solid #7d4f8d;
      outline-offset: 1px;
    }
    .ios-scroll-assist-grip {
      display: grid;
      place-items: center;
      width: 34px;
      height: 36px;
      border-radius: 16px;
      background: #4b245f;
      color: white;
      font: 700 19px/1 Arial,sans-serif;
      touch-action: none;
      user-select: none;
      -webkit-user-select: none;
      cursor: ns-resize;
      -webkit-tap-highlight-color: transparent;
    }
  `;
  document.head.appendChild(css);

  const controls = document.createElement('div');
  controls.className = 'ios-scroll-assist';
  controls.setAttribute('role', 'group');
  controls.setAttribute('aria-label', 'Scroll within the wedding website');
  controls.innerHTML =
    '<button type="button" aria-label="Scroll up" title="Scroll up">↑</button>' +
    '<div class="ios-scroll-assist-grip" role="slider" tabindex="0" ' +
      'aria-label="Drag up or down to scroll this page" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">↕</div>' +
    '<button type="button" aria-label="Scroll down" title="Scroll down">↓</button>';
  document.body.appendChild(controls);

  const up = controls.querySelector('button:first-child');
  const down = controls.querySelector('button:last-child');
  const grip = controls.querySelector('.ios-scroll-assist-grip');

  function movePage(distance, smooth) {
    window.scrollBy({ top: distance, left: 0, behavior: smooth ? 'smooth' : 'instant' });
  }

  up.addEventListener('click', () => movePage(-window.innerHeight * .7, true));
  down.addEventListener('click', () => movePage(window.innerHeight * .7, true));

  function updateVisible() {
    const bounds = frame.getBoundingClientRect();
    controls.hidden = !(bounds.top < window.innerHeight - 50 &&
      bounds.bottom > 55 &&
      document.documentElement.scrollHeight > window.innerHeight + 80);
    if (!controls.hidden) {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      grip.setAttribute('aria-valuenow', String(Math.round(window.scrollY / max * 100)));
    }
  }

  let previousY = null;
  grip.addEventListener('touchstart', event => {
    if (event.touches.length !== 1) return;
    previousY = event.touches[0].clientY;
  }, { passive: true });
  grip.addEventListener('touchmove', event => {
    if (previousY === null || event.touches.length !== 1) return;
    if (event.cancelable) event.preventDefault();
    const nextY = event.touches[0].clientY;
    movePage((previousY - nextY) * 2.1, false);
    previousY = nextY;
  }, { passive: false });
  grip.addEventListener('touchend', () => { previousY = null; });
  grip.addEventListener('touchcancel', () => { previousY = null; });
  grip.addEventListener('keydown', event => {
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
    event.preventDefault();
    movePage(event.key === 'ArrowUp' ? -100 : 100, true);
  });

  window.addEventListener('scroll', updateVisible, { passive: true });
  window.addEventListener('resize', updateVisible);
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(updateVisible).observe(frame);
  }
  updateVisible();

  // The native-page assist should not cover the gallery's album/photo modal.
  window.addEventListener('message', event => {
    const origin = event.origin || '';
    if (!/^https:\/\/(?:script\.google\.com|[a-z0-9.-]+\.googleusercontent\.com)$/.test(origin)) return;
    if (!event.data || event.data.page !== 'gallery') return;
    if (event.data.type === 'wedding-gallery-preview-open') {
      controls.style.visibility = 'hidden';
    } else if (event.data.type === 'wedding-gallery-preview-close') {
      controls.style.visibility = '';
    }
  });
})();