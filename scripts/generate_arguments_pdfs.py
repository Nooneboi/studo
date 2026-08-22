from pathlib import Path
from html import escape
from weasyprint import HTML
from arguments_pdf_content import UNITS

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets' / 'resources'
OUT.mkdir(parents=True, exist_ok=True)
FONT_REGULAR = '/usr/share/fonts/opentype/inter/Inter-Regular.otf'
FONT_SEMI = '/usr/share/fonts/opentype/inter/Inter-SemiBold.otf'

CSS = f'''\n@font-face {{ font-family: Inter; src: url("file://{FONT_REGULAR}"); font-weight: 400; }}\n@font-face {{ font-family: Inter; src: url("file://{FONT_SEMI}"); font-weight: 600; }}\n@page {{ size: Letter; margin: 0.68in 0.72in 0.70in 0.72in;\n  @bottom-left {{ content: "Studo - GED RLA Arguments & Sources"; font-family: Inter; font-size: 8.5pt; color: #5A5864; }}\n  @bottom-right {{ content: counter(page); font-family: Inter; font-size: 8.5pt; color: #5A5864; }}\n}}\n* {{ box-sizing: border-box; }}\nbody {{ font-family: Inter, sans-serif; color:#22212A; font-size:13.5pt; line-height:1.38; margin:0; }}\nh1 {{ font-size:23pt; line-height:1.18; color:#51439C; font-weight:600; margin:0 0 7pt; }}\n.subtitle {{ color:#5A5864; font-size:11.5pt; margin:0 0 18pt; }}\nh2 {{ font-size:16pt; line-height:1.25; margin:15pt 0 6pt; font-weight:600; }}\nh3 {{ font-size:13.5pt; line-height:1.25; color:#51439C; margin:12pt 0 5pt; font-weight:600; }}\np {{ margin:0 0 8pt; }}\nul {{ margin:4pt 0 10pt 20pt; padding:0; }}\nli {{ margin:0 0 5pt; }}\n.callout {{ background:#F0EDFF; border:0.8pt solid #DDD8F4; border-radius:6pt; padding:10pt 12pt; margin:7pt 0 10pt; }}\n.choice {{ margin:3pt 0 3pt 10pt; }}\n.answer {{ margin:0 0 7pt 8pt; font-size:12.3pt; }}\n.small {{ font-size:11.5pt; color:#5A5864; }}\n.exercise {{ break-inside: avoid; margin-top:9pt; }}\n.page-break {{ break-before: page; }}\n.rule {{ border-top:1pt solid #DDD8F4; margin:12pt 0 10pt; }}\n''' 

def para(text, cls=''):
    return f'<p{(" class=""+cls+""") if cls else ""}>{escape(text)}</p>'

def guide_html(u):
    chunks = [f'<h1>{escape(u["title"])}</h1>', '<p class="subtitle">Study Guide - Arguments &amp; Sources</p>']
    sections = [
        ('1. Learning goal', u['goal']),
        ('2. What this skill means', u['explain']),
        ('3. Do not confuse it with', u['contrast']),
        ('4. How GED-style questions may ask it', u['wording']),
    ]
    for h, t in sections:
        chunks += [f'<h2>{escape(h)}</h2>', para(t)]
    chunks += ['<h2>5. Repeatable method</h2>', '<ul>' + ''.join(f'<li>{escape(x)}</li>' for x in u['method']) + '</ul>']
    chunks += ['<h2>6. Worked example</h2>', f'<div class="callout">{escape(u["example_text"])}</div>', para('Question: ' + u['example_q']), para('Reasoning: ' + u['example_reason']), para('Best answer: ' + u['example_answer'])]
    chunks += ['<h2>7. Common traps</h2>', '<ul>' + ''.join(f'<li>{escape(x)}</li>' for x in u['traps']) + '</ul>']
    chunks += ['<h2>8. Diagnostic help</h2>', '<ul>' + ''.join(f'<li>{escape(x)}</li>' for x in u['diagnostic']) + '</ul>']
    chunks += ['<h2>9. Quick check</h2>', f'<div class="callout">{escape(u["quick_text"])}</div>', para(u['quick_q']), f'<p class="small"><strong>Check yourself:</strong> {escape(u["quick_answer"])}</p>']
    return '\n'.join(chunks)

def workbook_html(u, level):
    exercises = u['wb1' if level == 1 else 'wb2']
    label = 'Workbook 1 - Learn' if level == 1 else 'Workbook 2 - Apply'
    directions = ('Work slowly. Identify exactly what the source says before you decide what the evidence can support.' if level == 1 else 'Treat each item as close-choice practice. Preserve scope, certainty, and the exact job of each piece of evidence.')
    chunks = [f'<h1>{escape(u["title"])}</h1>', f'<p class="subtitle">{escape(label)} - Focused practice</p>', '<h2>Directions</h2>', para(directions)]
    for i, e in enumerate(exercises, 1):
        chunks += [f'<section class="exercise"><h3>Exercise {i}</h3>', f'<div class="callout">{escape(e["text"])}</div>', para('Task: ' + e['task'])]
        for letter, choice in zip('ABCD', e.get('choices', [])):
            chunks.append(f'<p class="choice">{letter}. {escape(choice)}</p>')
        chunks.append('</section>')
    chunks += ['<div class="page-break"></div>', '<h1>Answer reasoning</h1>', '<p class="subtitle">Check your reasoning, not only your answer.</p>', para('For every question, compare your reasoning with the explanation. If you missed the item, identify the exact step where your reasoning changed the source or used evidence for the wrong job.')]
    for i, e in enumerate(exercises, 1):
        chunks += [f'<section class="exercise"><h3>Exercise {i}</h3>', f'<p class="answer"><strong>Best answer:</strong> {escape(e["answer"])}</p>', f'<p class="answer"><strong>Why:</strong> {escape(e["why"])}</p></section>']
    chunks += ['<h2>Mistake check</h2>', para('For every miss, label the reason: wrong claim, evidence mismatch, too broad or too certain, reasoning gap, source or format confusion, or rushed reading. Then write one sentence explaining what you will check next time.')]
    return '\n'.join(chunks)

def write_pdf(path, body):
    html = f'<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head><body>{body}</body></html>'
    HTML(string=html, base_url=str(ROOT)).write_pdf(str(path))

def main():
    created=[]
    for unit in UNITS:
        guide = OUT / f'arguments-{unit["slug"]}-study-guide.pdf'
        wb1 = OUT / f'arguments-{unit["slug"]}-workbook-1.pdf'
        wb2 = OUT / f'arguments-{unit["slug"]}-workbook-2.pdf'
        write_pdf(guide, guide_html(unit)); created.append(guide)
        write_pdf(wb1, workbook_html(unit, 1)); created.append(wb1)
        write_pdf(wb2, workbook_html(unit, 2)); created.append(wb2)
    print(f'Generated {len(created)} Arguments PDFs')
    for p in created: print(p.relative_to(ROOT))

if __name__ == '__main__':
    main()
