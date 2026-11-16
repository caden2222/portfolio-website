"""Generate committed HTML and a clean GitHub Pages artifact, using Python stdlib."""
import json
import shutil
from pathlib import Path
from html import escape as e

ROOT = Path(__file__).resolve().parent.parent
data = json.loads((ROOT / 'content.json').read_text(encoding='utf-8'))
projects = data['projects']

def head(title, prefix=''):
    return f'''<!doctype html>
<html lang="en-SG"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{e(title)} | Caden Toh</title><meta name="description" content="Caden Toh, Applied AI &amp; Analytics student at Singapore Polytechnic. Selected projects in machine learning, data analysis and databases.">
<meta name="theme-color" content="#0B1018"><link rel="icon" href="data:,">
<link rel="stylesheet" href="{prefix}style.css"><script src="{prefix}script.js" defer></script></head><body>
<a class="skip-link" href="#main-content">Skip to content</a>
<header class="site-header"><nav class="container nav" aria-label="Main navigation"><a class="wordmark" href="{prefix}index.html">Caden<span> / </span>Toh<span class="mark">.</span></a>
<button class="menu-toggle" aria-expanded="false" aria-controls="navigation-menu" hidden>Menu <span aria-hidden="true">+</span></button>
<div class="nav-links" id="navigation-menu"><a href="{prefix}index.html#projects">Work</a><a href="{prefix}index.html#about">About</a><a href="{prefix}index.html#experience">Experience</a><a href="{prefix}index.html#contact">Contact</a><a class="nav-resume" href="{prefix}resume.html">Resume <span aria-hidden="true">↗</span></a></div></nav></header>'''

def footer(prefix=''):
    return f'''<footer class="container footer"><span>© <span data-year>2026</span> Caden Toh</span><span>Learning. Making. Iterating.</span><a href="#main-content">Back to top ↑</a></footer></body></html>'''

def tags(p):
    return '<ul class="tags" aria-label="Tools">' + ''.join(f'<li>{e(t)}</li>' for t in p['stack']) + '</ul>'

def cover(p):
    if p['slug'] == 'analogy':
        return '<div class="cover cover-model" aria-hidden="true"><span class="cover-label">FIELD NOTES / SOFTWARE PROTOTYPE</span><div class="review-lines"><span>A familiar idea.</span><span>A new way to understand.</span></div><div class="model-types">Q <span>/</span> K <span>/</span> V</div><span class="cover-bottom">SCRIPTED + GENERATED / DISTINCT MODES</span></div>'
    if p['slug'] == 'sentiment':
        return '<div class="cover cover-model" aria-hidden="true"><span class="cover-label">FIELD NOTES / NLP</span><div class="review-lines"><span>“The pizza was…”</span><span>text → sequence → sentiment</span></div><div class="model-types">RNN <span>↔</span> BiGRU</div><span class="cover-bottom">BASELINE / COMPARE / EVALUATE</span></div>'
    if p['slug'] == 'powerbi':
        return '<div class="cover cover-data"><span class="cover-label">FIELD NOTES / ANALYTICS</span><img src="assets/images/graduate-employment-dashboard.png" alt="Group Power BI dashboard of graduate employment and salary trends" loading="lazy" width="1269" height="804"><span class="cover-bottom">2018—2023 / GRADUATE OUTCOMES</span></div>'
    return '<div class="cover cover-sql" aria-hidden="true"><span class="cover-label">FIELD NOTES / DATABASES</span><div class="sql-graphic"><span>EXTRACT</span><i>↓</i><span>TRANSFORM</span><i>↓</i><strong>WAREHOUSE</strong></div><span class="cover-bottom">LIBRARY LOANS / MYSQL</span></div>'

cards = ''.join(f'''<article class="project-card">{cover(p)}<div class="project-copy"><p class="eyebrow">{p['number']} / {e(p['category'])}</p><h3><a href="projects/{p['slug']}.html">{e(p['title'])}<span aria-hidden="true">↗</span></a></h3><p>{e(p['short'])}</p>{tags(p)}<a class="text-link" href="projects/{p['slug']}.html">Explore project <span aria-hidden="true">↗</span></a></div></article>''' for p in projects)

