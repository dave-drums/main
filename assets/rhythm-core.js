// Original rhythm generation and scoring. Quarter-note timing uses 96 ticks.
export const TICKS = 96;
export const METERS = ['2/4', '3/4', '4/4', '5/4', '6/8', '7/8', '9/8', '12/8'];
export function meterInfo(meter) {
  const [top, bottom] = meter.split('/').map(Number);
  const compound = bottom === 8 && top % 3 === 0 && top >= 6;
  const pulse = compound ? 144 : TICKS * 4 / bottom;
  const groups = bottom === 4 ? Array(top).fill(96)
    : compound ? Array(top / 3).fill(144) : [96, 96, 144];
  return { top, bottom, total: top * TICKS * 4 / bottom, pulse,
    beats: top * TICKS * 4 / bottom / pulse, groups,
    unit: compound ? 'Dotted-quarter' : bottom === 8 ? 'Eighth-note' : 'Quarter-note' };
}
export function random(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6D2B79F5;
    let t = Math.imul(value ^ value >>> 15, 1 | value);
    t ^= t + Math.imul(t ^ t >>> 7, 61 | t);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const clamp = (value, min, max, fallback) => Number.isFinite(Number(value))
  ? Math.max(min, Math.min(max, Number(value))) : fallback;
export function normalizeSettings(input = {}) {
  const divisions = [2, 3, 4, 6].includes(Number(input.divisions)) ? Number(input.divisions) : 4;
  return { meter: METERS.includes(input.meter) ? input.meter : '4/4', divisions,
    level: Math.round(clamp(input.level, 0, 4, 1)), space: Math.round(clamp(input.space, 0, 80, 20)),
    swing: divisions % 3 === 0 ? 50 : Math.round(clamp(input.swing, 50, 75, 50)),
    bars: [1, 2, 4, 8].includes(Number(input.bars)) ? Number(input.bars) : 2,
    seed: Number.isFinite(Number(input.seed)) ? Number(input.seed) >>> 0 : 12345 };
}
export function writtenValue(ticks, ratio = 1) {
  const normal = ticks / ratio;
  for (const value of [1, 2, 4, 8, 16, 32]) {
    const duration = TICKS * 4 / value;
    if (Math.abs(normal - duration) < 1e-7) return { value, dot: false };
    if (Math.abs(normal - duration * 1.5) < 1e-7) return { value, dot: true };
  }
  return null;
}
export function generateBar(input, index = 0) {
  const settings = normalizeSettings(input), info = meterInfo(settings.meter);
  const rng = random(settings.seed ^ Math.imul(index + 1, 0x9e3779b9));
  const notes = [];
  for (let beat = 0; beat < info.beats; beat++) {
    const base = info.pulse / settings.divisions;
    const ratio = settings.divisions % 3 === 0 && !writtenValue(base) ? 2 / 3 : 1;
    const candidates = settings.level === 0 ? [settings.divisions]
      : settings.level === 1 ? [settings.divisions, settings.divisions === 3 ? 1 : settings.divisions / 2]
      : settings.level === 2 ? [1, 2, settings.divisions] : [1, 1, 2, 3, settings.divisions];
    const cell = [];
    let remaining = settings.divisions;
    while (remaining) {
      const choices = candidates.filter((n) => Number.isInteger(n) && n <= remaining && writtenValue(n * base, ratio));
      const units = choices.length ? choices[Math.floor(rng() * choices.length)] : 1;
      const duration = units * base;
      const value = writtenValue(duration, ratio);
      cell.push({ ...value, ticks: duration, hand: rng() * 100 < settings.space ? null : 'R',
        accent: settings.level >= 3 && rng() < 0.18, tieIn: false, tieOut: false });
      remaining -= units;
    }
    cell.forEach((note) => {
      if (!note.hand) note.accent = false;
      if (ratio !== 1 && cell.length > 1) {
        note.tuplet = settings.divisions;
        note.tupletGroup = beat;
        note.ratio = ratio;
      } else if (ratio !== 1) Object.assign(note, writtenValue(note.ticks));
    });
    notes.push(...cell);
  }
  if (!notes.some((n) => n.hand)) notes[0].hand = 'R';
  let position = 0;
  notes.forEach((note, i) => {
    note.start = position;
    position += note.ticks;
    const next = notes[i + 1];
    // Ties preserve the written beat boundary, and suppress the second attack.
    if (settings.level >= 3 && next && position % info.pulse === 0
      && note.hand && next.hand && rng() < (settings.level === 4 ? 0.4 : 0.2)) {
      note.tieOut = true; next.tieIn = true; next.accent = false;
    }
  });
  return { meter: settings.meter, info, notes, index, settings };
}
export const generatePattern = (settings) => Array.from({ length: normalizeSettings(settings).bars }, (_, i) => generateBar(settings, i));
export function swingTick(tick, pulse, percent = 50) {
  const whole = Math.floor(tick / pulse), phase = tick / pulse - whole;
  const ratio = percent / 100;
  const swung = phase <= 0.5 ? phase * 2 * ratio : ratio + (phase - 0.5) * 2 * (1 - ratio);
  return (whole + swung) * pulse;
}
export function tempoAtBar(index, trainer, fallback) {
  if (!trainer) return fallback;
  const { start, target, step, every, mode } = trainer;
  const distance = Math.abs(target - start);
  if (!distance) return start;
  const stages = Math.ceil(distance / step);
  let stage = Math.floor(index / every);
  if (mode === 'alternate') {
    stage %= stages * 2;
    if (stage > stages) stage = stages * 2 - stage;
  }
  return start + Math.sign(target - start) * Math.min(distance, stage * step);
}
export function eventAudioTime(context, timestamp, now = performance.now()) {
  const stamp = context.getOutputTimestamp?.();
  const valid = stamp?.performanceTime > 0 && Number.isFinite(stamp.contextTime);
  return valid ? stamp.contextTime + (timestamp - stamp.performanceTime) / 1000
    : context.currentTime + (timestamp - now) / 1000 - (context.baseLatency || 0) - (context.outputLatency || 0);
}
export const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b), middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};

