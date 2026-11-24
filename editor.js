'use strict';
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
const ARTEN = { 'Unterricht': 'gray', 'Arbeitsauftrag': 'blue', 'Themenzettel': 'purple' };
const sortKey = p => (p.props.datum || '9') + (p.props.art === 'Themenzettel' ? '0' : '1');
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
  const mk = (p, extra) => Object.assign({ id: p.id, title: p.title, icon: p.icon, cover: !!p.cover, coverColor: p.cover ? 'karamell' : undefined, bgPat: 'dots', bgColor: 'sand', edited: p.edited, blocks: p.blocks.map(nb) }, extra);
  pages.home = mk(START);
  EINTRAEGE.forEach(e => pages[e.id] = mk(e, { props: { datum: e.datum, thema: e.thema, werkzeug: e.werkzeug, gefuehl: e.gefuehl, art: e.art }, hide: ['werkzeug', 'gefuehl', 'art'] }));
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

function applyOff(el, o, px = 'dx', py = 'dy') {
  const x = o[px] || 0, y = o[py] || 0;
  el.style.transform = (x || y) ? 'translate(' + x + 'px,' + y + 'px)' : '';
  el.classList.toggle('offset', !!(x || y));
}
function freeHandle(el, o, px = 'dx', py = 'dy') {
  if (!EDIT) return;
  const hd = h('span', { class: 'fmove', contenteditable: 'false', title: 'Ziehen: frei verschieben\nDoppelklick: zurücksetzen' }, '✥');
  hd.addEventListener('pointerdown', e => {
    e.preventDefault(); e.stopPropagation(); hd.setPointerCapture(e.pointerId);
    const sx = e.clientX, sy = e.clientY, ox = o[px] || 0, oy = o[py] || 0; el.classList.add('moving');
    const mm = ev => { o[px] = Math.round((ox + ev.clientX - sx) / 2) * 2; o[py] = Math.round((oy + ev.clientY - sy) / 2) * 2; applyOff(el, o, px, py); };
    const up = () => { hd.removeEventListener('pointermove', mm); hd.removeEventListener('pointerup', up); el.classList.remove('moving'); save(); renderPanel(); };
    hd.addEventListener('pointermove', mm); hd.addEventListener('pointerup', up);
  });
  hd.addEventListener('click', e => e.stopPropagation());
  hd.addEventListener('dblclick', e => { e.stopPropagation(); o[px] = 0; o[py] = 0; applyOff(el, o, px, py); save(); renderPanel(); });
  el.append(hd);
}