cells = ''.join(f'<i style="--n:{i}" class="{"positive" if i % 5 in (0,1,3) else "neutral"}"></i>' for i in range(48))
home = head('Build Desk') + f'''
<main id="main-content"><section class="hero container" aria-labelledby="hero-title">
<div class="hero-copy"><p class="eyebrow"><span class="status-dot"></span> CADEN TOH / APPLIED AI &amp; ANALYTICS STUDENT</p>
<h1 id="hero-title">Learning deeply.<br>Building<br><em>practically.</em></h1>
<p class="hero-description">I’m Caden, a Year 2 student at Singapore Polytechnic. I explore data, train models and build databases to understand practical business problems.</p>
<div class="actions"><a class="button primary" href="#projects">View projects <span aria-hidden="true">↘</span></a><a class="button secondary" href="resume.html">View resume <span aria-hidden="true">↗</span></a></div>
<p class="hero-footnote">A growing collection of work, questions and things learned.</p></div>
<div class="workbench" data-mode="models"><div class="desk-caption"><span>THE BUILD DESK</span><span>INTERACTIVE STUDY / 01</span></div>
<div class="instrument"><div class="instrument-top"><span class="instrument-brand">CT / CAPABILITY CONSOLE</span><span class="screw" aria-hidden="true">+</span></div>
<div class="display"><div class="display-header"><span id="display-mode">01 / MODELS</span><span>ILLUSTRATIVE VIEW</span></div>
<div class="scene scene-models" aria-hidden="true"><div class="matrix">{cells}</div><div class="scene-side"><span>TEXT INPUT</span><b>↓</b><strong>RNN<br>BiGRU</strong><b>↓</b><span>SENTIMENT</span></div></div>
<div class="scene scene-data" aria-hidden="true"><div class="data-rows"><i></i><i></i><i></i><i></i><i></i></div><span class="scene-arrow">→</span><div class="bars"><i></i><i></i><i></i><i></i><i></i></div></div>
<div class="scene scene-software" aria-hidden="true"><span>LEARNER<br>REQUEST</span><b>→</b><span>SERVER</span><b>→</b><span>TUTOR<br>RESPONSE</span></div>
<div class="display-footer"><span id="display-readout">CLASSIFY / COMPARE / REFINE</span><span aria-hidden="true">▰ ▰ ▱</span></div></div>
<div class="console-controls" role="group" aria-label="Explore capabilities"><button class="console-key" data-capability="models" aria-pressed="true"><span>01</span>Models</button><button class="console-key" data-capability="data" aria-pressed="false"><span>02</span>Data</button><button class="console-key" data-capability="software" aria-pressed="false"><span>03</span>Software</button></div>
<div class="instrument-bottom"><span>SELECT A FIELD TO EXPLORE</span><span class="vents" aria-hidden="true">||||||||||||</span></div></div>
<div class="capability-note" aria-live="polite" aria-atomic="true"><span class="note-index" id="capability-number">01</span><div><h2 id="capability-title">Find patterns in language.</h2><p id="capability-description">Exploring pizza review sentiment with RNN and BiGRU models.</p><a class="text-link" id="capability-link" href="projects/sentiment.html">Explore sentiment analysis ↗</a></div></div>
<p class="desk-disclaimer">An illustration of the workflow, not live model output.</p><noscript><p class="desk-disclaimer">Static Models view. Explore all projects below.</p></noscript></div></section>
<section class="section container" id="projects" aria-labelledby="work-title"><div class="section-heading"><div><p class="eyebrow">01 / SELECTED WORK</p><h2 id="work-title">From questions<br>to working projects.</h2></div><p>Four studies in turning raw information<br>into something easier to understand.</p></div><div class="project-grid">{cards}</div></section>
<section class="section container about" id="about" aria-labelledby="about-title"><div class="about-photo"><img src="assets/images/profile.jpeg" alt="Caden Toh" width="708" height="961" loading="lazy"><span class="photo-caption">CADEN TOH / THE PERSON AT THE DESK</span></div><div class="about-copy"><p class="eyebrow">02 / ABOUT &amp; TOOLBOX</p><h2 id="about-title">Curiosity, with<br>a practical side.</h2><p>I’m studying Applied AI &amp; Analytics at Singapore Polytechnic. My academic projects span data analysis, machine learning and database development.</p><p>I’m interested in applying technology and analytical thinking to practical business problems. Alongside my studies, I lead training and mentor junior members as Vice Captain of SP Lifesavers.</p><div class="toolbox"><div><span class="eyebrow">CORE TOOLS</span><p>Python · SQL / MySQL<br>Power BI · Microsoft Excel</p></div><div><span class="eyebrow">HOW I WORK</span><p>Teamwork &amp; collaboration<br>Analytical thinking<br>Communication &amp; presentation</p></div></div></div></section>
<section class="section container" id="experience" aria-labelledby="experience-title"><div class="section-heading"><div><p class="eyebrow">03 / THE FOUNDATION</p><h2 id="experience-title">Learning in class.<br>Showing up beyond it.</h2></div></div>
<div class="experience-grid"><div><h3 class="column-title">Education</h3><article class="education-panel"><p class="eyebrow">APR 2025 — MAR 2028</p><h4>Singapore Polytechnic</h4><p>Diploma in Applied AI &amp; Analytics<br>Year 2 student</p><p class="gpa">3.91 <span>GPA</span></p><h5>Listed distinctions</h5><ul class="distinctions"><li>Statistics for Data Science</li><li>Data Structures &amp; Algorithms</li><li>AI &amp; Machine Learning</li><li>Deep Learning</li><li>Back-End Web Development</li></ul></article></div>
<div><h3 class="column-title">Leadership &amp; sport</h3><article class="timeline-item"><p class="eyebrow">SP LIFESAVERS</p><h4>Vice Captain</h4><p>Led training sessions and mentored junior members. Supported club activities through planning and team coordination.</p></article><article class="timeline-item"><p class="eyebrow">2026 / NATIONAL LIFESAVING CHAMPIONSHIP</p><h4>Gold Medallist</h4><p>Represented Singapore Polytechnic, applying lifesaving skills and teamwork to earn a gold medal.</p></article></div>
<div><h3 class="column-title">Work experience</h3><article class="timeline-item"><p class="eyebrow">FEB — MAY 2026</p><h4>Kitchen Crew <span>/ OGOG</span></h4><p>Supported kitchen operations and coordinated with teammates during busy service periods.</p></article><article class="timeline-item"><p class="eyebrow">DEC 2024 — FEB 2025</p><h4>Retail Assistant <span>/ Bee Cheng Hiang</span></h4><p>Assisted customers and supported daily store operations through communication and teamwork.</p></article></div></div></section>
<section class="contact container" id="contact" aria-labelledby="contact-title"><div><p class="eyebrow">04 / WHAT’S NEXT</p><h2 id="contact-title">Let’s put curiosity<br><em>to work.</em></h2><p>Have an AI, data or technology internship opportunity?<br>I’d be glad to hear from you.</p><a class="email-link" href="mailto:{data['email']}">{data['email']} ↗</a></div><div class="contact-links"><a href="{data['github']}">GitHub <span>↗</span></a><a href="{data['linkedin']}">LinkedIn <span>↗</span></a><a href="resume.html">View resume <span>↗</span></a></div></section></main>''' + footer()
(ROOT / 'index.html').write_text(home, encoding='utf-8')

