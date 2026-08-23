from pathlib import Path
import re
import fitz

ROOT = Path(__file__).resolve().parents[1]
PDF_DIR = ROOT / 'assets' / 'resources'
OLD = re.compile(r'\bStudo\b', re.IGNORECASE)
NEW = 'Chee Skool'


def color_tuple(value):
    return tuple(channel / 255 for channel in fitz.sRGB_to_rgb(int(value or 0)))


def rebrand_pdf(path: Path) -> int:
    doc = fitz.open(path)
    changed = 0
    for page in doc:
        replacements = []
        for block in page.get_text('dict').get('blocks', []):
            for line in block.get('lines', []):
                spans = line.get('spans', [])
                text = ''.join(span.get('text', '') for span in spans)
                if not OLD.search(text):
                    continue
                replacement = OLD.sub(NEW, text)
                first = spans[0]
                bbox = fitz.Rect(line['bbox'])
                bbox.x0 -= 0.8
                bbox.y0 -= 0.5
                bbox.x1 += 0.8
                bbox.y1 += 0.5
                origin = fitz.Point(*first.get('origin', (line['bbox'][0], line['bbox'][3])))
                size = float(first.get('size', 8.5))
                available = page.rect.width - origin.x - 30
                width = fitz.get_text_length(replacement, fontname='helv', fontsize=size)
                if width > available and width > 0:
                    size *= available / width
                replacements.append((origin, replacement, size, color_tuple(first.get('color', 0))))
                page.add_redact_annot(bbox, fill=None)
                changed += 1
        if replacements:
            page.apply_redactions()
            for origin, replacement, size, color in replacements:
                page.insert_text(origin, replacement, fontname='helv', fontsize=size, color=color, overlay=True)

    metadata = dict(doc.metadata or {})
    metadata_changed = False
    for key, value in list(metadata.items()):
        if isinstance(value, str) and OLD.search(value):
            metadata[key] = OLD.sub(NEW, value)
            metadata_changed = True
    if metadata_changed:
        doc.set_metadata(metadata)

    if changed or metadata_changed:
        tmp = path.with_suffix('.rebrand.tmp.pdf')
        doc.save(tmp, garbage=4, deflate=True)
        doc.close()
        tmp.replace(path)
    else:
        doc.close()
    return changed


def main():
    files = sorted(PDF_DIR.glob('*.pdf'))
    changed_files = 0
    changed_lines = 0
    for pdf in files:
        count = rebrand_pdf(pdf)
        if count:
            changed_files += 1
            changed_lines += count
    print(f'Rebranded {changed_files}/{len(files)} PDFs; replaced {changed_lines} visible text lines.')


if __name__ == '__main__':
    main()
