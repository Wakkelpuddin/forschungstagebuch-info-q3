'use strict';
/* kleiner Block-Editor im Notion-Stil */
const KEY = 'ftbq3-doc';
let DOC, BASE, EDIT = false, CUR = 'home', DRAG = null, MENU = null, POP = null;

const $ = (s, r = document) => r.querySelector(s);
const uid = () => Math.random().toString(36).slice(2, 9);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const strip = html => { const d = document.createElement('div'); d.innerHTML = html || ''; return d.textContent; };
function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (k === 'class') el.className = v; else if (k.startsWith('on')) el[k] = v; else if (v !== false && v != null) el.setAttribute(k, v);
  }
  kids.flat().forEach(k => k != null && el.append(k.nodeType ? k : document.createTextNode(k)));
  return el;
}
const pad = n => String(n).padStart(2, '0');
const nowStr = () => { const d = new Date(); return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const langDatum = iso => { if (!iso) return ''; const [y, m, d] = iso.split('-'); return `${+d}. ${MONATE[+m - 1]} ${y}`; };
const kurzDatum = iso => { if (!iso) return ''; const [, m, d] = iso.split('-'); return `${d}.${m}.`; };

const THEMEN = { 'Einstieg': 'gray', 'Endliche Automaten': 'blue', 'Reguläre Ausdrücke': 'green', 'Grammatiken': 'orange', 'Mealy-Automaten': 'purple', 'Syntaxdiagramme': 'pink', 'Registermaschine': 'brown', 'Klausur': 'red' };
const GEFUEHL = { 'gut': 'green', 'mittel': 'yellow', 'schwer': 'red' };
const ARTEN = { 'Unterricht': 'gray', 'Arbeitsauftrag': 'blue' };
const chip = (txt, map) => txt ? h('span', { class: 'chip c-' + (map[txt] || 'gray') }, txt) : '';

const TYPES = [
  ['p', 'Text', 'Einfach losschreiben', 'T'],
  ['h2', 'Überschrift 2', 'Mittlere Überschrift', 'H2'],
  ['h3', 'Überschrift 3', 'Kleine Überschrift', 'H3'],
  ['ul', 'Aufzählung', 'Einfache Liste', '•'],
  ['ol', 'Nummerierte Liste', 'Liste mit Nummern', '1.'],
  ['todo', 'To-do-Liste', 'Mit Checkboxen', '☐'],
  ['toggle', 'Toggle-Liste', 'Inhalt zum Aufklappen', '▸'],
  ['callout', 'Callout', 'Hervorgehobener Kasten', '💡'],
  ['arrow', 'Pfeil-Notiz', 'Kurze Stichpunkte mit →', '→'],
  ['quote', 'Zitat', 'Zitat einfügen', '❝'],
  ['code', 'Code', 'Code oder Protokoll', '</>'],
  ['table', 'Tabelle', 'Einfache Tabelle', '▦'],
  ['img', 'Bild', 'Hochladen und markieren', '🖼'],
  ['hr', 'Trennlinie', 'Teilt Abschnitte', '—'],
];
const TEXTY = ['p', 'h2', 'h3', 'ul', 'ol', 'todo', 'toggle', 'callout', 'quote'];

/* ---------- Datenmodell ---------- */
function nb(a) {
  const [t, ...r] = a; const b = { id: uid(), t };
  switch (t) {
    case 'p': case 'h2': case 'h3': case 'ul': case 'ol': case 'quote': b.html = r[0] || ''; break;
    case 'todo': b.html = r[0] || ''; b.checked = !!r[1]; break;
    case 'toggle': b.html = r[0] || ''; b.children = (r[1] || []).map(nb); b.open = false; break;
    case 'callout': b.icon = r[0] || '💡'; b.color = r[1] || 'gray'; b.html = r[2] || ''; break;
    case 'code': b.text = r[0] || ''; break;
    case 'img': b.src = r[0] || ''; b.cap = r[1] || ''; b.marks = (r[2] || []).map(m => ({ x: m[0], y: m[1], lx: m[2], ly: m[3], label: m[4] })); break;
    case 'arrow': b.items = r[0] ? [...r[0]] : ['']; break;
    case 'table': b.rows = r[0] ? r[0].map(x => [...x]) : [['', ''], ['', '']]; break;
    case 'link': b.page = r[0]; break;
  }
  return b;
}
function buildDoc() {
  const pages = {};
  const mk = (p, extra) => Object.assign({ id: p.id, title: p.title, icon: p.icon, cover: !!p.cover, edited: p.edited, blocks: p.blocks.map(nb) }, extra);
  pages.home = mk(START);
  EINTRAEGE.forEach(e => pages[e.id] = mk(e, { props: { datum: e.datum, thema: e.thema, werkzeug: e.werkzeug, gefuehl: e.gefuehl, art: e.art } }));
  EXTRA.forEach(e => pages[e.id] = mk(e));
  return { stamp: 'c' + CONTENT_VERSION, pages, rows: EINTRAEGE.map(e => e.id) };
}
let saveT;
function save(touch = true) {
  if (touch && DOC.pages[CUR]) { DOC.pages[CUR].edited = nowStr(); const ed = $('#edited'); if (ed) ed.textContent = 'Bearbeitet ' + DOC.pages[CUR].edited; }
  clearTimeout(saveT);
  saveT = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify(DOC)); } catch (e) { } }, 250);
}
function findIn(list, id, parent) {
  for (let i = 0; i < list.length; i++) {
    if (list[i].id === id) return { list, i, b: list[i], parent };
    if (list[i].children) { const r = findIn(list[i].children, id, list[i]); if (r) return r; }
  }
  return null;
}
const find = id => findIn(DOC.pages[CUR].blocks, id);
const contains = (b, id) => !!(b.children && findIn(b.children, id));
function insertAfter(id, nbk) { const f = find(id); if (f) f.list.splice(f.i + 1, 0, nbk); else DOC.pages[CUR].blocks.push(nbk); }
function removeBlock(id) { const f = find(id); if (f) f.list.splice(f.i, 1); }
function moveBlock(src, tgt, after) {
  const s = find(src); if (!s || s.b.id === tgt || contains(s.b, tgt)) return;
  s.list.splice(s.i, 1);
  const t = find(tgt); if (!t) { s.list.splice(s.i, 0, s.b); return; }
  t.list.splice(t.i + (after ? 1 : 0), 0, s.b);
}
function flatText(list, out = []) { list.forEach(b => { out.push(b); if (b.children && b.open) flatText(b.children, out); }); return out; }
function prevBlock(id) { const all = flatText(DOC.pages[CUR].blocks); const i = all.findIndex(b => b.id === id); for (let j = i - 1; j >= 0; j--) if ('html' in all[j]) return all[j]; return null; }
function convert(b, t) {
  const text = b.html !== undefined ? b.html : b.text !== undefined ? esc(b.text) : b.items ? b.items.map(esc).join(' ') : '';
  const keepKids = b.children;
  Object.keys(b).forEach(k => { if (k !== 'id') delete b[k]; });
  Object.assign(b, nb([t]), { id: b.id });
  if ('html' in b) b.html = text;
  if (t === 'code') b.text = strip(text);
  if (t === 'arrow') b.items = [strip(text)];
  if (t === 'toggle' && keepKids) b.children = keepKids;
  if (t === 'toggle') b.open = true;
}

