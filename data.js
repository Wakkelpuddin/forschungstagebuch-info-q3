'use strict';
/* Inhalte des Forschungstagebuchs. Jeder Eintrag = ein Unterrichtstag = ein "Commit". */

const README = `
<h1>Forschungstagebuch Informatik Q3</h1>
<p>Leo Widmann · Informatik GK Q3 · Heinrich-Böll-Schule Hattersheim · 12.08.2026 – 11.11.2026</p>
<p>Thema des Halbjahres: <b>Theoretische Informatik</b> (endliche Automaten, reguläre Ausdrücke, Grammatiken, Syntaxdiagramme, Registermaschine). Ich habe das Tagebuch wie ein Git-Repository aufgebaut, weil man da genau sieht, was sich wann geändert hat, und Fehler nicht einfach verschwinden, sondern als Korrektur sichtbar bleiben.</p>
<p><b>Leitfrage:</b> Welche Probleme kann eine Maschine lösen und wo sind ihre Grenzen?</p>
<div class="legend">
<span>Commit</span><span>ein Unterrichtstag (oder ein Arbeitsauftrag), chronologisch</span>
<span><span class="minus">− rot</span> / <span class="plus">+ grün</span></span><span>mein erster Versuch und die Korrektur, mit Begründung, was falsch war</span>
<span>▶</span><span>meine Lösung zum Ausprobieren: Automaten, reguläre Ausdrücke und Registermaschinen-Programme laufen direkt auf der Seite, man kann eigene Eingaben testen</span>
<span>Reflexion</span><span>was ich daraus gelernt habe</span>
</div>`;

const ENTRIES = [];

/* =====================================================================
   12.08.2026
   ===================================================================== */
ENTRIES.push({
  d: '2026-08-12', short: 'Einstieg', msg: 'Start Q3: Theoretische Informatik und Alan Turing', tags: ['Einstieg'],
  body: [
    p(`Heute hat das neue Halbjahr angefangen. Thema in Q3 ist <b>Theoretische Informatik</b>. Als Einstieg ging es um Alan Turing, deshalb fängt mein Tagebuch auch mit ihm an.`),
    h('Was ich über Turing mitgenommen habe'),
    p(`<ul>
<li>Alan Mathison Turing, geboren 1912 in London, gestorben 1954.</li>
<li>1936 hat er in einem Aufsatz eine <b>gedachte Maschine</b> beschrieben, die heute Turingmaschine heißt: ein unendlich langes Band, ein Kopf, der Zeichen liest und schreibt, und eine endliche Menge von Zuständen mit festen Regeln.</li>
<li>Damit wollte er eine Frage klären, die erst mal komisch klingt: <i>Was kann man überhaupt berechnen?</i></li>
<li>Im Zweiten Weltkrieg hat er in Bletchley Park an der Entschlüsselung der Enigma mitgearbeitet.</li>
<li>1950 kam der Turing-Test: Kann sich eine Maschine so verhalten, dass man sie nicht von einem Menschen unterscheiden kann?</li>
</ul>`),
    p(`Was mich überrascht hat: Die Turingmaschine ist gar kein echtes Gerät, sondern nur ein Gedankenmodell. Trotzdem kann sie alles berechnen, was ein heutiger Computer berechnen kann, nur eben sehr umständlich.`),
    task(`<b>Meine Leitfrage für das Halbjahr:</b> Welche Probleme kann eine Maschine lösen und wo sind ihre Grenzen?<br>Ich will bei jedem Eintrag festhalten, welches Maschinenmodell wir gerade anschauen und was es kann oder eben nicht kann. Am Ende versuche ich im <a href="#/fazit">Fazit</a> eine Antwort.`),
    h('Was in Q3 drankommt', 3),
    table(['Thema', 'Modell / Werkzeug'], [
      ['Endliche Automaten', 'Maschine mit endlich vielen Zuständen, sagt nur „ja“ oder „nein“'],
      ['Automaten mit Ausgabe', 'Mealy-Automat, gibt bei jedem Schritt etwas aus'],
      ['Reguläre Ausdrücke', 'Muster, mit denen man Wörter beschreibt'],
      ['Grammatiken', 'Regeln, mit denen man Wörter erzeugt'],
      ['Syntaxdiagramme', 'Grammatik als „Gleisplan“ gezeichnet'],
      ['Registermaschine', 'ein Modell, das schon wie ein richtiger Computer rechnet'],
    ]),
    refl(`Am Anfang war mir nicht klar, was „theoretisch“ in Informatik heißen soll, weil wir in Q2 mit Datenbanken und SQL immer etwas Praktisches gebaut haben. Mein Eindruck nach der ersten Stunde: Es geht weniger ums Programmieren, sondern darum, Maschinen so genau zu beschreiben, dass man sicher sagen kann, was sie können. Ich bin gespannt, ob das wirklich so abstrakt wird, wie es sich anhört.`)
  ]
});

/* =====================================================================
   19.08.2026
   ===================================================================== */
ENTRIES.push({
  d: '2026-08-19', short: 'Endliche Automaten', msg: 'Endliche Automaten: Lachautomat, Sprachen beschreiben, erste eigene Automaten', tags: ['Endliche Automaten', 'FLACI', 'AutoEdit'],
  body: [
    p(`Heute haben wir mit dem Lernpaket „Endliche Automaten – Akzeptoren“ angefangen. Ein endlicher Automat liest ein Wort Zeichen für Zeichen und springt dabei zwischen Zuständen hin und her. Ist das Wort zu Ende und er steht in einem Endzustand, wird es <b>akzeptiert</b>, sonst nicht. Gibt es für ein Zeichen keinen Übergang, ist das Wort sofort durchgefallen.`),
    h('Die Theorie in meinen Worten'),
    p(`Ein deterministischer endlicher Automat (DEA) ist ein 5-Tupel ⟨K, Σ, δ, s, F⟩:`),
    table(['Teil', 'Bedeutung', 'beim Lachautomaten'], [
      ['K', 'alle Zustände', '{1, 2, 3, 4}'],
      ['Σ', 'Eingabealphabet, also die erlaubten Zeichen', '{a, h, !}'],
      ['δ', 'Übergänge: von welchem Zustand mit welchem Zeichen wohin', '⟨1,h,2⟩, ⟨2,a,3⟩, ⟨3,h,2⟩, ⟨3,!,4⟩'],
      ['s', 'Startzustand', '1'],
      ['F', 'Endzustände', '{4}'],
    ]),
    p(`Deterministisch heißt: Von jedem Zustand geht pro Zeichen höchstens <i>ein</i> Übergang aus. Der nächste Schritt steht also immer fest. Eine <b>Konfiguration</b> ist das Paar ⟨Zustand, Restwort⟩, damit kann man den Ablauf genau aufschreiben. Im Simulator unten wird die Konfigurationsfolge automatisch mitgeschrieben.`),
    dfa({
      title: 'Lachautomat aus der Theorie', w: 470, h: 150, start: '1',
      states: [{ id: '1', x: 70, y: 85 }, { id: '2', x: 180, y: 85 }, { id: '3', x: 290, y: 85 }, { id: '4', x: 410, y: 85, final: true }],
      trans: [['1', 'h', '2'], ['2', 'a', '3'], ['3', 'h', '2'], ['3', '!', '4']],
      tests: ['haha!', 'ha!', 'hahaha!', 'hah!', 'h!', 'ha']
    }),
    img('img/autoedit-lachautomat.png', 'Mein erster Test in AutoEdit: „hah!“ landet im Trap-Zustand, weil nach dem zweiten h kein „!“ kommen darf. In der Konfigurationsfolge unten sieht man genau, wo es schiefgeht.'),

    h('Aufgabe 1: Grundverständnis'),
    task(`<b>a)</b> Unter welchen Umständen akzeptiert ein DEA die leere Eingabe?`),
    p(`Genau dann, wenn der <b>Startzustand gleichzeitig Endzustand</b> ist. Bei der leeren Eingabe liest der Automat gar nichts, bleibt also im Startzustand stehen. Ist der schon ein Endzustand, wird ε akzeptiert.`),
    task(`<b>b)</b> Welche Sprachen akzeptieren die beiden Automaten über Σ = {a, b}? Beschreibe die Sprache in eigenen Worten.`),
    img('img/aufgabe1-i.png', 'Aufgabenbild aus Moodle, Automat i)'),
    dfa({
      title: 'i) Zustand 2 ist Endzustand', w: 320, h: 140, start: '1',
      states: [{ id: '1', x: 90, y: 72 }, { id: '2', x: 230, y: 72, final: true }],
      trans: [['1', 'a', '2'], ['2', 'b', '1']],
      tests: ['a', 'aba', 'ababa', 'ab', 'aab', '']
    }),
    dfa({
      title: 'ii) wie i), zusätzlich Schleife a an Zustand 2', w: 340, h: 140, start: '1',
      states: [{ id: '1', x: 90, y: 72 }, { id: '2', x: 230, y: 72, final: true, loop: 'right' }],
      trans: [['1', 'a', '2'], ['2', 'b', '1'], ['2', 'a', '2']],
      tests: ['aa', 'aba', 'abaa', 'aaaba', 'abba', 'ab']
    }),
    diff('aufgabe1b_sprachen.txt', 'Sprachbeschreibung präzisiert, „ungerade Länge“ reicht nicht',
      `i)  Reihenfolge aus a und b mit ungeraden Längen
ii) Muss mit a beginnen, muss mit a enden`,
      `i)  a und b immer abwechselnd, Anfang und Ende ist a:
    a, aba, ababa, ...
    (die Länge ist dann automatisch ungerade, aber nicht jedes
    Wort mit ungerader Länge gehört dazu, z. B. aab oder bbb)
ii) Muss mit a beginnen, muss mit a enden
    und es stehen nie zwei b direkt hintereinander
    (abba: nach dem ersten b ist man in Zustand 1, dort gibt es kein b)`,
      `Gefunden habe ich den Fehler, indem ich meine eigene Beschreibung mit Gegenbeispielen getestet habe: <code>aab</code> hat Länge 3, wird von Automat i) aber abgelehnt. Meine erste Beschreibung war also zu weit. Bei ii) hat <code>abba</code> gezeigt, dass „mit a anfangen und aufhören“ nicht reicht.`),

    h('Aufgabe 2: Der erweiterte Lachautomat'),
    task(`Der Lachautomat soll zusätzlich hi/hihi/… und ho/hoho/… erkennen. Der Vokal darf innerhalb eines Wortes nicht wechseln („hahi“ ist verboten). Das Ausrufezeichen gehört diesmal nicht zum Alphabet.`),
    p(`Meine Idee: Nach dem ersten h teilt sich der Automat in drei „Spuren“ auf, eine pro Vokal. Jede Spur merkt sich ihren Vokal, weil sie ab da nur noch h und genau diesen Vokal annimmt. Deshalb landet „hahi“ im Fehlerzustand. Endzustände sind die Zustände direkt nach einem Vokal (q2, q3, q4), weil ein Lachen immer mit einem Vokal aufhört.`),
    img('img/flaci-hahiho.png', 'Mein Automat in FLACI, Test mit „hihi“: q0 → q1 → q3 → q6 → q3, q3 ist Endzustand.'),
    dfa({
      title: 'ha / hi / ho (TRAP nicht gezeichnet)', w: 450, h: 300, start: 'q0',
      states: [{ id: 'q0', x: 65, y: 150 }, { id: 'q1', x: 165, y: 150 }, { id: 'q4', x: 285, y: 55, final: true }, { id: 'q5', x: 405, y: 55 },
        { id: 'q3', x: 285, y: 150, final: true }, { id: 'q6', x: 405, y: 150 }, { id: 'q2', x: 285, y: 245, final: true }, { id: 'q7', x: 405, y: 245 }],
      trans: [['q0', 'h', 'q1'], ['q1', 'a', 'q4'], ['q1', 'i', 'q3'], ['q1', 'o', 'q2'], ['q4', 'h', 'q5'], ['q5', 'a', 'q4'], ['q3', 'h', 'q6'], ['q6', 'i', 'q3'], ['q2', 'h', 'q7'], ['q7', 'o', 'q2']],
      tests: ['hihi', 'hoho', 'hahaha', 'ha', 'hahi', 'hohihahohihoha', 'h'],
      legend: 'In FLACI hatte ich noch einen Zustand TRAP, in den alle verbotenen Übergänge führen. Hier lasse ich ihn weg, damit man den Rest besser sieht. Fehlt ein Übergang, bedeutet das: Wort wird abgelehnt.'
    }),
    refl(`Hier habe ich zum ersten Mal verstanden, dass Zustände eigentlich ein <b>Gedächtnis</b> sind. q3 bedeutet nicht einfach „Zustand Nummer 3“, sondern „ich bin in der i-Spur und habe gerade einen Vokal gelesen“. Seitdem überlege ich bei jedem Automaten zuerst: <i>Was muss er sich merken?</i> Daraus ergeben sich die Zustände fast von allein.`),

    h('Aufgabe 3: Automat für ein Suchmuster'),
    task(`<b>a)</b> Akzeptiert werden sollen genau die Wörter über {0,1} nach dem Muster 0(0|1)*: erst eine 0, dann beliebig viele 0en oder 1en. Höchstens zwei Zustände und genau ein Endzustand.`),
    dfa({
      title: 'a) 0(0|1)*', w: 320, h: 230, start: 'q0',
      states: [{ id: 'q0', x: 70, y: 70 }, { id: 'q1', x: 210, y: 70, final: true, loop: 'right' }, { id: 'TRAP', x: 70, y: 175, loop: 'right' }],
      trans: [['q0', '0', 'q1'], ['q1', '0, 1', 'q1'], ['q0', '1', 'TRAP'], ['TRAP', '0, 1', 'TRAP']],
      tests: ['0', '00', '0110', '10', '1', '']
    }),
    img('img/flaci-0-beliebig.png', 'FLACI-Test mit „00“: wird akzeptiert. TRAP zähle ich nicht als „richtigen“ Zustand, ohne ihn kommt der Automat mit zwei Zuständen aus.'),
    task(`<b>b)</b> Wie sieht der Automat aus, wenn das Wort mindestens drei Zeichen lang sein muss?`),
    p(`Dafür braucht man <b>Zählzustände</b>: q3 heißt „1 Zeichen gelesen“, q2 „2 Zeichen“, q1 „3 oder mehr“. Erst q1 ist Endzustand. Die Namen sind etwas durcheinander, weil ich in FLACI die Zustände nachträglich zwischen q0 und q1 eingefügt habe.`),
    dfa({
      title: 'b) wie a), aber mindestens 3 Zeichen', w: 440, h: 230, start: 'q0',
      states: [{ id: 'q0', x: 65, y: 75 }, { id: 'q3', x: 165, y: 75 }, { id: 'q2', x: 265, y: 75 }, { id: 'q1', x: 375, y: 75, final: true }, { id: 'TRAP', x: 65, y: 180, loop: 'right' }],
      trans: [['q0', '0', 'q3'], ['q3', '0, 1', 'q2'], ['q2', '0, 1', 'q1'], ['q1', '0, 1', 'q1'], ['q0', '1', 'TRAP'], ['TRAP', '0, 1', 'TRAP']],
      tests: ['010', '001', '0000', '01', '00', '100']
    }),
    img('img/flaci-min3.png', 'Test in FLACI: „00“ wird jetzt abgelehnt (×), „001“ akzeptiert (✓). Genau so sollte es laut Aufgabe sein.'),
    refl(`Mein größter Lernpunkt heute: Eine Sprache genau zu beschreiben ist schwerer als den Automaten zu zeichnen. Bei Aufgabe 1 dachte ich, „ungerade Länge“ passt, bis ich ein Gegenbeispiel gefunden habe. Ab jetzt teste ich jede Beschreibung mit mindestens einem Wort, das <i>nicht</i> dazugehören soll. FLACI hilft dabei sehr, weil man sofort sieht, in welchem Zustand der Automat hängen bleibt.`)
  ]
});