function go(id) { closePop(); SEL = null; CUR = DOC.pages[id] ? id : 'home'; location.hash = CUR === 'home' ? '' : '#' + CUR; render(); window.scrollTo(0, 0); }
function render() {
  const p = DOC.pages[CUR] || DOC.pages.home; CUR = p.id;
  document.body.classList.toggle('edit', EDIT);
  const cr = $('#crumbs'); cr.innerHTML = '';
  const home = DOC.pages.home;
  cr.append(h('a', { class: 'crumb', href: '#', onclick: e => { e.preventDefault(); go('home'); } }, h('span', { class: 'ci' }, home.icon), home.title));
  if (p.id !== 'home') cr.append(h('span', { class: 'sep' }, '/'), h('span', { class: 'crumb cur' }, h('span', { class: 'ci' }, p.icon), p.title || 'Unbenannt'));
  if ($('#edited')) $('#edited').textContent = 'Bearbeitet ' + (p.edited || '');
  if ($('#editbtn')) $('#editbtn').textContent = EDIT ? 'Fertig' : 'Bearbeiten';
  if ($('#more')) $('#more').hidden = !EDIT;

  const main = $('#page'); main.innerHTML = '';
  main.className = 'page f-' + (p.font || 'sans') + (p.small ? ' small' : '') + (p.full ? ' full' : '');
  applyPat(main, p.bgPat, p.bgColor);
  if (p.cover) main.append(coverEl(p));
  const inner = h('div', { class: 'inner' }); main.append(inner);
  const head = h('div', { class: 'phead' + (p.cover ? ' hascover' : '') + (p.icon ? '' : ' noicon') });
  if (EDIT) {
    head.addEventListener('mousedown', () => { if (PTAB !== 'seite') { PTAB = 'seite'; renderPanel(); } });
    const tools = h('div', { class: 'ptools' });
    if (!p.icon) tools.append(h('button', { onclick: () => { p.icon = '📄'; save(); render(); } }, '☺ Icon hinzufügen'));
    if (!p.cover) tools.append(h('button', { onclick: () => { p.cover = true; save(); render(); } }, '🖼 Titelbild hinzufügen'));
    if (tools.childNodes.length) head.append(tools);
  }
  const icon = p.icon ? h('div', { class: 'picon', title: EDIT ? 'Icon ändern' : null }, p.icon) : null;
  if (EDIT && icon) icon.onclick = e => { e.stopPropagation(); emojiPop(icon, em => { p.icon = em; save(); render(); }, () => { p.icon = ''; save(); render(); }); };
  if (icon) { if (p.iconSize) icon.style.fontSize = p.iconSize + 'px'; applyOff(icon, p, 'iconDx', 'iconDy'); freeHandle(icon, p, 'iconDx', 'iconDy'); }
  const title = h('h1', { class: 'ptitle', 'data-ph': 'Unbenannt' }); title.textContent = p.title;
  if (EDIT) {
    setEditable(title, true);
    title.oninput = () => { p.title = title.textContent; save(); const c = $('.crumb.cur', cr); if (c) c.lastChild.textContent = p.title; };
    title.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); const f = p.blocks[0]; if (f && 'html' in f) focusBlock(f.id); } };
  }
  if (icon) head.append(icon);
  const twrap = h('div', { class: 'twrap' }, title); applyOff(twrap, p, 'titleDx', 'titleDy'); freeHandle(twrap, p, 'titleDx', 'titleDy');
  head.append(twrap);
  if (p.props) { const pe = propsEl(p); applyOff(pe, p, 'propsDx', 'propsDy'); freeHandle(pe, p, 'propsDx', 'propsDy'); head.append(pe); }
  inner.append(head);
  const body = h('div', { class: 'blocks' }); renderList(p.blocks, body); inner.append(body);
  if (EDIT) inner.append(h('div', { class: 'addend', onclick: () => { const n = nb(['p']); p.blocks.push(n); SEL = n.id; save(); render(); focusBlock(n.id); } }, '+ Klicken, um einen Block hinzuzufügen'));
  document.title = (p.title || 'Unbenannt') + ' · Forschungstagebuch Q3';
  if (!NOPANEL) renderPanel();
}
let NOPANEL = false;
function renderPage() { NOPANEL = true; try { render(); } finally { NOPANEL = false; } }
const COVERS = { weiss: ['#ffffff', '#e3e2de'], karamell: ['#e8d8b6', '#d3bd8d'], sand: ['#f3ead8', '#e6d6b5'], blau: ['#dfe9f3', '#c3d6ea'], gruen: ['#e3efe3', '#c6dec6'], rosa: ['#f6e3ea', '#ebc8d5'], grau: ['#ecebe8', '#d8d6d0'], lila: ['#e9e3f3', '#d3c7e8'] };
const PATTERNS = [['', 'Keins'], ['dots', 'Punkte'], ['lines', 'Linien'], ['grid', 'Kariert'], ['plain', 'Einfarbig']];
function applyPat(el, pat, color) {
  el.classList.remove('pat', 'pt-dots', 'pt-lines', 'pt-grid', 'pt-plain');
  el.style.removeProperty('--cbg'); el.style.removeProperty('--cfg');
  if (!pat) return;
  const [bg, fg] = COVERS[color || 'sand'] || COVERS.sand;
  el.classList.add('pat', 'pt-' + pat); el.style.setProperty('--cbg', bg); el.style.setProperty('--cfg', fg);
}
function patCtl(B, o, kp, kc, label) {
  B.append(plabel(label));
  B.append(h('div', { class: 'prow' }, pseg(PATTERNS, o[kp] || '', v => { o[kp] = v; re(); })));
  if (o[kp]) B.append(h('div', { class: 'psw', style: 'margin-bottom:8px' }, ...Object.entries(COVERS).map(([k, [bg]]) => h('button', { class: 'sw2' + ((o[kc] || 'sand') === k ? ' on' : ''), style: 'background:' + bg, title: k, onclick: () => { o[kc] = k; re(); } }))));
}
function coverEl(p) {
  const [bg, fg] = COVERS[p.coverColor || 'sand'] || COVERS.sand;
  const c = h('div', { class: 'cover cv-' + (p.coverStyle || 'dots') }); if (p.coverH) c.style.height = p.coverH + 'px';
  c.style.setProperty('--cbg', bg); c.style.setProperty('--cfg', fg);
  if (p.coverImg) { c.style.backgroundImage = `url(${p.coverImg})`; c.classList.add('cv-img'); }
  return c;
}
function setEditable(el, plain) {
  el.contentEditable = plain ? 'plaintext-only' : 'true';
  if (plain && el.contentEditable !== 'plaintext-only') el.contentEditable = 'true';
  el.spellcheck = false;
  el.addEventListener('paste', e => { e.preventDefault(); const t = (e.clipboardData || window.clipboardData).getData('text/plain'); document.execCommand('insertText', false, t); });
}

