"""Turn the official German Scrum Guide 2020 PDF (GermanScrumTranslators, v3.5) into an HTML fragment.
Text is taken verbatim from the PDF; only line breaks and page breaks are undone.
Usage: python3 build_de.py guide-de.pdf out.html"""
import sys, re, html, json, collections
import pymupdf as fitz

SRC, OUT = sys.argv[1], sys.argv[2]
doc = fitz.open(SRC)

# German heading -> id shared with the English guide (so the language toggle keeps the reader's place)
IDS = {
    "Der Sinn des Scrum Guides": "sg-purpose-of-the-scrum-guide", "Scrum-Definition": "sg-scrum-definition",
    "Scrum-Theorie": "sg-scrum-theory", "Transparenz": "sg-transparency", "Überprüfung": "sg-inspection",
    "Anpassung": "sg-adaptation", "Scrum-Werte": "sg-scrum-values", "Scrum Team": "sg-scrum-team",
    "Developer:innen": "sg-developers", "Product Owner:in": "sg-product-owner", "Scrum Master:in": "sg-scrum-master",
    "Scrum Events": "sg-scrum-events", "Der Sprint": "sg-sprint", "Sprint Planning": "sg-sprint-planning",
    "Daily Scrum": "sg-daily-scrum", "Sprint Review": "sg-sprint-review", "Sprint Retrospective": "sg-sprint-retrospective",
    "Scrum-Artefakte": "sg-scrum-artifacts", "Product Backlog": "sg-product-backlog",
    "Commitment: Produkt-Ziel": "sg-commitment-product-goal", "Sprint Backlog": "sg-sprint-backlog",
    "Commitment: Sprint-Ziel": "sg-commitment-sprint-goal", "Increment": "sg-increment",
    "Commitment: Definition of Done": "sg-commitment-definition-of-done", "Schlussbemerkung": "sg-end-note",
    "Danksagungen": "sg-acknowledgements", "Personen": "sg-people", "Scrum-Guide-Historie": "sg-scrum-guide-history",
}

def level(span):
    s, c = round(span["size"], 1), span["color"]
    if c == 36020 and s == 18.0: return 3
    if c == 36020 and s == 16.1: return 4
    if c == 36020 and s == 13.0: return 5
    if c == 6710886 and s == 12.0: return 6
    return 0

def inline(spans):
    out = ""
    for s in spans:
        t = html.escape(s["text"], quote=False)
        if "Italic" in s["font"] and t.strip(): t = f"<em>{t}</em>"
        elif "Bold" in s["font"] and t.strip(): t = f"<strong>{t}</strong>"
        out += t
    return out

# 1) rows: spans grouped by page and baseline, page numbers and the table of contents removed
rows = []
for pno in range(len(doc)):
    if pno in (0, 2): continue  # cover (rebuilt below) and table of contents
    by_y = collections.defaultdict(list)
    for b in doc[pno].get_text("dict")["blocks"]:
        for l in b.get("lines", []):
            by_y[round(l["bbox"][1])].append(l)
    for y in sorted(by_y):
        ls = sorted(by_y[y], key=lambda l: l["bbox"][0])
        text = "".join(s["text"] for l in ls for s in l["spans"])
        if re.fullmatch(r"\s*\d+\s*", text) and ls[0]["bbox"][0] > 400: continue
        cols = [(round(l["bbox"][0]), l["spans"]) for l in ls]
        rows.append({"p": pno, "y": y, "x": cols[0][0], "cols": cols, "text": text})

# 2) blocks
blocks = []  # (kind, data)
cur = None   # current paragraph / list item being filled: dict(kind, parts)
def flush():
    global cur
    if cur: blocks.append(cur); cur = None
def join(a, b):
    a = a.rstrip(); b = b.lstrip()
    if not a: return b
    if re.search(r"[A-Za-zÄÖÜäöüß]-$", a) or re.search(r"[A-Za-zÄÖÜäöüß]-</(em|strong)>$", a): return a + b
    return a + " " + b

