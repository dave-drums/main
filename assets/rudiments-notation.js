// Small, data-driven percussion engraver. Integer ticks determine spacing,
// metrical beams, dots and tuplet brackets; ornament notes have no metric time.
const NS = 'http://www.w3.org/2000/svg';
const QUARTER = 96;
function svg(tag, attrs = {}, text) {
  const el = document.createElementNS(NS, tag);
  Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
  if (text !== undefined) el.textContent = text;
  return el;
}
const line = (x1, y1, x2, y2, extra = {}) => svg('line', { x1, y1, x2, y2, ...extra });
const ticks = (note) => note.ticks ?? Math.round(note.beats * QUARTER);
const levels = (note) => note.hand ? Math.max(0, Math.log2(note.value) - 2) : 0;
const head = (x, y, small = false, open = false) => svg('ellipse', {
  cx: x, cy: y, rx: small ? 3.5 : 5.5, ry: small ? 2.5 : 4,
  transform: `rotate(-20 ${x} ${y})`, class: open ? 'rud-notehead rud-open-head' : 'rud-notehead',
});

export function layoutNotation(rudiment, containerWidth) {
  const width = Math.max(280, Math.min(1060, containerWidth || 800));
  const left = 68, available = width - left - 22;
  const groups = [];
  let tick = 0;
  let group;
  const barTicks = rudiment.meter[0] * QUARTER * 4 / rudiment.meter[1];
  rudiment.notes.forEach((note, index) => {
    const span = note.tuplet
      ? QUARTER * 4 / note.tupletUnit * (note.tuplet === 6 ? 4 : 2) : QUARTER;
    const cell = Math.floor(tick / span);
    // A tuplet group stays intact, even with mixed values inside it (#11/#30).
    const same = group && group.cell === cell && group.span === span
      && group.tuplet === (note.tuplet || 0) && tick % barTicks !== 0;
    if (!same) {
      group = { cell, span, tuplet: note.tuplet || 0, items: [], width: 0 };
      groups.push(group);
    }
    const gracePad = note.grace.length ? note.grace.length * 12 + 8 : 0;
    const space = Math.max(27, 34 * Math.sqrt(ticks(note) / 24)) + gracePad + (note.dot ? 6 : 0);
    group.items.push({ index, note, tick, gracePad, space });
    group.width += space;
    tick += ticks(note);
    // Quarter notes, rests and longer values never join an adjacent beam.
    if (note.value <= 4 || !note.hand) group = null;
  });
  const packed = [];
  for (const source of groups) {
    // Dense straight 32nds can be beamed in smaller groups on narrow screens.
    // Never split a tuplet bracket or a grace-note cluster across systems.
    let part = { ...source, items: [], width: 0 };
    for (const item of source.items) {
      if (!source.tuplet && source.width > available && part.items.length && item.tick % (QUARTER / 2) === 0) {
        packed.push(part);
        part = { ...source, items: [], width: 0 };
      }
      part.items.push(item); part.width += item.space;
    }
    if (part.items.length) packed.push(part);
  }
  const rows = [];
  let row = { groups: [], width: 0 };
  for (const item of packed) {
    if (row.groups.length && row.width + item.width + 12 > available) {
      rows.push(row); row = { groups: [], width: 0 };
    }
    row.groups.push(item); row.width += item.width + 12;
  }
  if (row.groups.length) rows.push(row);
  // Keep the same logical staff width across rows, without magnifying short
  // figures to giant notes or shrinking dense figures into unreadable text.
  rows.forEach((system) => {
    let x = left;
    system.groups.forEach((g) => {
      g.items.forEach((item) => { item.x = x + item.gracePad + 8; x += item.space; });
      x += 12;
    });
    system.end = x - 4;
  });
  const usedWidth = Math.max(280, ...rows.map((system) => system.end + 20));
  return { width: Math.min(width, usedWidth), rows, barTicks, totalTicks: tick };
}

function graceNotes(score, item, y) {
  const { note, x, index } = item;
  if (!note.grace.length) return;
  const first = x - (note.grace.length === 2 ? 32 : 21);
  note.grace.forEach((hand, g) => {
    const gx = first + g * 12;
    const stroke = svg('g', { class: 'rud-stroke rud-grace', 'data-stroke': `${index}:g${g}` });
    stroke.append(svg('rect', { x: gx - 6, y: y - 32, width: 13, height: 79, rx: 3, class: 'rud-cursor' }),
      head(gx, y + 2, true), line(gx + 3, y + 2, gx + 3, y - 23),
      svg('text', { x: gx, y: y + 41, class: 'rud-sticking' }, hand.toLowerCase()));
    if (note.grace.length === 1) stroke.append(svg('path', {
      d: `M ${gx + 3} ${y - 23} q 13 6 4 15 M ${gx - 2} ${y - 9} l 13 -10`, class: 'rud-grace-flag',
    }));
    score.append(stroke);
  });
  if (note.grace.length === 2) score.append(
    line(first + 3, y - 23, first + 15, y - 23, { class: 'rud-grace-beam' }),
    line(first + 3, y - 18, first + 15, y - 18, { class: 'rud-grace-beam' }));
  score.append(svg('path', { d: `M ${first - 2} ${y + 11} Q ${x - 10} ${y + 27} ${x + 3} ${y + 11}`, class: 'rud-slur' }));
}