for p in projects:
    evidence = f'<a href="../assets/images/graduate-employment-dashboard.png"><img class="evidence-image" src="../assets/images/graduate-employment-dashboard.png" alt="Original shared dashboard, with three panels labelled Caden" width="1269" height="804"></a>' if p['slug'] == 'powerbi' else '<div class="workflow" aria-label="Illustrative workflow">' + ''.join(f'<span>{e(step)}</span>' for step in (['Review text', 'Preprocess', 'RNN / BiGRU', 'Evaluate'] if p['slug'] == 'sentiment' else (['Learner request', 'Selected reply mode', 'Provider', 'Response'] if p['slug'] == 'analogy' else ['Library loans', 'Clean & transform', 'Star schema', 'SQL analysis']))) + '</div>'
    html = head(p['title'], '../') + f'''<main class="container case-study" id="main-content"><a class="text-link" href="../index.html#projects">← All selected work</a><div class="case-heading"><p class="eyebrow">{e(p['context'])}</p><h1>{e(p['title'])}</h1><p class="case-intro">{e(p['short'])}</p>{tags(p)}</div><div class="case-columns"><section><p class="eyebrow">01 / THE QUESTION</p><h2>Problem &amp; objective</h2><p>{e(p['problem'])}</p></section><section><p class="eyebrow">02 / MY PART</p><h2>My contribution</h2><p>{e(p['contribution'])}</p></section></div><section class="case-section"><p class="eyebrow">03 / THE PROCESS</p><h2>Approach &amp; tools</h2><ol class="approach">{''.join(f'<li>{e(s)}</li>' for s in p['approach'])}</ol></section><section class="case-section"><p class="eyebrow">04 / PROJECT RECORD</p><h2>{'Dashboard evidence' if p['slug'] == 'powerbi' else 'Workflow overview'}</h2><p>{e(p['evidence'])}</p>{evidence}</section><div class="case-columns"><section><p class="eyebrow">05 / CONTEXT</p><h2>Limits of this work</h2><p>{e(p['limitation'])}</p></section><section><p class="eyebrow">06 / LEARNING</p><h2>Connecting the pieces</h2><p>{e(p['learning'])}</p></section></div><div class="case-end"><a class="button primary" href="../index.html#projects">More selected work ↗</a><a class="text-link" href="mailto:{data['email']}">Discuss this project ↗</a></div></main>''' + footer('../')
    if p.get('repository'):
        html = html.replace('<div class="case-end">', '<div class="case-end"><a class="text-link" href="' + p['repository'] + '">View source on GitHub ↗</a>')
    (ROOT / 'projects' / f"{p['slug']}.html").write_text(html, encoding='utf-8')

