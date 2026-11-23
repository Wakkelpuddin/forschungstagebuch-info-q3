'use strict';
/* Forschungstagebuch Informatik Q3 – Darstellung und kleine Simulatoren */

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function sha(s) { let h = 0x811c9dc5; for (const ch of s) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619) >>> 0; } return h.toString(16).padStart(8, '0').slice(1, 8); }
const fmt = iso => iso.split('-').reverse().join('.');
const WT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const wday = iso => WT[new Date(iso + 'T12:00:00').getDay()];
let UID = 0; const uid = () => 'w' + (++UID);

/* ---------- Bausteine für die Einträge ---------- */
const p = html => ({ t: 'p', html });
const h = (text, lvl = 2) => ({ t: 'h', text, lvl });
const task = html => ({ t: 'task', html });
const refl = html => ({ t: 'refl', html });
const note = html => ({ t: 'note', html });
const img = (src, cap) => ({ t: 'img', src, cap });
const code = text => ({ t: 'code', text });
const table = (head, rows, cap) => ({ t: 'table', head, rows, cap });
const diff = (file, msg, old, neu, why) => ({ t: 'diff', file, msg, old, neu, why });
const dfa = o => Object.assign({ t: 'dfa' }, o);
const rx = o => Object.assign({ t: 'rx' }, o);
const rm = o => Object.assign({ t: 'rm' }, o);
const der = o => Object.assign({ t: 'der' }, o);
const rail = (list, cap) => ({ t: 'rail', list, cap });
const svg = (html, cap) => ({ t: 'svg', html, cap });

/* ================= Syntaxdiagramme ================= */
function T(t) { return { k: 't', t }; }
function N(t) { return { k: 'n', t }; }
function Seq(...c) { return { k: 'seq', c }; }
function Alt(...c) { return { k: 'alt', c }; }
function Opt(x) { return { k: 'opt', c: [x] }; }
function Rep(x, sep) { return { k: 'rep', c: [x], sep }; }

function rrM(n) {
  switch (n.k) {
    case 't': case 'n': n.w = Math.max(30, Math.round(n.t.length * 8.2 + 22)); n.a = 13; n.d = 13; break;
    case 'seq': n.c.forEach(rrM); n.w = n.c.reduce((s, c) => s + c.w, 0) + 20 * (n.c.length - 1);
      n.a = Math.max(...n.c.map(c => c.a)); n.d = Math.max(...n.c.map(c => c.d)); break;
    case 'alt': {
      n.c.forEach(rrM); n.w = Math.max(...n.c.map(c => c.w)) + 48; n.a = n.c[0].a;
      let d = n.c[0].d; n.offs = [0];
      for (let i = 1; i < n.c.length; i++) { d += 14 + n.c[i].a; n.offs.push(d); d += n.c[i].d; }
      n.d = d; break;
    }
    case 'opt': { const x = rrM(n.c[0]); n.w = x.w + 48; n.a = x.a + 14; n.d = x.d; break; }
    case 'rep': {
      const x = rrM(n.c[0]); let sw = 0, sa = 0, sd = 0;
      if (n.sep) { rrM(n.sep); sw = n.sep.w; sa = n.sep.a; sd = n.sep.d; }
      n.w = Math.max(x.w, sw) + 48; n.a = x.a; n.ly = x.d + 14 + sa; n.d = n.ly + sd; break;
    }
  }
  return n;
}
const rp = (d, cls = 'rr-l') => `<path d="${d}" class="${cls}"/>`;
function rrD(n, x, y) {
  let s = '';
  switch (n.k) {
    case 't': return `<rect x="${x}" y="${y - 13}" width="${n.w}" height="26" rx="13" class="rr-t"/><text x="${x + n.w / 2}" y="${y + 5}" class="rr-tx">${esc(n.t)}</text>`;
    case 'n': return `<rect x="${x}" y="${y - 13}" width="${n.w}" height="26" class="rr-n"/><text x="${x + n.w / 2}" y="${y + 5}" class="rr-nx">${esc(n.t)}</text>`;
    case 'seq': {
      let cx = x;
      n.c.forEach((c, i) => { if (i) { s += rp(`M${cx},${y}H${cx + 20}`, 'rr-l rr-a'); cx += 20; } s += rrD(c, cx, y); cx += c.w; });
      return s;
    }
    case 'alt': {
      const R = x + n.w;
      n.c.forEach((c, i) => {
        const yi = y + n.offs[i], cx = x + 24, ex = cx + c.w;
        if (i === 0) s += rp(`M${x},${y}H${cx}`) + rrD(c, cx, y) + rp(`M${ex},${y}H${R}`);
        else s += rp(`M${x},${y}Q${x + 12},${y} ${x + 12},${y + 12}V${yi - 12}Q${x + 12},${yi} ${cx},${yi}`) + rrD(c, cx, yi)
          + rp(`M${ex},${yi}H${R - 24}Q${R - 12},${yi} ${R - 12},${yi - 12}V${y + 12}Q${R - 12},${y} ${R},${y}`);
      });
      return s;
    }
    case 'opt': {
      const c = n.c[0], R = x + n.w, yt = y - n.a;
      s += rp(`M${x},${y}H${x + 24}`) + rrD(c, x + 24, y) + rp(`M${x + 24 + c.w},${y}H${R}`);
      s += rp(`M${x},${y}Q${x + 12},${y} ${x + 12},${y - 12}V${yt + 12}Q${x + 12},${yt} ${x + 24},${yt}H${R - 24}Q${R - 12},${yt} ${R - 12},${yt + 12}V${y - 12}Q${R - 12},${y} ${R},${y}`);
      return s;
    }
    case 'rep': {
      const c = n.c[0], R = x + n.w, yl = y + n.ly, cx = x + (n.w - c.w) / 2;
      s += rp(`M${x},${y}H${cx}`) + rrD(c, cx, y) + rp(`M${cx + c.w},${y}H${R}`);
      const right = `M${R - 24},${y}Q${R - 12},${y} ${R - 12},${y + 12}V${yl - 12}Q${R - 12},${yl} ${R - 24},${yl}`;
      const left = `H${x + 24}Q${x + 12},${yl} ${x + 12},${yl - 12}V${y + 12}Q${x + 12},${y} ${x + 24},${y}`;
      if (n.sep) {
        const sx = x + (n.w - n.sep.w) / 2;
        s += rp(`${right}H${sx + n.sep.w}`, 'rr-l rr-a') + rrD(n.sep, sx, yl) + rp(`M${sx},${yl}${left}`);
      } else {
        const mx = x + n.w / 2;
        s += rp(`${right}H${mx}`, 'rr-l rr-a') + rp(`M${mx},${yl}${left}`);
      }
      return s;
    }
  }
  return s;
}
function railSvg(name, node) {
  rrM(node);
  const W = node.w + 40, top = 30 + node.a, H = top + node.d + 12;
  return `<svg class="rr" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<defs><marker id="rra" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0L8,4L0,8z" fill="#333"/></marker></defs>
<text x="4" y="14" class="rr-name">${esc(name)}</text>`
    + rp(`M8,${top - 9}V${top + 9}M8,${top}H20`) + rrD(node, 20, top) + rp(`M${20 + node.w},${top}H${W - 8}M${W - 8},${top - 9}V${top + 9}`) + '</svg>';
}