/* =====================================================================
   26.08.2026
   ===================================================================== */
ENTRIES.push({
  d: '2026-08-26', short: 'Automaten Aufgabe 4', msg: 'Endliche Automaten: Tabelle → Graph, Klassennamen, „kein bb“, vorletzte Ziffer', tags: ['Endliche Automaten', 'FLACI'],
  body: [
    p(`Heute ging es mit Aufgabe 4 aus dem Lernpaket weiter. a) bis c) waren Pflicht, d) war eine Wahlaufgabe.`),
    h('a) Von der Übergangstabelle zum Graphen'),
    task(`Gegeben ist ein Automat mit Σ = {a,b,c}, Zuständen {sa, s1, s2, se}, Start sa und Endzustand se. i) Zeichne den Übergangsgraphen. ii) Welche Wörter werden akzeptiert: abc, a³bc³, a²b²c², a³b²c²?`),
    table(['δ', 'sa', 's1', 's2', 'se'], [['a', 's1', 'sa', 's1', 'se'], ['b', 'se', 's1', 's1', 'sa'], ['c', 's2', 'sa', 'se', 's2']], 'Übergangstabelle aus der Aufgabe'),
    dfa({
      title: 'Automat aus der Tabelle', w: 480, h: 330, start: 'sa',
      states: [{ id: 'sa', x: 70, y: 165 }, { id: 's1', x: 240, y: 60 }, { id: 's2', x: 240, y: 270 }, { id: 'se', x: 410, y: 165, final: true, loop: 'right' }],
      trans: [['sa', 'a', 's1'], ['sa', 'b', 'se'], ['sa', 'c', 's2'], ['s1', 'a, c', 'sa'], ['s1', 'b', 's1'], ['s2', 'a, b', 's1'], ['s2', 'c', 'se'], ['se', 'a', 'se'], ['se', 'b', 'sa'], ['se', 'c', 's2']],
      bend: { 's2>s1': 45 },
      tests: ['abc', 'aaabccc', 'aabbcc', 'aaabbcc', 'acaabbba']
    }),
    p(`Wichtig: a³ bedeutet <code>aaa</code> (dreimal a hintereinander), nicht „a mal 3“. Damit habe ich die vier Wörter Schritt für Schritt durchgespielt:`),
    table(['Wort', 'ausgeschrieben', 'letzter Zustand', 'Ergebnis'], [
      ['abc', 'abc', 'sa', '<span class="bad">nicht akzeptiert</span>'],
      ['a³bc³', 'aaabccc', 'se', '<span class="ok">akzeptiert</span>'],
      ['a²b²c²', 'aabbcc', 'se', '<span class="ok">akzeptiert</span>'],
      ['a³b²c²', 'aaabbcc', 's2', '<span class="bad">nicht akzeptiert</span>'],
    ]),
    p(`Beispiel als Konfigurationsfolge: ⟨sa, aabbcc⟩ ⊢ ⟨s1, abbcc⟩ ⊢ ⟨sa, bbcc⟩ ⊢ ⟨se, bcc⟩ ⊢ ⟨sa, cc⟩ ⊢ ⟨s2, c⟩ ⊢ ⟨se, ε⟩. Das Wort ist zu Ende und se ist Endzustand, also akzeptiert.`),
    img('img/flaci-aufgabe4.png', 'Kontrolle in FLACI. Hier mit einem eigenen Testwort „acaabbba“, das zwischendurch zweimal im Endzustand vorbeikommt und am Ende in se landet.'),

    h('b) Klassenbezeichnungen der HBS'),
    task(`Klassennamen bestehen aus Jahrgang (5–10), Anfangsbuchstabe des Zweigs und einer Nummer von 1 bis 4, z. B. 5G1, 7H3, 9R2. Jahrgang 5/6: Zweige F und G. Jahrgang 7, 8, 9: R, H und G. Jahrgang 10: G und R. Entwirf einen Automaten, der nur korrekte Klassennamen akzeptiert (Graph + Mengenschreibweise).`),
    p(`Weil die erlaubten Zweige vom Jahrgang abhängen, braucht der Automat <b>drei verschiedene Zwischenzustände</b>, die sich merken, welche Buchstaben danach erlaubt sind: z56, z79 und z10. Nach dem Buchstaben ist der Jahrgang egal, deshalb laufen alle in zZ zusammen.`),
    dfa({
      title: 'Klassennamen', w: 550, h: 300, start: 'z0',
      states: [{ id: 'z0', x: 60, y: 150 }, { id: 'z56', x: 195, y: 55 }, { id: 'z79', x: 195, y: 150 }, { id: 'z1', x: 165, y: 250 }, { id: 'z10', x: 280, y: 250 }, { id: 'zZ', x: 350, y: 150 }, { id: 'zE', x: 500, y: 150, final: true }],
      trans: [['z0', '5, 6', 'z56'], ['z0', '7, 8, 9', 'z79'], ['z0', '1', 'z1'], ['z1', '0', 'z10'], ['z56', 'F, G', 'zZ'], ['z79', 'R, H, G', 'zZ'], ['z10', 'G, R', 'zZ'], ['zZ', '1, 2, 3, 4', 'zE']],
      tests: ['5G1', '7H3', '9R2', '10G4', '10H1', '6R1', '11G1', '5G5', '5F12']
    }),
    code(`K = {z0, z1, z56, z79, z10, zZ, zE}
Σ = {0, 1, 2, 3, 4, 5, 6, 7, 8, 9, F, G, H, R}
s = z0        F = {zE}
δ = { ⟨z0,5,z56⟩, ⟨z0,6,z56⟩, ⟨z0,7,z79⟩, ⟨z0,8,z79⟩, ⟨z0,9,z79⟩, ⟨z0,1,z1⟩,
      ⟨z1,0,z10⟩,
      ⟨z56,F,zZ⟩, ⟨z56,G,zZ⟩,
      ⟨z79,R,zZ⟩, ⟨z79,H,zZ⟩, ⟨z79,G,zZ⟩,
      ⟨z10,G,zZ⟩, ⟨z10,R,zZ⟩,
      ⟨zZ,1,zE⟩, ⟨zZ,2,zE⟩, ⟨zZ,3,zE⟩, ⟨zZ,4,zE⟩ }
alle anderen Übergänge führen in einen Fehlerzustand`),
    diff('aufgabe4b_klassen.txt', 'fix: Der Automat liest einzelne Zeichen, „10“ sind zwei Zeichen',
      `Σ = {5, 6, 7, 8, 9, 10, F, G, H, R, 1, 2, 3, 4}
z0 --10--> z10`,
      `Σ = {0, 1, 2, 3, 4, 5, 6, 7, 8, 9, F, G, H, R}
z0 --1--> z1 --0--> z10`,
      `In meinem ersten Entwurf war „10“ ein einziges Zeichen. Beim Nachbauen in FLACI ging das nicht, weil der Automat jedes Zeichen einzeln liest. Also braucht es einen Zwischenzustand z1 nach der 1. Dadurch wird „11G1“ jetzt auch richtig abgelehnt.`),

    h('c) Mit a beginnen, kein „bb“'),
    task(`Gesucht ist ein Automat über {a,b} für alle Wörter, die mit a beginnen und <code>bb</code> nicht als Teilstring enthalten. Graph, Übergangstabelle und Mengenschreibweise.`),
    p(`Merk-Idee: q2 heißt „das letzte Zeichen war ein b“. Kommt dann noch ein b, ist „bb“ drin und es geht in den Fehlerzustand F.`),
    dfa({
      title: 'beginnt mit a, kein bb', w: 380, h: 250, start: 'q0',
      states: [{ id: 'q0', x: 60, y: 85 }, { id: 'q1', x: 185, y: 85, final: true }, { id: 'q2', x: 310, y: 85, final: true }, { id: 'F', x: 185, y: 200, loop: 'right' }],
      trans: [['q0', 'a', 'q1'], ['q1', 'a', 'q1'], ['q1', 'b', 'q2'], ['q2', 'a', 'q1'], ['q0', 'b', 'F'], ['q2', 'b', 'F'], ['F', 'a, b', 'F']],
      tests: ['a', 'ab', 'aba', 'abab', 'aabaab', 'abb', 'ba', 'abba']
    }),
    table(['δ', 'q0', 'q1', 'q2', 'F'], [['a', 'q1', 'q1', 'q1', 'F'], ['b', 'F', 'q2', 'F', 'F']], 'Übergangstabelle. Mengenschreibweise: K = {q0, q1, q2, F}, Σ = {a, b}, s = q0, F<sub>End</sub> = {q1, q2}'),

    h('d) Wahlaufgabe: Die vorletzte Ziffer ist 0'),
    task(`Entwirf einen Automaten über {0,1}, der jedes Wort akzeptiert, dessen vorletzte Ziffer eine 0 ist.`),
    diff('aufgabe4d_idee.txt', 'Denkfehler: „vorletzte“ heißt von hinten gezählt',
      `Idee: zweites Zeichen muss 0 sein
q0 --0,1--> q1 --0--> q2 (Endzustand, Schleife 0,1)`,
      `vorletztes Zeichen = zweites von HINTEN
Problem: der Automat weiß nie, wann das Wort zu Ende ist
→ er muss sich immer die letzten zwei Zeichen merken`,
      `Mein erster Automat hat das zweite Zeichen von links geprüft. Bei „100“ hat er abgelehnt, obwohl die vorletzte Ziffer eine 0 ist. Da ist mir klar geworden, dass ein Automat nicht nach vorne schauen kann. Er muss sich deshalb immer die letzten beiden Zeichen merken.`),
    p(`Für zwei Zeichen gibt es 4 Möglichkeiten (00, 01, 10, 11), also 4 Zustände. Der Zustandsname ist genau das, was sich der Automat merkt. Endzustände sind die, bei denen das vorletzte Zeichen 0 ist: <b>00</b> und <b>01</b>. Den Startzustand behandle ich wie „11“, weil am Anfang noch keine 0 gelesen wurde.`),
    dfa({
      title: 'vorletzte Ziffer = 0', w: 420, h: 270, start: 'x11',
      states: [{ id: 'x11', label: '11', x: 75, y: 130, loop: 'down' }, { id: 'x10', label: '10', x: 205, y: 60 }, { id: 'x00', label: '00', x: 350, y: 60, final: true, loop: 'up' }, { id: 'x01', label: '01', x: 280, y: 200, final: true }],
      trans: [['x11', '0', 'x10'], ['x11', '1', 'x11'], ['x10', '0', 'x00'], ['x10', '1', 'x01'], ['x00', '0', 'x00'], ['x00', '1', 'x01'], ['x01', '0', 'x10'], ['x01', '1', 'x11']],
      tests: ['01', '100', '101', '1100', '10', '111', '0']
    }),
    refl(`Aufgabe d) war für mich die wichtigste heute. Ich habe gemerkt, dass ein endlicher Automat kein „Überblick“ über das ganze Wort hat. Er sieht immer nur ein Zeichen und seinen Zustand. Alles, was er wissen muss, muss in den Zuständen stecken. Bei „vorletzte Ziffer“ reichen 4 Zustände, weil nur 2 Zeichen gemerkt werden müssen. Ich habe mich gefragt, was passiert, wenn er sich unendlich viel merken müsste. Das kommt später bei den Grammatiken wieder.`)
  ]
});