# Preserve incoming URLs without carrying unverified legacy claims forward.
for slug in ['cnn', 'chatbot', 'prudential', 'vae']:
    (ROOT / 'projects' / f'{slug}.html').write_text(head('Selected work', '../') + '<main class="container case-study" id="main-content"><p class="eyebrow">PORTFOLIO UPDATE</p><h1>Explore my current work.</h1><p>This older project page has been retired from the selected portfolio.</p><a class="button primary" href="../index.html#projects">View selected projects ↗</a></main>' + footer('../'), encoding='utf-8')

(ROOT / 'resume.html').write_text(head('Resume') + '<main class="container case-study" id="main-content"><p class="eyebrow">CADEN TOH / RESUME</p><h1>Request my<br>current resume.</h1><p>The current PDF is not available on this site yet. Please email me for a copy.</p><a class="button primary" href="mailto:cadentoh22@gmail.com?subject=Resume%20request">Request by email ↗</a></main>' + footer(), encoding='utf-8')

dist = ROOT / 'dist'
dist.mkdir(exist_ok=True)
old_resume = dist / 'assets' / 'resume.pdf'
if old_resume.exists():
    old_resume.unlink()
for name in ['index.html', 'resume.html', 'style.css', 'script.js']:
    shutil.copy2(ROOT / name, dist / name)
for name in ['projects', 'assets']:
    (dist / name).mkdir(exist_ok=True)
for p in (ROOT / 'projects').glob('*.html'):
    shutil.copy2(p, dist / 'projects' / p.name)
(dist / 'assets' / 'images').mkdir(exist_ok=True)
for name in ['profile.jpeg', 'graduate-employment-dashboard.png']:
    shutil.copy2(ROOT / 'assets' / 'images' / name, dist / 'assets' / 'images' / name)
# The old resume is intentionally excluded pending the supplied current PDF.
(dist / '.nojekyll').touch()
print('Generated home, 4 project studies, 4 legacy landing pages and dist/.')
