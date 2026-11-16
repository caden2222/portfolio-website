/* Progressive enhancement; essential content is static HTML. */
(() => {
  'use strict';
  const menu = document.querySelector('.menu-toggle');
  const links = document.querySelector('.nav-links');
  if (menu && links) {
    document.documentElement.classList.add('js');
    menu.hidden = false;
    const close = () => { menu.setAttribute('aria-expanded', 'false'); links.classList.remove('is-open'); };
    menu.addEventListener('click', () => {
      const open = menu.getAttribute('aria-expanded') !== 'true';
      menu.setAttribute('aria-expanded', String(open));
      links.classList.toggle('is-open', open);
    });
    links.addEventListener('click', event => { if (event.target.closest('a')) close(); });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') { close(); menu.focus(); }
    });
    matchMedia('(max-width: 620px)').addEventListener('change', close);
  }
  document.querySelectorAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });
  const desk = document.querySelector('.workbench');
  if (!desk) return;
  const modes = {
    models: ['01', 'MODELS', 'Find patterns in language.', 'Exploring pizza review sentiment with RNN and BiGRU models.', 'sentiment', 'Explore sentiment analysis ↗', 'CLASSIFY / COMPARE / REFINE'],
    data: ['02', 'DATA', 'Look closer at the numbers.', 'Comparing graduate salary and employment patterns in Power BI.', 'powerbi', 'Explore graduate outcomes ↗', 'COMPARE / FILTER / UNDERSTAND'],
    software: ['03', 'SOFTWARE', 'Connect ideas through software.', 'Exploring learning interfaces with scripted and generated reply modes.', 'analogy', 'Explore Analogy Tutor ↗', 'REQUEST / PROCESS / RESPOND']
  };
  desk.querySelectorAll('[data-capability]').forEach(button => button.addEventListener('click', () => {
    const mode = button.dataset.capability;
    const [number, label, title, description, slug, link, readout] = modes[mode];
    desk.dataset.mode = mode;
    desk.querySelectorAll('[data-capability]').forEach(key => key.setAttribute('aria-pressed', String(key === button)));
    document.getElementById('display-mode').textContent = `${number} / ${label}`;
    document.getElementById('display-readout').textContent = readout;
    document.getElementById('capability-number').textContent = number;
    document.getElementById('capability-title').textContent = title;
    document.getElementById('capability-description').textContent = description;
    const target = document.getElementById('capability-link');
    target.href = `projects/${slug}.html`;
    target.textContent = link;
  }));
})();