/* =====================================================================
   02.09.2026
   ===================================================================== */
ENTRIES.push({
  d: '2026-09-02', short: 'Reguläre Ausdrücke', msg: 'Reguläre Ausdrücke: Muster bauen, testen und mit Automaten vergleichen', tags: ['Reguläre Ausdrücke', 'regex101', 'FLACI'],
  body: [
    p(`Neues Lernpaket: reguläre Ausdrücke. Ein regulärer Ausdruck beschreibt eine Sprache als <b>Muster</b>. Das Muster besteht aus normalen Zeichen und Metazeichen. Ich habe mir zuerst einen Spickzettel mit den Metazeichen gemacht und dann die Aufgaben mit regex101 und FLACI getestet.`),
    h('Mein Spickzettel', 3),
    table(['Zeichen', 'Bedeutung', 'Beispiel'], [
      ['<code>abc</code>', 'genau diese Zeichenfolge', 'passt nur auf „abc“'],
      ['<code>x|y</code>', 'Alternative: x oder y', '<code>(de|com)</code>'],
      ['<code>[abc]</code>', 'genau ein Zeichen aus der Klasse', '<code>[0-9]</code> = eine Ziffer'],
      ['<code>[^abc]</code>', 'ein Zeichen, das NICHT in der Klasse ist', '<code>[^0-9]</code>'],
      ['<code>(…)</code>', 'Gruppe', '<code>(ab)+</code>'],
      ['<code>?</code>', 'vorheriges Element 0- oder 1-mal (optional)', '<code>colou?r</code>'],
      ['<code>*</code>', '0-mal oder beliebig oft', '<code>a*</code>'],
      ['<code>+</code>', 'mindestens 1-mal', '<code>e+</code>'],
      ['<code>{n,m}</code>', 'n- bis m-mal', '<code>n{2,4}</code>'],
      ['<code>.</code>', 'irgendein Zeichen', ''],
      ['<code>\\.</code>', 'ein echter Punkt (Backslash hebt die Sonderbedeutung auf)', '<code>www\\.hbs\\.de</code>'],
    ], 'Wichtig: Quantoren (? * + {}) beziehen sich immer nur auf das Element direkt davor.'),
    note(`Im Tester unten steht der Ausdruck zwischen ^( und )$. Das heißt, das <b>ganze</b> Wort muss passen, nicht nur ein Teil davon. So prüft auch ein Automat.`),

    h('Aufgabe 1: Basismuster'),
    task(`Reguläre Ausdrücke für: a) Vornamen mit Großbuchstaben am Anfang, eventuell mit Zweitnamen, b) Postleitzahlen, c) Wörter aus a und b, die mit a beginnen und mit zwei b enden, d) ungerade Binärzahlen.`),
    rx({ title: 'a) Vornamen', p: String.raw`[A-ZÄÖÜ][a-zäöüß]+( [A-ZÄÖÜ][a-zäöüß]+)?`, tests: ['Leo', 'Anna Lena', 'Jörg', 'Özlem', 'leo', 'Max Peter Paul', 'L'],
      alts: [{ label: 'meine erste Version', p: String.raw`[A-Z][a-z]+( [A-Z][a-z]+)?` }, { label: 'verbessert (Umlaute)', p: String.raw`[A-ZÄÖÜ][a-zäöüß]+( [A-ZÄÖÜ][a-zäöüß]+)?` }] }),
    diff('aufgabe1_vornamen.regex', 'Umlaute ergänzt, „Jörg“ und „Özlem“ wurden abgelehnt',
      `[A-Z][a-z]+( [A-Z][a-z]+)?`,
      `[A-ZÄÖÜ][a-zäöüß]+( [A-ZÄÖÜ][a-zäöüß]+)?`,
      `Meine erste Lösung war für die Aufgabe eigentlich richtig. Beim Testen mit Namen aus meiner Klasse ist mir aber aufgefallen, dass alle Namen mit Umlaut durchfallen, weil [a-z] kein ö enthält. Die Klasse [a-z] heißt wirklich nur „a bis z“ im Zeichensatz.`),
    rx({ title: 'b) Postleitzahlen', p: String.raw`[0-9]{5}`, tests: ['65795', '60311', '6579', '657950', '00000'] }),
    p(`Grenze von b): <code>00000</code> wird auch akzeptiert, obwohl es diese PLZ nicht gibt (die kleinste ist 01067). Das Muster prüft nur die <i>Form</i>, nicht ob es die PLZ wirklich gibt. Das kann ein regulärer Ausdruck auch gar nicht wissen.`),
    rx({ title: 'c) beginnt mit a, endet mit bb', p: String.raw`a(a|b)*bb`, tests: ['abb', 'aabb', 'abbb', 'ababb', 'abab', 'bb', 'ab'] }),
    rx({ title: 'd) ungerade Binärzahlen', p: String.raw`(0|1)*1`, tests: ['1', '101', '111', '110', '0', ''] }),

    h('Aufgabe 2: Den Spam-Filter umgehen'),
    task(`Ein möglichst einfacher regulärer Ausdruck für {Sex, Seex, Seeex, …}. Wie sähe der passende endliche Automat aus?`),
    rx({ title: 'Spam-Filter', p: String.raw`Se+x`, tests: ['Sex', 'Seex', 'Seeeeex', 'Sx', 'Sexx'] }),
    p(`Das <code>e+</code> wird im Automaten zu einer <b>Schleife</b> an q1. In FLACI hatte ich alles klein geschrieben (seeeex), hier steht das große S wie im Ausdruck.`),
    dfa({
      title: 'Automat zu Se+x', w: 430, h: 140, start: 's',
      states: [{ id: 's', x: 60, y: 90 }, { id: 'q0', x: 165, y: 90 }, { id: 'q1', x: 270, y: 90 }, { id: 'q2', x: 375, y: 90, final: true }],
      trans: [['s', 'S', 'q0'], ['q0', 'e', 'q1'], ['q1', 'e', 'q1'], ['q1', 'x', 'q2']],
      tests: ['Sex', 'Seeeeex', 'Sx', 'Sexx']
    }),
    img('img/flaci-seex.png', 'Mein Automat in FLACI mit „seeeex“ (✓) und „eeex“ (×)'),

    h('Aufgabe 3: Internetadressen'),
    task(`Ein regulärer Ausdruck für alle Internet-Adressen mit .de oder .com, mit beliebig vielen Subdomains, z. B. www.a.b.c.heinrich-boell-schule.de.`),
    rx({ title: 'Internetadressen', p: String.raw`([a-z0-9-]+\.)+(de|com)`, tests: ['www.a.b.c.heinrich-boell-schule.de', 'google.com', 'hbs.de', 'heinrichXboellXschulexde', 'hbs.org', '.de'],
      alts: [{ label: 'erster Versuch (ohne \\)', p: String.raw`([a-z0-9-]+.)+(de|com)` }, { label: 'korrigiert', p: String.raw`([a-z0-9-]+\.)+(de|com)` }] }),
    diff('aufgabe3_url.regex', 'fix: Punkt escapen, sonst passt jedes Zeichen',
      `([a-z0-9-]+.)+(de|com)`,
      `([a-z0-9-]+\\.)+(de|com)`,
      `Ohne Backslash ist der Punkt ein Metazeichen für „irgendein Zeichen“. Dann wird sogar „heinrichXboellXschulexde“ akzeptiert. Kann man oben mit dem Knopf „erster Versuch“ selbst ausprobieren.`),

    h('Aufgabe 4: Sprachen über {a, b, c}'),
    rx({ title: 'a) zwei Buchstaben, beginnt mit a', p: String.raw`a[abc]`, tests: ['aa', 'ab', 'ac', 'a', 'ba', 'abc'] }),
    rx({ title: 'b) alle Wörter, die mit a beginnen', p: String.raw`a[abc]*`, tests: ['a', 'abc', 'acbca', 'b', ''] }),
    rx({ title: 'c) alle Wörter der Länge 3', p: String.raw`[abc]{3}`, tests: ['aaa', 'cab', 'ab', 'abca'] }),
    rx({ title: 'd) genau ein a', p: String.raw`(b|c)*a(b|c)*`, tests: ['a', 'bcbcba', 'bab', 'abbbcccb', 'aa', 'bcb'] }),
    rx({ title: 'e) höchstens zwei verschiedene Buchstaben', p: String.raw`(a|b)+|(a|c)+|(b|c)+`, tests: ['a', 'ab', 'abbaab', 'cacaac', 'bcbcbc', 'abc', 'aabbc'] }),
    p(`Bei e) war der Trick, dass „höchstens zwei verschiedene“ heißt: Entweder kommen nur a und b vor, oder nur a und c, oder nur b und c. Das sind genau drei Alternativen.`),
    refl(`Reguläre Ausdrücke finde ich praktischer als Automaten, weil man sie wirklich benutzt, z. B. zum Prüfen von Formularen. Der Automat zeigt dafür besser, <i>warum</i> ein Wort nicht passt. Mir ist aufgefallen, dass ich zu jedem Ausdruck heute auch einen Automaten hätte bauen können (bei Se+x hab ich es gemacht). Meine Vermutung: Beide können genau dasselbe. Außerdem habe ich wieder gemerkt, dass Testen mit „falschen“ Wörtern am meisten bringt: Der Fehler mit dem Punkt wäre mir ohne „heinrichXboellXschulexde“ nie aufgefallen.`)
  ]
});

/* =====================================================================
   09.09.2026
   ===================================================================== */
