# Caden Toh — Build Desk portfolio

One continuous portfolio at `/portfolio-website/`, with static profile content, inline project case studies and an automatically advancing capability console. React/Three.js enhances only the console illustration; the rest remains HTML/CSS/JavaScript. TypeScript, Tailwind and shadcn-compatible aliases are configured.

## Run and check

Requires Node.js 22.15+ and Python 3.

```powershell
npm ci
npm run build
npm run preview
```

Open http://localhost:8000/portfolio-website/. Stop the preview with Ctrl+C. The server exposes only `dist/`, excluding research notes, unused images, tooling and the older resume.

```powershell
npm test
```

The browser suite requires Chrome (default `C:/Program Files/Google/Chrome/Application/chrome.exe`; override `CHROME_PATH` as needed). It starts and closes its own server/browser, uses the real `/portfolio-website/` prefix and saves screenshots in ignored `.qa/`. Timed showcase checks intentionally take about a minute.

## Page and interactions

Navigation uses `#home`, `#projects`, `#about`, `#experience` and `#contact`. Resume links lead to the inline `#resume` note. The header is sticky; native anchor navigation respects its offset and reduced-motion preferences.

Each project has a stable direct link: `#project-sentiment`, `#project-powerbi`, `#project-sql`, `#project-analogy`. Explore/Close buttons toggle inline case studies using `aria-expanded`, `aria-controls` and native `hidden`. Hidden content is removed from keyboard navigation. Opening/closing a disclosure preserves the current position; following an explicit project link reveals its study and scrolls to the project. Without JavaScript, all case studies remain readable.

Models → Data → Software advances every six seconds. `script.js` owns the sole writable showcase state and progression timer; React observes its projection for the shader. A decorative progress line follows the same interval. Manual selection pauses until Resume showcase is explicitly chosen. Pointer hover, keyboard focus, offscreen visibility and hidden tabs temporarily suspend progression. Returning starts a fresh full interval. Reduced motion defaults to a static state with manual selection available; visitors can explicitly resume the showcase. Automatic transitions neither move focus nor announce content; manual selections use a dedicated polite status region.

The shader shares the showcase pause state, respects reduced motion, limits pixel ratio to 1.5, and disposes resources. WebGL failure has a CSS fallback; missing JavaScript retains the HTML console illustration. There is no wheel interception, body lock, fullscreen video sequence or automatic page scrolling.

Existing project URLs redirect to their corresponding homepage anchors. The older CNN, chatbot, Prudential and VAE paths redirect to selected work. `resume.html` redirects to `#resume`; the superseded `motion-study.html` redirects to `#home`. These are compatibility documents, not separate content routes.

## Editing

- `content.json`: shared project titles, summaries, tools, contribution, approach, limitations, evidence and source links.
- `tools/build.py`: page templates, profile/education/experience copy, inline studies and compatibility documents. Run `npm run build` after edits. Generated HTML is committed for static review.
- `script.js`: navigation, disclosures and showcase controller. Keep its short capability descriptions aligned with project content.
- `style.css`: main design tokens, editorial typography, responsive layouts and disclosure/showcase styles. System Arial, Georgia and Courier New avoid font downloads.
- `components/ui/shader-animation.tsx`: typed reusable shader; `components/demo.tsx` retains its reusable RGB demo. Portfolio colouring is amber.
- `src/shader-entry.tsx`: the small React mount. `src/styles.css`: Tailwind utilities and shader styling without global Preflight.
- `components.json`, `tsconfig.json`, `vite.config.ts`: shadcn, TypeScript and Vite setup. `@/components/ui` maps to root `components/ui`; `lib/utils.ts` supplies `cn`. No context providers are required. For future components, use `npx shadcn@latest add <component>` and review the output; no reinitialization is needed.
- `assets/shader/`: ignored generated React/Three bundle; the build copies only current bundles into `dist/`.

Setup references: [shadcn Vite](https://ui.shadcn.com/docs/installation/vite), [shadcn aliases](https://ui.shadcn.com/docs/components-json), [Tailwind Vite](https://tailwindcss.com/docs/installation/using-vite).

## Assets, accuracy and resume status

The portrait is the existing `assets/images/profile.jpeg`. The original `graduate-employment-dashboard.png` is shared group work: Caden-labelled panels show his contribution; other panels belong to a teammate. Other covers and workflow diagrams are illustrative, not fabricated screenshots or technical results.

Identity, GPA 3.91, current education, three academic projects, employment, leadership and distinctions use the user's supplied verified facts. LinkedIn content was inaccessible; no additional facts were taken from it. Analogy Tutor is included following the user's explicit clarification. Its README, server routes and Groq provider source were inspected; it is labelled a prototype, with scripted and generated modes distinguished. Live model responses were not tested.

The requested `Grey Modern Profesional Resume (1)(1).pdf` was absent. The existing `assets/resume.pdf` was visually verified as Caden's older resume, with different projects and coursework. It remains unchanged and is excluded from the public artifact. The inline Resume note offers an email request for the current copy. To enable a download, replace the one canonical `assets/resume.pdf` with the verified current PDF, update the links in `tools/build.py`, and explicitly copy it into `dist/assets/` during the build. Do not generate a resume from portfolio copy.

Omitted: old CNN metrics, VAE, burnout chatbot, Prudential work, NDP participation, certifications and superseded resident-data Power BI descriptions. The older resume contains some of these, but they are outside the approved selected work and were not independently checked against project source. Current distinctions follow the user's latest verified list. No model scores, semester results, dataset sizes or business-impact figures were invented. Private research notes remain in ignored `.qa/` and are never served.

## Publishing after review

`npm run build` produces `dist/` with relative asset paths suitable for GitHub Pages. No deployment is activated. An inactive manual workflow lives at `tools/github-pages.yml.example`; after review, copy it to `.github/workflows/pages.yml`, configure Pages for Actions if necessary, and run it manually. It installs dependencies and builds the public artifact. Publish `dist/`, not the whole checkout.

## Validation scope

The suite checks real six-second progression, manual persistence, explicit pause/resume, hover/focus/offscreen/actual hidden-tab suspension, fresh intervals after returning, reduced motion, keyboard selection, inline expansion and scroll stability, direct links, legacy redirects, navigation and asset paths, local resume/email/source destinations, and static content without JavaScript. Layouts cover 1440×900, 768×1024, 390×844 and 320×740. It does not claim a performance score, full accessibility compliance, live tutor API verification or current availability of external profile destinations.

Suggested commit: `Unify portfolio with inline case studies and an accessible animated showcase`
