/* Original CSS 3D capability console. No renderer or external assets required. */
(() => {
  'use strict';
  const desk = document.querySelector('.workbench');
  if (!desk) return;
  const stage = desk.querySelector('.console-stage');
  const pause = desk.querySelector('#motion-toggle');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const capabilities = {
    ml: ['01 / Machine learning', 'From patterns to predictions.', 'Training and evaluating models that turn complex inputs into useful results.', 'projects/cnn.html', 'Explore the CNN project ↗', '01 — LEARN. TEST. REFINE.'],
    data: ['02 / Data & analytics', 'Make the numbers tell a story.', 'Transforming raw data into clear dashboards, meaningful comparisons and actionable insights.', 'projects/powerbi.html', 'Explore the Power BI project ↗', '02 — EXPLORE. CONNECT. DISCOVER.'],
    code: ['03 / Software', 'Build the connection to people.', 'Connecting models and ideas with interfaces, APIs and software people can use.', 'projects/chatbot.html', 'Explore the chatbot project ↗', '03 — DESIGN. BUILD. ITERATE.']
  };
  desk.querySelectorAll('[data-capability]').forEach(key => {
    key.addEventListener('click', () => {
      const id = key.dataset.capability;
      const [label, title, description, href, link, readout] = capabilities[id];
      desk.dataset.mode = id;
      desk.querySelectorAll('[data-capability]').forEach(button => {
        const selected = button === key;
        button.classList.toggle('is-selected', selected);
        button.setAttribute('aria-pressed', String(selected));
      });
      document.getElementById('capability-label').textContent = label;
      document.getElementById('capability-title').textContent = title;
      document.getElementById('capability-description').textContent = description;
      const target = document.getElementById('capability-link');
      target.href = href;
      target.textContent = link;
      desk.querySelector('.display-readout').textContent = readout;
    });
  });

  let paused = false;
  let visible = true;
  let frame = 0;
  let x = 0;
  let y = 0;
  const reset = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    stage.style.setProperty('--pointer-x', '0deg');
    stage.style.setProperty('--pointer-y', '0deg');
  };
  const sync = () => {
    desk.classList.toggle('motion-paused', paused || reduced.matches);
    pause.textContent = paused ? 'Resume motion' : 'Pause motion';
    pause.setAttribute('aria-pressed', String(paused));
    reset();
  };
  pause.hidden = false;
  pause.addEventListener('click', () => { paused = !paused; sync(); });
  reduced.addEventListener('change', sync);
  fine.addEventListener('change', reset);
  stage.addEventListener('pointermove', event => {
    if (paused || reduced.matches || !fine.matches || !visible || document.hidden) return;
    const rect = stage.getBoundingClientRect();
    x = ((event.clientX - rect.left) / rect.width - .5) * 8;
    y = ((event.clientY - rect.top) / rect.height - .5) * -6;
    if (!frame) frame = requestAnimationFrame(() => {
      stage.style.setProperty('--pointer-x', `${x}deg`);
      stage.style.setProperty('--pointer-y', `${y}deg`);
      frame = 0;
    });
  });
  stage.addEventListener('pointerleave', reset);
  document.addEventListener('visibilitychange', reset);
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      if (!visible) reset();
    });
    observer.observe(stage);
    window.addEventListener('pagehide', () => { observer.disconnect(); reset(); }, { once: true });
  }
  sync();
})();