ENTRIES.push({
  d: '2026-09-09', short: 'Grammatiken', msg: 'Grammatiken: Arbeitsauftrag bearbeitet (Unterricht entfallen)', tags: ['Grammatiken', 'Arbeitsauftrag'],
  body: [
    note(`Die Stunde ist ausgefallen. Wir hatten aber Arbeitsaufträge im Moodle: das Lernpaket „Grammatiken“. Die habe ich selbstständig bearbeitet.`),
    h('Was ist eine Grammatik?'),
    p(`Endliche Automaten und reguläre Ausdrücke <b>erkennen</b> Wörter, sie prüfen also, ob eine Zeichenkette dazugehört. Eine Grammatik geht den umgekehrten Weg: Sie <b>erzeugt</b> die Wörter Schritt für Schritt aus einem Startsymbol.`),
    p(`Formal ist eine Grammatik ein 4-Tupel <b>G = (N, T, P, S)</b>:`),
    table(['Teil', 'Bedeutung', 'Beispiel aus dem Lernpaket'], [
      ['T', 'Terminale, also das Alphabet der Sprache', 'T = {a, b, n, s, o, w}'],
      ['N', 'Nichtterminale (Variablen), ein Hilfsalphabet', 'N = {S, U}'],
      ['P', 'Produktionen: wodurch ein Nichtterminal ersetzt werden darf', 'S → aU, U → nUs | sUn | oUw | wUo | b'],
      ['S', 'Startsymbol', 'S'],
    ]),

    h('Aufgabe 1a: Eigene Ableitungen'),
    task(`Leite mit S → aU, U → nUs | sUn | oUw | wUo | b drei weitere Wörter ab und zeichne jeweils den Ableitungsbaum.`),
    der({ title: 'Wort 1: anbs', steps: ['S', 'aU', 'anUs', 'anbs'], tree: ['S', 'a', ['U', 'n', ['U', 'b'], 's']] }),
    der({ title: 'Wort 2: aswbon', steps: ['S', 'aU', 'asUn', 'aswUon', 'aswbon'], tree: ['S', 'a', ['U', 's', ['U', 'w', ['U', 'b'], 'o'], 'n']] }),
    der({ title: 'Wort 3: aonsbnsw', steps: ['S', 'aU', 'aoUw', 'aonUsw', 'aonsUnsw', 'aonsbnsw'], tree: ['S', 'a', ['U', 'o', ['U', 'n', ['U', 's', ['U', 'b'], 'n'], 's'], 'w']] }),
    p(`Was mir an den Bäumen aufgefallen ist: Die Wörter sind um das b herum <b>gespiegelt</b>. n steht immer gegenüber von s, o gegenüber von w, wie öffnende und schließende Klammern. Das liegt daran, dass jede Regel links und rechts gleichzeitig ein Zeichen hinzufügt.`),

    h('Aufgabe 1b: Wann ist eine Grammatik regulär?'),
    table(['Art', 'erlaubte Regeln', 'Merkhilfe'], [
      ['rechtsregulär', 'A → aB, A → a, A → B, A → ε', 'höchstens ein Nichtterminal, und das steht ganz rechts'],
      ['linksregulär', 'A → Ba, A → a, A → B, A → ε', 'höchstens ein Nichtterminal, und das steht ganz links'],
    ], 'Eine Grammatik ist regulär, wenn sie rechts- ODER linksregulär ist. U → nUs ist keins von beiden.'),

    h('Aufgabe 2: Grammatik und Automat'),
    task(`<b>a)</b> Eine Grammatik für alle binären Wörter gerader Länge (ε, 00, 01, 10, 11, 0000, …), danach in einen DEA übersetzen.`),
    diff('aufgabe2a_grammatik.txt', 'umgebaut, damit die Grammatik wirklich rechtsregulär ist',
      `P = { S → 00S | 01S | 10S | 11S | ε }`,
      `P = { S → 0A | 1A | ε,
      A → 0S | 1S }`,
      `Meine erste Grammatik erzeugt die richtige Sprache, aber S → 00S hat zwei Terminale vor dem Nichtterminal. Nach der Definition aus 1b ist das nicht rechtsregulär. Mit dem Hilfssymbol A klappt es. Und das A hat eine Bedeutung: „bis jetzt ungerade viele Zeichen“. Damit wurde die Übersetzung in den Automaten fast geschenkt: Jedes Nichtterminal wird ein Zustand.`),
    dfa({
      title: 'DEA zu a): S = gerade, A = ungerade', w: 330, h: 140, start: 'S',
      states: [{ id: 'S', x: 90, y: 75, final: true }, { id: 'A', x: 240, y: 75 }],
      trans: [['S', '0, 1', 'A'], ['A', '0, 1', 'S']],
      tests: ['', '0110', '01', '010', '1']
    }),
    task(`<b>b)</b> Grammatik und Akzeptor für alle Wörter über {a,b}, die mit a beginnen und mit b enden. Ist die Sprache regulär?`),
    code(`G = ({S, A}, {a, b}, P, S)
P = { S → aA,
      A → aA | bA | b }`),
    p(`Ja, die Sprache ist regulär, denn die Grammatik ist rechtsregulär (immer ein Terminal und danach höchstens ein Nichtterminal). Deshalb gibt es auch einen DEA:`),
    dfa({
      title: 'DEA zu b)', w: 380, h: 150, start: 'q0',
      states: [{ id: 'q0', x: 60, y: 95 }, { id: 'q1', x: 185, y: 95 }, { id: 'q2', x: 310, y: 95, final: true }],
      trans: [['q0', 'a', 'q1'], ['q1', 'a', 'q1'], ['q1', 'b', 'q2'], ['q2', 'b', 'q2'], ['q2', 'a', 'q1']],
      tests: ['ab', 'aab', 'abab', 'abba', 'aba', 'b']
    }),

    h('Aufgabe 3: Grenzen regulärer Grammatiken'),
    task(`<b>a)</b> Welche Sprache erzeugt P = { S → 0A | 1B, A → 1 | 1S | 0AA, B → 0 | 0S | 1BB }? Erst mindestens fünf Wörter ableiten.`),
    der({ title: '0110', steps: ['S', '0A', '01S', '011B', '0110'], tree: ['S', '0', ['A', '1', ['S', '1', ['B', '0']]]] }),
    der({ title: '1100', steps: ['S', '1B', '11BB', '110B', '1100'], tree: ['S', '1', ['B', '1', ['B', '0'], ['B', '0']]] }),
    table(['Wort', 'Ableitung'], [
      ['01', 'S → 0A → 01'],
      ['10', 'S → 1B → 10'],
      ['0011', 'S → 0A → 00AA → 001A → 0011'],
      ['0101', 'S → 0A → 01S → 010A → 0101'],
      ['0110', 'siehe oben'],
      ['1100', 'siehe oben'],
    ]),
    p(`Beim Zählen ist es mir aufgefallen: In jedem Wort kommen <b>gleich viele 0 und 1</b> vor. A heißt quasi „es fehlt noch eine 1“, B heißt „es fehlt noch eine 0“, und AA heißt „es fehlen zwei 1en“. Deshalb heißt das wohl Balance-Sprache. Die Grammatik ist nicht regulär (bei 0AA stehen zwei Nichtterminale rechts).`),
    task(`<b>b)</b> Welche Sprache erzeugt S → a | b | aSa | bSb? Warum gibt es keinen DEA dafür?`),
    der({ title: 'ababa', steps: ['S', 'aSa', 'abSba', 'ababa'], tree: ['S', 'a', ['S', 'b', ['S', 'a'], 'b'], 'a'] }),
    p(`Weitere Wörter: a, b, aaa, aba, bab, abbba, baaab. Alle Wörter sind <b>Palindrome mit ungerader Länge</b> (vorwärts wie rückwärts gleich). Gerade Länge geht nicht, weil man immer mit genau einem a oder b in der Mitte aufhören muss.`),
    p(`<b>Warum kein DEA?</b> Um zu prüfen, ob ein Wort ein Palindrom ist, müsste sich der Automat die komplette erste Hälfte merken, damit er sie rückwärts mit der zweiten Hälfte vergleichen kann. Die Wörter können aber beliebig lang sein. Ein endlicher Automat hat nur endlich viele Zustände, also auch nur endlich viel Gedächtnis. Bei Aufgabe 4d (vorletzte Ziffer) mussten nur 2 Zeichen gemerkt werden, hier wären es unendlich viele.`),

    h('Aufgabe 4: Ipogesien'),
    task(`Produktionen: S → iAi, A → siAis | piBis, B → siBis | g. Welche der Wörter <code>ipigisi</code>, <code>isipisigisi</code>, <code>isipisigisisisi</code> sind ableitbar?`),
    der({ title: 'ipigisi', steps: ['S', 'iAi', 'ipiBisi', 'ipigisi'], tree: ['S', 'i', ['A', 'p', 'i', ['B', 'g'], 'i', 's'], 'i'] }),
    der({ title: 'isipisigisisisi', steps: ['S', 'iAi', 'isiAisi', 'isipiBisisi', 'isipisiBisisisi', 'isipisigisisisi'], tree: ['S', 'i', ['A', 's', 'i', ['A', 'p', 'i', ['B', 's', 'i', ['B', 'g'], 'i', 's'], 'i', 's'], 'i', 's'], 'i'] }),
    table(['Wort', 'ableitbar?', 'Begründung'], [
      ['ipigisi', '<span class="ok">ja</span>', 'S → iAi → ipiBisi → ipigisi'],
      ['isipisigisi', '<span class="bad">nein</span>', 'vor dem g stehen 4 i, danach nur 2. Jede Regel setzt aber links und rechts gleich viele i'],
      ['isipisigisisisi', '<span class="ok">ja</span>', 'Ableitung oben, vor und nach dem g je 4 i'],
    ]),
    p(`Bei isipisigisi habe ich es erst eine Weile probiert, bis ich das Muster gesehen habe: Jede Regel fügt links und rechts gleich viele i ein. Dadurch sind vor dem g und nach dem g immer gleich viele i. Das zu zählen ging viel schneller als alle Ableitungen auszuprobieren.`),
    refl(`Das war der erste Moment im Halbjahr, an dem wir eine echte <b>Grenze</b> gefunden haben. Bis jetzt dachte ich, für jede Sprache kann man irgendwie einen Automaten bauen. Bei den Palindromen geht das nicht, weil ein Automat nicht beliebig weit zählen oder sich beliebig viel merken kann. Grammatiken mit Regeln wie S → aSa können das, weil sie „von außen nach innen“ bauen und dadurch beide Seiten gleichzeitig wachsen.<br><br>Für meine Leitfrage heißt das: Die Anzahl der Zustände ist das Gedächtnis eines Automaten, und das ist begrenzt. Selbstständig zu arbeiten ging gut, aber bei 3b musste ich das Lernpaket zweimal lesen, bis ich die Begründung wirklich verstanden habe.`)
  ]
});

/* =====================================================================
   23.09.2026
   ===================================================================== */