function propsEl(p) {
  const P = p.props, box = h('div', { class: 'props' });
  const hide = p.hide || [], KEYS = { 'Datum': 'datum', 'Thema': 'thema', 'Werkzeug': 'werkzeug', 'Gefühl': 'gefuehl', 'Art': 'art' };
  const row = (ic, name, view, editor) => hide.includes(KEYS[name]) ? null : box.append(h('div', { class: 'prop' }, h('div', { class: 'pn' }, h('span', { class: 'pi' }, ic), name), h('div', { class: 'pv' }, EDIT ? editor() : view)));
  const sel = (key, map) => () => { const s = h('select', { onchange: () => { P[key] = s.value; save(); } }, h('option', { value: '' }, '—'), ...Object.keys(map).map(k => h('option', { value: k, selected: P[key] === k ? 'selected' : false }, k))); return s; };
  row('📅', 'Datum', langDatum(P.datum), () => h('input', { type: 'date', value: P.datum || '', onchange: e => { P.datum = e.target.value; save(); } }));
  row('🏷️', 'Thema', chip(P.thema, THEMEN), sel('thema', THEMEN));
  row('🛠️', 'Werkzeug', P.werkzeug || '', () => { const i = h('input', { value: P.werkzeug || '', placeholder: 'leer', oninput: e => { P.werkzeug = e.target.value; save(); } }); return i; });
  row('🙂', 'Gefühl', chip(P.gefuehl, GEFUEHL), sel('gefuehl', GEFUEHL));
  row('📌', 'Art', chip(P.art, ARTEN), sel('art', ARTEN));
  return box;
}

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
  const w = h('div', { class: 'blk b-' + b.t + (b.tc ? ' tc-' + b.tc : '') + (b.bg ? ' bgc-' + b.bg : '') + (EDIT && b.id === SEL ? ' sel' : ''), 'data-id': b.id });
  if (EDIT) {
    const pick = e => { if (e.target.closest('.blk') === w) select(b.id); };
    w.addEventListener('mousedown', pick); w.addEventListener('focusin', pick);
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
  if (b.wpct) w.style.width = b.wpct + '%';
  applyPat(c, b.pat, b.patColor);
  applyOff(w, b); freeHandle(w, b);
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
      w.classList.add('col-' + b.color);
      if (b.icon) {
        const ic = h('span', { class: 'cic' }, b.icon);
        if (EDIT) ic.onclick = e => { e.stopPropagation(); emojiPop(ic, em => { b.icon = em; save(); render(); }, () => { b.icon = ''; save(); render(); }); };
        c.append(ic);
      }
      c.append(textEl('div', b, 'Text')); break;
    }
    case 'hr': c.append(h('hr')); break;
    case 'code': {
      const pre = h('pre', { class: 'code' + (b.wrap ? ' wrap' : '') }); pre.textContent = b.text;
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
    case 'db': c.append(dbEl(b)); break;
  }
  return w;
}
function clearDrop() { document.querySelectorAll('.drop-before,.drop-after').forEach(x => x.classList.remove('drop-before', 'drop-after')); }

