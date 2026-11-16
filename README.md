# Caden Toh — Build Desk portfolio

A static HTML/CSS/JavaScript portfolio for AI, data and technology internship applications. No frontend framework, package installation, backend or API key is needed. System fonts (Arial, Georgia and Courier New) avoid third-party font requests.

## Run locally

From the repository directory, with Python 3:

```powershell
python tools/build.py
python tools/serve.py
```

Open http://localhost:8000/portfolio-website/. Stop with Ctrl+C. The preview serves only `dist/`, so local research notes, source tooling and the superseded PDF are not exposed. Generated root HTML can also be opened directly for a quick preview.

## Edit content and assets

- `content.json`: identity/contact fields and the four project records. Project summaries and detail pages share these records.
- `tools/build.py`: static page templates; edit profile, education, experience and shared navigation here. Run the generator after editing either file. Generated HTML is committed so GitHub Pages can remain buildless if needed.
- `style.css`: colour tokens, layouts, original typographic covers, console illustration and responsive styles.
- `script.js`: progressive enhancement for navigation and capability selection. Keep its three short capability descriptions aligned with the corresponding project records.
- `assets/images/profile.jpeg`: existing portrait, reused after inspection.
- `assets/images/graduate-employment-dashboard.png`: original shared dashboard. Its Caden-labelled charts are his contribution; the remaining charts are a teammate's work. The detail page links to the full-size original.
- Other project covers are illustrative HTML/CSS, not fabricated screenshots. Sentiment and SQL repositories were not supplied, so they have no invented source links.

The console uses native buttons and HTML explanations with `aria-pressed` and a polite live region. It contains no continuous animation or WebGL render loop; only short press/hover transitions occur. Reduced motion disables these transitions. With JavaScript disabled, navigation, profile, all projects and the default Models illustration remain available.

## Resume status — action needed

The requested `Grey Modern Profesional Resume (1)(1).pdf` was not found in the workspace and could not be read. The existing `assets/resume.pdf` was rendered and visually verified as Caden's **older** resume. It has different projects and coursework from the supplied current facts. Its contents have not been changed.

All Resume links currently go to `resume.html`, which offers an email request for the current copy. The older PDF is excluded from `dist/`. To enable a download, replace `assets/resume.pdf` with the verified current PDF, change the resume destinations in `tools/build.py`, and copy that single canonical asset into `dist/assets/` in the build step. Do not generate a replacement resume from the website copy.

## Sources and omissions

Profile, GPA 3.91, education dates, employment, leadership, medal, listed distinctions and the three academic projects use the user-supplied verified resume facts. LinkedIn content was inaccessible; no additional LinkedIn facts were used.

Analogy Tutor is included following the user's clarification. Its public README, `server.js` and `server/groq-provider.js` were inspected on 16 November 2026. The source implements separate scripted and generated modes and a real Groq API request. The portfolio describes it as a prototype. Live generated responses and the project's interactive graphics were not run or independently validated.

Omitted: old CNN accuracy claims, VAE, burnout chatbot, Prudential project, NDP participation, certifications and old resident-data Power BI claims. The older resume lists some of these, but they are outside the approved selected work and were not independently verified against their project source. Its listed coursework differs from the latest supplied facts; the site uses the explicitly supplied current distinction list. No semester results, model scores, dataset sizes, business-impact figures or employment dates beyond the approved brief were added. Private source inventory and verification notes are in ignored `.qa/`, outside the served artifact.

Old `cnn.html`, `chatbot.html`, `prudential.html` and `vae.html` URLs now show a short retirement notice linking to selected work. The existing Power BI and SQL paths are retained.

## Verification

```powershell
python tools/build.py
node --check script.js
node tests/portfolio.cjs
```

The browser check requires Node 22+ and Chrome. Default executable: `C:/Program Files/Google/Chrome/Application/chrome.exe`; override with `CHROME_PATH` if needed. It starts and closes its own server and headless browser, tests the `/portfolio-website/` base path, and writes ignored screenshots to `.qa/`.

Passed: 1440×900, 768×1024, 390×844 and 320×740 layouts; no horizontal overflow; all capability states and destinations; Enter activation and focus outline; mobile menu open/close/Escape; local links and assets across project/resume pages; reduced-motion CSS; no-JavaScript content/navigation; no runtime exceptions or missing asset responses. Desktop, tablet, mobile and project screenshots were captured and inspected. Public output was searched for prohibited reference-specific names/claims and encoding corruption with no matches. No performance score or full accessibility certification is claimed. External profile destinations and live tutor generation are not covered by the browser suite.

## Publishing after review

No `.github` Pages workflow existed in this checkout. No deployment or repository setting has been changed.

`python tools/build.py` prepares `dist/` as the publication artifact, containing only public pages and the two used images. All local paths are relative and work beneath `/portfolio-website/`.

An inactive manual deployment workflow is provided at `tools/github-pages.yml.example`. After review, copy it to `.github/workflows/pages.yml`, configure GitHub Pages to use Actions if needed, and run the workflow manually. Publish `dist/`, not the whole checkout, to exclude research notes, unused assets and the old PDF. The example has no push trigger and is not active at its current path.

Suggested commit message: `Redesign portfolio as Build Desk with verified project studies`
