# Caden Toh — Portfolio

Vanilla HTML, CSS and JavaScript portfolio with an original CSS 3D capability console.

Run locally with `python -m http.server 8000`, then open http://localhost:8000. No build or installation is required. Opening `index.html` directly also works.

The three console keys switch between machine learning, analytics and software, updating the display, HTML explanation and project link. Mouse movement adds bounded perspective on desktop. Touch and keyboard users use the same native buttons. Pause motion stops the perspective effect and scene transitions; reduced-motion preferences are respected automatically. Content and project links remain available without JavaScript.

`script.js` maintains navigation, project filters, search and contact controls. `workbench.js` owns the hero interaction. `style.css` contains the shared styles and responsive portfolio design.

Validation: `node --check script.js`, `node --check workbench.js`, and `node tests/portfolio.cjs`. The browser check uses Node 22+ and Chrome at its standard Windows installation path; it starts a temporary local server and isolated browser profile, saves screenshots in ignored `.qa/`, and closes the processes it starts. It checks four viewport sizes, scene selection, project links, keyboard activation, project search, mobile navigation, reduced motion and static content with JavaScript disabled. Change the Chrome path in the test for other systems.

Design reference: https://github.com/Abhiz2411/3D-interactive-portfolio — used for visual inspiration only. No source code, Spline models or assets were copied. The console is original CSS geometry; existing portfolio images and content are retained. Existing Google Fonts imports remain.

Suggested commit: `Redesign portfolio with interactive 3D capability console`