/* ---------- Seiten ---------- */
function go(id) { closePop(); CUR = DOC.pages[id] ? id : 'home'; location.hash = CUR === 'home' ? '' : '#' + CUR; render(); window.scrollTo(0, 0); }
function render() {
  const p = DOC.pages[CUR] || DOC.pages.home; CUR = p.id;
  document.body.classList.toggle('edit', EDIT);
  const cr = $('#crumbs'); cr.innerHTML = '';
  const home = DOC.pages.home;
  cr.append(h('a', { class: 'crumb', href: '#', onclick: e => { e.preventDefault(); go('home'); } }, h('span', { class: 'ci' }, home.icon), home.title));
  if (p.id !== 'home') cr.append(h('span', { class: 'sep' }, '/'), h('span', { class: 'crumb cur' }, h('span', { class: 'ci' }, p.icon), p.title || 'Unbenannt'));
  $('#edited').textContent = 'Bearbeitet ' + (p.edited || '');
  $('#editbtn').textContent = EDIT ? 'Fertig' : 'Bearbeiten';
  $('#more').hidden = !EDIT;

  const main = $('#page'); main.innerHTML = '';
  if (p.cover) main.append(h('div', { class: 'cover' }));
  const head = h('div', { class: 'phead' + (p.cover ? ' hascover' : '') });
  const icon = h('div', { class: 'picon', title: EDIT ? 'Icon ändern' : null }, p.icon || '📄');
  if (EDIT) icon.onclick = e => { e.stopPropagation(); emojiPop(icon, em => { p.icon = em; save(); render(); }); };
  const title = h('h1', { class: 'ptitle', 'data-ph': 'Unbenannt' }); title.textContent = p.title;
  if (EDIT) {
    setEditable(title, true);
    title.oninput = () => { p.title = title.textContent; save(); const c = $('.crumb.cur', cr); if (c) c.lastChild.textContent = p.title; };
    title.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); const f = p.blocks[0]; if (f && 'html' in f) focusBlock(f.id); } };
  }
  head.append(icon, title);
  if (p.props) head.append(propsEl(p));
  main.append(head);
  const body = h('div', { class: 'blocks' }); renderList(p.blocks, body); main.append(body);
  if (EDIT) main.append(h('div', { class: 'addend', onclick: () => { const n = nb(['p']); p.blocks.push(n); save(); render(); focusBlock(n.id); } }, '+ Klicken, um einen Block hinzuzufügen'));
  document.title = (p.title || 'Unbenannt') + ' · Forschungstagebuch Q3';
}
function setEditable(el, plain) {
  el.contentEditable = plain ? 'plaintext-only' : 'true';
  if (plain && el.contentEditable !== 'plaintext-only') el.contentEditable = 'true';
  el.spellcheck = false;
  el.addEventListener('paste', e => { e.preventDefault(); const t = (e.clipboardData || window.clipboardData).getData('text/plain'); document.execCommand('insertText', false, t); });
}