/* ================= Endliche Automaten (auch Mealy) ================= */
function autoTrans(A) {
  // liefert [{from,to,ins:[...],out,lab}]
  return A.trans.map(t => A.mealy
    ? { from: t[0], ins: String(t[1]).split(',').map(s => s.trim()), out: t[2], to: t[3], lab: `${t[1]}/${t[2]}` }
    : { from: t[0], ins: String(t[1]).split(',').map(s => s.trim()), out: null, to: t[2], lab: t[1] });
}
function dfaSvg(A, id) {
  const R = 19, st = {}; A.states.forEach(s => st[s.id] = s);
  const groups = new Map();
  autoTrans(A).forEach(t => {
    const k = t.from + '>' + t.to;
    if (!groups.has(k)) groups.set(k, { from: t.from, to: t.to, labs: [] });
    groups.get(k).labs.push(t.lab);
  });
  const label = (x, y, lines) => {
    const off = -(lines.length - 1) * 7;
    return `<text class="lb" x="${x.toFixed(1)}" y="${(y + off + 4).toFixed(1)}">` + lines.map((l, i) => `<tspan x="${x.toFixed(1)}" dy="${i ? 14 : 0}">${esc(l)}</tspan>`).join('') + '</text>';
  };
  let s = `<svg class="dfa" viewBox="0 0 ${A.w} ${A.h}" style="max-width:${A.w}px"><defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0L10,5L0,10z" fill="#555"/></marker></defs>`;
  for (const g of groups.values()) {
    const a = st[g.from], b = st[g.to];
    const lines = A.mealy ? g.labs : [g.labs.join(', ')];
    if (a === b) {
      const th = ({ up: -Math.PI / 2, down: Math.PI / 2, left: Math.PI, right: 0 })[a.loop || 'up'];
      const pt = (r, ang) => [a.x + r * Math.cos(ang), a.y + r * Math.sin(ang)];
      const [x1, y1] = pt(R, th - 0.5), [x2, y2] = pt(R + 1, th + 0.5), [c1x, c1y] = pt(R + 40, th - 0.7), [c2x, c2y] = pt(R + 40, th + 0.7);
      const apex = 0.25 * R * Math.cos(0.5) + 0.75 * (R + 40) * Math.cos(0.7);
      const vertical = Math.abs(Math.sin(th)) > .5;
      const maxLen = Math.max(...lines.map(l => l.length));
      const dist = vertical ? apex + 10 + (lines.length - 1) * 7 : apex + 8 + maxLen * 3.7;
      const [lx, ly] = pt(dist, th);
      s += `<path class="e" d="M${x1.toFixed(1)},${y1.toFixed(1)}C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}"/>`;
      s += label(lx, ly, lines);
    } else {
      const rev = groups.has(g.to + '>' + g.from);
      const key = g.from + '>' + g.to;
      const bend = (A.bend && A.bend[key] !== undefined) ? A.bend[key] : (rev ? -24 : 0);
      const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L;
      const cx = (a.x + b.x) / 2 + nx * 2 * bend, cy = (a.y + b.y) / 2 + ny * 2 * bend;
      const d1 = Math.hypot(cx - a.x, cy - a.y), d2 = Math.hypot(cx - b.x, cy - b.y);
      const sx = a.x + (cx - a.x) / d1 * R, sy = a.y + (cy - a.y) / d1 * R;
      const ex = b.x + (cx - b.x) / d2 * (R + 1), ey = b.y + (cy - b.y) / d2 * (R + 1);
      s += `<path class="e" d="M${sx.toFixed(1)},${sy.toFixed(1)}Q${cx.toFixed(1)},${cy.toFixed(1)} ${ex.toFixed(1)},${ey.toFixed(1)}"/>`;
      const sign = bend === 0 ? -1 : Math.sign(bend);
      const off = bend + sign * (13 + (lines.length - 1) * 7);
      s += label((a.x + b.x) / 2 + nx * off, (a.y + b.y) / 2 + ny * off, lines);
    }
  }
  const S = st[A.start];
  if (A.startFrom === 'top') s += `<path class="e" d="M${S.x},${S.y - R - 30}V${S.y - R - 1}"/><text class="stx" x="${S.x + 4}" y="${S.y - R - 20}">Start</text>`;
  else s += `<path class="e" d="M${S.x - R - 32},${S.y}H${S.x - R - 1}"/><text class="stx" x="${S.x - R - 34}" y="${S.y - 6}">Start</text>`;
  A.states.forEach(q => {
    s += `<circle class="st" data-q="${esc(q.id)}" cx="${q.x}" cy="${q.y}" r="${R}"/>`;
    if (q.final) s += `<circle class="fin" cx="${q.x}" cy="${q.y}" r="${R - 4}"/>`;
    s += `<text class="sl" x="${q.x}" y="${q.y}">${esc(q.label || q.id)}</text>`;
  });
  return s + '</svg>';
}
function autoRunner(A) {
  const delta = new Map();
  autoTrans(A).forEach(t => t.ins.forEach(c => delta.set(t.from + '\u0001' + c, t)));
  const lab = id => { const q = A.states.find(s => s.id === id); return q ? (q.label || q.id) : id; };
  const tok = w => A.sep === ',' ? w.split(',').map(s => s.trim()).filter(Boolean) : [...w.replace(/\s+/g, '')];
  return {
    tok, lab,
    start(w) { return { tk: tok(w), i: 0, q: A.start, outs: [], hist: [], dead: false, done: false }; },
    rest(S) { const r = S.tk.slice(S.i); return r.length ? r.join(A.sep === ',' ? ',' : '') : 'ε'; },
    step(S) {
      if (S.done) return S;
      if (S.i >= S.tk.length) { S.done = true; return S; }
      const c = S.tk[S.i], t = delta.get(S.q + '\u0001' + c);
      if (!t) {
        if (A.mealy && A.stay) { S.outs.push('–'); S.i++; return S; }
        S.dead = true; S.done = true; S.miss = c; return S;
      }
      if (A.mealy) S.outs.push(t.out);
      S.q = t.to; S.i++;
      return S;
    },
    accepts(w) { const S = this.start(w); while (!S.done) this.step(S); return !S.dead && A.states.find(s => s.id === S.q)?.final === true; },
    output(w) { const S = this.start(w); while (!S.done) this.step(S); return S.outs; }
  };
}