ENTRIES.push({
  d: '2026-09-23', short: 'Mealy-Automaten', msg: 'Automaten mit Ausgabe: Mealy-Automaten modellieren', tags: ['Mealy-Automaten', 'FLACI'],
  body: [
    p(`Die Automaten bis jetzt waren <b>Akzeptoren</b>: Am Ende sagen sie nur „akzeptiert“ oder „nicht akzeptiert“. Heute ging es um <b>Transduktoren</b>, also Automaten mit Ausgabe. Beim <b>Mealy-Automaten</b> gibt es bei jedem gelesenen Zeichen genau ein Ausgabezeichen. Es steht direkt am Übergang: <code>Eingabe / Ausgabe</code>.`),
    table(['Teil', 'Bedeutung'], [
      ['X', 'Eingabealphabet'], ['Y', 'Ausgabealphabet'], ['Z', 'Zustände'],
      ['δ', 'Übergangsfunktion: wohin geht es'], ['λ', 'Ausgabefunktion: was wird ausgegeben'], ['z₀', 'Startzustand'],
    ], 'Mealy-Automat als 6-Tupel M = (X, Y, Z, δ, λ, z₀). Endzustände braucht man nicht mehr.'),

    h('Aufgabe 1: Der Getränkeautomat'),
    task(`Cola und Limo kosten 1,50 €. Der Automat nimmt 50-ct- und 1-€-Stücke, solange der Betrag noch nicht erreicht ist, sonst gibt er die Münze direkt zurück. Das Getränk kommt, wenn genug Geld drin ist und die Taste gedrückt wurde.`),
    p(`Die Zustände sind einfach der <b>bisher eingeworfene Betrag</b> in Cent. Eingaben: 50, 100, C (Cola-Taste), L (Limo-Taste).`),
    p(`Eine Sache war in der Aufgabe nicht klar: Was passiert, wenn 1,00 € drin ist und noch ein 1-€-Stück kommt? Der Betrag ist da noch nicht erreicht, also nimmt der Automat die Münze an, hat dann aber 50 ct zu viel. Ich habe es so gelöst, dass er die Münze annimmt und sofort 50 ct zurückgibt.`),
    dfa({
      title: 'Getränkeautomat', mealy: true, stay: true, sep: ',', w: 580, h: 290, start: 'g0',
      states: [{ id: 'g0', label: '0', x: 65, y: 150 }, { id: 'g50', label: '50', x: 205, y: 150 }, { id: 'g100', label: '100', x: 345, y: 150 }, { id: 'g150', label: '150', x: 495, y: 150 }],
      trans: [['g0', '50', '–', 'g50'], ['g0', '100', '–', 'g100'], ['g50', '50', '–', 'g100'], ['g50', '100', '–', 'g150'], ['g100', '50', '–', 'g150'], ['g100', '100', '50 zurück', 'g150'],
        ['g150', '50', '50 zurück', 'g150'], ['g150', '100', '100 zurück', 'g150'], ['g150', 'C', 'Cola', 'g0'], ['g150', 'L', 'Limo', 'g0']],
      bend: { 'g0>g100': -48, 'g50>g150': -48, 'g150>g0': -72 },
      tests: ['50,100,C', '100,100,L', '50,50,50,50,L', 'C', '100,50,C'],
      legend: 'Nicht gezeichnet: Drückt man eine Taste, bevor 1,50 € drin sind, passiert nichts (Ausgabe –, Zustand bleibt).'
    }),

    h('Aufgabe 2: Der Fahrkartenautomat (Zone I)'),
    task(`Zone I kostet 1,50 €, es gehen 50-ct- und 1-€-Stücke. Keine Taste: Die Fahrkarte kommt automatisch, sobald der Betrag erreicht ist. Zu viel Geld kommt sofort als Wechselgeld zurück.`),
    dfa({
      title: 'Fahrkartenautomat Zone I', mealy: true, sep: ',', w: 420, h: 330, start: 'z0',
      states: [{ id: 'z0', label: '0', x: 75, y: 165 }, { id: 'z50', label: '50', x: 310, y: 50 }, { id: 'z100', label: '100', x: 310, y: 280 }],
      trans: [['z0', '50', '–', 'z50'], ['z0', '100', '–', 'z100'], ['z50', '50', '–', 'z100'], ['z50', '100', 'Karte', 'z0'], ['z100', '50', 'Karte', 'z0'], ['z100', '100', 'Karte+50', 'z0']],
      tests: ['50,100', '100,100', '50,50,50', '100,50', '50,50,100']
    }),
    diff('fahrkarte.mealy', 'fix: Überzahlung vergessen',
      `z100 --100 / Karte--> z0`,
      `z100 --100 / Karte+50--> z0`,
      `Beim Testen in FLACI mit „100, 100“ kam bei mir nur „Karte“ raus. Dann wären 50 ct verloren. Laut Aufgabe soll aber zu viel Geld sofort zurückkommen.`),
    code(`M = (X, Y, Z, δ, λ, z₀)
X = {50, 100}        Y = {–, Karte, Karte+50}
Z = {z0, z50, z100}  z₀ = z0   (Zustand = schon bezahlter Betrag in ct)
δ / λ:  (z0, 50)  → z50,  –        (z0, 100)  → z100, –
        (z50, 50) → z100, –        (z50, 100) → z0,   Karte
        (z100,50) → z0,   Karte    (z100,100) → z0,   Karte+50`),

    h('Aufgabe 3: Der einarmige Bandit'),
    task(`Zwei Walzen mit Apfel (A), Birne (B) und Krone (K). Nach 1 € und Hebel erscheint eine Kombination. Zwei Kronen: doppelter Einsatz. Zwei Äpfel oder zwei Birnen: Einsatz zurück. Sonst nichts. Die Kombination im Fenster zählt selbst als Eingabe.`),
    dfa({
      title: 'Spielautomat', mealy: true, stay: true, sep: ',', w: 440, h: 280, start: 'w',
      states: [{ id: 'w', x: 75, y: 135 }, { id: 'b', x: 220, y: 50 }, { id: 'd', x: 365, y: 135 }],
      trans: [['w', 'M', '–', 'b'], ['b', 'H', '–', 'd'], ['d', 'KK', '2 €', 'w'], ['d', 'AA,BB', '1 €', 'w'], ['d', 'AB,BA,AK,KA,BK,KB', '0 €', 'w']],
      bend: { 'd>w': -40 },
      tests: ['M,H,KK', 'M,H,AB', 'M,H,AA', 'H,M,H,BB'],
      legend: 'w = wartet auf Münze, b = bezahlt, d = Walzen gedreht. Eingaben: M = Münze (1 €), H = Hebel, danach die Kombination. Falsche Eingaben (z. B. Hebel ohne Münze) werden ignoriert.'
    }),

    h('Aufgabe 4: Der Ziffern-Addierer'),
    task(`Ein Mealy-Automat mit X = {0, 1}, der zwei nacheinander eingegebene Ziffern addiert und die Summe ausgibt (01 → 1, 11 → 2). Danach soll er wieder im Startzustand sein.`),
    p(`Nach der ersten Ziffer gibt es noch kein Ergebnis, deshalb gebe ich <code>n</code> für „noch nichts“ aus. Der Zustand merkt sich die erste Ziffer.`),
    dfa({
      title: 'Addierer', mealy: true, w: 380, h: 280, start: 'z0',
      states: [{ id: 'z0', x: 80, y: 140 }, { id: 'z1', x: 300, y: 40 }, { id: 'z2', x: 300, y: 240 }],
      trans: [['z0', '0', 'n', 'z1'], ['z0', '1', 'n', 'z2'], ['z1', '0', '0', 'z0'], ['z1', '1', '1', 'z0'], ['z2', '0', '1', 'z0'], ['z2', '1', '2', 'z0']],
      tests: ['01', '11', '10', '0111'],
      legend: 'z1 = „erste Ziffer war 0“, z2 = „erste Ziffer war 1“. Bei 0111 werden zwei Additionen hintereinander gemacht: n, 1, n, 2.'
    }),
    refl(`Mealy-Automaten sind näher an echten Maschinen als die Akzeptoren, weil sie wirklich etwas <i>tun</i>. Am schwierigsten war nicht das Zeichnen, sondern die Aufgabe genau zu lesen. Beim Getränkeautomaten war unklar, was mit zu viel Geld passiert, da musste ich selbst eine Entscheidung treffen und sie begründen.<br><br>Zur Leitfrage: Auch der Getränkeautomat kommt nur mit wenigen Zuständen aus, weil der Betrag nie über 1,50 € geht. Ein Automat, der sich beliebig hohe Beträge merken müsste, ginge mit endlich vielen Zuständen nicht. Das ist dieselbe Grenze wie bei den Palindromen.`)
  ]
});

/* =====================================================================
   30.09.2026
   ===================================================================== */
ENTRIES.push({
  d: '2026-09-30', short: 'Syntaxdiagramme', msg: 'Syntaxdiagramme: Rechenausdrücke, ipigisi, E-Mail-Adressen', tags: ['Syntaxdiagramme', 'Rekursion'],
  body: [
    p(`Ein Syntaxdiagramm ist eine grafische Methode, um die Grammatik einer formalen Sprache darzustellen. Es zeigt, welche Zeichenketten gültig sind. Weil sie an Gleisanlagen erinnern, heißen sie auch Railroad-Diagramme. Man fährt von links nach rechts in Pfeilrichtung und darf nicht spitz abbiegen. Jeder Weg vom Eingang zum Ausgang ergibt ein gültiges Wort.`),
    table(['Baustein', 'Aussehen', 'Bedeutung'], [
      ['Terminal', 'abgerundet (grün)', 'genau dieses Zeichen steht im Wort'],
      ['Nichtterminal', 'eckig', 'Platzhalter, wird in einem eigenen Diagramm erklärt'],
      ['Sequenz', 'hintereinander', 'in genau dieser Reihenfolge'],
      ['Alternative', 'Weg teilt sich', 'genau einer der Wege'],
      ['Option', 'Weg daran vorbei', 'kann, muss aber nicht'],
      ['Wiederholung', 'Rückweg nach links', 'beliebig oft (mindestens einmal)'],
    ]),
    rail([['Bezeichner', Seq(N('Buchstabe'), Opt(Rep(Alt(N('Buchstabe'), N('Ziffer')))))]], 'Beispiel aus der Theorie, von mir nachgezeichnet: Ein Variablenname beginnt mit einem Buchstaben, danach beliebig viele Buchstaben oder Ziffern. „x2a“ ist gültig, „2x“ nicht.'),

    h('Diagramme lesen: Rechenausdrücke'),
    task(`<b>a)</b> Analysiere die Wegbeschreibung Ausdruck → Summand + Summand → … → x + 2 0 * y. <b>b)</b> Konstruiere Wegbeschreibungen für x-y-2, x-(y-2) und (x+y)*(x-y).`),
    p(`Zu a): Im Diagramm <i>Ausdruck</i> wird die Schleife einmal durchlaufen (Summand, +, Summand). Der erste Summand wird über Faktor → Variable zu x. Der zweite Summand nimmt die Schleife mit * (Faktor * Faktor). Der erste Faktor wird eine Zahl aus zwei Ziffern (20), der zweite eine Variable (y). Ergebnis: <code>x+20*y</code>.`),
    p(`Zu b), meine Wegbeschreibungen:`),
    code(`x-y-2:
Ausdruck → Summand - Summand - Summand
         → Faktor - Summand - Summand → Variable - Summand - Summand
         → x - Summand - Summand → x - Faktor - Summand
         → x - Variable - Summand → x - y - Summand → x - y - Faktor
         → x - y - Zahl → x - y - Ziffer → x - y - 2

x-(y-2):
Ausdruck → Summand - Summand → Faktor - Summand → Variable - Summand
         → x - Summand → x - Faktor → x - ( Ausdruck )
         → x - ( Summand - Summand ) → x - ( Faktor - Summand )
         → x - ( Variable - Summand ) → x - ( y - Summand )
         → x - ( y - Faktor ) → x - ( y - Zahl ) → x - ( y - Ziffer ) → x - ( y - 2 )

(x+y)*(x-y):
Ausdruck → Summand → Faktor * Faktor → ( Ausdruck ) * Faktor
         → ( Summand + Summand ) * Faktor → ( Faktor + Faktor ) * Faktor
         → ( Variable + Variable ) * Faktor → ( x + y ) * Faktor
         → ( x + y ) * ( Ausdruck ) → ( x + y ) * ( Summand - Summand )
         → ( x + y ) * ( Faktor - Faktor ) → ( x + y ) * ( Variable - Variable )
         → ( x + y ) * ( x - y )`),
    p(`Spannend fand ich den Unterschied zwischen x-y-2 und x-(y-2): Bei der Klammer springt man aus <i>Faktor</i> wieder ganz nach oben ins Diagramm <i>Ausdruck</i>. Ein Diagramm ruft sich also über Umwege selbst auf. Das ist <b>Rekursion</b>, und dadurch kann man beliebig tief verschachtelte Klammern bauen.`),

    h('Aufgabe 3: ipigisi'),
    task(`<b>a)</b> Syntaxdiagramm für „isi-Folgen“: i, isi, isisi, … <b>b)</b> Syntaxdiagramme für „ipigisi-Folgen“ mit der Struktur isi-Folge p isi-Folge g isi-Folge.`),
    diff('aufgabe3a_isi.txt', 'Skizze aus der Stunde sauber gezeichnet',
      `   ---i---
   -----s--`,
      `isi-Folge:  ──▶ i ──▶ (Ausgang)
             ▲         │
             └── s ◀───┘
Wiederholung: Das s liegt auf dem Rückweg,
deshalb steht zwischen zwei i immer genau ein s`,
      `In meiner Mitschrift aus der Stunde hatte ich nur zwei Striche mit i und s. Da sieht man nicht, dass das s auf dem <b>Rückweg</b> liegt. Genau darauf kommt es an: Wäre das s auf dem Hinweg, könnte das Wort mit s anfangen.`),
    rail([
      ['isi-Folge', Rep(T('i'), T('s'))],
      ['ipigisi-Folge', Seq(N('isi-Folge'), T('p'), N('isi-Folge'), T('g'), N('isi-Folge'))],
    ], 'Meine Diagramme zu a) und b)'),
    p(`Weil diese Diagramme keine Rekursion haben, kann man das auch als regulären Ausdruck schreiben. Zum Testen:`),
    rx({ title: 'ipigisi-Folge als regulärer Ausdruck', p: String.raw`i(si)*pi(si)*gi(si)*`, tests: ['ipigi', 'ipigisi', 'isipigisi', 'isipisigisi', 'ipgi', 'isspigi'] }),
    task(`<b>c)</b> Ein „mathematisch korrekter ipigisi-Ausdruck“ hat vor dem g genauso viele i wie danach. Kann man das mit Syntaxdiagrammen beschreiben?`),
    p(`Hier habe ich gemerkt: Das ist genau die Sprache aus <b>Ipogesien</b> vom 09.09.! Dort war jedes ableitbare Wort so, dass vor und nach dem g gleich viele i stehen. Die Produktionen kann man direkt in Diagramme übersetzen:`),
    rail([
      ['Ausdruck', Seq(T('i'), N('A'), T('i'))],
      ['A', Alt(Seq(T('s'), T('i'), N('A'), T('i'), T('s')), Seq(T('p'), T('i'), N('B'), T('i'), T('s')))],
      ['B', Alt(Seq(T('s'), T('i'), N('B'), T('i'), T('s')), T('g'))],
    ], 'A und B rufen sich selbst auf (Rekursion). Dadurch wachsen beide Seiten gleich schnell.'),
    p(`<b>Antwort:</b> Ja, aber nur mit <b>rekursiven</b> Syntaxdiagrammen. Ohne Rekursion (also nur mit Schleifen) geht es nicht, denn eine Schleife kann nicht „mitzählen“, wie oft sie vorher durchlaufen wurde. Und weil ohne Rekursion = regulär ist, gibt es dafür auch keinen endlichen Automaten. Genau wie bei den Palindromen.`),

    h('Aufgabe 4: E-Mail-Adressen'),
    task(`Vereinfachte E-Mail-Adressen aus b, @ und . (Beispiel: bb@b.bbb). <b>a)</b> Warum ist die Textbeschreibung zu ungenau? <b>b)</b> Präzisiere mit Syntaxdiagrammen.`),
    p(`Zu a), Fragen, die der Text nicht beantwortet:`),
    p(`<ul>
<li>Darf der User-Name leer sein? Ist <code>@b.b</code> gültig?</li>
<li>Wie viele Subdomains braucht man mindestens? Ist <code>bb@b</code> gültig oder braucht man einen Punkt?</li>
<li>Darf eine Subdomain leer sein, also <code>b@b..b</code> oder <code>b@b.</code>?</li>
</ul>`),
    p(`Zu b), meine Festlegungen: User-Name mindestens ein b. Mindestens zwei Subdomains (also mindestens ein Punkt). Jede Subdomain mindestens ein b, deshalb nie zwei Punkte hintereinander.`),
    rail([
      ['Adresse', Seq(N('User'), T('@'), N('Domain'))],
      ['User', Rep(T('b'))],
      ['Domain', Seq(N('Subdomain'), T('.'), Rep(N('Subdomain'), T('.')))],
      ['Subdomain', Rep(T('b'))],
    ]),
    rx({ title: 'dieselben Regeln als regulärer Ausdruck', p: String.raw`b+@b+(\.b+)+`, tests: ['bb@b.bbb', 'b@b.b.b', '@b.b', 'bb@b', 'b@b..b', 'b@b.'] }),
    refl(`Heute hat sich für mich viel verbunden. Ein Syntaxdiagramm ohne Rekursion ist dasselbe wie ein regulärer Ausdruck (Option = ?, Wiederholung = +, Alternative = |). Mit Rekursion ist es dasselbe wie eine Grammatik. Ipogesien und „mathematisch korrekte ipigisi-Ausdrücke“ sind dieselbe Sprache, nur einmal als Produktionen und einmal als Bild.<br><br>Bei Aufgabe 4 habe ich gelernt, dass man eine Sprache nicht nur korrekt, sondern auch <b>vollständig</b> beschreiben muss. Eine Textbeschreibung lässt fast immer Fälle offen, ein Diagramm nicht.`)
  ]
});