/* Eigenschaften eines Eintrags */
function propsEl(p) {
  const P = p.props, box = h('div', { class: 'props' });
  const row = (ic, name, view, editor) => box.append(h('div', { class: 'prop' }, h('div', { class: 'pn' }, h('span', { class: 'pi' }, ic), name), h('div', { class: 'pv' }, EDIT ? editor() : view)));
  const sel = (key, map) => () => { const s = h('select', { onchange: () => { P[key] = s.value; save(); } }, h('option', { value: '' }, '—'), ...Object.keys(map).map(k => h('option', { value: k, selected: P[key] === k ? 'selected' : false }, k))); return s; };
  row('📅', 'Datum', langDatum(P.datum), () => h('input', { type: 'date', value: P.datum || '', onchange: e => { P.datum = e.target.value; save(); } }));
  row('🏷️', 'Thema', chip(P.thema, THEMEN), sel('thema', THEMEN));
  row('🛠️', 'Werkzeug', P.werkzeug || '', () => { const i = h('input', { value: P.werkzeug || '', placeholder: 'leer', oninput: e => { P.werkzeug = e.target.value; save(); } }); return i; });
  row('🙂', 'Gefühl', chip(P.gefuehl, GEFUEHL), sel('gefuehl', GEFUEHL));
  row('📌', 'Art', chip(P.art, ARTEN), sel('art', ARTEN));
  return box;
}

