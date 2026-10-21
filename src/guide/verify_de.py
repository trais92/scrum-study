# Independent check: every word of the official PDF (as pdftotext reads it) appears in the HTML, and nothing else.
import re, html, collections, subprocess, sys
raw = subprocess.run(["pdftotext", sys.argv[1], "-"], capture_output=True, text=True).stdout
pages = raw.split("\f")
pages = [p for i, p in enumerate(pages) if i != 2]   # drop the table of contents page
txt = "\n".join(pages)
txt = re.sub(r"(?m)^\s*\d+\s*$", " ", txt)            # page numbers
txt = re.sub(r"([A-Za-zÄÖÜäöüß])-\n\s*", r"\1-", txt)  # compound words broken at line end
words = lambda t: collections.Counter(w for w in re.findall(r"[^\s]+", t.replace(" ", " ")))
a = words(txt)
h = open(sys.argv[2]).read()
h = re.sub(r"<(td|th)>", " ", h); h = re.sub(r"<[^>]+>", " ", h); h = html.unescape(h)
h = re.sub(r"([A-Za-zÄÖÜäöüß])- ", r"\1-", h)
b = words(h)
miss, extra = a - b, b - a
print("pdf words", sum(a.values()), "html words", sum(b.values()))
print("missing in html:", dict(miss))
print("extra in html:", dict(extra))
# Order check: the words must also come in the same order (ignoring list markers and hyphen splits).
import difflib
norm = lambda t: [w.replace("-", "") for w in re.findall(r"[^\s]+", t) if w not in ("●", "•") and not re.fullmatch(r"\d\.", w)]
sa, sb = norm(txt), norm(h)
ops = [o for o in difflib.SequenceMatcher(None, sa, sb, autojunk=False).get_opcodes() if o[0] != "equal"]
print("order differences:", len(ops))
print("first difference at word", ops[0][1] if ops else None, "of", len(sa), "| table section starts at word", sa.index("Kontaktinformationen"))