/* =====================================================================
   28.10.2026
   ===================================================================== */
const RM_21 = `      LOAD #0
      STORE 2
M:    LOAD 1
      DIV #2
      STORE 1
      JZERO Ende
      LOAD 2
      ADD #1
      STORE 2
      GOTO M
Ende: END`;
const RM_22 = `LOAD 1
SUB 2
STORE 3
LOAD 2
SUB 1
ADD 3
STORE 3
END`;
ENTRIES.push({
  d: '2026-10-28', short: 'Registermaschine', msg: 'Registermaschine: Aufbau, Befehle, erste Ablaufprotokolle', tags: ['Registermaschine', 'Simulator'],
  body: [
    p(`Nach den Herbstferien hat das letzte große Thema angefangen: die <b>Registermaschine</b>. Das ist ein Modell, das schon ziemlich nah an einem echten Prozessor ist.`),
    table(['Teil', 'Bedeutung'], [
      ['Register R1, R2, …', 'speichern je eine natürliche Zahl. Am Anfang stehen die Eingaben in den ersten Registern, der Rest ist 0'],
      ['Akkumulator (Akku)', 'hier wird gerechnet, immer nur hier'],
      ['Programm', 'Befehle, die von oben nach unten abgearbeitet werden'],
      ['Marken', 'Name mit Doppelpunkt (z. B. M:), Ziel für Sprünge'],
    ]),
    table(['Schreibweise', 'Bedeutung', 'Beispiel'], [
      ['<code>#i</code>', 'die Zahl i selbst (Konstante)', 'LOAD #7 lädt 7'],
      ['<code>i</code>', 'der Inhalt von Register Ri', 'ADD 4 addiert den Inhalt von R4'],
      ['<code>*i</code>', 'das Register, dessen Nummer in Ri steht (indirekt)', 'R3 = 9: STORE *3 speichert in R9'],
    ], 'Die drei Operandenarten. Den Unterschied zwischen #1 und 1 habe ich in Aufgabe 2.2 erst durch einen Fehler richtig verstanden.'),
    p(`Befehle: LOAD, STORE, ADD, SUB, MUL, DIV, GOTO, JZERO (springt bei Akku = 0), JNZERO (springt bei Akku > 0), END. Zwei Stolperstellen: <b>SUB rechnet nie ins Negative</b> (3 − 5 = 0), und <b>DIV rechnet ganzzahlig</b> (7 / 2 = 3).`),

    h('Aufgabe 2.1: Ein Programm mit Schleife'),
    task(`a) Ablaufprotokoll für R1 = 6. b) Was liefert das Programm in R2 für beliebige n? Teste n = 1, 8, 15, 16. c) Zusammenhang mit der Binärdarstellung von n.`),
    rm({ title: 'Aufgabe 2.1', code: RM_21, init: { 1: 6 }, inits: [{ 1: 6 }, { 1: 1 }, { 1: 8 }, { 1: 15 }, { 1: 16 }], cols: [1, 2] }),
    diff('aufgabe2.1b.txt', 'Vermutung nach nur einem Testwert war falsch',
      `b) Immer 2 (bei n = 6 kam 2 raus)`,
      `b) R2 gibt an, wie oft man n ganzzahlig halbieren kann, bis 1 erreicht ist
   n = 1 → 0,  n = 6 → 2,  n = 8 → 3,  n = 15 → 3,  n = 16 → 4`,
      `Nach dem Protokoll für n = 6 habe ich zu schnell „immer 2“ hingeschrieben. Erst mit den anderen Startwerten (die Knöpfe oben) habe ich gesehen, dass es von n abhängt. Lehre daraus: aus einem einzigen Beispiel keine allgemeine Regel machen.`),
    p(`<b>c) Binärdarstellung:</b> DIV #2 schneidet in der Binärdarstellung die letzte Ziffer ab (6 = 110 → 11 → 1 → 0). Das Programm zählt also, wie oft man abschneiden kann, bis nur noch die führende 1 übrig ist. <b>R2 = Anzahl der Binärstellen von n minus 1</b>. Beispiel: 16 = 10000 hat 5 Stellen, R2 = 4. 15 = 1111 hat 4 Stellen, R2 = 3.`),

    h('Aufgabe 2.2: Zwei Subtraktionen'),
    task(`a) Inhalt von R3 am Ende für (R1, R2) = (5, 8), (8, 5) und (4, 4). b) Was berechnet das Programm allgemein? c) Warum funktioniert es nur, weil SUB nicht negativ wird?`),
    rm({ title: 'Aufgabe 2.2', code: RM_22, init: { 1: 5, 2: 8 }, inits: [{ 1: 5, 2: 8 }, { 1: 8, 2: 5 }, { 1: 4, 2: 4 }], cols: [1, 2, 3] }),
    diff('aufgabe2.2_protokoll.txt', 'fix: LOAD 1 heißt Inhalt von R1, nicht die Zahl 1',
      `Nr  Befehl    Akku  R1  R2  R3
1   LOAD #1   1     5   8
2   SUB 2     0     5   8
3   STORE 3   0     5   8   0
4   LOAD 2    8     5   8   0
5   SUB 1     7     5   8   0
6   ADD 3     7     5   8   0
7   STORE 3   7     5   8   7`,
      `Nr  Befehl    Akku  R1  R2  R3
1   LOAD 1    5     5   8
2   SUB 2     0     5   8        (5 − 8 wäre negativ → 0)
3   STORE 3   0     5   8   0
4   LOAD 2    8     5   8   0
5   SUB 1     3     5   8   0    (8 − 5, nicht 8 − 1!)
6   ADD 3     3     5   8   0
7   STORE 3   3     5   8   3`,
      `Ich habe LOAD 1 und SUB 1 so gerechnet, als stünde dort #1. Ohne # ist aber der <b>Inhalt von R1</b> gemeint (also 5). Beim ersten Befehl ist der Fehler nicht aufgefallen, weil 1 − 8 und 5 − 8 beide 0 ergeben. Erst beim Vergleich mit dem Simulator kam statt 7 die 3 heraus.`),
    p(`Ergebnisse: (5, 8) → R3 = 3, (8, 5) → R3 = 3, (4, 4) → R3 = 0.`),
    p(`<b>b)</b> Das Programm berechnet den <b>Abstand</b> der beiden Zahlen: R3 = |R1 − R2|.`),
    p(`<b>c)</b> Es rechnet R1 − R2 und R2 − R1 und addiert beide. Weil SUB nie negativ wird, ist eine der beiden Differenzen immer 0 und die andere ist der echte Abstand. Würde SUB negativ rechnen, wäre (R1 − R2) + (R2 − R1) immer 0.`),
    refl(`Die Registermaschine fühlt sich ganz anders an als die Automaten, eher wie Programmieren in einer sehr eingeschränkten Sprache. Meine zwei Fehler heute hatten beide dieselbe Ursache: Ich habe zu schnell gearbeitet. Einmal habe ich aus einem einzigen Testwert eine Regel gemacht, einmal habe ich #1 und 1 verwechselt. Ab jetzt schreibe ich bei jedem Operanden kurz dazu, ob es eine Zahl oder ein Register ist. Außerdem mache ich das Protokoll erst auf Papier und kontrolliere dann mit dem Simulator, nicht umgekehrt.`)
  ]
});

/* =====================================================================
   04.11.2026
   ===================================================================== */
const RM_23_ALT = `        LOAD #1
        STORE 2     // Ergebnis = 1
M:      LOAD 1
        SUB #1
        STORE 1
        JZERO Ende
        LOAD 2
        MUL #2
        STORE 2
        GOTO M
Ende:   END`;
const RM_23 = `        LOAD #1
        STORE 2     // Ergebnis = 1
M:      LOAD 1
        JZERO Ende  // erst prüfen ...
        SUB #1      // ... dann herunterzählen
        STORE 1
        LOAD 2
        MUL #2
        STORE 2
        GOTO M
Ende:   END`;
const RM_31 = `// Aufgabe 3.1: Verzweigung
// R1, R2, R3 enthalten die Eingaben, ab R4 Hilfsregister
         LOAD 2
         ADD #18
         SUB 1          // (r2 + 18) - r1
         JZERO größer   // = 0  <=>  r1 > r2 + 17
         JNZERO kleiner
größer:  LOAD 2
         MUL #2
         ADD #1
         STORE 2        // r2 = 2 * r2 + 1
         GOTO weiter
kleiner: LOAD 2
         MUL 3
         STORE 2        // r2 = r2 * r3
weiter:  END`;
const RM_32 = `Start: LOAD 1
       MUL #2
       ADD #1
       STORE 1      // r1 = 2 * r1 + 1
       LOAD 2
       SUB #1
       STORE 2      // r2 = r2 - 1
       LOAD 1
       SUB 2        // r1 - r2 = 0  <=>  r2 >= r1
       JZERO Start
       END`;
