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
const tagsOf = p => { const P = p.props; if (!Array.isArray(P.tags)) P.tags = P.art && P.art !== 'Unterricht' ? [P.art] : []; return P.tags; };
const sortKey = p => (p.props.datum || '9') + (p.props.art === 'Themenzettel' || tagsOf(p).includes('Themenzettel') ? '0' : '1');
const chip = (txt, map) => txt ? h('span', { class: 'chip c-' + (map[txt] || 'gray') }, txt) : '';
const tagChip = t => h('span', { class: 'chip c-' + (THEMEN[t] || ARTEN[t] || 'gray') }, t);
function syncArt(p) { const tg = tagsOf(p); p.props.art = tg.includes('Themenzettel') ? 'Themenzettel' : tg.includes('Arbeitsauftrag') ? 'Arbeitsauftrag' : 'Unterricht'; }
function allTags() {
  const s = new Set(Object.keys(ARTEN).filter(k => k !== 'Unterricht'));
  Object.keys(THEMEN).forEach(k => s.add(k));
  Object.values(DOC.pages).forEach(p => p.props && (p.props.tags || []).forEach(t => s.add(t)));
  return [...s];
}
function tagPop(anchor, p) {
  closePop();
  POP = h('div', { class: 'pop' }); document.body.append(POP);
  const tg = tagsOf(p);
  const item = (on, label, fn) => POP.append(h('div', { class: 'popi small', onmousedown: ev => { ev.preventDefault(); fn(); save(); closePop(); render(); } }, h('span', { class: 'popic' }, on ? '✓' : ''), label));
  POP.append(h('div', { class: 'poph' }, 'Thema'));
  Object.keys(THEMEN).forEach(k => item(p.props.thema === k, chip(k, THEMEN), () => { p.props.thema = k; p.props.tags = tg.filter(t => t !== k); }));
  POP.append(h('div', { class: 'poph' }, 'Zusätzliche Begriffe'));
  allTags().filter(t => t !== p.props.thema).forEach(t => item(tg.includes(t), tagChip(t), () => { const i = tg.indexOf(t); if (i >= 0) tg.splice(i, 1); else tg.push(t); syncArt(p); }));
  item(false, h('span', { class: 'popn' }, 'Neuer Begriff …'), () => { const n = (prompt('Neuer Begriff') || '').trim(); if (n && !tg.includes(n)) { tg.push(n); syncArt(p); } });
  place(POP, anchor);
}

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
  ['graph', 'Automat (Graph)', 'Zustände und Übergänge', '◎'],
  ['rail', 'Syntaxdiagramm', 'Regel als Gleisplan', '⇄'],
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
    case 'rail': b.name = r[0] || 'Regel'; b.def = r[1] || '"a" { "b" }'; break;
    case 'graph': {
      const sp = r[0] || { w: 420, h: 160, start: 'q0', states: [['q0', 90, 80]], edges: [] };
      b.w = sp.w; b.h = sp.h; b.start = sp.start;
      b.states = sp.states.map(([id, x, y, fin, loop]) => ({ id, x, y, final: !!fin, loop }));
      b.edges = sp.edges.map(([from, to, label, bend]) => ({ from, to, label, bend }));
      break;
    }
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
let UNDO = [], REDO = [], LAST = null, histT = null;
function histInit() { LAST = JSON.stringify(DOC); UNDO = []; REDO = []; updHist(); }
function histMark() { clearTimeout(histT); histT = setTimeout(commitHist, 500); }
function commitHist() {
  histT = null;
  if (LAST === null) return;
  const cur = JSON.stringify(DOC); if (cur === LAST) return;
  UNDO.push(LAST); if (UNDO.length > 150) UNDO.shift();
  REDO = []; LAST = cur; updHist();
}
function persist() { try { localStorage.setItem(KEY, JSON.stringify(DOC)); } catch (er) { } }
function stepHist(from, to) {
  if (histT) { clearTimeout(histT); commitHist(); }
  if (!from.length) return;
  to.push(LAST); LAST = from.pop(); DOC = JSON.parse(LAST);
  if (!DOC.pages[CUR]) CUR = 'home';
  closePop(); persist(); render(); updHist();
}
const undo = () => stepHist(UNDO, REDO), redo = () => stepHist(REDO, UNDO);
function updHist() {
  const u = $('#undo'), r = $('#redo');
  if (u) { u.hidden = !EDIT; u.disabled = !UNDO.length && !histT; }
  if (r) { r.hidden = !EDIT; r.disabled = !REDO.length; }
}
document.addEventListener('keydown', ev => {
  if (!EDIT || !(ev.ctrlKey || ev.metaKey)) return;
  const k = ev.key.toLowerCase();
  if (k !== 'z' && k !== 'y') return;
  const t = ev.target; if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')) return;
  ev.preventDefault();
  if (k === 'y' || ev.shiftKey) redo(); else undo();
});
let saveT;
function save(touch = true) {
  histMark(); updHist();
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

function go(id) { closePop(); SEL = null; GSEL = null; ADDEDGE = null; CUR = DOC.pages[id] ? id : 'home'; location.hash = CUR === 'home' ? '' : '#' + CUR; render(); window.scrollTo(0, 0); }
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
  updHist();

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
  const sel = (key, map) => () => { const s = h('select', { onchange: () => { P[key] = s.value; if (key === 'art') { P.tags = tagsOf(p).filter(t => !ARTEN[t]); if (s.value && s.value !== 'Unterricht') P.tags.push(s.value); } save(); } }, h('option', { value: '' }, '—'), ...Object.keys(map).map(k => h('option', { value: k, selected: P[key] === k ? 'selected' : false }, k))); return s; };
  row('📅', 'Datum', langDatum(P.datum), () => h('input', { type: 'date', value: P.datum || '', onchange: e => { P.datum = e.target.value; save(); } }));
  row('🏷️', 'Thema', chip(P.thema, THEMEN), sel('thema', THEMEN));
  row('🛠️', 'Werkzeug', P.werkzeug || '', () => { const i = h('input', { value: P.werkzeug || '', placeholder: 'leer', oninput: e => { P.werkzeug = e.target.value; save(); } }); return i; });
  row('🙂', 'Gefühl', chip(P.gefuehl, GEFUEHL), sel('gefuehl', GEFUEHL));
  row('📌', 'Art', chip(P.art, ARTEN), sel('art', ARTEN));
  if (EDIT && p.id !== 'home') {
    const v = h('div', { class: 'tagrow' }, ...tagsOf(p).map(t => h('span', { class: 'tagw' }, tagChip(t), h('button', { class: 'tagrm', title: 'entfernen', onclick: () => { p.props.tags = tagsOf(p).filter(x => x !== t); syncArt(p); save(); render(); } }, '×'))));
    const add = h('button', { class: 'tagadd', onclick: () => tagPop(add, p) }, '+ Begriff');
    v.append(add);
    box.append(h('div', { class: 'prop' }, h('div', { class: 'pn' }, h('span', { class: 'pi' }, '🔖'), 'Begriffe'), h('div', { class: 'pv' }, v)));
  }
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
    case 'graph': c.append(graphEl(b)); break;
    case 'rail': c.append(railEl(b)); break;
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

let GSEL = null, ADDEDGE = null;
function graphSvg(b) {
  const R = 20, st = {};
  b.states.forEach(q => st[q.id] = q);
  const groups = new Map();
  b.edges.forEach((e, i) => {
    if (!st[e.from] || !st[e.to]) return;
    const k = e.from + '>' + e.to;
    if (!groups.has(k)) groups.set(k, { from: e.from, to: e.to, labs: [], bend: undefined });
    const g = groups.get(k); g.labs.push(e.label); if (e.bend !== undefined && e.bend !== null && e.bend !== '') g.bend = +e.bend;
  });
  const f = n => n.toFixed(1);
  const label = (x, y, lines) => {
    const off = -(lines.length - 1) * 7.5;
    return `<text class="glb" x="${f(x)}" y="${f(y + off + 4)}">` + lines.map((l, i) => `<tspan x="${f(x)}" dy="${i ? 15 : 0}">${esc(l)}</tspan>`).join('') + '</text>';
  };
  let s = `<svg class="graph" viewBox="0 0 ${b.w} ${b.h}" style="max-width:${b.w}px"><defs><marker id="gah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0L10,5L0,10z" fill="#55534e"/></marker></defs>`;
  for (const g of groups.values()) {
    const a = st[g.from], c = st[g.to], lines = g.labs;
    if (a === c) {
      const th = ({ up: -Math.PI / 2, down: Math.PI / 2, left: Math.PI, right: 0 })[a.loop || 'up'];
      const pt = (r, ang) => [a.x + r * Math.cos(ang), a.y + r * Math.sin(ang)];
      const [x1, y1] = pt(R, th - 0.5), [x2, y2] = pt(R + 1, th + 0.5), [c1x, c1y] = pt(R + 40, th - 0.7), [c2x, c2y] = pt(R + 40, th + 0.7);
      const apex = 0.25 * R * Math.cos(0.5) + 0.75 * (R + 40) * Math.cos(0.7);
      const vertical = Math.abs(Math.sin(th)) > .5;
      const maxLen = Math.max(...lines.map(l => String(l).length));
      const [lx, ly] = pt(vertical ? apex + 10 + (lines.length - 1) * 7.5 : apex + 8 + maxLen * 3.8, th);
      s += `<path class="ge" d="M${f(x1)},${f(y1)}C${f(c1x)},${f(c1y)} ${f(c2x)},${f(c2y)} ${f(x2)},${f(y2)}"/>` + label(lx, ly, lines);
    } else {
      const bend = g.bend !== undefined ? g.bend : (groups.has(g.to + '>' + g.from) ? -24 : 0);
      const dx = c.x - a.x, dy = c.y - a.y, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
      const cx = (a.x + c.x) / 2 + nx * 2 * bend, cy = (a.y + c.y) / 2 + ny * 2 * bend;
      const d1 = Math.hypot(cx - a.x, cy - a.y) || 1, d2 = Math.hypot(cx - c.x, cy - c.y) || 1;
      const sx = a.x + (cx - a.x) / d1 * R, sy = a.y + (cy - a.y) / d1 * R, ex = c.x + (cx - c.x) / d2 * (R + 1), ey = c.y + (cy - c.y) / d2 * (R + 1);
      s += `<path class="ge" d="M${f(sx)},${f(sy)}Q${f(cx)},${f(cy)} ${f(ex)},${f(ey)}"/>`;
      const sign = bend === 0 ? -1 : Math.sign(bend), off = bend + sign * (14 + (lines.length - 1) * 7.5);
      s += label((a.x + c.x) / 2 + nx * off, (a.y + c.y) / 2 + ny * off, lines);
    }
  }
  const S = st[b.start];
  if (S) s += `<path class="ge" d="M${S.x - R - 34},${S.y}H${S.x - R - 1}"/><text class="gstart" x="${S.x - R - 36}" y="${S.y - 7}">Start</text>`;
  b.states.forEach(q => {
    const on = GSEL && GSEL.b === b.id && GSEL.q === q.id;
    const from = ADDEDGE && ADDEDGE.b === b.id && ADDEDGE.from === q.id;
    s += `<g class="gq${on || from ? ' sel' : ''}" data-q="${esc(q.id)}"><circle class="gst" cx="${q.x}" cy="${q.y}" r="${R}"/>`;
    if (q.final) s += `<circle class="gfin" cx="${q.x}" cy="${q.y}" r="${R - 4}"/>`;
    s += `<text class="gsl" x="${q.x}" y="${q.y}">${esc(q.id)}</text></g>`;
  });
  return s + '</svg>';
}
function graphEl(b) {
  const box = h('div', { class: 'gbox' });
  const holder = h('div', { class: 'gsvg' });
  const draw = () => { holder.innerHTML = graphSvg(b); };
  draw(); box.append(holder);
  if (!EDIT) return box;
  const hint = h('span', { class: 'ghint' }, ADDEDGE && ADDEDGE.b === b.id ? (ADDEDGE.from ? 'Jetzt den Zielzustand anklicken' : 'Startzustand des Pfeils anklicken') : '');
  const nextId = () => { let i = 0; while (b.states.some(q => q.id === 'q' + i)) i++; return 'q' + i; };
  box.append(h('div', { class: 'gbar' },
    h('button', { onclick: () => { const n = b.states.length; const q = { id: nextId(), x: Math.min(b.w - 40, 60 + (n % 5) * 90), y: Math.min(b.h - 40, 60 + Math.floor(n / 5) * 90), final: false }; b.states.push(q); if (!b.start) b.start = q.id; GSEL = { b: b.id, q: q.id }; SEL = b.id; save(); render(); } }, '+ Zustand'),
    h('button', { onclick: () => { ADDEDGE = { b: b.id, from: null }; SEL = b.id; render(); } }, '+ Übergang'),
    hint));
  const toSvg = (svg, ev) => { const p = svg.createSVGPoint(); p.x = ev.clientX; p.y = ev.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  holder.addEventListener('pointerdown', ev => {
    const gq = ev.target.closest('.gq'); if (!gq) return;
    ev.preventDefault(); ev.stopPropagation();
    const svg = holder.querySelector('svg'), q = b.states.find(x => x.id === gq.dataset.q); if (!q) return;
    const p0 = toSvg(svg, ev), ox = q.x, oy = q.y; let moved = false;
    holder.setPointerCapture(ev.pointerId);
    const mm = e2 => { const p = toSvg(holder.querySelector('svg'), e2); const nx = Math.round(ox + p.x - p0.x), ny = Math.round(oy + p.y - p0.y); if (Math.abs(nx - ox) + Math.abs(ny - oy) > 3) moved = true; if (moved) { q.x = Math.max(22, Math.min(b.w - 22, nx)); q.y = Math.max(22, Math.min(b.h - 22, ny)); draw(); } };
    const up = () => {
      holder.removeEventListener('pointermove', mm); holder.removeEventListener('pointerup', up);
      if (moved) { save(); return; }
      if (ADDEDGE && ADDEDGE.b === b.id) {
        if (!ADDEDGE.from) { ADDEDGE.from = q.id; render(); return; }
        b.edges.push({ from: ADDEDGE.from, to: q.id, label: 'a' }); ADDEDGE = null; GSEL = { b: b.id, e: b.edges.length - 1 }; SEL = b.id; PTAB = 'block'; save(); render();
        const inp = document.querySelector('#panel .gedge.sel input'); if (inp) { inp.focus(); inp.select(); }
        return;
      }
      GSEL = { b: b.id, q: q.id }; SEL = b.id; PTAB = 'block'; render();
    };
    holder.addEventListener('pointermove', mm); holder.addEventListener('pointerup', up);
  });
  return box;
}
function panelGraph(B, b) {
  const rerender = () => { save(); renderPage(); };
  B.append(rangeCtl('Breite', b.w, 200, 900, 'px', v => { b.w = v; rerender(); }));
  B.append(rangeCtl('Höhe', b.h, 80, 600, 'px', v => { b.h = v; rerender(); }));
  B.append(plabel('Zustände'));
  b.states.forEach(q => {
    const name = h('input', { class: 'pin', value: q.id, title: 'Name' });
    name.onchange = () => {
      const nv = name.value.trim(); if (!nv || b.states.some(x => x !== q && x.id === nv)) { name.value = q.id; return; }
      b.edges.forEach(e => { if (e.from === q.id) e.from = nv; if (e.to === q.id) e.to = nv; });
      if (b.start === q.id) b.start = nv; if (GSEL && GSEL.q === q.id) GSEL.q = nv; q.id = nv; re();
    };
    const loop = pselect([['up', 'oben'], ['right', 'rechts'], ['down', 'unten'], ['left', 'links']], q.loop || 'up', v => { q.loop = v; rerender(); });
    loop.title = 'Schleife'; loop.classList.add('gloop');
    B.append(h('div', { class: 'gstate' + (GSEL && GSEL.b === b.id && GSEL.q === q.id ? ' sel' : '') }, name,
      pcheck('Start', b.start === q.id, v => { b.start = v ? q.id : ''; re(); }),
      pcheck('Ende', q.final, v => { q.final = v; re(); }), loop,
      pbtn('×', () => { b.states = b.states.filter(x => x !== q); b.edges = b.edges.filter(e => e.from !== q.id && e.to !== q.id); if (b.start === q.id) b.start = b.states[0] ? b.states[0].id : ''; re(); }, 'danger')));
  });
  B.append(plabel('Übergänge'));
  if (!b.edges.length) B.append(h('p', { class: 'pmut' }, 'Noch keine Übergänge. „+ Übergang“ unter dem Graphen klicken.'));
  b.edges.forEach((e, i) => {
    const lab = h('input', { class: 'pin', value: e.label, placeholder: 'Beschriftung' });
    lab.oninput = () => { e.label = lab.value; rerender(); };
    const bend = h('input', { type: 'range', min: -90, max: 90, step: 2, value: e.bend ?? 0, title: 'Bogen' });
    bend.oninput = () => { e.bend = +bend.value; rerender(); };
    B.append(h('div', { class: 'gedge' + (GSEL && GSEL.b === b.id && GSEL.e === i ? ' sel' : '') },
      h('div', { class: 'gedgeh' }, h('span', {}, e.from + ' → ' + e.to), pbtn('×', () => { b.edges.splice(i, 1); re(); }, 'danger')), lab, h('label', { class: 'gbend' }, 'Bogen', bend)));
  });
}

function railParse(src) {
  const toks = []; let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (/\s/.test(c)) { i++; continue; }
    if ('|[]{}/()+'.includes(c)) { toks.push({ k: c }); i++; continue; }
    if (c === '"' || c === '„' || c === '“') {
      let j = i + 1, v = '';
      while (j < src.length && src[j] !== '"' && src[j] !== '“' && src[j] !== '”') v += src[j++];
      if (j >= src.length) throw new Error('Anführungszeichen nicht geschlossen');
      toks.push({ k: 't', v }); i = j + 1; continue;
    }
    let v = '';
    while (i < src.length && !/\s/.test(src[i]) && !'|[]{}/()+"„“'.includes(src[i])) v += src[i++];
    toks.push({ k: 'n', v });
  }
  let p = 0;
  const peek = () => toks[p], eat = k => { if (!toks[p] || toks[p].k !== k) throw new Error('„' + k + '“ fehlt'); return toks[p++]; };
  const expr = () => { const alts = [seq()]; while (peek() && peek().k === '|') { p++; alts.push(seq()); } return alts.length > 1 ? { k: 'alt', c: alts } : alts[0]; };
  const seq = () => { const items = []; while (peek() && !'|]}/)'.includes(peek().k)) items.push(item()); if (!items.length) throw new Error('leerer Teil'); return items.length > 1 ? { k: 'seq', c: items } : items[0]; };
  const item = () => {
    const t = toks[p++];
    if (t.k === 't') return { k: 't', t: t.v };
    if (t.k === 'n') return { k: 'n', t: t.v };
    if (t.k === '(') { const e = expr(); eat(')'); return e; }
    if (t.k === '[') { const e = expr(); eat(']'); return { k: 'opt', c: [e] }; }
    if (t.k === '{') {
      const e = expr(); let sep = null;
      if (peek() && peek().k === '/') { p++; sep = expr(); }
      eat('}');
      const plus = peek() && peek().k === '+'; if (plus) p++;
      const rep = { k: 'rep', c: [e], sep };
      return sep || plus ? rep : { k: 'opt', c: [rep] };
    }
    throw new Error('unerwartetes Zeichen „' + t.k + '“');
  };
  if (!toks.length) throw new Error('Definition ist leer');
  const r = expr(); if (p < toks.length) throw new Error('unerwartetes „' + (toks[p].v || toks[p].k) + '“');
  return r;
}
function rrM(n) {
  switch (n.k) {
    case 't': case 'n': n.w = Math.max(30, Math.round(String(n.t).length * 8.2 + 24)); n.a = 13; n.d = 13; break;
    case 'seq': n.c.forEach(rrM); n.w = n.c.reduce((s, c) => s + c.w, 0) + 20 * (n.c.length - 1); n.a = Math.max(...n.c.map(c => c.a)); n.d = Math.max(...n.c.map(c => c.d)); break;
    case 'alt': { n.c.forEach(rrM); n.w = Math.max(...n.c.map(c => c.w)) + 48; n.a = n.c[0].a; let d = n.c[0].d; n.offs = [0]; for (let i = 1; i < n.c.length; i++) { d += 14 + n.c[i].a; n.offs.push(d); d += n.c[i].d; } n.d = d; break; }
    case 'opt': { const x = rrM(n.c[0]); n.w = x.w + 48; n.a = x.a + 14; n.d = x.d; break; }
    case 'rep': { const x = rrM(n.c[0]); let sw = 0, sa = 0, sd = 0; if (n.sep) { rrM(n.sep); sw = n.sep.w; sa = n.sep.a; sd = n.sep.d; } n.w = Math.max(x.w, sw) + 48; n.a = x.a; n.ly = x.d + 14 + sa; n.d = n.ly + sd; break; }
  }
  return n;
}
const rp = (d, cls = 'rr-l') => `<path d="${d}" class="${cls}"/>`;
function rrD(n, x, y) {
  let s = '';
  switch (n.k) {
    case 't': return `<rect x="${x}" y="${y - 13}" width="${n.w}" height="26" rx="13" class="rr-t"/><text x="${x + n.w / 2}" y="${y + 5}" class="rr-tx">${esc(n.t)}</text>`;
    case 'n': return `<rect x="${x}" y="${y - 13}" width="${n.w}" height="26" class="rr-n"/><text x="${x + n.w / 2}" y="${y + 5}" class="rr-nx">${esc(n.t)}</text>`;
    case 'seq': { let cx = x; n.c.forEach((c, i) => { if (i) { s += rp(`M${cx},${y}H${cx + 20}`, 'rr-l rr-a'); cx += 20; } s += rrD(c, cx, y); cx += c.w; }); return s; }
    case 'alt': {
      const R = x + n.w;
      n.c.forEach((c, i) => {
        const yi = y + n.offs[i], cx = x + 24, ex = cx + c.w;
        if (i === 0) s += rp(`M${x},${y}H${cx}`) + rrD(c, cx, y) + rp(`M${ex},${y}H${R}`);
        else s += rp(`M${x},${y}Q${x + 12},${y} ${x + 12},${y + 12}V${yi - 12}Q${x + 12},${yi} ${cx},${yi}`) + rrD(c, cx, yi) + rp(`M${ex},${yi}H${R - 24}Q${R - 12},${yi} ${R - 12},${yi - 12}V${y + 12}Q${R - 12},${y} ${R},${y}`);
      });
      return s;
    }
    case 'opt': {
      const c = n.c[0], R = x + n.w, yt = y - n.a;
      return rp(`M${x},${y}H${x + 24}`) + rrD(c, x + 24, y) + rp(`M${x + 24 + c.w},${y}H${R}`)
        + rp(`M${x},${y}Q${x + 12},${y} ${x + 12},${y - 12}V${yt + 12}Q${x + 12},${yt} ${x + 24},${yt}H${R - 24}Q${R - 12},${yt} ${R - 12},${yt + 12}V${y - 12}Q${R - 12},${y} ${R},${y}`);
    }
    case 'rep': {
      const c = n.c[0], R = x + n.w, yl = y + n.ly, cx = x + (n.w - c.w) / 2;
      s += rp(`M${x},${y}H${cx}`) + rrD(c, cx, y) + rp(`M${cx + c.w},${y}H${R}`);
      const right = `M${R - 24},${y}Q${R - 12},${y} ${R - 12},${y + 12}V${yl - 12}Q${R - 12},${yl} ${R - 24},${yl}`;
      const left = `H${x + 24}Q${x + 12},${yl} ${x + 12},${yl - 12}V${y + 12}Q${x + 12},${y} ${x + 24},${y}`;
      if (n.sep) { const sx = x + (n.w - n.sep.w) / 2; s += rp(`${right}H${sx + n.sep.w}`, 'rr-l rr-a') + rrD(n.sep, sx, yl) + rp(`M${sx},${yl}${left}`); }
      else { const mx = x + n.w / 2; s += rp(`${right}H${mx}`, 'rr-l rr-a') + rp(`M${mx},${yl}${left}`); }
      return s;
    }
  }
  return s;
}
function railEl(b) {
  const box = h('div', { class: 'rrbox' });
  let node;
  try { node = railParse(b.def || ''); } catch (er) { box.append(h('div', { class: 'rrerr' }, 'Syntaxdiagramm: ' + er.message)); return box; }
  rrM(node);
  const W = node.w + 40, top = 32 + node.a, H = top + node.d + 12;
  box.innerHTML = `<svg class="rr" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><defs><marker id="rra" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0L8,4L0,8z" fill="#37352f"/></marker></defs>`
    + `<text x="4" y="15" class="rr-name">${esc(b.name || '')}</text>`
    + rp(`M8,${top - 9}V${top + 9}M8,${top}H20`) + rrD(node, 20, top) + rp(`M${20 + node.w},${top}H${W - 8}M${W - 8},${top - 9}V${top + 9}`) + '</svg>';
  return box;
}
function panelRail(B, b) {
  const nm = h('input', { class: 'pin', value: b.name || '' });
  nm.oninput = () => { b.name = nm.value; save(); renderPage(); };
  B.append(prow('Name', nm));
  const ta = h('textarea', { class: 'pin rrdef', rows: 4, spellcheck: 'false' }); ta.value = b.def || '';
  const err = h('div', { class: 'rrmsg' });
  const check = () => { try { railParse(ta.value); err.textContent = ''; } catch (er) { err.textContent = er.message; } };
  ta.oninput = () => { b.def = ta.value; check(); save(); renderPage(); };
  check();
  B.append(prow('Regel', ta, err));
  const ins = txt => { const s0 = ta.selectionStart, s1 = ta.selectionEnd; ta.value = ta.value.slice(0, s0) + txt + ta.value.slice(s1); ta.focus(); ta.selectionStart = ta.selectionEnd = s0 + txt.length; ta.oninput(); };
  B.append(pc(pbtn('"Terminal"', () => ins(' "a" ')), pbtn('Nichtterminal', () => ins(' Name ')), pbtn('|', () => ins(' | ')), pbtn('[ Option ]', () => ins(' [ "a" ] ')), pbtn('{ Wiederholung }', () => ins(' { "a" } ')), pbtn('{ mind. 1 }+', () => ins(' { "a" }+ ')), pbtn('{ A / Trenner }', () => ins(' { A / "," } '))));
  B.append(h('p', { class: 'pmut' }, '"text" = Terminal, Wort = Nichtterminal, Leerzeichen = hintereinander, | = oder, [ ] = optional, { } = beliebig oft, { }+ = mindestens einmal, { A / "s" } = A mehrmals, dazwischen s auf dem Rückweg.'));
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
        h('span', { class: 'tlt' }, h('span', { class: 'ci' }, p.icon), p.title), h('span', { class: 'tlc' + (EDIT ? ' ed' : ''), title: EDIT ? 'Begriffe ändern' : '', onclick: EDIT ? ev => { ev.stopPropagation(); tagPop(ev.currentTarget, p); } : null }, chip(p.props.thema, THEMEN), ...tagsOf(p).map(tagChip), EDIT ? h('span', { class: 'tagplus' }, '+') : '')));
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
  if (b.t === 'graph') panelGraph(B, b);
  if (b.t === 'rail') panelRail(B, b);
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