/* ---------- Blöcke ---------- */
function renderList(list, cont) { let n = 0; list.forEach(b => { n = b.t === 'ol' ? n + 1 : 0; cont.append(blockEl(b, list, n)); }); }
function textEl(tag, b, ph) {
  const el = h(tag, { class: 'tx', 'data-ph': ph || '' }); el.innerHTML = b.html || '';
  if (EDIT) {
    setEditable(el, false);
    el.oninput = () => { b.html = (el.innerHTML === '<br>' ? '' : el.innerHTML); save(); slashInput(el, b); mdShortcut(el, b); };
    el.onkeydown = e => keys(e, el, b);
  }
  return el;
}
function blockEl(b, list, num) {
  const w = h('div', { class: 'blk b-' + b.t, 'data-id': b.id });
  if (EDIT) {
    const plus = h('span', { class: 'hplus', title: 'Klicken: Block darunter einfügen' }, '+');
    const grip = h('span', { class: 'hgrip', title: 'Ziehen: verschieben\nKlicken: Menü' }, '⋮⋮');
    w.append(h('div', { class: 'hnd', contenteditable: 'false' }, plus, grip));
    plus.onclick = e => { e.stopPropagation(); const n = nb(['p']); insertAfter(b.id, n); save(); render(); focusBlock(n.id); openSlash($(`[data-id="${n.id}"] .tx`), n, true); };
    grip.onmousedown = () => { w.draggable = true; };
    grip.onclick = e => { e.stopPropagation(); blockMenu(grip, b); };
    w.ondragstart = e => { e.stopPropagation(); DRAG = b.id; e.dataTransfer.setData('text/plain', b.id); e.dataTransfer.effectAllowed = 'move'; w.classList.add('dragging'); };
    w.ondragend = () => { w.draggable = false; DRAG = null; clearDrop(); w.classList.remove('dragging'); };
    w.ondragover = e => {
      if (!DRAG || DRAG === b.id) return; e.preventDefault(); e.stopPropagation();
      const r = w.getBoundingClientRect(); clearDrop(); w.classList.add(e.clientY > r.top + Math.min(r.height / 2, 18) ? 'drop-after' : 'drop-before');
    };
    w.ondrop = e => { e.preventDefault(); e.stopPropagation(); if (!DRAG || DRAG === b.id) return; const after = w.classList.contains('drop-after'); moveBlock(DRAG, b.id, after); DRAG = null; save(); render(); };
  }
  const c = h('div', { class: 'bc' }); w.append(c);
  switch (b.t) {
    case 'p': c.append(textEl('div', b, 'Tippe „/“ für Befehle')); break;
    case 'h2': c.append(textEl('h2', b, 'Überschrift 2')); break;
    case 'h3': c.append(textEl('h3', b, 'Überschrift 3')); break;
    case 'ul': c.append(h('span', { class: 'mk' }, '•'), textEl('div', b, 'Liste')); break;
    case 'ol': c.append(h('span', { class: 'mk num' }, num + '.'), textEl('div', b, 'Liste')); break;
    case 'quote': c.append(textEl('div', b, 'Zitat')); break;
    case 'todo': {
      const cb = h('input', { type: 'checkbox', class: 'chk' }); cb.checked = b.checked; cb.disabled = !EDIT;
      cb.onchange = () => { b.checked = cb.checked; w.classList.toggle('done', b.checked); save(); };
      w.classList.toggle('done', !!b.checked);
      c.append(cb, textEl('div', b, 'To-do')); break;
    }
    case 'toggle': {
      const car = h('span', { class: 'car' + (b.open ? ' open' : ''), role: 'button', tabindex: '0', 'aria-expanded': b.open ? 'true' : 'false' }, '▸');
      const flip = () => { b.open = !b.open; w.replaceWith(blockEl(b, list, num)); };
      car.onclick = flip; car.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); } };
      const row = h('div', { class: 'trow' }, car, textEl('div', b, 'Toggle'));
      if (!EDIT) row.lastChild.onclick = flip;
      c.append(row);
      if (b.open) {
        const kids = h('div', { class: 'kids' }); renderList(b.children, kids);
        if (EDIT && !b.children.length) kids.append(h('div', { class: 'empty', onclick: () => { const n = nb(['p']); b.children.push(n); save(); render(); focusBlock(n.id); } }, 'Leerer Toggle. Klicken, um etwas hinzuzufügen.'));
        c.append(kids);
      }
      break;
    }
    case 'callout': {
      const ic = h('span', { class: 'cic' }, b.icon);
      if (EDIT) ic.onclick = e => { e.stopPropagation(); emojiPop(ic, em => { b.icon = em; save(); ic.textContent = em; }); };
      w.classList.add('col-' + b.color);
      c.append(ic, textEl('div', b, 'Text')); break;
    }
    case 'hr': c.append(h('hr')); break;
    case 'code': {
      const pre = h('pre', { class: 'code' }); pre.textContent = b.text;
      if (EDIT) {
        setEditable(pre, true);
        pre.oninput = () => { b.text = pre.innerText.replace(/\n$/, ''); save(); };
        pre.onkeydown = e => { if (e.key === 'Tab') { e.preventDefault(); document.execCommand('insertText', false, '  '); } };
      }
      c.append(pre); break;
    }
    case 'arrow': {
      const ul = h('div', { class: 'arr' });
      b.items.forEach((it, i) => {
        const tx = h('div', { class: 'tx', 'data-ph': 'Stichpunkt' }); tx.innerHTML = it;
        if (EDIT) {
          setEditable(tx, false);
          tx.oninput = () => { b.items[i] = tx.innerHTML === '<br>' ? '' : tx.innerHTML; save(); };
          tx.onkeydown = e => {
            const item = k => { const a = $(`[data-id="${b.id}"] .arr`); return a && a.children[k] ? a.children[k].querySelector('.tx') : null; };
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (!tx.textContent.trim()) { b.items.splice(i, 1); const n = nb(['p']); if (!b.items.length) b.items.push(''); insertAfter(b.id, n); save(); render(); focusBlock(n.id); return; }
              b.items.splice(i + 1, 0, ''); save(); w.replaceWith(blockEl(b, list, num)); focusEl(item(i + 1));
            }
            if (e.key === 'Backspace' && !tx.textContent) {
              e.preventDefault(); b.items.splice(i, 1);
              if (!b.items.length) { const pv = prevBlock(b.id); removeBlock(b.id); save(); render(); if (pv) focusBlock(pv.id); return; }
              save(); w.replaceWith(blockEl(b, list, num)); focusEl(item(Math.max(0, i - 1)));
            }
          };
        }
        ul.append(h('div', { class: 'ai' }, h('span', { class: 'am' }, '→'), tx));
      });
      c.append(ul); break;
    }
    case 'table': c.append(tableEl(b, w, list, num)); break;
    case 'img': c.append(imgEl(b, w, list, num)); break;
    case 'link': {
      const pg = DOC.pages[b.page];
      c.append(h('a', { class: 'plink', href: '#' + b.page, onclick: e => { e.preventDefault(); go(b.page); } }, h('span', { class: 'ci' }, pg ? pg.icon : '📄'), h('span', { class: 'pt' }, pg ? pg.title : 'Seite fehlt')));
      break;
    }
    case 'db': c.append(dbEl()); break;
  }
  return w;
}
function clearDrop() { document.querySelectorAll('.drop-before,.drop-after').forEach(x => x.classList.remove('drop-before', 'drop-after')); }

/* Tabelle */
function tableEl(b, w, list, num) {
  const box = h('div', { class: 'tblw' }), t = h('table', { class: 'tbl' });
  b.rows.forEach((r, ri) => {
    const tr = h('tr');
    r.forEach((cell, ci) => {
      const td = h(ri === 0 ? 'th' : 'td'); td.innerHTML = cell;
      if (EDIT) { setEditable(td, false); td.oninput = () => { b.rows[ri][ci] = td.innerHTML; save(); }; }
      tr.append(td);
    });
    t.append(tr);
  });
  box.append(t);
  if (EDIT) box.append(h('div', { class: 'tctl' },
    h('button', { onclick: () => { b.rows.push(b.rows[0].map(() => '')); save(); w.replaceWith(blockEl(b, list, num)); } }, '+ Zeile'),
    h('button', { onclick: () => { b.rows.forEach(r => r.push('')); save(); w.replaceWith(blockEl(b, list, num)); } }, '+ Spalte'),
    h('button', { onclick: () => { if (b.rows.length > 1) { b.rows.pop(); save(); w.replaceWith(blockEl(b, list, num)); } } }, '− Zeile')));
  return box;
}

