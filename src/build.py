"""Build the app: one self-contained HTML page.
Outputs go to ../dist/: scrum-master-on-duty.html (artifact page, no doctype) and index.html (standalone file / GitHub Pages).
The practice bank, six fixed exams, and both Scrum Guide texts are embedded at build time."""
import json, re, sys, pathlib, subprocess, html as H
d = pathlib.Path(__file__).parent
G = d / "guide"
BANK = d.parent / "data" / "questions.json"
EXAM_BANK = d.parent / "data" / "exams.json"
OUT = d.parent / "dist"
OUT.mkdir(exist_ok=True)

# ---- Scrum Guide (English: annotated reader from the PSM I Trainer; German: official GermanScrumTranslators text) ----
# de-body.html is committed; rebuild it from the PDF only when it is missing (needs pymupdf)
if not (G / "de-body.html").exists():
    subprocess.run([sys.executable, str(G / "build_de.py"), str(G / "2020-Scrum-Guide-German.pdf"), str(G / "de-body.html")], check=True)
tips = json.loads((G / "tips.json").read_text(encoding="utf-8"))
en_body = (G / "en-body.html").read_text(encoding="utf-8")
de_body = (G / "de-body.html").read_text(encoding="utf-8")

EN_COVER = ('<header class="sg-cover"><p class="sg-authors">Ken Schwaber &amp; Jeff Sutherland</p><h2>The Scrum Guide</h2>'
            '<p class="sg-sub">The Definitive Guide to Scrum: The Rules of the Game</p><p class="sg-date">November 2020</p></header>'
            '<p class="sg-attrib">Original text: <a href="https://scrumguides.org/scrum-guide.html" target="_blank" rel="noopener">scrumguides.org</a>. '
            'Changes in this app: the dotted-underlined explanations were added for exam practice and are not part of the Scrum Guide. Shared under the same licence, '
            '<a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener">CC BY-SA 4.0</a>.</p>')
EN_LEGAL = ('<p class="sg-legal">© 2020 Ken Schwaber and Jeff Sutherland</p>'
            '<p class="sg-legal">This publication is offered for license under the Attribution Share-Alike license of Creative Commons, '
            'accessible at https://creativecommons.org/licenses/by-sa/4.0/legalcode and also described in summary form at https://creativecommons.org/licenses/by-sa/4.0/. '
            'By utilizing this Scrum Guide, you acknowledge and agree that you have read and agree to be bound by the terms of the Attribution Share-Alike license of Creative Commons.</p>')
DE_ATTRIB = ('<p class="sg-attrib">Offizielle deutsche Übersetzung der GermanScrumTranslators (Übersetzung Version 3.5, Glossar Stand 15.06.2022), '
             'veröffentlicht auf <a href="https://scrumguides.org/download.html" target="_blank" rel="noopener">scrumguides.org</a>. '
             '© 2020 Ken Schwaber and Jeff Sutherland, lizenziert unter <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener">CC BY-SA 4.0</a>. '
             'Änderungen in dieser App: Der Text ist unverändert. Die gepunktet unterstrichenen Begriffe zeigen den offiziellen englischen Begriff und eine englische Erklärung für die Prüfungsvorbereitung; sie sind nicht Teil des Scrum Guides.</p>')

# German term -> explanation index (first match per paragraph; longest phrases first)
DE_TERMS = [
    (r"Commitment, Fokus, Offenheit, Respekt und Mut", 14), (r"Refinement", 32), (r"Sprint Retrospective", 27),
    (r"Sprint Planning", 26), (r"Sprint Review", 23), (r"Sprint Backlogs?", 20), (r"Product Backlogs?", 2),
    (r"Daily Scrum", 30), (r"Definition of Done", 21), (r"Sprint-Ziel(?:s|e|en)?", 22), (r"Produkt-Ziel(?:s|e|en)?", 16),
    (r"Scrum Master:in", 0), (r"Product Owner:in", 1), (r"Scrum Teams?", 3), (r"Developer:innen", 15),
    (r"Stakeholder:innen", 6), (r"Increments?", 4), (r"Sprints?", 5), (r"absichtlich unvollständig", 7),
    (r"Empirie", 8), (r"Lean Thinking", 9), (r"Überprüfung", 10), (r"Anpassung", 11), (r"Transparenz", 12),
    (r"Selbstmanagement|selbst managen", 13), (r"interdisziplinär", 17), (r"Ergebnisverantwortlichkeiten", 19),
    (r"Hindernisse(?:n)?", 24), (r"Timebox|zeitlich beschränkt", 25), (r"Burn-Down-Charts", 28), (r"abgebrochen", 29),
    (r"Commitments?", 31), (r"Größenbestimmung", 33), (r"unveränderlich", 34),
]
TERM_RE = re.compile("|".join(f"(?P<t{i}>(?<![\\w:-])(?:{p})(?![\\w-]))" for i, (p, _) in enumerate(DE_TERMS)))
def wrap_de(body):
    out, stack, seen = [], [], set()
    stop = body.find('<h4 id="sg-de-uebersetzung">')
    tail = body[stop:] if stop >= 0 else ""
    body = body[:stop] if stop >= 0 else body
    for tok in re.split(r"(<[^>]+>)", body):
        if tok.startswith("<"):
            m = re.match(r"</?([a-zA-Z0-9]+)", tok)
            name = m.group(1).lower() if m else ""
            if name in ("p", "li"):
                seen = set()
            if not tok.startswith("</") and name in ("h2", "h3", "h4", "h5", "h6", "table", "header", "a", "span"): stack.append(name)
            elif tok.startswith("</") and stack and stack[-1] == name: stack.pop()
            out.append(tok); continue
        if stack:
            out.append(tok); continue
        def rep(m):
            i = int(m.lastgroup[1:]); tip = DE_TERMS[i][1]
            if tip in seen: return m.group(0)
            seen.add(tip)
            return f'<span class="term" tabindex="0" data-tip="{tip}">{m.group(0)}</span>'
        out.append(TERM_RE.sub(rep, tok))
    return "".join(out).replace('<span class="term" tabindex="0" data-tip="11">Anpassung</span> oder Neuplanung', "Anpassung oder Neuplanung") + tail