ENTRIES.push({
  d: '2026-11-04', short: 'Registermaschine 2', msg: 'Registermaschine: Fehlersuche, indirekte Adressierung, if/else und do-while übersetzen', tags: ['Registermaschine', 'Simulator'],
  body: [
    h('Aufgabe 2.3: Fehlersuche'),
    task(`Das Programm soll 2ⁿ berechnen (n steht in R1). a) Ergebnis für n = 3? b) Fehler finden und korrigieren. c) Warum ist das Ergebnis für n = 0 schon richtig?`),
    rm({ title: 'Aufgabe 2.3', code: RM_23_ALT, init: { 1: 3 }, inits: [{ 1: 3 }, { 1: 0 }, { 1: 1 }, { 1: 5 }], cols: [1, 2],
      variants: [{ label: 'fehlerhaftes Programm', code: RM_23_ALT }, { label: 'meine Korrektur', code: RM_23 }] }),
    p(`<b>a)</b> Erwartet: 2³ = 8. Das Programm liefert aber <b>4</b>. Bei n = 5 kommt 16 statt 32 raus, also immer eine Verdopplung zu wenig.`),
    diff('aufgabe2.3.rm', 'fix: erst prüfen, dann herunterzählen',
      `M:      LOAD 1
        SUB #1
        STORE 1
        JZERO Ende`,
      `M:      LOAD 1
        JZERO Ende  // erst prüfen ...
        SUB #1      // ... dann herunterzählen
        STORE 1`,
      `Das Programm zählt n zuerst herunter und prüft danach auf 0. Beim letzten Durchlauf wird R1 von 1 auf 0 gesetzt, und dann springt es sofort zum Ende, <b>bevor</b> noch einmal verdoppelt wird. Die Prüfung muss also vor das Herunterzählen.`),
    p(`<b>c)</b> Bei n = 0 ergibt SUB #1 wieder 0 (SUB wird nie negativ). Dann wird sofort gesprungen, R2 bleibt 1, und 2⁰ = 1 ist ja richtig. Der Fehler fällt bei 0 also nur zufällig nicht auf. Deshalb ist es wichtig, mehrere Werte zu testen und nicht nur den Randfall.`),

    h('Aufgabe 2.4: Indirekte Adressierung'),
    task(`Startbelegung R1 = 4, R2 = 5, R3 = 6, R4 = 7, R5 = 8. a) Ablaufprotokoll. b) Welche Register werden gelesen, welches beschrieben? c) Was ändert sich, wenn am Anfang in R3 eine 1 steht?`),
    rm({ title: 'Aufgabe 2.4', code: `LOAD *1\nADD *2\nSTORE *3\nEND`, init: { 1: 4, 2: 5, 3: 6, 4: 7, 5: 8 }, cols: [1, 2, 3, 4, 5, 6],
      inits: [{ 1: 4, 2: 5, 3: 6, 4: 7, 5: 8 }, { 1: 4, 2: 5, 3: 1, 4: 7, 5: 8 }] }),
    p(`<b>b)</b> R1, R2 und R3 werden nur als „Zeiger“ gelesen. Die eigentlichen Werte kommen aus <b>R4</b> (weil R1 = 4) und <b>R5</b> (weil R2 = 5). Geschrieben wird in <b>R6</b> (weil R3 = 6): R6 = 7 + 8 = 15.`),
    p(`<b>c)</b> Steht in R3 eine 1, wird das Ergebnis 15 in <b>R1</b> geschrieben. Damit wird der Zeiger überschrieben. Das Programm ist danach zwar fertig, aber die Eingabe ist kaputt. Im Simulator oben über den zweiten Knopf ausprobierbar.`),

    h('Aufgabe 3.1: Verzweigung'),
    task(`Übersetze in ein RM-Programm: if (r1 > r2 + 17) { r2 = 2 * r2 + 1; } else { r2 = r2 * r3; }`),
    p(`Vergleiche gehen nur über SUB und die Prüfung auf 0. Weil SUB nie negativ wird, gilt: a − b = 0 genau dann, wenn a ≤ b. Ich brauche „r1 > r2 + 17“. Das ist dasselbe wie „r1 ≥ r2 + 18“, also „(r2 + 18) − r1 = 0“.`),
    rm({ title: 'Aufgabe 3.1', code: RM_31, init: { 1: 30, 2: 10, 3: 3 }, inits: [{ 1: 30, 2: 10, 3: 3 }, { 1: 27, 2: 10, 3: 3 }, { 1: 28, 2: 10, 3: 3 }], cols: [1, 2, 3] }),
    diff('aufgabe3.1.rm', 'fix: Gleichheitsfall r1 = r2 + 17 lief in den falschen Zweig',
      `LOAD 2
ADD #17
SUB 1          // (r2 + 17) - r1`,
      `LOAD 2
ADD #18
SUB 1          // (r2 + 18) - r1`,
      `Mit ADD #17 springt das Programm schon bei r1 = r2 + 17 in den then-Zweig. Getestet mit r1 = 27, r2 = 10: 27 > 27 ist falsch, also müsste r2 = 10 · 3 = 30 werden. Mein Programm hat aber 21 berechnet. Weil es nur natürliche Zahlen gibt, ist „> x“ dasselbe wie „≥ x + 1“, deshalb #18.`),
    table(['r1', 'r2', 'r3', 'Bedingung r1 > r2+17', 'erwartet r2', 'Simulator'], [
      ['30', '10', '3', 'wahr', '21', '21 ✓'], ['27', '10', '3', 'falsch (Grenzfall)', '30', '30 ✓'], ['28', '10', '3', 'wahr', '21', '21 ✓'],
    ], 'Meine Testfälle. Der Grenzfall ist der wichtigste.'),

    h('Aufgabe 3.2: Schleife mit Prüfung am Ende'),
    task(`Übersetze: do { r1 = 2 * r1 + 1; r2 = r2 - 1; } while (r2 >= r1); Dann R1 und R2 am Ende für R1 = 0, R2 = 10.`),
    p(`Bei do-while steht die Prüfung am Ende, gesprungen wird zurück an den Anfang, wenn die Bedingung wahr ist. r2 ≥ r1 ist dasselbe wie r1 − r2 = 0, also LOAD 1, SUB 2, JZERO Start.`),
    rm({ title: 'Aufgabe 3.2', code: RM_32, init: { 1: 0, 2: 10 }, cols: [1, 2] }),
    p(`Ergebnis: <b>R1 = 15, R2 = 6</b>. Die Schleife läuft viermal: (1, 9), (3, 8), (7, 7), (15, 6). Bei (7, 7) gilt r2 ≥ r1 gerade noch, deshalb kommt noch ein vierter Durchlauf.`),
    refl(`Heute ging es eigentlich die ganze Zeit um <b>Randfälle</b>: n = 0 bei 2.3, r1 = r2 + 17 bei 3.1 und (7, 7) bei 3.2. Bei allen drei Aufgaben lag der Fehler oder die Schwierigkeit genau an der Grenze. Ich habe mir angewöhnt, bei jeder Bedingung den Fall „genau gleich“ extra zu testen.<br><br>Zur Leitfrage: Die Registermaschine kann sich in ihren Registern beliebig große Zahlen merken. Das ist der große Unterschied zum endlichen Automaten, der nur endlich viele Zustände hat. Mit indirekter Adressierung kann sie sogar wie mit einem Array durch viele Register laufen.`)
  ]
});

/* =====================================================================
   11.11.2026
   ===================================================================== */