export class TapScorer {
  constructor() {
    this.targets = []; this.hits = 0; this.misses = 0; this.extras = 0;
    this.streak = 0; this.longest = 0; this.errorTotal = 0; this.missedBars = new Map();
  }
  add(target) { this.targets.push({ ...target, status: 'pending' }); }
  commit() {
    while (this.targets.length && this.targets[0].status !== 'pending') {
      const target = this.targets.shift();
      if (target.status === 'hit') {
        this.hits++; this.streak++; this.longest = Math.max(this.longest, this.streak);
        this.errorTotal += Math.abs(target.error);
      } else {
        this.misses++; this.streak = 0;
        if (this.missedBars.size < 32) this.missedBars.set(target.bar.index, target.bar);
      }
    }
  }
  expire(time) {
    this.targets.forEach((target) => {
      if (target.status === 'pending' && time > target.time + target.window + 0.06) target.status = 'miss';
    });
    this.commit();
  }
  tap(time) {
    let best;
    for (const target of this.targets) {
      if (target.status !== 'pending') continue;
      const distance = Math.abs(time - target.time);
      if (distance <= target.window && (!best || distance < Math.abs(time - best.time))) best = target;
    }
    if (!best) { this.extras++; return { hit: false }; }
    best.status = 'hit'; best.error = (time - best.time) * 1000;
    const result = { hit: true, error: best.error, id: best.id };
    this.commit(); return result;
  }
  finish(time) {
    this.targets = this.targets.filter((target) => target.time <= time || target.status === 'hit');
    this.targets.forEach((target) => { if (target.status === 'pending') target.status = 'miss'; });
    this.commit();
  }
  stats() {
    const total = this.hits + this.misses + this.extras;
    return { hits: this.hits, misses: this.misses, extras: this.extras, streak: this.streak,
      longest: this.longest, accuracy: total ? Math.round(this.hits / total * 100) : 0,
      average: this.hits ? Math.round(this.errorTotal / this.hits) : 0 };
  }
}