/* Bild mit Pfeil-Markierungen */
function imgEl(b, w, list, num) {
  const fig = h('figure', { class: 'fig' });
  const redraw = () => w.replaceWith(blockEl(b, list, num));
  const pick = () => { const f = h('input', { type: 'file', accept: 'image/*' }); f.onchange = () => f.files[0] && loadImage(f.files[0], src => { b.src = src; save(); redraw(); }); f.click(); };
  if (!b.src) {
    fig.append(h('div', { class: 'imgempty', onclick: EDIT ? pick : null }, '🖼  Bild hinzufügen'));
    return fig;
  }
  const wrap = h('div', { class: 'iw' });
  const img = h('img', { src: b.src, alt: strip(b.cap) || 'Screenshot', loading: 'lazy', draggable: 'false' });
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('class', 'marks');
  svg.innerHTML = '<defs><marker id="mh" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0L10,5L0,10z" fill="#e03e3e"/></marker></defs>'
    + b.marks.map(m => `<line x1="${m.lx}%" y1="${m.ly}%" x2="${m.x}%" y2="${m.y}%" marker-end="url(#mh)"/>`).join('');
  wrap.append(img, svg);
  b.marks.forEach((m, i) => {
    const lab = h('div', { class: 'mlabel', style: `left:${m.lx}%;top:${m.ly}%` });
    const tx = h('span', { class: 'mt' }); tx.textContent = m.label; lab.append(tx);
    if (EDIT) {
      setEditable(tx, true); tx.oninput = () => { m.label = tx.textContent; save(); };
      const mv = h('span', { class: 'mmove', title: 'verschieben' }, '⠿'), del = h('span', { class: 'mdel', title: 'Pfeil löschen' }, '×');
      del.onclick = () => { b.marks.splice(i, 1); save(); redraw(); };
      dragPct(mv, wrap, (x, y) => { m.lx = x; m.ly = y; lab.style.left = x + '%'; lab.style.top = y + '%'; svg.querySelectorAll('line')[i].setAttribute('x1', x + '%'); svg.querySelectorAll('line')[i].setAttribute('y1', y + '%'); }, () => save());
      lab.prepend(mv); lab.append(del);
      const tip = h('div', { class: 'mtip', style: `left:${m.x}%;top:${m.y}%`, title: 'Pfeilspitze verschieben' });
      dragPct(tip, wrap, (x, y) => { m.x = x; m.y = y; tip.style.left = x + '%'; tip.style.top = y + '%'; svg.querySelectorAll('line')[i].setAttribute('x2', x + '%'); svg.querySelectorAll('line')[i].setAttribute('y2', y + '%'); }, () => save());
      wrap.append(tip);
    }
    wrap.append(lab);
  });
  fig.append(wrap);
  const cap = h('figcaption', { class: 'tx', 'data-ph': 'Bildunterschrift' }); cap.innerHTML = b.cap;
  if (EDIT) { setEditable(cap, false); cap.oninput = () => { b.cap = cap.innerHTML; save(); }; }
  if (b.cap || EDIT) fig.append(cap);
  if (EDIT) {
    const bar = h('div', { class: 'imgbar' },
      h('button', { onclick: () => { wrap.classList.add('placing'); bar.querySelector('.hint').textContent = 'Klick auf die Stelle, auf die der Pfeil zeigen soll'; } }, '↗ Pfeil hinzufügen'),
      h('button', { onclick: pick }, 'Bild ersetzen'), h('span', { class: 'hint' }, ''));
    wrap.addEventListener('click', e => {
      if (!wrap.classList.contains('placing')) return;
      const r = wrap.getBoundingClientRect(); const x = +((e.clientX - r.left) / r.width * 100).toFixed(1), y = +((e.clientY - r.top) / r.height * 100).toFixed(1);
      b.marks.push({ x, y, lx: Math.min(85, x + 12), ly: Math.max(8, y - 12), label: 'Notiz' }); save(); redraw();
    });
    fig.append(bar);
  }
  return fig;
}
function dragPct(handle, area, move, done) {
  handle.addEventListener('pointerdown', e => {
    e.preventDefault(); e.stopPropagation(); handle.setPointerCapture(e.pointerId);
    const mm = ev => { const r = area.getBoundingClientRect(); const x = Math.max(0, Math.min(100, (ev.clientX - r.left) / r.width * 100)); const y = Math.max(0, Math.min(100, (ev.clientY - r.top) / r.height * 100)); move(+x.toFixed(1), +y.toFixed(1)); };
    const up = () => { handle.removeEventListener('pointermove', mm); handle.removeEventListener('pointerup', up); done(); };
    handle.addEventListener('pointermove', mm); handle.addEventListener('pointerup', up);
  });
}
function loadImage(file, cb) {
  const fr = new FileReader();
  fr.onload = () => {
    const im = new Image();
    im.onload = () => {
      const s = Math.min(1, 1400 / im.width), cv = document.createElement('canvas');
      cv.width = Math.round(im.width * s); cv.height = Math.round(im.height * s);
      cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height);
      cb(cv.toDataURL('image/jpeg', 0.85));
    };
    im.src = fr.result;
  };
  fr.readAsDataURL(file);
}