function beams(score, group, y) {
  const items = group.items;
  for (let level = 1; level <= 3; level++) {
    let start = 0;
    while (start < items.length) {
      if (levels(items[start].note) < level) { start++; continue; }
      let end = start;
      while (end + 1 < items.length && levels(items[end + 1].note) >= level) end++;
      const x1 = items[start].x + 5;
      const x2 = items[end].x + 5;
      const by = y - 36 + (level - 1) * 7;
      if (end > start) score.append(line(x1, by, x2, by, { class: 'rud-beam' }));
      else if (items.length > 1) {
        const direction = start < items.length - 1 ? 1 : -1;
        score.append(line(x1, by, x1 + direction * 9, by, { class: 'rud-beam' }));
      } else {
        score.append(svg('path', { d: `M ${x1} ${by} q 15 6 5 17`, class: 'rud-flag' }));
      }
      start = end + 1;
    }
  }
  if (group.tuplet) {
    const first = items[0].x, last = items.at(-1).x;
    const mid = (first + last) / 2;
    // Brackets remain explicit with mixed note values, including Flam Drag.
    score.append(svg('path', { d: `M ${first - 7} ${y - 64} v -5 H ${mid - 10} M ${mid + 10} ${y - 69} H ${last + 9} v 5`, class: 'rud-tuplet-bracket' }),
      svg('text', { x: mid, y: y - 65, class: 'rud-tuplet' }, group.tuplet));
  }
}

export function renderNotation(container, rudiment) {
  const layout = layoutNotation(rudiment, container.clientWidth);
  const score = svg('svg', { viewBox: `0 0 ${layout.width} ${layout.rows.length * 150 + 8}`,
    role: 'img', 'aria-labelledby': 'rud-score-title rud-score-description', class: 'rud-score' });
  score.append(svg('title', { id: 'rud-score-title' }, `${rudiment.name} — ${rudiment.meter.join('/')} percussion notation`),
    svg('desc', { id: 'rud-score-description' },
      `Quarter-note pulse. ${rudiment.rhythm || ''}. R means right hand; L means left hand. Small notes lead into main strokes. Numbers mark tuplets; Z marks uncounted buzz rebounds. Repeat the complete pattern.`));
  layout.rows.forEach((row, rowIndex) => {
    const y = rowIndex * 150 + 86;
    score.append(line(12, y, Math.min(layout.width - 8, row.end + 10), y, { class: 'rud-staff' }));
    if (rowIndex === 0) score.append(line(19, y - 11, 19, y + 11, { class: 'rud-clef' }),
      line(25, y - 11, 25, y + 11, { class: 'rud-clef' }),
      svg('text', { x: 44, y: y - 2, class: 'rud-meter' }, rudiment.meter[0]),
      svg('text', { x: 44, y: y + 16, class: 'rud-meter' }, rudiment.meter[1]));
    row.groups.forEach((group) => {
      group.items.forEach((item) => {
        const { note, index, x, tick } = item;
        const stroke = svg('g', { class: 'rud-stroke', 'data-stroke': `${index}:main` });
        stroke.append(svg('rect', { x: x - 12, y: y - 59, width: 25, height: 106, rx: 4, class: 'rud-cursor' }));
        if (note.hand) {
          stroke.append(head(x, y, false, note.value <= 2));
          if (note.value > 1) stroke.append(line(x + 5, y, x + 5, y - 36));
          if (note.buzz) stroke.append(svg('path', { d: `M ${x - 1} ${y - 25} h 12 l -12 12 h 12`, class: 'rud-buzz-mark' }));
          if (note.accent) stroke.append(svg('path', { d: `M ${x - 6} ${y - 55} l 13 5 l -13 5`, class: 'rud-accent' }));
          stroke.append(svg('text', { x, y: y + 41, class: 'rud-sticking' }, note.hand));
        } else {
          stroke.append(svg('path', { d: `M ${x - 3} ${y - 18} l 8 9 l -7 8 l 6 10 l -8 -4 l 4 -7 l -7 -8 Z`, class: 'rud-rest' }));
        }
        if (note.dot) stroke.append(svg('circle', { cx: x + 12, cy: y - 5, r: 2, class: 'rud-dot' }));
        score.append(stroke);
        graceNotes(score, item, y);
        if (tick && tick % layout.barTicks === 0) score.append(line(x - item.gracePad - 12, y - 16, x - item.gracePad - 12, y + 16));
      });
      beams(score, group, y);
    });
    if (rowIndex === layout.rows.length - 1) {
      const end = Math.min(layout.width - 17, row.end);
      score.append(line(end, y - 16, end, y + 16), line(end + 6, y - 16, end + 6, y + 16, { class: 'rud-repeat-bar' }),
        svg('circle', { cx: end - 7, cy: y - 5, r: 2 }), svg('circle', { cx: end - 7, cy: y + 5, r: 2 }));
    }
  });
  container.replaceChildren(score);
}