de_html = de_body.replace("</header>", "</header>" + DE_ATTRIB, 1)
de_html = wrap_de(de_html)
assert en_body.count('<h3 id="sg-scrum-definition">') == 1
en_html = EN_COVER + en_body.replace('<h3 id="sg-scrum-definition">', EN_LEGAL + '<h3 id="sg-scrum-definition">')

# Official terms for the tooltip headers: English term (shown in German mode) and German term (shown in English mode)
TIP_EN = ["Scrum Master", "Product Owner", "Product Backlog", "Scrum Team", "Increment", "Sprint", "Stakeholders", "Purposefully incomplete",
          "Empiricism", "Lean thinking", "Inspection", "Adaptation", "Transparency", "Self-managing", "Commitment, Focus, Openness, Respect, Courage",
          "Developers", "Product Goal", "Cross-functional", "Sprints", "Accountabilities", "Sprint Backlog", "Definition of Done", "Sprint Goal",
          "Sprint Review", "Impediments", "Timebox", "Sprint Planning", "Sprint Retrospective", "Burn-downs", "Cancelling a Sprint", "Daily Scrum",
          "Commitment", "Product Backlog refinement", "Sizing", "Immutable"]
TIP_DE = ["Scrum Master:in", "Product Owner:in", "das Product Backlog", "Scrum Team", "das Increment", "Sprint", "Stakeholder:innen", "absichtlich unvollständig",
          "Empirie", "Lean Thinking", "Überprüfung", "Anpassung", "Transparenz", "Selbstmanagement", "Commitment, Fokus, Offenheit, Respekt, Mut",
          "die Developer:innen", "Produkt-Ziel", "interdisziplinär", "Sprints", "Ergebnisverantwortlichkeiten", "das Sprint Backlog", "Definition of Done", "Sprint-Ziel",
          "das Sprint Review", "Hindernisse (impediments)", "die Timebox / zeitlich beschränkt", "das Sprint Planning", "die Sprint Retrospective", "Burn-Down-Charts", "Sprint abbrechen", "Daily Scrum",
          "Commitment", "das Refinement des Product Backlogs", "Größenbestimmung", "unveränderlich"]
assert len(TIP_EN) == len(TIP_DE) == len(tips), (len(TIP_EN), len(TIP_DE), len(tips))

q = json.loads(BANK.read_text(encoding="utf-8"))
data = {"questions": q["questions"], "topics": q["topics"]}
exam_data = json.loads(EXAM_BANK.read_text(encoding="utf-8"))
strip = lambda s: re.sub(r"^if \(typeof module.*$", "", s, flags=re.M)
js = ("const QB = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n"
      + "const EXAM_DATA = " + json.dumps(exam_data, ensure_ascii=False, separators=(",", ":")) + ";\n"
      + "const GUIDE = " + json.dumps({"en": en_html, "de": de_html}, ensure_ascii=False) + ";\n"
      + "const TIPS = " + json.dumps(tips, ensure_ascii=False) + ";\nconst TIP_EN = " + json.dumps(TIP_EN, ensure_ascii=False) + ";\nconst TIP_DE = " + json.dumps(TIP_DE, ensure_ascii=False) + ";\n"
      + strip((d / "engine.js").read_text(encoding="utf-8")) + "\n" + strip((d / "story.js").read_text(encoding="utf-8")) + "\n"
      + (d / "office.js").read_text(encoding="utf-8") + "\n" + (d / "ui.js").read_text(encoding="utf-8") + "\n" + (d / "app.js").read_text(encoding="utf-8"))
shell = (d / "shell.html").read_text(encoding="utf-8").replace("</style>", (d / "app.css").read_text(encoding="utf-8") + "\n</style>", 1)
script = "\n<script>\n" + js.replace("</script", "<\\/script") + "\n</script>\n"
page = shell + script
(OUT / "scrum-master-on-duty.html").write_text(page, encoding="utf-8", newline="\n")
# Standalone document: same page with a proper head
cut = shell.index("</style>") + len("</style>")
standalone = ('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
              '<meta name="description" content="PSM I study kit: the full Scrum Guide 2020 in English and German, exam practice and a Scrum Master game.">\n'
              + shell[:cut] + "\n</head>\n<body>\n" + shell[cut:] + script + "</body>\n</html>\n")
(OUT / "index.html").write_text(standalone, encoding="utf-8", newline="\n")
print(OUT / "scrum-master-on-duty.html", len(page) // 1024, "KB;", OUT / "index.html", len(standalone) // 1024, "KB")