table_mode = False
prev = None
for r in rows:
    spans = [s for _, sp in r["cols"] for s in sp]
    first = next((s for s in spans if s["text"].strip()), None)
    if first is None: continue  # blank rows are unreliable; paragraph breaks come from the vertical gap
    if prev is not None:
        gap_break = (r["p"] == prev["p"] and r["y"] - prev["y"] > 22) or (r["p"] != prev["p"] and re.search(r"[.:!?”\"]\s*$", prev["text"]))
        if gap_break and not (table_mode and cur and cur["kind"] == "tr"): flush()
    prev = r
    lv = level(first)
    if lv:
        flush(); table_mode = False
        t = r["text"].strip()
        if blocks and blocks[-1]["kind"] == "h" and blocks[-1]["lv"] == lv and blocks[-1]["p"] == r["p"] and r["y"] - blocks[-1]["y"] < 25:
            blocks[-1]["t"] = join(blocks[-1]["t"], t); blocks[-1]["y"] = r["y"]; continue
        blocks.append({"kind": "h", "lv": lv, "t": t, "p": r["p"], "y": r["y"]})
        if t in ("Kontaktinformationen", "Änderungshistorie der Übersetzung"): table_mode = True
        continue
    # two-column tables at the end (contacts, translation history, glossary)
    multi = len(r["cols"]) >= 2 and r["cols"][1][0] - r["cols"][0][0] > 60 and not first["text"].strip() in ("●", "•")
    if r["p"] >= 17 and r["text"].strip().startswith("Englischer Begriff"): table_mode = True
    if table_mode and (multi or (r["x"] >= 150 and cur and cur["kind"] == "tr")):
        if multi:
            flush()
            cur = {"kind": "tr", "cells": [x for x in (inline(c[1]).strip() for c in r["cols"]) if x], "head": "Bold" in first["font"]}
        else:
            cur["cells"][-1] = join(cur["cells"][-1], inline(spans))
        continue
    if table_mode and cur and cur["kind"] == "tr": flush()
    t = first["text"].strip()
    bullet = t in ("●", "•") or re.match(r"^\d+\.\s", r["text"].strip())
    if bullet:
        flush()
        body = inline(spans).strip()
        body = re.sub(r"^(●|•)\s*", "", body)
        num = re.match(r"^(\d+)\.\s*", body)
        kind = "ol" if num else "ul"
        if num: body = body[num.end():]
        cur = {"kind": "li", "list": kind, "t": body}
        continue
    if cur and cur["kind"] == "li" and r["x"] >= 85:
        cur["t"] = join(cur["t"], inline(spans)); continue
    if r["x"] > 150 and not table_mode and not (cur and cur["kind"] == "p" and cur["t"].startswith("This publication")):  # a centred line such as the list of the five values
        flush(); blocks.append({"kind": "p", "t": inline(spans).strip(), "x": r["x"]}); continue
    if cur and cur["kind"] == "p" and cur.get("x", 72) <= 150:
        cur["t"] = join(cur["t"], inline(spans)); continue
    flush()
    cur = {"kind": "p", "t": inline(spans).strip(), "x": r["x"]}
flush()

# 3) html
out = ['<header class="sg-cover"><p class="sg-authors">Ken Schwaber &amp; Jeff Sutherland</p><h2>Der Scrum Guide</h2><p class="sg-sub">Der gültige Leitfaden für Scrum: Die Spielregeln</p><p class="sg-date">November 2020</p></header>']
used = set(); i = 0
def slug(t):
    s = re.sub(r"[^a-z0-9äöüß]+", "-", t.lower()).strip("-")
    return "sg-de-" + s.replace("ä", "ae").replace("ö", "oe").replace("ü", "ue").replace("ß", "ss")
while i < len(blocks):
    b = blocks[i]
    if b["kind"] == "h":
        hid = IDS.get(b["t"]) or slug(b["t"])
        assert hid not in used, hid; used.add(hid)
        out.append(f'<h{b["lv"]} id="{hid}">{html.escape(b["t"], quote=False)}</h{b["lv"]}>')
    elif b["kind"] == "li":
        kind = b["list"]; items = []
        while i < len(blocks) and blocks[i]["kind"] == "li" and blocks[i]["list"] == kind:
            items.append(f'<li>{blocks[i]["t"].strip()}</li>'); i += 1
        out.append(f"<{kind}>" + "".join(items) + f"</{kind}>"); continue
    elif b["kind"] == "tr":
        rws = []
        while i < len(blocks) and blocks[i]["kind"] == "tr":
            tag = "th" if blocks[i]["head"] else "td"
            rws.append("<tr>" + "".join(f"<{tag}>{c}</{tag}>" for c in blocks[i]["cells"]) + "</tr>"); i += 1
        out.append('<table class="sg-table">' + "".join(rws) + "</table>"); continue
    else:
        t = re.sub(r"  +", " ", b["t"].strip())
        cls = ""
        if t.startswith("This publication is offered for license") or t.startswith("© 2020 Ken Schwaber"): cls = ' class="sg-legal"'
        elif b.get("x", 72) > 150 and len(t) < 80: cls = ' class="sg-center"'
        out.append(f"<p{cls}>{t}</p>")
    i += 1
missing = [k for k, v in IDS.items() if v not in used]
assert not missing, missing
open(OUT, "w").write("\n".join(out))
print(len(blocks), "blocks;", len(used), "headings;", OUT)