/* ---------- Datenbank ---------- */
let VIEW = 'zeit';
function dbEl() {
  const wrap = h('div', { class: 'db' });
  const tabs = h('div', { class: 'dbtabs' });
  [['zeit', '⏱', 'Zeitstrahl'], ['tab', '▦', 'Tabelle'], ['thema', '▤', 'Nach Thema']].forEach(([k, ic, n]) =>
    tabs.append(h('button', { class: 'dbtab' + (VIEW === k ? ' on' : ''), onclick: () => { VIEW = k; render(); } }, h('span', { class: 'ti' }, ic), n)));
  wrap.append(h('div', { class: 'dbtitle' }, 'Unterrichtstage'), tabs);
  const rows = DOC.rows.map(id => DOC.pages[id]).filter(Boolean).sort((a, b) => (a.props.datum || '9').localeCompare(b.props.datum || '9'));
  const open = p => h('a', { class: 'rowlink', href: '#' + p.id, onclick: e => { e.preventDefault(); go(p.id); } }, h('span', { class: 'ci' }, p.icon), p.title || 'Unbenannt');
  if (VIEW === 'tab') {
    const t = h('table', { class: 'dbt' }, h('tr', {}, ...['Name', 'Datum', 'Thema', 'Werkzeug', 'Gefühl'].map(x => h('th', {}, x))));
    rows.forEach(p => t.append(h('tr', {}, h('td', { class: 'nm' }, open(p)), h('td', {}, kurzDatum(p.props.datum)), h('td', {}, chip(p.props.thema, THEMEN)), h('td', { class: 'mut' }, p.props.werkzeug || ''), h('td', {}, chip(p.props.gefuehl, GEFUEHL)))));
    wrap.append(h('div', { class: 'dbscroll' }, t));
  } else if (VIEW === 'thema') {
    const board = h('div', { class: 'board' });
    const groups = {}; rows.forEach(p => (groups[p.props.thema || 'Ohne Thema'] = groups[p.props.thema || 'Ohne Thema'] || []).push(p));
    Object.keys(THEMEN).concat('Ohne Thema').filter(k => groups[k]).forEach(k => board.append(h('div', { class: 'col' },
      h('div', { class: 'colh' }, chip(k, THEMEN) || k, h('span', { class: 'cnt' }, groups[k].length)),
      ...groups[k].map(p => h('div', { class: 'card', onclick: () => go(p.id) }, h('div', { class: 'ct' }, h('span', { class: 'ci' }, p.icon), p.title), h('div', { class: 'cm' }, kurzDatum(p.props.datum), ' ', chip(p.props.gefuehl, GEFUEHL)))))));
    wrap.append(board);
  } else {
    const tl = h('div', { class: 'tl' }); let mon = '';
    rows.forEach(p => {
      const m = p.props.datum ? MONATE[+p.props.datum.slice(5, 7) - 1] + ' ' + p.props.datum.slice(0, 4) : 'ohne Datum';
      if (m !== mon) { mon = m; tl.append(h('div', { class: 'tlm' }, m)); }
      tl.append(h('div', { class: 'tli', onclick: () => go(p.id) }, h('span', { class: 'tld' }, kurzDatum(p.props.datum)), h('span', { class: 'dot' }),
        h('span', { class: 'tlt' }, h('span', { class: 'ci' }, p.icon), p.title), h('span', { class: 'tlc' }, chip(p.props.thema, THEMEN), p.props.art === 'Arbeitsauftrag' ? chip('Arbeitsauftrag', ARTEN) : '')));
    });
    wrap.append(tl);
  }
  if (EDIT) wrap.append(h('div', { class: 'dbnew', onclick: () => {
    const id = 'p' + uid(); const d = new Date();
    DOC.pages[id] = { id, title: '', icon: '📄', edited: nowStr(), props: { datum: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, thema: '', werkzeug: '', gefuehl: '', art: 'Unterricht' }, blocks: [nb(['p'])] };
    DOC.rows.push(id); save(false); go(id); setTimeout(() => $('.ptitle').focus(), 30);
  } }, '+ Neu'));
  return wrap;
}