const REPO = 'Wakkelpuddin/forschungstagebuch-info-q3', TKEY = 'ftbq3-token';
async function ghApi(path, opt = {}) {
  const r = await fetch('https://api.github.com/repos/' + REPO + path, Object.assign({}, opt, { headers: { 'Authorization': 'Bearer ' + localStorage.getItem(TKEY), 'Accept': 'application/vnd.github+json', 'Content-Type': 'application/json' } }));
  if (!r.ok) throw new Error(r.status + ' ' + (await r.text()).slice(0, 150));
  return r.json();
}
async function publish(btn) {
  const old = btn.textContent; btn.disabled = true; btn.textContent = 'Wird gespeichert …';
  try {
    const data = JSON.parse(JSON.stringify(DOC)); data.stamp = 'x' + Date.now(); delete data.base;
    const ref = await ghApi('/git/ref/heads/main'), head = ref.object.sha;
    const commit = await ghApi('/git/commits/' + head);
    const blob = await ghApi('/git/blobs', { method: 'POST', body: JSON.stringify({ content: JSON.stringify(data), encoding: 'utf-8' }) });
    const tree = await ghApi('/git/trees', { method: 'POST', body: JSON.stringify({ base_tree: commit.tree.sha, tree: [{ path: 'data.json', mode: '100644', type: 'blob', sha: blob.sha }] }) });
    const neu = await ghApi('/git/commits', { method: 'POST', body: JSON.stringify({ message: 'Änderungen', tree: tree.sha, parents: [head] }) });
    await ghApi('/git/refs/heads/main', { method: 'PATCH', body: JSON.stringify({ sha: neu.sha }) });
    BASE = JSON.parse(JSON.stringify(data)); try { localStorage.setItem(BKEY, JSON.stringify(BASE)); } catch (er) { } DOC.base = data.stamp; DOC.stamp = data.stamp; save(false); clearTimeout(histT); histT = null; LAST = JSON.stringify(DOC); updHist();
    btn.textContent = 'Veröffentlicht ✓';
    setTimeout(() => { btn.textContent = old; btn.disabled = false; }, 4000);
  } catch (er) {
    btn.textContent = old; btn.disabled = false;
    alert('Veröffentlichen hat nicht geklappt: ' + er.message);
  }
}
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
const J = x => JSON.stringify(x === undefined ? null : x);
function mergeFields(o, l, n, skip) {
  const r = {};
  new Set([...Object.keys(n || {}), ...Object.keys(l || {})]).forEach(k => {
    if (skip.includes(k)) return;
    const lv = (l || {})[k], ov = (o || {})[k], nv = (n || {})[k];
    const v = J(lv) !== J(ov) ? lv : nv;
    if (v !== undefined) r[k] = JSON.parse(J(v));
  });
  return r;
}
function mergeList(o, l, n) {
  o = o || []; l = l || []; n = n || [];
  const om = new Map(o.map(b => [b.id, b])), nm = new Map(n.map(b => [b.id, b]));
  const out = [];
  l.forEach(lb => {
    const ob = om.get(lb.id), nb = nm.get(lb.id);
    if (ob && !nb) return;
    if (!ob && !nb) { out.push(JSON.parse(J(lb))); return; }
    const m = mergeFields(ob, lb, nb, ['children']);
    if (lb.children || nb.children) m.children = mergeList(ob && ob.children, lb.children, nb.children);
    out.push(m);
  });
  n.forEach((nb, i) => {
    if (om.has(nb.id) || out.some(b => b.id === nb.id)) return;
    let at = 0;
    for (let j = i - 1; j >= 0; j--) { const k = out.findIndex(b => b.id === n[j].id); if (k >= 0) { at = k + 1; break; } }
    out.splice(at, 0, JSON.parse(J(nb)));
  });
  return out;
}
function merge3(o, l, n) {
  const r = JSON.parse(J(n));
  Object.keys(l.pages || {}).forEach(id => {
    const op = o.pages[id], lp = l.pages[id], np = n.pages[id];
    if (!op && !np) { r.pages[id] = JSON.parse(J(lp)); return; }
    if (op && !np) return;
    if (!op) return;
    const m = mergeFields(op, lp, np, ['blocks', 'props']);
    if (lp.props || np.props) m.props = mergeFields(op.props, lp.props, np.props, []);
    m.blocks = mergeList(op.blocks, lp.blocks, np.blocks);
    r.pages[id] = m;
  });
  Object.keys(o.pages || {}).forEach(id => { if (!(l.pages || {})[id] && r.pages[id] && id !== 'home') delete r.pages[id]; });
  if (J(l.rows) !== J(o.rows)) {
    const rows = (l.rows || []).filter(id => r.pages[id]);
    (n.rows || []).forEach(id => { if (!rows.includes(id) && !(o.rows || []).includes(id) && r.pages[id]) rows.push(id); });
    r.rows = rows;
  }
  return r;
}
const BKEY = KEY + '-base';
async function findBase(stamp) {
  try { const b = JSON.parse(localStorage.getItem(BKEY)); if (b && b.stamp === stamp) return b; } catch (er) { }
  try {
    const list = await (await fetch('https://api.github.com/repos/' + REPO + '/commits?path=data.json&per_page=40')).json();
    for (const c of list) {
      if (!/^[0-9a-f]{40}$/.test(c.sha)) continue;
      const r = await fetch('https://raw.githubusercontent.com/' + REPO + '/' + c.sha + '/data.json');
      if (!r.ok) continue;
      const d = await r.json();
      if (d && d.stamp === stamp) return d;
    }
  } catch (er) { }
  return null;
}
function backupKey(s) { return KEY + '-alt-' + (s.base || 'x') + '-' + Date.now(); }
async function mergeOld(owner) {
  if (!owner) return;
  let s = null; try { s = JSON.parse(localStorage.getItem(KEY)); } catch (er) { }
  let alt = null; try { alt = JSON.parse(localStorage.getItem(KEY + '-alt')); } catch (er) { }
  const newer = s && s.pages && s.base && s.base[0] === 'x' && (BASE.stamp[0] !== 'x' || +s.base.slice(1) > +BASE.stamp.slice(1));
  if (newer) { DOC = s; return; }
  const cand = [];
  if (alt && alt.pages) cand.push({ key: KEY + '-alt', d: alt });
  if (s && s.pages) cand.push({ key: KEY, d: s });
  let failed = false;
  for (const c of cand) {
    const o = c.d.base === BASE.stamp ? BASE : await findBase(c.d.base);
    if (c.d.base !== BASE.stamp || c.key !== KEY) { try { localStorage.setItem(backupKey(c.d), JSON.stringify(c.d)); } catch (er) { } }
    if (c.key !== KEY) { try { localStorage.removeItem(c.key); } catch (er) { } }
    if (!o) { failed = true; continue; }
    try { DOC = merge3(o, c.d, DOC); } catch (er) { failed = true; }
  }
  DOC.base = BASE.stamp;
  try { localStorage.setItem(BKEY, JSON.stringify(BASE)); localStorage.setItem(KEY, JSON.stringify(DOC)); } catch (er) { }
  if (failed) setTimeout(() => alert('Ein älterer Stand konnte nicht automatisch übernommen werden. Er ist gesichert (••• → Ältere Stände herunterladen).'), 500);
}
function backups() { const r = []; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k.startsWith(KEY + '-alt')) r.push(k); } } catch (er) { } return r.sort(); }
function download(name, text) { const a = h('a', { href: URL.createObjectURL(new Blob([text], { type: 'application/json' })), download: name }); document.body.append(a); a.click(); a.remove(); }
window.addEventListener('pagehide', () => { if (saveT) { clearTimeout(saveT); saveT = null; persist(); } });
async function start() {
  const owner = await checkOwner();
  BASE = buildDoc();
  try { const r = await fetch('data.json?t=' + Date.now(), { cache: 'no-store' }); if (r.ok) { const d = await r.json(); if (d && d.pages && d.stamp) BASE = d; } } catch (e) { }
  DOC = BASE;
  DOC = JSON.parse(JSON.stringify(BASE));
  if (owner) await mergeOld(owner);
  DOC.base = BASE.stamp;
  CUR = location.hash.slice(1) || 'home';
  if (!owner) { $('#editbtn').remove(); $('#more').remove(); $('#undo').remove(); $('#redo').remove(); EDIT = false; render(); window.addEventListener('hashchange', () => { const id = location.hash.slice(1) || 'home'; if (id !== CUR) { CUR = id; render(); window.scrollTo(0, 0); } }); return; }
  histInit();
  $('#undo').onclick = undo; $('#redo').onclick = redo;
  $('#editbtn').onclick = () => { EDIT = !EDIT; SEL = null; PTAB = 'block'; closePop(); render(); };
  $('#more').onclick = e => {
    e.stopPropagation(); closePop();
    POP = h('div', { class: 'pop' }); document.body.append(POP); place(POP, $('#more'));
    POP.style.left = Math.max(8, $('#more').getBoundingClientRect().right - 230) + 'px';
    const it = (n, fn, cls) => POP.append(h('div', { class: 'popi small ' + (cls || ''), onmousedown: ev => { ev.preventDefault(); closePop(); fn(); } }, h('span', { class: 'popn' }, n)));
    if (localStorage.getItem(TKEY)) it('Veröffentlichen', () => publish($('#editbtn')));
    else it('Veröffentlichen einrichten', async () => {
      const t = (prompt('GitHub-Token einfügen (nur für dieses Repo, Contents: Read and write):') || '').trim();
      if (!t) return;
      try {
        const r = await fetch('https://api.github.com/repos/' + REPO, { headers: { 'Authorization': 'Bearer ' + t, 'Accept': 'application/vnd.github+json' } });
        const j = r.ok ? await r.json() : null;
        if (!j || !j.permissions || !j.permissions.push) { alert('Der Token funktioniert nicht oder hat kein Schreibrecht für das Repo.'); return; }
        localStorage.setItem(TKEY, t);
        if (confirm('Token gespeichert. Jetzt veröffentlichen?')) publish($('#editbtn'));
      } catch (er) { alert('Token konnte nicht geprüft werden.'); }
    });
    if (localStorage.getItem(TKEY)) it('Token auf diesem Gerät löschen', () => { localStorage.removeItem(TKEY); });
    it('Sicherung herunterladen', () => download('forschungstagebuch-sicherung-' + new Date().toISOString().slice(0, 10) + '.json', JSON.stringify(DOC)));
    if (backups().length) it('Ältere Stände herunterladen (' + backups().length + ')', () => backups().forEach((k, i) => setTimeout(() => download('stand-' + (i + 1) + '.json', localStorage.getItem(k)), i * 400)));
    it('Bearbeiten auf diesem Gerät sperren', () => { try { localStorage.removeItem(OWNER_FLAG); } catch (er) { } location.reload(); });
    it('Alle lokalen Änderungen verwerfen', () => { if (confirm('Alle Änderungen in diesem Browser verwerfen?')) { try { localStorage.removeItem(KEY); } catch (er) { } commitHist(); UNDO.push(LAST); DOC = JSON.parse(JSON.stringify(BASE)); DOC.base = BASE.stamp; LAST = JSON.stringify(DOC); REDO = []; persist(); render(); updHist(); } }, 'danger');
  };
  window.addEventListener('hashchange', () => { const id = location.hash.slice(1) || 'home'; if (id !== CUR) { CUR = id; closePop(); render(); window.scrollTo(0, 0); } });
  render();
}