function tableEl(b, w, list, num) {
  const box = h('div', { class: 'tblw' }), t = h('table', { class: 'tbl' });
  b.rows.forEach((r, ri) => {
    const tr = h('tr');
    r.forEach((cell, ci) => {
      const td = h(ri === 0 && b.head !== false ? 'th' : 'td'); td.innerHTML = cell;
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

function imgEl(b, w, list, num) {
  const fig = h('figure', { class: 'fig w-' + (b.w || 'L') });
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
  if ((b.cap || EDIT) && !b.nocap) fig.append(cap);
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

let VIEW = null;
const DBVIEWS = [['zeit', '⏱', 'Zeitstrahl'], ['thema', '▤', 'Nach Thema']];
const DBCOLS = [['datum', 'Datum'], ['thema', 'Thema'], ['werkzeug', 'Werkzeug'], ['gefuehl', 'Gefühl'], ['art', 'Art']];
function newPage() {
  const id = 'p' + uid(); const d = new Date();
  DOC.pages[id] = { id, title: '', icon: '', bgPat: 'dots', bgColor: 'sand', edited: nowStr(), props: { datum: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, thema: '', werkzeug: '', gefuehl: '', art: 'Unterricht' }, hide: ['werkzeug', 'gefuehl', 'art'], blocks: [nb(['p'])] };
  DOC.rows.push(id); save(false); go(id); setTimeout(() => { const t = $('.ptitle'); if (t) t.focus(); }, 30);
}
function dbEl(b) {
  const views = DBVIEWS.filter(v => !(b.hideViews || []).includes(v[0]));
  if (!views.length) views.push(DBVIEWS[0]);
  if (!VIEW || !views.some(v => v[0] === VIEW)) VIEW = views.some(v => v[0] === b.view) ? b.view : views[0][0];
  const cols = b.cols || ['datum', 'thema', 'werkzeug', 'gefuehl'];
  const wrap = h('div', { class: 'db' });
  const tabs = h('div', { class: 'dbtabs' });
  if (views.length > 1) views.forEach(([k, ic, n]) =>
    tabs.append(h('button', { class: 'dbtab' + (VIEW === k ? ' on' : ''), onclick: () => { VIEW = k; render(); } }, h('span', { class: 'ti' }, ic), n)));
  if (b.title !== '') wrap.append(h('div', { class: 'dbtitle' }, b.title || 'Unterrichtstage'));
  if (views.length > 1) wrap.append(tabs);
  const rows = DOC.rows.map(id => DOC.pages[id]).filter(Boolean).sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
  const open = p => h('a', { class: 'rowlink', href: '#' + p.id, onclick: e => { e.preventDefault(); go(p.id); } }, h('span', { class: 'ci' }, p.icon), p.title || 'Unbenannt');
  if (VIEW === 'tab') {
    const shown = DBCOLS.filter(c => cols.includes(c[0]));
    const cell = (p, k) => k === 'datum' ? kurzDatum(p.props.datum) : k === 'thema' ? chip(p.props.thema, THEMEN) : k === 'gefuehl' ? chip(p.props.gefuehl, GEFUEHL) : k === 'art' ? chip(p.props.art, ARTEN) : (p.props[k] || '');
    const t = h('table', { class: 'dbt' }, h('tr', {}, h('th', {}, 'Name'), ...shown.map(x => h('th', {}, x[1]))));
    rows.forEach(p => t.append(h('tr', {}, h('td', { class: 'nm' }, open(p)), ...shown.map(([k]) => h('td', { class: k === 'werkzeug' ? 'mut' : '' }, cell(p, k))))));
    wrap.append(h('div', { class: 'dbscroll' }, t));
  } else if (VIEW === 'thema') {
    const board = h('div', { class: 'board' });
    const groups = {}; rows.forEach(p => (groups[p.props.thema || 'Ohne Thema'] = groups[p.props.thema || 'Ohne Thema'] || []).push(p));
    Object.keys(THEMEN).concat('Ohne Thema').filter(k => groups[k]).forEach(k => board.append(h('div', { class: 'col' },
      h('div', { class: 'colh' }, chip(k, THEMEN) || k, h('span', { class: 'cnt' }, groups[k].length)),
      ...groups[k].map(p => h('div', { class: 'card', onclick: () => go(p.id) }, h('div', { class: 'ct' }, h('span', { class: 'ci' }, p.icon), p.title), h('div', { class: 'cm' }, kurzDatum(p.props.datum)))))));
    wrap.append(board);
  } else {
    const tl = h('div', { class: 'tl' }); let mon = '';
    rows.forEach(p => {
      const m = p.props.datum ? MONATE[+p.props.datum.slice(5, 7) - 1] + ' ' + p.props.datum.slice(0, 4) : 'ohne Datum';
      if (m !== mon) { mon = m; tl.append(h('div', { class: 'tlm' }, m)); }
      tl.append(h('div', { class: 'tli', onclick: () => go(p.id) }, h('span', { class: 'tld' }, kurzDatum(p.props.datum)), h('span', { class: 'dot' }),
        h('span', { class: 'tlt' }, h('span', { class: 'ci' }, p.icon), p.title), h('span', { class: 'tlc' }, chip(p.props.thema, THEMEN), p.props.art && p.props.art !== 'Unterricht' ? chip(p.props.art, ARTEN) : '')));
    });
    wrap.append(tl);
  }
  if (EDIT) wrap.append(h('div', { class: 'dbnew', onclick: newPage }, '+ Neu'));
  return wrap;
}

let SEL = null, PTAB = 'block';
const COLORS = [['', 'Standard'], ['gray', 'Grau'], ['brown', 'Braun'], ['orange', 'Orange'], ['yellow', 'Gelb'], ['green', 'Grün'], ['blue', 'Blau'], ['purple', 'Lila'], ['pink', 'Pink'], ['red', 'Rot']];
const CONVERTIBLE = ['p', 'h2', 'h3', 'ul', 'ol', 'todo', 'toggle', 'callout', 'quote', 'code', 'arrow'];
const typeName = t => (TYPES.find(x => x[0] === t) || [, t === 'link' ? 'Seitenlink' : t === 'db' ? 'Datenbank' : t])[1];
function select(id) {
  if (SEL === id) return;
  SEL = id; PTAB = 'block';
  document.querySelectorAll('.blk.sel').forEach(x => x.classList.remove('sel'));
  const w = $(`[data-id="${id}"]`); if (w) w.classList.add('sel');
  renderPanel();
}
function pc(...kids) { return h('div', { class: 'pc' }, ...kids); }
function plabel(t) { return h('div', { class: 'plab' }, t); }
function prow(label, ...ctrl) { return h('div', { class: 'prow' }, plabel(label), h('div', { class: 'pctl' }, ...ctrl)); }
function pbtn(label, fn, cls) { return h('button', { class: 'pb ' + (cls || ''), onclick: fn }, label); }
function pcheck(label, val, fn) { const i = h('input', { type: 'checkbox' }); i.checked = !!val; i.onchange = () => fn(i.checked); return h('label', { class: 'pchk' }, i, label); }
function pselect(opts, val, fn) { const s = h('select', { class: 'psel', onchange: () => fn(s.value) }, ...opts.map(([v, n]) => h('option', { value: v, selected: v === val ? 'selected' : false }, n))); return s; }
function pseg(opts, val, fn) { return h('div', { class: 'pseg' }, ...opts.map(([v, n]) => h('button', { class: v === val ? 'on' : '', onclick: () => fn(v) }, n))); }
function pswatch(list, val, fn, kind) { return h('div', { class: 'psw' }, ...list.map(([v, n]) => h('button', { class: 'sw2 ' + kind + '-' + (v || 'none') + (v === val ? ' on' : ''), title: n, onclick: () => fn(v) }, kind === 't' ? 'A' : ''))); }

function posCtl(o, px, py, getEl) {
  const mk = k => { const i = h('input', { type: 'number', class: 'pin num', step: '2', value: o[k] || 0 }); i.oninput = () => { o[k] = +i.value || 0; const el = getEl(); if (el) applyOff(el, o, px, py); save(); }; return i; };
  return h('div', { class: 'ppos' }, h('span', {}, 'X'), mk(px), h('span', {}, 'Y'), mk(py), pbtn('↺', () => { o[px] = 0; o[py] = 0; const el = getEl(); if (el) applyOff(el, o, px, py); save(); renderPanel(); }));
}
function rangeCtl(label, val, min, max, unit, fn) {
  const out = h('span', { class: 'rval' }, val + unit);
  const r = h('input', { type: 'range', min, max, step: 1, value: val }); r.oninput = () => { out.textContent = r.value + unit; fn(+r.value); };
  return h('div', { class: 'prow' }, h('div', { class: 'plab' }, label, ' ', out), r);
}
function renderPanel() {
  const P = $('#panel'); if (!P) return;
  P.hidden = !EDIT; document.body.classList.toggle('haspanel', EDIT);
  if (!EDIT) return;
  const st = P.scrollTop; P.innerHTML = '';
  const tabs = h('div', { class: 'ptabs' });
  [['block', 'Block'], ['einfuegen', 'Einfügen'], ['seite', 'Seite'], ['seiten', 'Alle Seiten']].forEach(([k, n]) => tabs.append(h('button', { class: PTAB === k ? 'on' : '', onclick: () => { PTAB = k; renderPanel(); } }, n)));
  P.append(tabs);
  const body = h('div', { class: 'pbody' });
  ({ block: panelBlock, einfuegen: panelInsert, seite: panelPage, seiten: panelPages })[PTAB](body);
  P.append(body); P.scrollTop = st;
}
const re = () => { save(); render(); };

function panelBlock(B) {
  const f = SEL && find(SEL);
  if (!f) { B.append(h('p', { class: 'pmut' }, 'Klicke auf der Seite einen Block an, dann kannst du ihn hier ändern, verschieben oder löschen.')); return; }
  const b = f.b;
  B.append(h('div', { class: 'phead2' }, typeName(b.t)));
  if (CONVERTIBLE.includes(b.t)) B.append(prow('Blocktyp', pselect(TYPES.filter(x => CONVERTIBLE.includes(x[0])).map(x => [x[0], x[1]]), b.t, v => { convert(b, v); re(); })));
  if (['p', 'h2', 'h3', 'ul', 'ol', 'todo', 'toggle', 'quote', 'arrow'].includes(b.t)) {
    B.append(prow('Textfarbe', pswatch(COLORS, b.tc || '', v => { b.tc = v; re(); }, 't')));
    B.append(prow('Hintergrund', pswatch(COLORS, b.bg || '', v => { b.bg = v; re(); }, 'b')));
  }
  if (b.t === 'callout') {
    B.append(prow('Farbe', pswatch(COLORS.slice(1), b.color, v => { b.color = v; re(); }, 'b')));
    B.append(prow('Icon', pbtn(b.icon || 'kein Icon', e => emojiPop(e.target, em => { b.icon = em; re(); }, () => { b.icon = ''; re(); })), b.icon ? pbtn('Entfernen', () => { b.icon = ''; re(); }) : null));
  }
  if (b.t === 'todo') B.append(pc(pcheck('Erledigt', b.checked, v => { b.checked = v; re(); })));
  if (b.t === 'toggle') B.append(pc(pcheck('Aufgeklappt', b.open, v => { b.open = v; re(); })));
  if (b.t === 'code') B.append(pc(pcheck('Lange Zeilen umbrechen', b.wrap, v => { b.wrap = v; re(); })));
  if (b.t === 'arrow') B.append(pc(pbtn('+ Stichpunkt', () => { b.items.push(''); re(); })));
  if (b.t === 'table') {
    const cols = b.rows[0].length;
    B.append(prow('Zeilen', pbtn('+ Zeile', () => { b.rows.push(new Array(cols).fill('')); re(); }), pbtn('− Zeile', () => { if (b.rows.length > 1) { b.rows.pop(); re(); } })));
    B.append(prow('Spalten', pbtn('+ Spalte', () => { b.rows.forEach(r => r.push('')); re(); }), pbtn('− Spalte', () => { if (cols > 1) { b.rows.forEach(r => r.pop()); re(); } })));
    B.append(pc(pcheck('Erste Zeile als Kopfzeile', b.head !== false, v => { b.head = v; re(); })));
  }
  if (b.t === 'img') {
    const pick = () => { const fi = h('input', { type: 'file', accept: 'image/*' }); fi.onchange = () => fi.files[0] && loadImage(fi.files[0], src => { b.src = src; re(); }); fi.click(); };
    B.append(prow('Bild', pbtn(b.src ? 'Ersetzen' : 'Hochladen', pick)));
    B.append(prow('Breite', pseg([['S', 'Klein'], ['M', 'Mittel'], ['L', 'Groß']], b.w || 'L', v => { b.w = v; re(); })));
    B.append(pc(pcheck('Bildunterschrift anzeigen', !b.nocap, v => { b.nocap = !v; re(); })));
    if (b.src) {
      B.append(plabel('Pfeile'));
      b.marks.forEach((m, i) => { const inp = h('input', { class: 'pin', value: m.label, oninput: () => { m.label = inp.value; save(); const l = document.querySelectorAll(`[data-id="${b.id}"] .mt`)[i]; if (l) l.textContent = inp.value; } }); B.append(h('div', { class: 'pmark' }, inp, pbtn('×', () => { b.marks.splice(i, 1); re(); }, 'danger'))); });
      B.append(pc(pbtn('+ Pfeil (dann aufs Bild klicken)', () => { const bt = $(`[data-id="${b.id}"] .imgbar button`); if (bt) bt.click(); }), b.marks.length ? pbtn('Alle Pfeile löschen', () => { b.marks = []; re(); }, 'danger') : null));
    }
  }
  if (b.t === 'link') B.append(prow('Ziel', pselect(Object.values(DOC.pages).map(p => [p.id, (p.icon ? p.icon + ' ' : '') + (p.title || 'Unbenannt')]), b.page, v => { b.page = v; re(); })));
  if (b.t === 'db') {
    const ti = h('input', { class: 'pin', value: b.title === undefined ? 'Unterrichtstage' : b.title, oninput: () => { b.title = ti.value; save(); renderPage(); } });
    B.append(prow('Titel', ti));
    B.append(prow('Startansicht', pselect(DBVIEWS.map(v => [v[0], v[2]]), b.view || 'zeit', v => { b.view = v; VIEW = v; re(); })));
    B.append(plabel('Ansichten anzeigen'));
    DBVIEWS.forEach(([k, , n]) => B.append(pc(pcheck(n, !(b.hideViews || []).includes(k), v => { b.hideViews = (b.hideViews || []).filter(x => x !== k); if (!v) b.hideViews.push(k); re(); }))));
    B.append(pc(pbtn('+ Neuer Termin', newPage)));
  }
  if (b.t !== 'db') patCtl(B, b, 'pat', 'patColor', 'Hintergrundmuster');
  const blkEl = () => document.querySelector('[data-id="' + b.id + '"]');
  B.append(plabel('Position und Größe'));
  B.append(posCtl(b, 'dx', 'dy', blkEl));
  B.append(rangeCtl('Breite', b.wpct || 100, 20, 100, '%', v => { b.wpct = v === 100 ? 0 : v; const el = blkEl(); if (el) el.style.width = b.wpct ? v + '%' : ''; save(); }));
  B.append(plabel('Anordnen'));
  const sib = d => f.list[f.i + d];
  B.append(pc(pbtn('↑ Nach oben', () => { if (sib(-1)) { f.list.splice(f.i, 1); f.list.splice(f.i - 1, 0, b); re(); } }), pbtn('↓ Nach unten', () => { if (sib(1)) { f.list.splice(f.i, 1); f.list.splice(f.i + 1, 0, b); re(); } })));
  if (f.parent) B.append(pc(pbtn('Aus dem Toggle herausnehmen', () => { f.list.splice(f.i, 1); const pf = find(f.parent.id); pf.list.splice(pf.i + 1, 0, b); re(); })));
  if (sib(-1) && sib(-1).t === 'toggle' && b.t !== 'db') B.append(pc(pbtn('In den Toggle darüber', () => { const tg = sib(-1); f.list.splice(f.i, 1); tg.children.push(b); tg.open = true; re(); })));
  B.append(pc(pbtn('⧉ Duplizieren', () => { const copy = JSON.parse(JSON.stringify(b)); const rid = x => { x.id = uid(); (x.children || []).forEach(rid); }; rid(copy); f.list.splice(f.i + 1, 0, copy); SEL = copy.id; re(); }),
    pbtn('🗑 Löschen', () => { f.list.splice(f.i, 1); SEL = null; re(); }, 'danger')));
}
function panelInsert(B) {
  const f = SEL && find(SEL);
  B.append(h('p', { class: 'pmut' }, f ? 'Wird unter dem ausgewählten Block eingefügt.' : 'Wird am Ende der Seite eingefügt.'));
  const grid = h('div', { class: 'pgrid' });
  [...TYPES, ['link', 'Seitenlink', 'Link auf eine Seite', '↗'], ['db', 'Datenbank', 'Liste der Termine', '▤']].forEach(([t, n, , ic]) => grid.append(h('button', { class: 'pgi', onclick: () => {
    const nbk = nb([t]); if (t === 'link') nbk.page = DOC.rows[0] || 'home';
    if (f) f.list.splice(f.i + 1, 0, nbk); else DOC.pages[CUR].blocks.push(nbk);
    SEL = nbk.id; PTAB = 'block'; re();
    if (t === 'img') { const fi = h('input', { type: 'file', accept: 'image/*' }); fi.onchange = () => fi.files[0] && loadImage(fi.files[0], src => { nbk.src = src; re(); }); fi.click(); }
    else focusBlock(nbk.id);
  } }, h('span', { class: 'pgic' }, ic), n)));
  B.append(grid);
}
function panelPage(B) {
  const p = DOC.pages[CUR];
  B.append(h('div', { class: 'phead2' }, p.title || 'Unbenannt'));
  B.append(prow('Icon', pbtn(p.icon || 'kein Icon', e => emojiPop(e.target, em => { p.icon = em; re(); }, () => { p.icon = ''; re(); })), p.icon ? pbtn('Entfernen', () => { p.icon = ''; re(); }) : null));
  if (p.icon) {
    B.append(rangeCtl('Icon-Größe', p.iconSize || 72, 24, 200, 'px', v => { p.iconSize = v; const el = $('.picon'); if (el) el.style.fontSize = v + 'px'; save(); }));
    B.append(plabel('Icon-Position')); B.append(posCtl(p, 'iconDx', 'iconDy', () => $('.picon')));
  }
  B.append(plabel('Titel-Position')); B.append(posCtl(p, 'titleDx', 'titleDy', () => $('.twrap')));
  if (p.props) { B.append(plabel('Eigenschaften-Position')); B.append(posCtl(p, 'propsDx', 'propsDy', () => $('.props'))); }
  B.append(plabel('Titelbild'));
  B.append(pc(pcheck('Titelbild anzeigen', p.cover, v => { p.cover = v; re(); })));
  if (p.cover) {
    B.append(rangeCtl('Höhe', p.coverH || 190, 60, 480, 'px', v => { p.coverH = v; const el = $('.cover'); if (el) el.style.height = v + 'px'; save(); }));
    B.append(prow('Muster', pseg([['dots', 'Punkte'], ['plain', 'Einfarbig'], ['lines', 'Linien'], ['grid', 'Kariert']], p.coverStyle || 'dots', v => { p.coverStyle = v; re(); })));
    B.append(prow('Farbe', h('div', { class: 'psw' }, ...Object.entries(COVERS).map(([k, [bg]]) => h('button', { class: 'sw2' + ((p.coverColor || 'sand') === k ? ' on' : ''), style: 'background:' + bg, title: k, onclick: () => { p.coverColor = k; re(); } })))));
    B.append(prow('Eigenes Bild', pbtn('Hochladen', () => { const fi = h('input', { type: 'file', accept: 'image/*' }); fi.onchange = () => fi.files[0] && loadImage(fi.files[0], src => { p.coverImg = src; re(); }); fi.click(); }), p.coverImg ? pbtn('Entfernen', () => { delete p.coverImg; re(); }) : null));
  }
  patCtl(B, p, 'bgPat', 'bgColor', 'Seitenhintergrund');
  B.append(plabel('Text'));
  B.append(prow('Schrift', pseg([['sans', 'Standard'], ['serif', 'Serif'], ['mono', 'Mono']], p.font || 'sans', v => { p.font = v; re(); })));
  B.append(pc(pcheck('Kleine Schrift', p.small, v => { p.small = v; re(); })));
  B.append(pc(pcheck('Volle Breite', p.full, v => { p.full = v; re(); })));
  if (p.props) {
    B.append(plabel('Eigenschaften anzeigen'));
    DBCOLS.forEach(([k, n]) => B.append(pc(pcheck(n, !(p.hide || []).includes(k), v => { p.hide = (p.hide || []).filter(x => x !== k); if (!v) p.hide.push(k); re(); }))));
  }
  if (p.id !== 'home') B.append(h('div', { class: 'psep' }), pc(pbtn('🗑 Seite löschen', () => deletePage(p.id), 'danger')));
}
function panelPages(B) {
  const list = h('div', { class: 'plist' });
  const pages = [DOC.pages.home, ...DOC.rows.map(id => DOC.pages[id]).filter(Boolean).sort((a, b) => sortKey(a).localeCompare(sortKey(b))), ...Object.values(DOC.pages).filter(p => p.id !== 'home' && !DOC.rows.includes(p.id))];
  pages.forEach(p => list.append(h('div', { class: 'pli' + (p.id === CUR ? ' on' : '') },
    h('a', { href: '#' + p.id, onclick: e => { e.preventDefault(); go(p.id); } }, p.icon ? h('span', { class: 'ci' }, p.icon, ' ') : '', p.title || 'Unbenannt'),
    p.id !== 'home' ? h('button', { class: 'pb danger', title: 'Seite löschen', onclick: () => deletePage(p.id) }, '×') : null)));
  B.append(list, pc(pbtn('+ Neue Seite', newPage)));
  B.append(h('div', { class: 'psep' }), plabel('Speichern'), h('p', { class: 'pmut' }, 'Änderungen werden in diesem Browser gespeichert. Für die öffentliche Seite als data.json exportieren.'),
    pc(pbtn('Als data.json exportieren', exportDoc)));
}
function deletePage(id) {
  const p = DOC.pages[id]; if (!p || id === 'home') return;
  if (!confirm(`Seite „${p.title || 'Unbenannt'}“ löschen?`)) return;
  delete DOC.pages[id]; DOC.rows = DOC.rows.filter(x => x !== id);
  const strip = list => { for (let i = list.length - 1; i >= 0; i--) { if (list[i].t === 'link' && list[i].page === id) list.splice(i, 1); else if (list[i].children) strip(list[i].children); } };
  Object.values(DOC.pages).forEach(pg => strip(pg.blocks));
  save(false);
  if (CUR === id) go('home'); else render();
}

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
function emojiPop(anchor, cb, onRemove) {
  closePop();
  POP = h('div', { class: 'pop emo' }); document.body.append(POP); place(POP, anchor);
  if (onRemove) POP.append(h('button', { class: 'emrm', onmousedown: e => { e.preventDefault(); closePop(); onRemove(); } }, 'Icon entfernen'));
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

function exportDoc() {
  const data = JSON.parse(JSON.stringify(DOC)); data.stamp = 'x' + Date.now();
  const a = h('a', { href: URL.createObjectURL(new Blob([JSON.stringify(data)], { type: 'application/json' })), download: 'data.json' });
  document.body.append(a); a.click(); a.remove();
}
const OWNER_HASH = '531824cd38caf9dd1a8bb8f85043f174da10cf140ec9d7110a255b14a2dddd23';
const OWNER_FLAG = 'ftbq3-owner';
async function sha256(s) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}
async function checkOwner() {
  const key = new URLSearchParams(location.search).get('key');
  if (key) {
    try { if (await sha256(key) === OWNER_HASH) localStorage.setItem(OWNER_FLAG, OWNER_HASH); } catch (e) { }
    history.replaceState(null, '', location.pathname + location.hash);
  }
  try { return localStorage.getItem(OWNER_FLAG) === OWNER_HASH; } catch (e) { return false; }
}
async function start() {
  const owner = await checkOwner();
  BASE = buildDoc();
  try { const r = await fetch('data.json', { cache: 'no-store' }); if (r.ok) { const d = await r.json(); if (d && d.pages && d.stamp) BASE = d; } } catch (e) { }
  DOC = BASE;
  if (owner) {
    try {
      const s = JSON.parse(localStorage.getItem(KEY));
      if (s && s.base === BASE.stamp && s.pages) DOC = s;
      else if (s && s.pages) localStorage.setItem(KEY + '-alt', JSON.stringify(s));
    } catch (e) { }
  }
  DOC.base = BASE.stamp;
  CUR = location.hash.slice(1) || 'home';
  if (!owner) { $('#editbtn').remove(); $('#more').remove(); EDIT = false; render(); window.addEventListener('hashchange', () => { const id = location.hash.slice(1) || 'home'; if (id !== CUR) { CUR = id; render(); window.scrollTo(0, 0); } }); return; }
  $('#editbtn').onclick = () => { EDIT = !EDIT; SEL = null; PTAB = 'block'; closePop(); render(); };
  $('#more').onclick = e => {
    e.stopPropagation(); closePop();
    POP = h('div', { class: 'pop' }); document.body.append(POP); place(POP, $('#more'));
    POP.style.left = Math.max(8, $('#more').getBoundingClientRect().right - 230) + 'px';
    const it = (n, fn, cls) => POP.append(h('div', { class: 'popi small ' + (cls || ''), onmousedown: ev => { ev.preventDefault(); closePop(); fn(); } }, h('span', { class: 'popn' }, n)));
    it('Als data.json exportieren', exportDoc);
    if (localStorage.getItem(KEY + '-alt')) it('Ältere Änderungen exportieren', () => { const a = h('a', { href: URL.createObjectURL(new Blob([localStorage.getItem(KEY + '-alt')], { type: 'application/json' })), download: 'data-alt.json' }); document.body.append(a); a.click(); a.remove(); });
    it('Bearbeiten auf diesem Gerät sperren', () => { try { localStorage.removeItem(OWNER_FLAG); } catch (er) { } location.reload(); });
    it('Alle lokalen Änderungen verwerfen', () => { if (confirm('Alle Änderungen in diesem Browser verwerfen?')) { try { localStorage.removeItem(KEY); } catch (er) { } DOC = JSON.parse(JSON.stringify(BASE)); DOC.base = BASE.stamp; render(); } }, 'danger');
  };
  window.addEventListener('hashchange', () => { const id = location.hash.slice(1) || 'home'; if (id !== CUR) { CUR = id; closePop(); render(); window.scrollTo(0, 0); } });
  render();
}