/* ---------- Tastatur, Slash-Menü, Markdown-Kürzel ---------- */
function caretAtStart(el) {
  const s = getSelection(); if (!s.rangeCount || !s.isCollapsed) return false;
  const r = s.getRangeAt(0), pre = document.createRange(); pre.selectNodeContents(el); pre.setEnd(r.startContainer, r.startOffset);
  return pre.toString().length === 0;
}
function cutAfterCaret(el) {
  const s = getSelection(); if (!s.rangeCount) return '';
  const r = s.getRangeAt(0), rest = document.createRange(); rest.selectNodeContents(el); rest.setStart(r.endContainer, r.endOffset);
  const d = h('div'); d.append(rest.extractContents()); return d.innerHTML === '<br>' ? '' : d.innerHTML;
}
function keys(e, el, b) {
  if (MENU && MENU.el === el) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); MENU.sel = (MENU.sel + (e.key === 'ArrowDown' ? 1 : -1) + MENU.items.length) % MENU.items.length; drawSlash(); return; }
    if (e.key === 'Enter') { e.preventDefault(); if (MENU.items[MENU.sel]) applySlash(MENU.items[MENU.sel][0]); return; }
    if (e.key === 'Escape') { e.preventDefault(); closePop(); return; }
  }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') { e.preventDefault(); const t = getSelection().toString(); if (t) document.execCommand('insertHTML', false, '<code>' + esc(t) + '</code>'); return; }
  if (e.key === '/' && !el.textContent.trim()) { setTimeout(() => openSlash(el, b), 0); return; }
  if (e.key === 'Enter' && !e.shiftKey && b.t !== 'code') {
    e.preventDefault();
    const empty = !el.textContent.trim();
    if (['ul', 'ol', 'todo', 'quote'].includes(b.t) && empty) { convert(b, 'p'); save(); render(); focusBlock(b.id); return; }
    const rest = cutAfterCaret(el); b.html = el.innerHTML === '<br>' ? '' : el.innerHTML;
    if (b.t === 'toggle') {
      b.open = true; const n = nb(['p', rest]); b.children.unshift(n); save(); render(); focusBlock(n.id, false); return;
    }
    const t = ['ul', 'ol', 'todo'].includes(b.t) ? b.t : 'p';
    const n = nb([t, rest]); insertAfter(b.id, n); save(); render(); focusBlock(n.id, false); return;
  }
  if (e.key === 'Backspace' && caretAtStart(el)) {
    if (['h2', 'h3', 'ul', 'ol', 'todo', 'quote', 'toggle', 'callout'].includes(b.t) && !(b.t === 'toggle' && b.children.length)) { e.preventDefault(); convert(b, 'p'); save(); render(); focusBlock(b.id, false); return; }
    if (b.t === 'p') {
      const pv = prevBlock(b.id); if (!pv) return;
      e.preventDefault();
      const empty = !el.textContent.trim();
      if (!empty) pv.html = (pv.html || '') + b.html;
      removeBlock(b.id); save(); render(); focusBlock(pv.id, true);
    }
  }
}
function mdShortcut(el, b) {
  if (b.t !== 'p') return;
  const t = el.textContent.replace(/ /g, ' ');
  const rules = [[/^[-*] /, 'ul'], [/^1\. /, 'ol'], [/^\[\] /, 'todo'], [/^## /, 'h2'], [/^### /, 'h3'], [/^> /, 'toggle'], [/^" /, 'quote'], [/^-> /, 'arrow'], [/^```$/, 'code'], [/^---$/, 'hr']];
  for (const [re, type] of rules) {
    const m = t.match(re);
    if (m) { b.html = esc(t.slice(m[0].length)); convert(b, type); if (type === 'hr') { const n = nb(['p']); insertAfter(b.id, n); save(); render(); focusBlock(n.id); return; } save(); render(); focusBlock(b.id); return; }
  }
}
function openSlash(el, b, viaPlus) {
  if (!el) return;
  closePop();
  MENU = { el, b, sel: 0, items: TYPES, viaPlus };
  POP = h('div', { class: 'pop slash' }); document.body.append(POP); place(POP, el); drawSlash();
}
function slashInput(el, b) {
  if (!MENU || MENU.el !== el) return;
  const t = el.textContent;
  if (!MENU.viaPlus && !t.startsWith('/')) { closePop(); return; }
  const q = (MENU.viaPlus ? t.replace(/^\//, '') : t.slice(1)).toLowerCase().trim();
  MENU.items = TYPES.filter(x => !q || x[1].toLowerCase().includes(q) || x[0].includes(q));
  MENU.sel = 0; drawSlash();
}
function drawSlash() {
  if (!POP) return; POP.innerHTML = '';
  POP.append(h('div', { class: 'poph' }, 'Grundblöcke'));
  if (!MENU.items.length) POP.append(h('div', { class: 'popnone' }, 'Keine Treffer'));
  MENU.items.forEach(([t, n, d, ic], i) => POP.append(h('div', { class: 'popi' + (i === MENU.sel ? ' sel' : ''), onmousedown: e => { e.preventDefault(); applySlash(t); }, onmouseenter: () => { MENU.sel = i; drawSlash(); } },
    h('span', { class: 'popic' }, ic), h('span', {}, h('div', { class: 'popn' }, n), h('div', { class: 'popd' }, d)))));
  const s = POP.querySelector('.sel'); if (s) s.scrollIntoView({ block: 'nearest' });
}
function applySlash(type) {
  const { b } = MENU; closePop();
  b.html = ''; convert(b, type);
  if (type === 'hr') { const n = nb(['p']); insertAfter(b.id, n); save(); render(); focusBlock(n.id); return; }
  if (type === 'img') { save(); render(); const f = h('input', { type: 'file', accept: 'image/*' }); f.onchange = () => f.files[0] && loadImage(f.files[0], src => { b.src = src; save(); render(); }); f.click(); return; }
  if (type === 'table') { save(); render(); focusEl($(`[data-id="${b.id}"] th`)); return; }
  save(); render(); focusBlock(b.id);
}
function blockMenu(anchor, b) {
  closePop();
  POP = h('div', { class: 'pop' }); document.body.append(POP); place(POP, anchor);
  const item = (ic, n, fn, cls) => POP.append(h('div', { class: 'popi small ' + (cls || ''), onmousedown: e => { e.preventDefault(); closePop(); fn(); } }, h('span', { class: 'popic' }, ic), h('span', { class: 'popn' }, n)));
  item('🗑', 'Löschen', () => { removeBlock(b.id); save(); render(); }, 'danger');
  item('⧉', 'Duplizieren', () => { const copy = JSON.parse(JSON.stringify(b)); const re = x => { x.id = uid(); (x.children || []).forEach(re); }; re(copy); insertAfter(b.id, copy); save(); render(); });
  if (b.t === 'callout') {
    POP.append(h('div', { class: 'poph' }, 'Farbe'));
    [['gray', 'Grau'], ['red', 'Rot'], ['yellow', 'Gelb'], ['blue', 'Blau'], ['green', 'Grün']].forEach(([c, n]) => item(h('span', { class: 'sw col-' + c }), n, () => { b.color = c; save(); render(); }));
  }
  if (TEXTY.includes(b.t) || b.t === 'code' || b.t === 'arrow') {
    POP.append(h('div', { class: 'poph' }, 'Umwandeln in'));
    TYPES.filter(x => [...TEXTY, 'code', 'arrow'].includes(x[0]) && x[0] !== b.t).forEach(([t, n, , ic]) => item(ic, n, () => { convert(b, t); save(); render(); }));
  }
}
const EMOJIS = '📓 📝 🧠 😂 🔢 🔍 🌳 🥤 🚂 🧮 🐞 💭 ✅ 💡 ⚠️ ❓ ℹ️ 📌 🔥 ⭐ 🎯 🤔 😅 👍 ✏️ 📎 🧩 🔧 🛠️ 💻 🖥️ 📊 📈 🗂️ 📚 🎓 ⏱️ 🔑 ❗ ✔️ ❌ 🚀 🤖 ⚙️'.split(' ');
function emojiPop(anchor, cb) {
  closePop();
  POP = h('div', { class: 'pop emo' }); document.body.append(POP); place(POP, anchor);
  EMOJIS.forEach(em => POP.append(h('button', { class: 'emb', onmousedown: e => { e.preventDefault(); closePop(); cb(em); } }, em)));
}
function place(pop, el) {
  const r = el.getBoundingClientRect();
  pop.style.top = (window.scrollY + r.bottom + 4) + 'px';
  pop.style.left = Math.max(8, Math.min(window.scrollX + r.left, window.scrollX + document.documentElement.clientWidth - pop.offsetWidth - 8)) + 'px';
}
function closePop() { if (POP) POP.remove(); POP = null; MENU = null; }
document.addEventListener('mousedown', e => { if (POP && !POP.contains(e.target)) closePop(); });

function focusEl(el, end = true) {
  if (!el) return; el.focus();
  const s = getSelection(), r = document.createRange(); r.selectNodeContents(el); r.collapse(!end); s.removeAllRanges(); s.addRange(r);
}
function focusBlock(id, end = true) { const w = $(`[data-id="${id}"]`); if (!w) return; focusEl(w.querySelector('.tx, pre.code'), end); }

/* ---------- Start ---------- */
function exportDoc() {
  const data = JSON.parse(JSON.stringify(DOC)); data.stamp = 'x' + Date.now();
  const a = h('a', { href: URL.createObjectURL(new Blob([JSON.stringify(data)], { type: 'application/json' })), download: 'data.json' });
  document.body.append(a); a.click(); a.remove();
}
async function start() {
  BASE = buildDoc();
  try { const r = await fetch('data.json', { cache: 'no-store' }); if (r.ok) { const d = await r.json(); if (d && d.pages && d.stamp) BASE = d; } } catch (e) { }
  DOC = BASE;
  try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.base === BASE.stamp && s.pages) DOC = s; } catch (e) { }
  DOC.base = BASE.stamp;
  CUR = location.hash.slice(1) || 'home';
  $('#editbtn').onclick = () => { EDIT = !EDIT; closePop(); render(); };
  $('#more').onclick = e => {
    e.stopPropagation(); closePop();
    POP = h('div', { class: 'pop' }); document.body.append(POP); place(POP, $('#more'));
    POP.style.left = Math.max(8, $('#more').getBoundingClientRect().right - 230) + 'px';
    const it = (n, fn, cls) => POP.append(h('div', { class: 'popi small ' + (cls || ''), onmousedown: ev => { ev.preventDefault(); closePop(); fn(); } }, h('span', { class: 'popn' }, n)));
    it('Als data.json exportieren', exportDoc);
    it('Alle lokalen Änderungen verwerfen', () => { if (confirm('Alle Änderungen in diesem Browser verwerfen?')) { try { localStorage.removeItem(KEY); } catch (er) { } DOC = JSON.parse(JSON.stringify(BASE)); DOC.base = BASE.stamp; render(); } }, 'danger');
  };
  window.addEventListener('hashchange', () => { const id = location.hash.slice(1) || 'home'; if (id !== CUR) { CUR = id; closePop(); render(); window.scrollTo(0, 0); } });
  render();
}
