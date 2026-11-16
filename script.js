/* Static content remains usable without this progressive enhancement. */
(() => {
  'use strict';
  const lifetime = new AbortController();
  const on = (target, event, callback, options = {}) => target.addEventListener(event, callback, { ...options, signal: lifetime.signal });
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const menu = document.querySelector('.menu-toggle');
  const links = document.querySelector('.nav-links');
  if (menu && links) {
    document.documentElement.classList.add('js');
    menu.hidden = false;
    const close = () => { menu.setAttribute('aria-expanded', 'false'); links.classList.remove('is-open'); };
    on(menu, 'click', () => {
      const open = menu.getAttribute('aria-expanded') !== 'true';
      menu.setAttribute('aria-expanded', String(open));
      links.classList.toggle('is-open', open);
    });
    on(links, 'click', event => { if (event.target.closest('a')) close(); });
    on(document, 'keydown', event => {
      if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') { close(); menu.focus(); }
    });
    on(matchMedia('(max-width: 620px)'), 'change', close);
  }
  document.querySelectorAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });

  // Disclosures never change the URL or scroll position unless a link is followed.
  const projectButtons = [...document.querySelectorAll('.project-toggle')];
  function disclose(button, open) {
    const details = document.getElementById(button.getAttribute('aria-controls'));
    details.hidden = !open;
    button.setAttribute('aria-expanded', String(open));
    button.innerHTML = `${open ? 'Close project' : 'Explore project'} <span aria-hidden="true">${open ? '−' : '+'}</span>`;
  }
  projectButtons.forEach(button => {
    button.hidden = false;
    disclose(button, false);
    on(button, 'click', () => {
      const y = window.scrollY;
      disclose(button, button.getAttribute('aria-expanded') !== 'true');
      // Avoid browser scroll anchoring when the page height changes.
      window.scrollTo({ top: y, behavior: 'instant' });
    });
  });
  function projectFromHash(hash) {
    try { return document.getElementById(decodeURIComponent(hash.slice(1)))?.closest('.project-card'); }
    catch { return null; }
  }
  function revealLink(hash, scroll = true) {
    const project = projectFromHash(hash);
    if (!project) return false;
    disclose(project.querySelector('.project-toggle'), true);
    if (scroll) project.scrollIntoView({ behavior: reduced.matches ? 'instant' : 'smooth', block: 'start' });
    return true;
  }
  on(document, 'click', event => {
    const anchor = event.target.closest('a[href]');
    if (!anchor || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const url = new URL(anchor.href);
    if (url.origin !== location.origin || url.pathname !== location.pathname || !projectFromHash(url.hash)) return;
    event.preventDefault();
    history.pushState(null, '', url.hash);
    revealLink(url.hash);
  });
  on(window, 'hashchange', () => revealLink(location.hash));
  if (revealLink(location.hash, false)) requestAnimationFrame(() => projectFromHash(location.hash)?.scrollIntoView({ behavior: 'instant', block: 'start' }));

  const desk = document.querySelector('.workbench');
  if (!desk) return;
  const toggle = document.getElementById('showcase-toggle');
  const progress = desk.querySelector('.showcase-progress span');
  const announcement = document.getElementById('showcase-announcement');
  const modes = {
    models: ['01', 'MODELS', 'Find patterns in language.', 'Exploring pizza review sentiment with RNN and BiGRU models.', 'sentiment', 'Explore sentiment analysis ↗', 'CLASSIFY / COMPARE / REFINE'],
    data: ['02', 'DATA', 'Look closer at the numbers.', 'Comparing graduate salary and employment patterns in Power BI.', 'powerbi', 'Explore graduate outcomes ↗', 'COMPARE / FILTER / UNDERSTAND'],
    software: ['03', 'SOFTWARE', 'Connect ideas through software.', 'Exploring learning interfaces with scripted and generated reply modes.', 'analogy', 'Explore Analogy Tutor ↗', 'REQUEST / PROCESS / RESPOND']
  };
  const order = Object.keys(modes);
  // This is the sole writable showcase state. React only observes its projection.
  const state = { mode: 'models', paused: reduced.matches, hover: false, focus: false, visible: false };
  const interval = 6000;
  let timer = null;
  let fill = null;
  function paint(manual = false) {
    const [number, label, title, description, slug, link, readout] = modes[state.mode];
    desk.dataset.mode = state.mode;
    desk.querySelectorAll('[data-capability]').forEach(key => key.setAttribute('aria-pressed', String(key.dataset.capability === state.mode)));
    document.getElementById('display-mode').textContent = `${number} / ${label}`;
    document.getElementById('display-readout').textContent = readout;
    document.getElementById('capability-number').textContent = number;
    document.getElementById('capability-title').textContent = title;
    document.getElementById('capability-description').textContent = description;
    const target = document.getElementById('capability-link');
    target.href = `#project-${slug}`;
    target.textContent = link;
    if (manual) announcement.textContent = `${label}. ${title} ${description}`;
  }
  function stopTimer() {
    if (timer !== null) clearTimeout(timer);
    timer = null;
    fill?.cancel();
    fill = null;
  }
  function sync() {
    stopTimer();
    const running = !state.paused && !state.hover && !state.focus && state.visible && !document.hidden;
    desk.dataset.running = String(running);
    desk.dataset.paused = String(state.paused);
    toggle.textContent = state.paused ? 'Resume showcase' : 'Pause showcase';
    toggle.setAttribute('aria-pressed', String(state.paused));
    if (!running) return;
    // Animation is decorative; only this timeout advances the state.
    if (!reduced.matches) fill = progress.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: interval, easing: 'linear', fill: 'forwards' });
    timer = setTimeout(() => {
      timer = null;
      state.mode = order[(order.indexOf(state.mode) + 1) % order.length];
      paint();
      sync();
    }, interval);
  }
  toggle.hidden = false;
  on(toggle, 'click', () => { state.paused = !state.paused; sync(); });
  desk.querySelectorAll('[data-capability]').forEach(button => on(button, 'click', () => {
    state.mode = button.dataset.capability;
    state.paused = true;
    paint(true);
    sync();
  }));
  on(desk, 'pointerenter', event => { if (event.pointerType !== 'touch') { state.hover = true; sync(); } });
  on(desk, 'pointerleave', () => { state.hover = false; sync(); });
  on(desk, 'focusin', () => { state.focus = true; sync(); });
  on(desk, 'focusout', event => { state.focus = desk.contains(event.relatedTarget); sync(); });
  on(document, 'visibilitychange', sync);
  on(reduced, 'change', () => { if (reduced.matches) state.paused = true; sync(); });
  const observer = new IntersectionObserver(([entry]) => { state.visible = entry.isIntersecting; sync(); }, { threshold: 0 });
  observer.observe(desk);
  paint();
  sync();
  on(window, 'pagehide', event => {
    stopTimer();
    desk.dataset.running = 'false';
    if (!event.persisted) { observer.disconnect(); lifetime.abort(); }
  });
  on(window, 'pageshow', () => {
    state.focus = desk.contains(document.activeElement);
    state.hover = matchMedia('(hover: hover)').matches && desk.matches(':hover');
    sync();
  });
})();
