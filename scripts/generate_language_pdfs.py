from pathlib import Path
from html import escape
from weasyprint import HTML
from language_pdf_content import UNITS

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets' / 'resources'
OUT.mkdir(parents=True, exist_ok=True)
FONT_REGULAR = '/usr/share/fonts/opentype/inter/Inter-Regular.otf'
FONT_SEMI = '/usr/share/fonts/opentype/inter/Inter-SemiBold.otf'

CSS = f'''
@font-face {{ font-family: Inter; src: url("file://{FONT_REGULAR}"); font-weight: 400; }}
@font-face {{ font-family: Inter; src: url("file://{FONT_SEMI}"); font-weight: 600; }}
@page {{ size: Letter; margin: 0.68in 0.72in 0.70in 0.72in;
  @bottom-left {{ content: "Chee Skool - GED RLA Language & Editing"; font-family: Inter; font-size: 8.5pt; color: #5A5864; }}
  @bottom-right {{ content: counter(page); font-family: Inter; font-size: 8.5pt; color: #5A5864; }}
}}
* {{ box-sizing: border-box; }}
body {{ font-family: Inter, sans-serif; color:#22212A; font-size:13.5pt; line-height:1.38; margin:0; }}
body.guide {{ font-size:13.35pt; line-height:1.34; }}
body.guide h2 {{ margin:13pt 0 5pt; }}
body.guide p {{ margin-bottom:7pt; }}
body.guide li {{ margin-bottom:4pt; }}
h1 {{ font-size:23pt; line-height:1.18; color:#51439C; font-weight:600; margin:0 0 7pt; }}
.subtitle {{ color:#5A5864; font-size:11.5pt; margin:0 0 18pt; }}
h2 {{ font-size:16pt; line-height:1.25; margin:15pt 0 6pt; font-weight:600; }}
h3 {{ font-size:13.5pt; line-height:1.25; color:#51439C; margin:12pt 0 5pt; font-weight:600; }}
p {{ margin:0 0 8pt; }}
ul {{ margin:4pt 0 10pt 20pt; padding:0; }}
li {{ margin:0 0 5pt; }}
.callout {{ background:#F0EDFF; border:0.8pt solid #DDD8F4; border-radius:6pt; padding:10pt 12pt; margin:7pt 0 10pt; }}
.er-note {{ background:#F8F7FC; border-left:3pt solid #51439C; padding:9pt 11pt; margin:10pt 0; }}
.choice {{ margin:3pt 0 3pt 10pt; }}
.answer {{ margin:0 0 7pt 8pt; font-size:12.3pt; }}
.small {{ font-size:11.5pt; color:#5A5864; }}
.exercise {{ break-inside: avoid; margin-top:9pt; }}
.page-break {{ break-before: page; }}
'''

def display(text):
    return escape(str(text).replace('{{blank}}', '_____'))

def para(text, cls=''):
    attr = f' class="{cls}"' if cls else ''
    return f'<p{attr}>{display(text)}</p>'

def guide_html(u):
    chunks=[f'<h1>{escape(u["title"])}</h1>','<p class="subtitle">Study Guide - Language &amp; Editing</p>']
    for h,t in [('1. Learning goal',u['goal']),('2. What this skill means',u['explain']),('3. Do not confuse it with',u['contrast']),('4. How GED-style questions may ask it',u['wording'])]:
        chunks += [f'<h2>{escape(h)}</h2>',para(t)]
    chunks += ['<h2>5. Repeatable method</h2>','<ul>'+''.join(f'<li>{escape(x)}</li>' for x in u['method'])+'</ul>']
    chunks += ['<h2>6. Worked example</h2>',f'<div class="callout">{display(u["example_text"])}</div>',para('Question: '+u['example_q']),para('Reasoning: '+u['example_reason']),para('Best answer: '+u['example_answer'])]
    chunks += ['<h2>7. Common traps</h2>','<ul>'+''.join(f'<li>{escape(x)}</li>' for x in u['traps'])+'</ul>']
    chunks += ['<h2>8. Diagnostic help</h2>','<ul>'+''.join(f'<li>{escape(x)}</li>' for x in u['diagnostic'])+'</ul>']
    chunks += [f'<div class="er-note"><strong>Why this matters in ER:</strong> {escape(u["er_note"])}</div>']
    chunks += ['<h2>9. Quick check</h2>',f'<div class="callout">{display(u["quick_text"])}</div>',para(u['quick_q']),f'<p class="small"><strong>Check yourself:</strong> {escape(u["quick_answer"])}</p>']
    return '\n'.join(chunks)

def workbook_html(u,level):
    exercises=u['wb1' if level==1 else 'wb2']
    label='Workbook 1 - Learn' if level==1 else 'Workbook 2 - Apply'
    directions='Focus on the rule and explain why the other choices fail.' if level==1 else 'Treat each item as editing in context. Preserve meaning while fixing grammar, mechanics, and logic.'
    chunks=[f'<h1>{escape(u["title"])}</h1>',f'<p class="subtitle">{escape(label)} - Focused practice</p>','<h2>Directions</h2>',para(directions)]
    for i,e in enumerate(exercises,1):
        chunks += [f'<section class="exercise"><h3>Exercise {i}</h3>',f'<div class="callout">{display(e["text"])}</div>',para('Task: '+e['task'])]
        for letter,choice in zip('ABCD',e.get('choices',[])): chunks.append(f'<p class="choice">{letter}. {display(choice)}</p>')
        chunks.append('</section>')
    chunks += ['<div class="page-break"></div>','<h1>Answer reasoning</h1>','<p class="subtitle">Check the rule and the meaning, not only the letter.</p>',para('For every miss, identify whether the problem was grammar, punctuation, word meaning, sentence logic, or a rushed reading of the context.')]
    for i,e in enumerate(exercises,1):
        chunks += [f'<section class="exercise"><h3>Exercise {i}</h3>',f'<p class="answer"><strong>Best answer:</strong> {escape(e["answer"])}</p>',f'<p class="answer"><strong>Why:</strong> {escape(e["why"])}</p></section>']
    chunks += ['<h2>Mistake check</h2>',para('Rewrite one missed sentence correctly. Then state the rule in one short sentence you could use on a new example.')]
    return '\n'.join(chunks)

def write_pdf(path,body,body_class=''):
    cls=f' class="{body_class}"' if body_class else ''
    html=f'<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head><body{cls}>{body}</body></html>'
    HTML(string=html,base_url=str(ROOT)).write_pdf(str(path))

def main():
    created=[]
    for u in UNITS:
        for suffix,body,body_class in [
            ('study-guide',guide_html(u),'guide'),
            ('workbook-1',workbook_html(u,1),''),
            ('workbook-2',workbook_html(u,2),''),
        ]:
            p=OUT/f'language-{u["slug"]}-{suffix}.pdf'; write_pdf(p,body,body_class); created.append(p)
    print(f'Generated {len(created)} Language PDFs')
    for p in created: print(p.relative_to(ROOT))

if __name__=='__main__': main()
