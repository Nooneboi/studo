from pathlib import Path
from html import escape
from weasyprint import HTML
from extended_response_pdf_content import UNITS

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets'/'resources'; OUT.mkdir(parents=True,exist_ok=True)
FONT_REGULAR='/usr/share/fonts/opentype/inter/Inter-Regular.otf'
FONT_SEMI='/usr/share/fonts/opentype/inter/Inter-SemiBold.otf'
CSS=f'''@font-face {{font-family:Inter;src:url("file://{FONT_REGULAR}");font-weight:400;}} @font-face {{font-family:Inter;src:url("file://{FONT_SEMI}");font-weight:600;}}
@page {{size:Letter;margin:.68in .72in .70in .72in;@bottom-left{{content:"Studo - GED RLA Extended Response";font-family:Inter;font-size:8.5pt;color:#5A5864;}}@bottom-right{{content:counter(page);font-family:Inter;font-size:8.5pt;color:#5A5864;}}}}
*{{box-sizing:border-box}} body{{font-family:Inter,sans-serif;color:#22212A;font-size:13.4pt;line-height:1.36;margin:0}} h1{{font-size:23pt;color:#51439C;font-weight:600;margin:0 0 7pt}} .subtitle{{color:#5A5864;font-size:11.5pt;margin:0 0 18pt}} h2{{font-size:16pt;margin:14pt 0 6pt;font-weight:600}} h3{{font-size:13.5pt;color:#51439C;margin:12pt 0 5pt}} p{{margin:0 0 8pt}} ul{{margin:4pt 0 10pt 20pt;padding:0}} li{{margin:0 0 5pt}} .callout{{background:#F0EDFF;border:.8pt solid #DDD8F4;border-radius:6pt;padding:10pt 12pt;margin:7pt 0 10pt}} .exercise{{break-inside:avoid;margin-top:9pt}} .page-break{{break-before:page}} .answer{{font-size:12.3pt;margin:0 0 7pt 8pt}} .small{{font-size:11.3pt;color:#5A5864}}'''

def p(text,cls=''):
    return f'<p{(" class="+repr(cls)+"") if False else ""}>{escape(str(text))}</p>'

def guide(u):
    out=[f'<h1>{escape(u["title"])}</h1>','<p class="subtitle">Study Guide - Extended Response</p>']
    for h,key in [('1. Learning goal','goal'),('2. What this skill means','explain'),('3. Do not confuse it with','contrast'),('4. How GED-style questions may ask it','wording')]: out += [f'<h2>{h}</h2>',f'<p>{escape(u[key])}</p>']
    out += ['<h2>5. Repeatable method</h2>','<ul>'+''.join(f'<li>{escape(x)}</li>' for x in u['method'])+'</ul>']
    out += ['<h2>6. Worked example</h2>',f'<div class="callout">{escape(u["example_text"])}</div>',f'<p><strong>Question:</strong> {escape(u["example_q"])}</p>',f'<p><strong>Reasoning:</strong> {escape(u["example_reason"])}</p>',f'<p><strong>Best answer:</strong> {escape(u["example_answer"])}</p>']
    out += ['<h2>7. Common traps</h2>','<ul>'+''.join(f'<li>{escape(x)}</li>' for x in u['common_traps'])+'</ul>']
    out += ['<h2>8. Diagnostic help</h2>','<ul>'+''.join(f'<li>{escape(x)}</li>' for x in u['diagnostic'])+'</ul>']
    out += ['<h2>9. Quick check</h2>',f'<div class="callout">{escape(u["quick_text"])}</div>',f'<p>{escape(u["quick_q"])}</p>',f'<p class="small"><strong>Check yourself:</strong> {escape(u["quick_answer"])}</p>']
    return '\n'.join(out)

def workbook(u,level):
    rows=u['wb1' if level==1 else 'wb2']; label='Workbook 1 - Learn' if level==1 else 'Workbook 2 - Apply'
    out=[f'<h1>{escape(u["title"])}</h1>',f'<p class="subtitle">{label}</p>','<h2>Directions</h2>',f'<p>{"Build the skill in small pieces. Keep every answer source-based." if level==1 else "Apply the skill with less support. Explain the reasoning, not only the final answer."}</p>']
    for i,(text,task,answer) in enumerate(rows,1): out += [f'<section class="exercise"><h3>Exercise {i}</h3>',f'<div class="callout">{escape(text)}</div>',f'<p><strong>Task:</strong> {escape(task)}</p></section>']
    out += ['<div class="page-break"></div>','<h1>Answer reasoning</h1>','<p class="subtitle">Compare your reasoning, not just your wording.</p>']
    for i,(text,task,answer) in enumerate(rows,1): out += [f'<section class="exercise"><h3>Exercise {i}</h3><p class="answer"><strong>Reasoning target:</strong> {escape(answer)}</p></section>']
    out += ['<h2>Mistake check</h2>','<p>If you missed an item, label the cause: task misunderstanding, source drift, weak evidence match, summary without analysis, organization, or sentence clarity. Then redo the item in one precise sentence.</p>']
    return '\n'.join(out)

def write(path,body):
    html=f'<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head><body>{body}</body></html>'
    HTML(string=html,base_url=str(ROOT)).write_pdf(str(path))

def main():
    made=[]
    for u in UNITS:
        for suffix,body in [('study-guide',guide(u)),('workbook-1',workbook(u,1)),('workbook-2',workbook(u,2))]:
            path=OUT/f'er-{u["slug"]}-{suffix}.pdf'; write(path,body); made.append(path)
    print(f'Generated {len(made)} Extended Response PDFs')
if __name__=='__main__': main()