const RM_Q = `      LOAD #1
      STORE 3
M:    LOAD 1
      JZERO Ende
      LOAD 2
      ADD 3
      STORE 2
      LOAD 3
      ADD #2
      STORE 3
      LOAD 1
      SUB #1
      STORE 1
      GOTO M
Ende: END`;
const RM_33 = `// R1 = n, R2 = z
M:       LOAD 1
         JZERO Ende     // while (n > 0)
         SUB #10
         JZERO kleiner  // n - 10 = 0  <=>  n <= 10
         STORE 1        // n = n - 10 (steht schon im Akku)
         GOTO zaehlen
kleiner: LOAD 1
         SUB #1
         STORE 1        // n = n - 1
zaehlen: LOAD 2
         ADD #1
         STORE 2        // z = z + 1
         GOTO M
Ende:    END`;
ENTRIES.push({
  d: '2026-11-11', short: 'Klausurvorbereitung', msg: 'Klausurvorbereitung: Probeklausur unter Zeitdruck und Auswertung', tags: ['Probeklausur', 'alle Themen'],
  body: [
    p(`Heute haben wir für die Klausur geübt. Ich habe die Probeklausur aus Moodle wie eine echte Klausur bearbeitet: Timer auf 90 Minuten, auf Papier, ohne Tipps. Danach habe ich mit dem Erwartungshorizont verglichen und meine Lösungen hier im Simulator kontrolliert.`),
    table(['Aufgabe', 'Thema'], [['1 · Signaturen in der Schulbibliothek', 'Syntaxdiagramme, Automat, regulärer Ausdruck'], ['2 · Höhenprofile von Wanderwegen', 'Grammatik, Ableitungsbaum, Grenzen von Automaten'], ['3 · Quadratzahlen', 'Registermaschine']]),

    h('1.3: Automat für Signaturen'),
    task(`Signaturen wie M-7 oder PH-120: ein oder zwei Großbuchstaben, Bindestrich, Nummer mit 1 bis 3 Ziffern ohne führende 0. Alphabet Σ = {b, n, 0, -} (b = Großbuchstabe, n = Ziffer 1 bis 9). Zeige, dass PH-40 akzeptiert wird.`),
    dfa({
      title: 'Signatur-Automat', w: 600, h: 230, start: 's0',
      states: [{ id: 's0', x: 60, y: 90 }, { id: 's1', x: 150, y: 90 }, { id: 's2', x: 150, y: 190 }, { id: 's3', x: 260, y: 90 }, { id: 's4', x: 365, y: 90, final: true }, { id: 's5', x: 455, y: 90, final: true }, { id: 's6', x: 545, y: 90, final: true }],
      trans: [['s0', 'b', 's1'], ['s1', 'b', 's2'], ['s1', '-', 's3'], ['s2', '-', 's3'], ['s3', 'n', 's4'], ['s4', 'n, 0', 's5'], ['s5', 'n, 0', 's6']],
      tests: ['bb-n0', 'b-n', 'b-nn0', 'b-0', 'bbb-n', 'b-n000', 'bb-'],
      legend: 'Fehlende Übergänge führen in einen Fehlerzustand (vermerkt, wie in der Aufgabe erlaubt). PH-40 wird zu bb-n0.'
    }),
    diff('probeklausur_1.3.txt', 'fix: erste Ziffer darf keine 0 sein',
      `s3 --n, 0--> s4`,
      `s3 --n--> s4`,
      `In der Klausur hatte ich am Übergang nach dem Bindestrich auch die 0 erlaubt. Dann würde „D-012“ akzeptiert, das ist laut Aufgabe 1.2 aber gerade ungültig. Ich hätte meinen Automaten mit den Wörtern aus 1.2 testen sollen, die standen ja direkt darüber.`),
    p(`Konfigurationsfolge für PH-40 = bb-n0: ⟨s0, bb-n0⟩ ⊢ ⟨s1, b-n0⟩ ⊢ ⟨s2, -n0⟩ ⊢ ⟨s3, n0⟩ ⊢ ⟨s4, 0⟩ ⊢ ⟨s5, ε⟩. Das Wort ist zu Ende und s5 ist Endzustand, also akzeptiert.`),

    h('1.4: Regulärer Ausdruck für Signaturen'),
    rx({ title: 'Signaturen', p: String.raw`[A-Z]{1,2}-[1-9][0-9]?[0-9]?`, tests: ['M-7', 'PH-120', 'E-305', 'INF-12', 'D-012', 'PH-1000'] }),

    h('2.1: Ableitungsbaum'),
    task(`G mit S → hSr | hGr, G → eG | e. Leite hheerr ab und zeichne den Ableitungsbaum.`),
    der({ title: 'hheerr', steps: ['S', 'hSr', 'hhGrr', 'hheGrr', 'hheerr'], tree: ['S', 'h', ['S', 'h', ['G', 'e', ['G', 'e']], 'r'], 'r'] }),
    h('2.4: Gibt es einen endlichen Automaten für L(G)?'),
    p(`Meine Antwort in der Klausur: Nein. L(G) sind die Wörter hⁿeᵐrⁿ, also genauso viele r wie h. Ein Automat müsste sich nach den h merken, wie viele es waren. n kann beliebig groß sein, ein endlicher Automat hat aber nur endlich viele Zustände. Spätestens wenn n größer ist als die Anzahl der Zustände, kann er die Anzahl nicht mehr unterscheiden.`),
    p(`Im Erwartungshorizont stand ein Hinweis, auf den ich nicht gekommen wäre: Dass die Grammatik nicht regulär ist (2.3), beweist allein noch nicht, dass es keinen Automaten gibt. Es könnte ja eine andere, reguläre Grammatik für dieselbe Sprache geben. Man muss mit der Sprache selbst argumentieren. Meine Begründung hat das zum Glück schon gemacht.`),

    h('3: Quadratzahlen mit der Registermaschine'),
    rm({ title: 'Material 3', code: RM_Q, init: { 1: 2 }, inits: [{ 1: 0 }, { 1: 1 }, { 1: 2 }, { 1: 3 }, { 1: 4 }], cols: [1, 2, 3] }),
    p(`<b>3.2</b> Am Ende steht in R2 die Zahl <b>n²</b>. R3 läuft durch die ungeraden Zahlen 1, 3, 5, …, und die werden in R2 aufsummiert: 1 = 1, 1 + 3 = 4, 1 + 3 + 5 = 9. Die Summe der ersten n ungeraden Zahlen ist n².`),
    p(`<b>3.4</b> Laufzeit: Ich habe im Simulator die ausgeführten Befehle für n = 0, 1, 2, 3 abgelesen: 5, 17, 29, 41. Es kommen pro Schleifendurchlauf immer 12 Befehle dazu, also <b>Zeit(n) = 12 · n + 5</b> (2 Befehle vorher, 12 pro Durchlauf, 3 beim Verlassen).`),
    h('3.3: while und if übersetzen'),
    task(`z = 0; while (n > 0) { if (n > 10) { n = n - 10; } else { n = n - 1; } z = z + 1; }`),
    rm({ title: 'Aufgabe 3.3', code: RM_33, init: { 1: 25 }, inits: [{ 1: 25 }, { 1: 0 }, { 1: 10 }, { 1: 11 }, { 1: 3 }], cols: [1, 2] }),
    p(`Kleiner Trick, den ich erst beim Nachkontrollieren gesehen habe: Nach SUB #10 steht n − 10 schon im Akku. Im then-Zweig reicht deshalb STORE 1, man muss nicht nochmal laden. Getestet mit den Grenzfällen 10 und 11: Bei 10 wird zehnmal 1 abgezogen (z = 10), bei 11 einmal 10 und dann einmal 1 (z = 2).`),

    h('Meine Auswertung'),
    table(['Teil', 'wie es lief', 'woran es lag'], [
      ['1.1, 1.2 Syntaxdiagramme', 'sicher', 'viel geübt am 30.09.'],
      ['1.3 Automat', 'Fehler (führende 0)', 'nicht mit den Beispielen aus 1.2 getestet'],
      ['1.4 regulärer Ausdruck', 'sicher', ''],
      ['2.1 – 2.3 Grammatik', 'sicher', 'Ableitungsbäume kannte ich aus dem Arbeitsauftrag'],
      ['2.4 Grenzen von Automaten', 'richtig, aber knapp', 'Begründung hätte ausführlicher sein können'],
      ['3.1 – 3.4 Registermaschine', 'sicher, aber langsam', 'Ablaufprotokoll kostet viel Zeit'],
      ['3.5 Laufzeit beurteilen', 'nicht mehr geschafft', 'Zeit war um'],
    ]),
    refl(`Unter Zeitdruck mache ich genau die Fehler, die ich aus dem Halbjahr schon kenne: Randfälle übersehen (führende 0) und zu wenig testen. Das Gute ist, dass ich die Fehler inzwischen schnell selbst finde, wenn ich mit Beispielen kontrolliere. Für die Klausur nehme ich mir vor: bei jedem Automaten am Ende zwei gültige und zwei ungültige Wörter durchspielen, und bei der Registermaschine nur die STORE-Zeilen protokollieren, damit das Protokoll schneller geht.<br><br>Die Probeklausur hat auch gezeigt, wie alles zusammenhängt: Eine Aufgabe (Signaturen) wurde mit Syntaxdiagramm, Automat und regulärem Ausdruck beschrieben, also drei Darstellungen derselben Sprache.`)
  ]
});

/* =====================================================================
   Fazit
   ===================================================================== */
const HIER = `<svg class="hier" viewBox="0 0 640 330" role="img" aria-label="Wie stark sind die Modelle?">
<rect x="4" y="4" width="632" height="322" rx="14" fill="#eef3f9" stroke="#7a9cc2"/>
<text x="20" y="30" font-weight="700" font-size="15">Registermaschine / Turingmaschine</text>
<text x="20" y="50" font-size="12.5" fill="#555">kann sich beliebig große Zahlen merken → z. B. aⁿbⁿ, n², Primzahltest</text>
<rect x="24" y="66" width="592" height="244" rx="12" fill="#f3f8ee" stroke="#8fb36a"/>
<text x="40" y="92" font-weight="700" font-size="15">Grammatiken / Syntaxdiagramme MIT Rekursion</text>
<text x="40" y="112" font-size="12.5" fill="#555">Palindrome (09.09.), Balance-Sprache, Ipogesien = korrekte ipigisi-Ausdrücke (30.09.), hⁿeᵐrⁿ, Klammern</text>
<rect x="44" y="128" width="552" height="164" rx="10" fill="#fff8e6" stroke="#d9b54a"/>
<text x="60" y="154" font-weight="700" font-size="15">reguläre Sprachen</text>
<text x="60" y="176" font-size="13">endlicher Automat  =  regulärer Ausdruck  =  reguläre Grammatik</text>
<text x="60" y="196" font-size="13">=  Syntaxdiagramm ohne Rekursion</text>
<text x="60" y="222" font-size="12.5" fill="#555">Lachautomat, Se+x, Klassennamen, „vorletzte Ziffer 0“, E-Mail-Adressen, Signaturen</text>
<text x="60" y="262" font-size="12.5" fill="#7a3c12">Grenze: nur endlich viele Zustände = endliches Gedächtnis,</text>
<text x="60" y="280" font-size="12.5" fill="#7a3c12">kann nicht beliebig weit zählen</text>
</svg>`;

const FAZIT = [
  h('Meine Antwort auf die Leitfrage'),
  p(`Am 12.08. habe ich mir die Frage gestellt: <i>Welche Probleme kann eine Maschine lösen und wo sind ihre Grenzen?</i> Nach dem Halbjahr würde ich sagen: Das hängt fast nur davon ab, <b>wie viel sich die Maschine merken kann</b>.`),
  svg(HIER, 'Meine Übersicht: Jeder Kasten kann alles, was die inneren Kästen können, und noch mehr. Die Beispiele sind alle aus meinen Einträgen.'),
  p(`<ul>
<li><b>Endliche Automaten</b> haben nur endlich viele Zustände. Alles, was sie sich merken, muss in den Zuständen stecken. Das reicht für „vorletzte Ziffer ist 0“ (4 Zustände) oder Klassennamen, aber nicht für Palindrome oder hⁿeᵐrⁿ, weil man da beliebig weit zählen müsste.</li>
<li><b>Reguläre Ausdrücke</b>, <b>reguläre Grammatiken</b> und <b>Syntaxdiagramme ohne Rekursion</b> können genau dasselbe wie endliche Automaten. Das habe ich am 02.09. vermutet und am 09.09. und 30.09. bestätigt gesehen, weil ich jedes Mal das eine ins andere übersetzen konnte.</li>
<li>Mit <b>Rekursion</b> (S → aSa, Klammern in Rechenausdrücken) kann man mehr beschreiben, weil beide Seiten gleichzeitig wachsen.</li>
<li>Die <b>Registermaschine</b> kann in ihren Registern beliebig große Zahlen speichern. Damit kann sie z. B. aⁿbⁿ erkennen und alles berechnen, was ein normaler Computer kann. Soweit ich gelesen habe, ist sie genauso stark wie Turings Maschine vom Anfang. Damit schließt sich der Kreis.</li>
</ul>`),

  h('Meine typischen Fehler'),
  p(`Auf der Seite <a href="#/fehler">Fehler &amp; Fixes</a> habe ich alle Korrekturen gesammelt. Wenn ich sie zusammen anschaue, sind es eigentlich nur drei Muster:`),
  table(['Muster', 'Beispiele', 'was ich jetzt anders mache'], [
    ['<b>Zu ungenau beschrieben</b>', '„ungerade Länge“ (19.08.), „immer 2“ (28.10.), E-Mail-Regeln (30.09.)', 'Jede Beschreibung mit einem Gegenbeispiel testen, das NICHT dazugehören soll'],
    ['<b>Zeichen ≠ Bedeutung</b>', '„10“ als ein Zeichen (26.08.), Punkt ohne \\ (02.09.), LOAD #1 statt LOAD 1 (28.10.)', 'Bei jedem Symbol kurz fragen: Ist das wörtlich gemeint oder hat es eine Sonderbedeutung?'],
    ['<b>Randfälle übersehen</b>', 'Gleichheit bei 3.1 (04.11.), n = 0 bei 2.3, führende 0 in der Probeklausur (11.11.)', 'Immer den Fall „genau gleich“, 0 und 1 extra testen'],
  ]),
  p(`Was mich daran überrascht hat: Kaum einer meiner Fehler war ein „Rechenfehler“. Fast alle kamen daher, dass ich zu schnell etwas angenommen habe, statt es zu prüfen.`),

  h('Wie ich gearbeitet habe'),
  p(`<ul>
<li><b>Erst Papier, dann Werkzeug:</b> Automaten habe ich zuerst skizziert und dann in FLACI (am Anfang auch AutoEdit) nachgebaut. Reguläre Ausdrücke habe ich mit regex101 getestet, Registermaschinen-Programme mit dem Simulator aus dem Lernpaket.</li>
<li><b>Testen mit falschen Wörtern:</b> Am meisten gelernt habe ich immer dann, wenn ein Wort akzeptiert wurde, das eigentlich nicht hätte passen dürfen (z. B. „heinrichXboellXschulexde“).</li>
<li><b>Verbindungen suchen:</b> Die besten Momente waren, als zwei Themen plötzlich dasselbe waren, z. B. Ipogesien und die ipigisi-Ausdrücke.</li>
<li>In diesem Tagebuch kann man meine Lösungen ausprobieren (die ▶-Blöcke). Dafür habe ich jede Lösung beim Zusammenstellen noch einmal mit verschiedenen Eingaben durchgetestet.</li>
</ul>`),

  h('Was ich weiter untersuchen würde'),
  p(`<ul>
<li>In der Themenübersicht stand, dass der <b>Kellerautomat</b> nur im Leistungskurs drankommt. Soweit ich weiß, hat er einen Stapel als Gedächtnis. Ich vermute, dass er genau die Sprachen mit Rekursion schafft, also Palindrome und Klammern. Das würde in meine Übersicht oben genau in den grünen Kasten passen.</li>
<li>Die Registermaschinen-Aufgabe mit den „wundersamen Zahlen“ (Collatz) fand ich spannend: Man kann ein Programm schreiben, aber niemand weiß, ob es für jede Zahl anhält. Das ist wieder eine Grenze, diesmal nicht wegen zu wenig Gedächtnis, sondern grundsätzlich.</li>
</ul>`),
  refl(`Am Anfang dachte ich, theoretische Informatik ist trockene Mathematik. Jetzt sehe ich es eher so: Man baut absichtlich ganz einfache Maschinen, um genau herauszufinden, was man für ein bestimmtes Problem mindestens braucht. Am meisten mitgenommen habe ich aber etwas Allgemeines: genau lesen, Randfälle testen, und eine Lösung erst glauben, wenn ich versucht habe, sie kaputt zu machen.`)
];