/* ================= Registermaschine ================= */
function rmParse(src) {
  const prog = [], labels = {}; let pending = [];
  src.split('\n').forEach((raw, ln) => {
    let l = raw.replace(/\/\/.*$/, '').trim();
    if (!l) return;
    const m = l.match(/^([^\s:#*]+)\s*:\s*(.*)$/);
    if (m) { pending.push(m[1]); l = m[2].trim(); if (!l) return; }
    const parts = l.split(/\s+/); const op = parts[0].toUpperCase(), arg = parts[1];
    const ins = { op, arg, line: ln + 1, labs: pending, text: (pending.length ? pending.join(', ') + ': ' : '') + op + (arg !== undefined ? ' ' + arg : '') };
    pending.forEach(x => labels[x] = prog.length); pending = [];
    prog.push(ins);
  });
  pending.forEach(x => labels[x] = prog.length);
  return { prog, labels };
}
function rmRun(src, init, max = 20000) {
  const { prog, labels } = rmParse(src);
  const R = {}; Object.entries(init || {}).forEach(([k, v]) => R[+k] = v);
  const used = new Set(Object.keys(R).map(Number));
  const g = i => { used.add(i); return R[i] || 0; };
  let acc = 0, pc = 0, steps = 0; const rows = [];
  const val = a => {
    if (a === undefined) throw new Error('Operand fehlt');
    if (a[0] === '#') return +a.slice(1);
    if (a[0] === '*') return g(g(+a.slice(1)));
    return g(+a);
  };
  const tgt = a => {
    if (a === undefined || a[0] === '#') throw new Error('STORE braucht ein Register, keine Konstante');
    if (a[0] === '*') return g(+a.slice(1));
    return +a;
  };
  const jump = a => { if (!(a in labels)) throw new Error(`Marke „${a}“ gibt es nicht`); return labels[a]; };
  while (pc < prog.length) {
    if (steps >= max) return { rows, R, acc, steps, err: `Abbruch nach ${max} Befehlen (Endlosschleife?)` };
    const ins = prog[pc]; let next = pc + 1, ch = null, end = false;
    steps++;
    try {
      switch (ins.op) {
        case 'LOAD': acc = val(ins.arg); break;
        case 'STORE': { const t = tgt(ins.arg); R[t] = acc; used.add(t); ch = t; break; }
        case 'ADD': acc += val(ins.arg); break;
        case 'SUB': acc = Math.max(0, acc - val(ins.arg)); break;
        case 'MUL': acc *= val(ins.arg); break;
        case 'DIV': { const v = val(ins.arg); if (v === 0) end = true; else acc = Math.floor(acc / v); break; }
        case 'GOTO': next = jump(ins.arg); break;
        case 'JZERO': if (acc === 0) next = jump(ins.arg); break;
        case 'JNZERO': if (acc > 0) next = jump(ins.arg); break;
        case 'END': end = true; break;
        default: throw new Error(`Unbekannter Befehl „${ins.op}“ in Zeile ${ins.line}`);
      }
    } catch (e) { return { rows, R, acc, steps, err: e.message }; }
    rows.push({ nr: steps, text: ins.text, acc, R: { ...R }, ch });
    if (end) return { rows, R, acc, steps, used: used.size, ended: true };
    pc = next;
  }
  return { rows, R, acc, steps, used: used.size, ended: true };
}
const parseInit = s => { const o = {}; (s.match(/R?\s*(\d+)\s*=\s*(\d+)/gi) || []).forEach(m => { const [, a, b] = m.match(/(\d+)\s*=\s*(\d+)/); o[+a] = +b; }); return o; };
const initStr = o => Object.entries(o).map(([k, v]) => `R${k}=${v}`).join(', ');

/* ================= Ableitungsbaum ================= */
function treeSvg(t) {
  let leaf = 0; const nodes = [], edges = [];
  const lay = (n, dep) => {
    if (typeof n === 'string') { const o = { x: leaf++, dep, l: n, leaf: true }; nodes.push(o); return o; }
    const kids = n.slice(1).map(c => lay(c, dep + 1));
    const o = { x: (kids[0].x + kids[kids.length - 1].x) / 2, dep, l: n[0] };
    nodes.push(o); kids.forEach(k => edges.push([o, k])); return o;
  };
  lay(t, 0);
  const maxD = Math.max(...nodes.map(n => n.dep));
  const X = x => 22 + x * 30, Y = d => 20 + d * 44;
  const W = X(leaf - 1) + 22, H = Y(maxD) + 16;
  let s = `<svg class="tree" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">`;
  edges.forEach(([a, b]) => s += `<line x1="${X(a.x)}" y1="${Y(a.dep) + 9}" x2="${X(b.x)}" y2="${Y(b.dep) - 11}"/>`);
  nodes.forEach(n => s += n.leaf
    ? `<text class="tt" x="${X(n.x)}" y="${Y(n.dep) + 4}">${esc(n.l)}</text>`
    : `<circle cx="${X(n.x)}" cy="${Y(n.dep)}" r="11"/><text class="nt" x="${X(n.x)}" y="${Y(n.dep) + 4.5}">${esc(n.l)}</text>`);
  return s + '</svg>';
}

/* ================= Zeilen-Diff ================= */
function lineDiff(a, b) {
  const A = a.split('\n'), B = b.split('\n'), n = A.length, m = B.length;
  const L = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = A[i] === B[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const out = []; let i = 0, j = 0;
  while (i < n && j < m) {
    if (A[i] === B[j]) { out.push(['c', A[i]]); i++; j++; }
    else if (L[i + 1][j] >= L[i][j + 1]) out.push(['d', A[i++]]);
    else out.push(['a', B[j++]]);
  }
  while (i < n) out.push(['d', A[i++]]);
  while (j < m) out.push(['a', B[j++]]);
  return out;
}

/* ================= Rendern ================= */
const W = {}; // Widget-Zustand
function block(b, ctx) {
  switch (b.t) {
    case 'p': return /^\s*<(ul|ol|div|table)/.test(b.html) ? b.html : `<p>${b.html}</p>`;
    case 'h': return `<h${b.lvl + 0}>${esc(b.text)}</h${b.lvl + 0}>`;
    case 'task': return `<div class="task">${b.html}</div>`;
    case 'refl': return `<div class="refl">${b.html}</div>`;
    case 'note': return `<div class="note">${b.html}</div>`;
    case 'img': return `<figure><img src="${b.src}" alt="${esc(b.cap || '')}" loading="lazy"><figcaption>${b.cap || ''}</figcaption></figure>`;
    case 'code': return `<pre class="code">${esc(b.text)}</pre>`;
    case 'svg': return `<figure>${b.html}${b.cap ? `<figcaption>${b.cap}</figcaption>` : ''}</figure>`;
    case 'table': return `<div class="tbl"><table>${b.head ? '<tr>' + b.head.map(x => `<th>${x}</th>`).join('') + '</tr>' : ''}${b.rows.map(r => '<tr>' + r.map(x => `<td>${x}</td>`).join('') + '</tr>').join('')}${b.cap ? `<caption>${b.cap}</caption>` : ''}</table></div>`;
    case 'diff': {
      const lines = lineDiff(b.old, b.neu);
      const plus = lines.filter(l => l[0] === 'a').length, minus = lines.filter(l => l[0] === 'd').length;
      return `<div class="diff"><div class="dh"><span class="cm">${esc(b.msg)}</span><span class="f">${esc(b.file)}</span> · <span class="plus">+${plus}</span> <span class="minus">−${minus}</span>${ctx && ctx.from ? ` · <a href="#/c/${ctx.from.sha}">${fmt(ctx.from.d)}</a>` : ''}</div>`
        + lines.map(([k, t]) => `<div class="dl ${k}">${esc(t) || ' '}</div>`).join('')
        + (b.why ? `<div class="why">${b.why}</div>` : '') + '</div>';
    }
    case 'rail': return `<figure class="rrbox">${b.list.map(([n, node]) => railSvg(n, node)).join('')}${b.cap ? `<figcaption>${b.cap}</figcaption>` : ''}</figure>`;
    case 'dfa': {
      const id = uid(); W[id] = { A: b, run: autoRunner(b) };
      const first = b.tests && b.tests.length ? b.tests[0] : '';
      return `<div class="w" id="${id}" data-k="dfa"><div class="wh"><span>▶ <b>${b.mealy ? 'Mealy-Automat' : 'Automat'}</b> ausführen</span><span>${esc(b.title || '')}</span></div><div class="wb">
${dfaSvg(b, id)}
<div class="ctrl"><input aria-label="Eingabewort" value="${esc(first)}" placeholder="${b.sep === ',' ? 'z. B. 50,100' : 'Eingabewort'}"><button data-a="step">Schritt</button><button class="pri" data-a="all">Ganz durchlaufen</button><button data-a="reset">Reset</button></div>
${b.tests ? `<div class="chips">${b.tests.map(w => `<span class="chip ${b.mealy ? '' : (W[id].run.accepts(w) ? 'y' : 'n')}" data-w="${esc(w)}">${esc(w) || 'ε'}</span>`).join('')}</div>` : ''}
<div class="out">Eingabe wählen und starten.</div>${b.legend ? `<div class="note" style="margin-bottom:0">${b.legend}</div>` : ''}</div></div>`;
    }
    case 'rx': {
      const id = uid(); W[id] = { b };
      const alts = b.alts ? `<div class="chips">${b.alts.map((a, i) => `<button data-a="alt" data-i="${i}">${esc(a.label)}</button>`).join('')}</div>` : '';
      return `<div class="w" id="${id}" data-k="rx"><div class="wh"><span>▶ <b>Regulärer Ausdruck</b> testen</span><span>${esc(b.title || '')}</span></div><div class="wb">
<div class="rx">^(<input aria-label="Regulärer Ausdruck" value="${esc(b.p)}" spellcheck="false">)$</div>${alts}
<ul class="rxl"></ul><div class="ctrl"><input aria-label="eigenes Testwort" placeholder="eigenes Wort testen …"><button data-a="add">testen</button></div></div></div>`;
    }
    case 'rm': {
      const id = uid(); W[id] = { b };
      const chips = (b.inits || []).map(o => `<span class="chip" data-init="${esc(initStr(o))}">${esc(initStr(o))}</span>`).join('')
        + (b.variants || []).map((v, i) => `<button data-a="var" data-i="${i}">${esc(v.label)}</button>`).join('');
      return `<div class="w" id="${id}" data-k="rm"><div class="wh"><span>▶ <b>Registermaschine</b></span><span>${esc(b.title || '')}</span></div><div class="wb">
<textarea class="rmc" rows="${Math.min(18, (b.code.match(/\n/g) || []).length + 2)}" spellcheck="false" aria-label="Programm">${esc(b.code)}</textarea>
<div class="ctrl"><span class="mono">Start:</span><input aria-label="Startbelegung" value="${esc(initStr(b.init || {}))}"><button class="pri" data-a="run">Ausführen</button><button data-a="stepper">Zeile für Zeile</button></div>
${chips ? `<div class="chips">${chips}</div>` : ''}<div class="out">Ablaufprotokoll erscheint hier.</div><div class="prot"></div></div></div>`;
    }
    case 'der': {
      const id = uid(); W[id] = { b, i: 0 };
      return `<div class="w" id="${id}" data-k="der"><div class="wh"><span>▶ <b>Ableitung</b></span><span>${esc(b.title || '')}</span></div><div class="wb">
<div class="der"></div><div class="ctrl"><button data-a="next">nächster Schritt</button><button data-a="allder">alle</button><button data-a="resetder">von vorn</button></div>
${b.tree ? `<div style="overflow-x:auto">${treeSvg(b.tree)}</div>` : ''}</div></div>`;
    }
  }
  return '';
}

/* ---------- Widget-Logik ---------- */
function dfaShow(id, S, msg) {
  const el = document.getElementById(id), w = W[id], A = w.A;
  el.querySelectorAll('.st').forEach(c => c.classList.toggle('on', S && c.dataset.q === S.q && !S.dead));
  if (!S) return;
  const conf = S.hist.join(' ⊢ ');
  let tail = '';
  if (S.done) {
    if (A.mealy) tail = `\nAusgabe: ${S.outs.join(', ') || '(keine)'}`;
    else if (S.dead) tail = `\n<span class="bad">✗ nicht akzeptiert</span>: von ${esc(w.run.lab(S.q))} gibt es keinen Übergang mit „${esc(S.miss)}“ → Fehlerzustand`;
    else {
      const fin = A.states.find(s => s.id === S.q).final;
      tail = fin ? `\n<span class="ok">✓ akzeptiert</span>: Wort komplett gelesen, ${esc(w.run.lab(S.q))} ist Endzustand`
        : `\n<span class="bad">✗ nicht akzeptiert</span>: Wort gelesen, aber ${esc(w.run.lab(S.q))} ist kein Endzustand`;
    }
  } else if (A.mealy && S.outs.length) tail = `\nAusgabe bisher: ${S.outs.join(', ')}`;
  el.querySelector('.out').innerHTML = esc(conf).replace(/&lt;(\/?span[^&]*)&gt;/g, '<$1>') + tail;
}
function dfaPush(w, S) { S.hist.push(`⟨${w.run.lab(S.q)}, ${w.run.rest(S)}⟩`); }
function rxRender(id) {
  const el = document.getElementById(id), w = W[id];
  const src = el.querySelector('.rx input').value; let re = null, err = '';
  try { re = new RegExp('^(?:' + src + ')$'); } catch (e) { err = e.message; }
  const words = [...(w.b.tests || []), ...(w.extra || [])];
  el.querySelector('.rxl').innerHTML = err ? `<li class="bad">Ausdruck fehlerhaft: ${esc(err)}</li>` :
    words.map(x => { const ok = re.test(x); return `<li><span>${esc(x) || 'ε (leeres Wort)'}</span><span class="${ok ? 'ok' : 'bad'}">${ok ? '✓ passt' : '✗ passt nicht'}</span></li>`; }).join('');
}
function rmShow(id, step) {
  const el = document.getElementById(id), w = W[id];
  const src = el.querySelector('textarea').value, init = parseInit(el.querySelector('.ctrl input').value);
  const r = rmRun(src, init);
  const regs = new Set(w.b.cols || []);
  if (!w.b.cols) { Object.keys(init).forEach(k => regs.add(+k)); r.rows.forEach(x => x.ch && regs.add(x.ch)); }
  const cols = [...regs].sort((a, b) => a - b);
  const lim = step === undefined ? r.rows.length : step;
  let html = `<table><tr><th>Nr.</th><th class="b">Befehl</th><th>Akku</th>${cols.map(c => `<th>R${c}</th>`).join('')}</tr>`;
  html += `<tr><td></td><td class="b">Start</td><td>0</td>${cols.map(c => `<td>${init[c] || 0}</td>`).join('')}</tr>`;
  let prevAcc = 0;
  r.rows.slice(0, Math.min(lim, 400)).forEach(x => {
    html += `<tr><td>${x.nr}</td><td class="b">${esc(x.text)}</td><td class="${x.acc !== prevAcc ? 'ch' : ''}">${x.acc}</td>${cols.map(c => `<td class="${x.ch === c ? 'ch' : ''}">${x.R[c] || 0}</td>`).join('')}</tr>`;
    prevAcc = x.acc;
  });
  html += '</table>';
  el.querySelector('.prot').innerHTML = html;
  const fertig = lim >= r.rows.length;
  el.querySelector('.out').innerHTML = r.err ? `<span class="bad">Fehler:</span> ${esc(r.err)}`
    : fertig ? `<span class="ok">Programm beendet.</span> Ergebnis: ${cols.map(c => `R${c} = ${r.R[c] || 0}`).join(', ')}\nZeit: ${r.steps} ausgeführte Befehle (inkl. END) · Speicher: ${r.used} Register`
      : `Schritt ${lim} von ${r.rows.length} …`;
  return r.rows.length;
}
function derShow(id) {
  const el = document.getElementById(id), w = W[id], st = w.b.steps;
  el.querySelector('.der').innerHTML = st.map((x, i) => i <= w.i ? esc(x) : `<span class="nx">${esc(x)}</span>`).join(' → ');
}

function bind(root) {
  root.querySelectorAll('[data-k]').forEach(el => {
    const id = el.id, k = el.dataset.k, w = W[id];
    if (k === 'dfa') {
      const inp = el.querySelector('.ctrl input');
      const begin = () => { w.S = w.run.start(inp.value); dfaPush(w, w.S); };
      el.addEventListener('click', e => {
        const a = e.target.dataset.a, chip = e.target.closest('.chip');
        if (chip) { inp.value = chip.dataset.w; begin(); while (!w.S.done) { w.run.step(w.S); if (!w.S.dead) dfaPush(w, w.S); if (w.S.i >= w.S.tk.length) w.S.done = true; } dfaShow(id, w.S); return; }
        if (a === 'reset') { w.S = null; dfaShow(id, null); el.querySelector('.out').textContent = 'Eingabe wählen und starten.'; }
        if (a === 'step') {
          if (!w.S || w.S.done || w.S.word !== inp.value) { begin(); w.S.word = inp.value; }
          else { w.run.step(w.S); if (!w.S.dead) dfaPush(w, w.S); if (w.S.i >= w.S.tk.length) w.S.done = true; }
          dfaShow(id, w.S);
        }
        if (a === 'all') { begin(); while (!w.S.done) { w.run.step(w.S); if (!w.S.dead) dfaPush(w, w.S); if (w.S.i >= w.S.tk.length) w.S.done = true; } dfaShow(id, w.S); }
      });
      inp.addEventListener('keydown', e => { if (e.key === 'Enter') el.querySelector('[data-a=all]').click(); });
    }
    if (k === 'rx') {
      const pin = el.querySelector('.rx input'), add = el.querySelector('.ctrl input');
      pin.addEventListener('input', () => rxRender(id));
      el.addEventListener('click', e => {
        const a = e.target.dataset.a;
        if (a === 'alt') { pin.value = w.b.alts[+e.target.dataset.i].p; rxRender(id); }
        if (a === 'add') { (w.extra = w.extra || []).push(add.value); add.value = ''; rxRender(id); }
      });
      add.addEventListener('keydown', e => { if (e.key === 'Enter') el.querySelector('[data-a=add]').click(); });
      rxRender(id);
    }
    if (k === 'rm') {
      const inp = el.querySelector('.ctrl input'), ta = el.querySelector('textarea');
      el.addEventListener('click', e => {
        const a = e.target.dataset.a, chip = e.target.closest('.chip');
        if (chip) { inp.value = chip.dataset.init; w.st = undefined; rmShow(id); return; }
        if (a === 'run') { w.st = undefined; rmShow(id); }
        if (a === 'stepper') { w.st = (w.st || 0) + 1; const n = rmShow(id, w.st); if (w.st >= n) w.st = undefined; }
        if (a === 'var') { const v = w.b.variants[+e.target.dataset.i]; ta.value = v.code; if (v.init) inp.value = initStr(v.init); w.st = undefined; rmShow(id); }
      });
    }
    if (k === 'der') {
      el.addEventListener('click', e => {
        const a = e.target.dataset.a;
        if (a === 'next') w.i = Math.min(w.i + 1, w.b.steps.length - 1);
        if (a === 'allder') w.i = w.b.steps.length - 1;
        if (a === 'resetder') w.i = 0;
        derShow(id);
      });
      derShow(id);
    }
  });
}

/* ================= Seiten ================= */
function stats(e) {
  let plus = 0, minus = 0;
  e.body.forEach(b => {
    if (b.t === 'diff') lineDiff(b.old, b.neu).forEach(l => { if (l[0] === 'a') plus++; if (l[0] === 'd') minus++; });
    else plus += b.t === 'p' || b.t === 'refl' ? Math.max(1, Math.round((b.html || '').length / 90)) : 2;
  });
  return { plus, minus };
}
function pageLog() {
  const list = state.rev ? [...ENTRIES].reverse() : ENTRIES;
  return `<section class="readme"><div class="fn">README.md</div><div class="bd">${README}</div></section>
<div class="loghead"><h2>Verlauf · ${ENTRIES.length} Unterrichtstage</h2><button data-act="rev">${state.rev ? 'älteste zuerst' : 'neueste zuerst'}</button></div>
<div class="log">${list.map(e => {
    const s = stats(e);
    return `<a class="commit" href="#/c/${e.sha}"><div class="m">${esc(e.msg)}</div><div class="meta"><span>${wday(e.d)}, ${fmt(e.d)}</span><span class="sha">${e.sha}</span><span><span class="plus">+${s.plus}</span> <span class="minus">−${s.minus}</span></span><span>${e.tags.map(t => `<span class="tag">${esc(t)}</span>`).join('')}</span></div></a>`;
  }).join('')}</div>`;
}
function pageCommit(e) {
  const i = ENTRIES.indexOf(e), prev = ENTRIES[i - 1], next = ENTRIES[i + 1], s = stats(e);
  return `<div class="chead"><h1>${esc(e.msg)}</h1><div class="meta"><span>Leo Widmann</span><span>${wday(e.d)}, ${fmt(e.d)}</span><span class="sha">commit ${e.sha}</span>${prev ? `<span>parent <a class="sha" href="#/c/${prev.sha}">${prev.sha}</a></span>` : '<span>erster Commit</span>'}<span><span class="plus">+${s.plus}</span> <span class="minus">−${s.minus}</span></span></div><div class="meta" style="margin-top:6px">${e.tags.map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div></div>
<div class="nav2"><span>${prev ? `<a href="#/c/${prev.sha}">← ${fmt(prev.d)} ${esc(prev.short || '')}</a>` : ''}</span><span>${next ? `<a href="#/c/${next.sha}">${fmt(next.d)} ${esc(next.short || '')} →</a>` : `<a href="#/fazit">Fazit →</a>`}</span></div>
<article>${e.body.map(b => block(b)).join('\n')}</article>
<div class="nav2" style="margin-top:28px"><span>${prev ? `<a href="#/c/${prev.sha}">← ${fmt(prev.d)}</a>` : ''}</span><span>${next ? `<a href="#/c/${next.sha}">${fmt(next.d)} →</a>` : `<a href="#/fazit">Fazit →</a>`}</span></div>`;
}
function pageFixes() {
  let html = `<div class="chead"><h1>Fehler &amp; Fixes</h1><div>Alle Stellen, an denen mein erster Versuch falsch oder ungenau war, mit der Korrektur. Rot = erster Versuch, grün = verbessert. Die Sammlung hilft mir zu sehen, welche Fehler ich immer wieder mache (siehe <a href="#/fazit">Fazit</a>).</div></div><div class="fixlist">`;
  ENTRIES.forEach(e => e.body.filter(b => b.t === 'diff').forEach(b => {
    html += block(b, { from: e });
  }));
  return html + '</div>';
}
function pageFazit() { return `<div class="chead"><h1>Fazit: Was kann eine Maschine?</h1><div class="meta"><span>Leo Widmann</span><span>Rückblick auf Q3</span></div></div><article>${FAZIT.map(b => block(b)).join('\n')}</article>`; }

const state = { rev: false };
function render() {
  const hsh = location.hash.replace(/^#/, '') || '/';
  const main = document.getElementById('main');
  let tab = 'log';
  if (hsh.startsWith('/c/')) { const e = ENTRIES.find(x => x.sha === hsh.slice(3)); main.innerHTML = e ? pageCommit(e) : pageLog(); }
  else if (hsh === '/fehler') { main.innerHTML = pageFixes(); tab = 'fehler'; }
  else if (hsh === '/fazit') { main.innerHTML = pageFazit(); tab = 'fazit'; }
  else main.innerHTML = pageLog();
  document.querySelectorAll('.tabs a').forEach(a => a.classList.toggle('on', a.dataset.tab === tab));
  bind(main);
  const rev = main.querySelector('[data-act=rev]');
  if (rev) rev.onclick = () => { state.rev = !state.rev; render(); };
}
function start() {
  ENTRIES.forEach(e => e.sha = sha(e.d + e.msg));
  document.getElementById('cnt-log').textContent = ENTRIES.length;
  document.getElementById('cnt-fix').textContent = ENTRIES.reduce((s, e) => s + e.body.filter(b => b.t === 'diff').length, 0);
  window.addEventListener('hashchange', () => { render(); window.scrollTo(0, 0); });
  render();
}
