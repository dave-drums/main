// Original single-line rhythm engraving. Shares the site's notation CSS, with
// meter-aware beams, duration-specific rests, explicit tuplets and sound ties.
const NS = 'http://www.w3.org/2000/svg';
function el(tag, attrs = {}, text) {
  const node = document.createElementNS(NS, tag);
  for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, value);
  if (text !== undefined) node.textContent = text;
  return node;
}
const line = (x1, y1, x2, y2, attrs = {}) => el('line', { x1, y1, x2, y2, ...attrs });
const level = (note) => note.hand ? Math.max(0, Math.log2(note.value) - 2) : 0;
export function layoutBar(bar, width) {
  width = Math.max(280, Math.min(1000, width || 500));
  const groups = [], available = width - 78;
  let boundary = bar.info.groups[0], beat = 0;
  for (let i = 0; i < bar.notes.length; i++) {
    const note = bar.notes[i];
    while (note.start >= boundary && beat < bar.info.groups.length - 1) boundary += bar.info.groups[++beat];
    const key = note.tuplet ? `t${note.tupletGroup}` : `b${beat}`;
    let group = groups.at(-1);
    if (!group || group.key !== key) { group = { key, items: [], width: 0 }; groups.push(group); }
    const space = Math.max(26, 30 * Math.sqrt(note.ticks / 24)) + (note.dot ? 5 : 0);
    group.items.push({ note, index: i, space }); group.width += space;
  }
  const packed = [];
  for (const source of groups) {
    let group = { key: source.key, items: [], width: 0 };
    for (const item of source.items) {
      if (source.width > available && !source.key.startsWith('t') && group.items.length && item.note.start % 48 === 0) {
        packed.push(group); group = { key: source.key, items: [], width: 0 };
      }
      group.items.push(item); group.width += item.space;
    }
    packed.push(group);
  }
  const rows = [];
  let row = { groups: [], width: 0 };
  for (const group of packed) {
    if (row.groups.length && row.width + group.width + 10 > available) { rows.push(row); row = { groups: [], width: 0 }; }
    row.groups.push(group); row.width += group.width + 10;
  }
  if (row.groups.length) rows.push(row);
  const positions = new Map();
  rows.forEach((system, r) => {
    let x = 62;
    for (const group of system.groups) {
      for (const item of group.items) { item.x = x + 6; item.y = r * 120 + 72; positions.set(item.index, item); x += item.space; }
      x += 10;
    }
    system.end = x - 4;
  });
  return { width: Math.min(width, Math.max(280, ...rows.map((r) => r.end + 14))), rows, positions };
}
function rest(node, note, x, y) {
  if (note.value <= 2) node.append(el('rect', { x: x - 6, y: note.value === 1 ? y : y - 5, width: 12, height: 5 }));
  else if (note.value === 4) node.append(el('path', { d: `M ${x - 3} ${y - 18} l 7 8 l -6 8 l 6 7 C ${x - 10} ${y - 2} ${x - 11} ${y + 8} ${x - 1} ${y + 14}`, class: 'rr-quarter-rest' }));
  else {
    node.append(line(x + 7, y - 20, x - 1, y + 14));
    const flags = Math.log2(note.value) - 2;
    for (let i = 0; i < flags; i++) {
      const fy = y - 14 + i * 7;
      node.append(el('circle', { cx: x - 1 - i, cy: fy, r: 3 }),
        el('path', { d: `M ${x - 1 - i} ${fy} Q ${x + 5} ${fy + 5} ${x + 7 - i * 2} ${fy - 6}`, class: 'rr-rest-flag' }));
    }
  }
}
function beam(score, group, y) {
  const items = group.items;
  for (let tier = 1; tier <= 3; tier++) {
    let start = 0;
    while (start < items.length) {
      if (level(items[start].note) < tier) { start++; continue; }
      let end = start;
      while (end + 1 < items.length && level(items[end + 1].note) >= tier) end++;
      const x = items[start].x + 5, by = y - 34 + (tier - 1) * 7;
      if (end > start) score.append(line(x, by, items[end].x + 5, by, { class: 'rud-beam' }));
      else {
        const connected = tier > 1 && (level(items[start - 1]?.note || {}) || level(items[start + 1]?.note || {}));
        if (connected) score.append(line(x, by, x + (start ? -9 : 9), by, { class: 'rud-beam' }));
        else score.append(el('path', { d: `M ${x} ${by} q 14 6 5 16`, class: 'rud-flag' }));
      }
      start = end + 1;
    }
  }
  const tuplet = items.find((item) => item.note.tuplet)?.note.tuplet;
  if (tuplet) {
    const first = items[0].x - 7, last = items.at(-1).x + 9, mid = (first + last) / 2;
    score.append(el('path', { d: `M ${first} ${y - 54} v -4 H ${mid - 10} M ${mid + 10} ${y - 58} H ${last} v 4`, class: 'rud-tuplet-bracket' }),
      el('text', { x: mid, y: y - 54, class: 'rud-tuplet' }, tuplet));
  }
}
export function renderBar(container, bar, serial, width) {
  const layout = layoutBar(bar, width), prefix = `rr-score-${serial}`;
  const score = el('svg', { viewBox: `0 0 ${layout.width} ${layout.rows.length * 120 + 4}`,
    class: 'rud-score rr-score', role: 'img', 'aria-labelledby': `${prefix}-title ${prefix}-desc` });
  score.append(el('title', { id: `${prefix}-title` }, `Rhythm in ${bar.meter}`),
    el('desc', { id: `${prefix}-desc` }, 'Single-line percussion notation. Dots extend notes. Curves join tied notes without another attack. Numbers mark tuplets.'));
  layout.rows.forEach((row, r) => {
    const y = r * 120 + 72;
    score.append(line(10, y, row.end + 8, y, { class: 'rud-staff' }));
    if (!r) score.append(line(17, y - 10, 17, y + 10, { class: 'rud-clef' }), line(23, y - 10, 23, y + 10, { class: 'rud-clef' }),
      el('text', { x: 42, y: y - 2, class: 'rud-meter' }, bar.info.top), el('text', { x: 42, y: y + 16, class: 'rud-meter' }, bar.info.bottom));
    for (const group of row.groups) {
      for (const item of group.items) {
        const { note, index, x } = item;
        const node = el('g', { 'data-rr-note': `${serial}:${index}`, class: 'rr-note' });
        node.append(el('rect', { x: x - 12, y: y - 45, width: 25, height: 75, rx: 4, class: 'rud-cursor' }));
        if (note.hand) {
          node.append(el('ellipse', { cx: x, cy: y, rx: 5.5, ry: 4, transform: `rotate(-20 ${x} ${y})`, class: note.value <= 2 ? 'rud-notehead rud-open-head' : 'rud-notehead' }));
          if (note.value > 1) node.append(line(x + 5, y, x + 5, y - 34));
          if (note.accent) node.append(el('path', { d: `M ${x - 5} ${y - 46} l 12 4 l -12 4`, class: 'rud-accent' }));
        } else rest(node, note, x, y);
        if (note.dot) node.append(el('circle', { cx: x + 12, cy: y - 5, r: 2 }));
        score.append(node);
      }
      beam(score, group, y);
    }
    if (r === layout.rows.length - 1) score.append(line(row.end, y - 16, row.end, y + 16), line(row.end + 5, y - 16, row.end + 5, y + 16));
  });
  bar.notes.forEach((note, i) => {
    if (!note.tieOut) return;
    const a = layout.positions.get(i), b = layout.positions.get(i + 1);
    if (!b) return;
    if (a.y === b.y) score.append(el('path', { d: `M ${a.x + 3} ${a.y + 10} Q ${(a.x + b.x) / 2} ${a.y + 30} ${b.x - 3} ${b.y + 10}`, class: 'rr-tie' }));
    else {
      const end = layout.rows.find((row) => row.groups.some((g) => g.items.includes(a))).end;
      score.append(el('path', { d: `M ${a.x + 3} ${a.y + 10} Q ${end - 10} ${a.y + 26} ${end} ${a.y + 15} M 52 ${b.y + 15} Q 57 ${b.y + 26} ${b.x - 3} ${b.y + 10}`, class: 'rr-tie' }));
    }
  });
  container.replaceChildren(score);
}
