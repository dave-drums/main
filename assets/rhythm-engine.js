import { RudimentEngine } from './rudiments-engine.js';
import { generateBar, swingTick, tempoAtBar, eventAudioTime } from './rhythm-core.js';

// Reuse the site's synthesised percussion and source cleanup, with an original
// bar transport supporting reading, ties, swing, independent click and scoring.
export class RhythmEngine extends RudimentEngine {
  constructor(context, callbacks) {
    super(context, callbacks);
    this.callbacks = callbacks;
  }
  barAt(index) {
    if (this.options.mode !== 'read') return this.options.pattern[index % this.options.pattern.length];
    if (!this.cache.has(index)) this.cache.set(index, generateBar(this.options.settings, index));
    return this.cache.get(index);
  }
  prepareBar() {
    const bar = this.barAt(this.barIndex), points = new Map();
    bar.notes.forEach((note, index) => points.set(note.start, { tick: note.start, index }));
    const division = this.options.clickDivision;
    for (let beat = 0; beat < bar.info.beats; beat++) {
      for (let sub = 0; sub < division; sub++) {
        const tick = (beat + sub / division) * bar.info.pulse;
        points.set(tick, { ...(points.get(tick) || { tick }), beat, sub });
      }
    }
    // The first bar event is present even when it starts with a rest.
    points.set(0, { ...(points.get(0) || { tick: 0 }), first: true });
    this.points = [...points.values()].sort((a, b) => a.tick - b.tick);
    this.pointIndex = 0;
    this.bar = bar;
    this.bpm = tempoAtBar(this.barIndex, this.options.trainer, this.requestedBpm);
    for (const index of this.cache.keys()) if (index < this.barIndex - 4) this.cache.delete(index);
  }
  start(options) {
    this.stop();
    this.options = options;
    this.cache = new Map();
    this.barIndex = 0;
    this.requestedBpm = options.bpm;
    this.bpm = options.trainer?.start || options.bpm;
    this.count = 0;
    this.countTotal = options.countIn * options.pattern[0].info.beats;
    this.nextTime = this.context.currentTime + 0.16;
    this.startedAt = null;
    this.endsAt = Infinity;
    this.calibrationTargets = [];
    this.prepareBar();
    this.running = true;
    this.master.gain.setValueAtTime(0.8, this.context.currentTime);
    this.tick();
    this.timer = setInterval(() => this.tick(), 25);
    this.frame = requestAnimationFrame(() => this.draw());
  }
  tick() {
    if (!this.running) return;
    const now = this.context.currentTime;
    this.options.scorer?.expire(eventAudioTime(this.context, performance.now()));
    this.calibrationTargets = this.calibrationTargets.filter((target) => target.time > now - 2);
    if (now >= this.endsAt) { this.callbacks.finished(); return; }
    while (this.nextTime < now + 0.12) {
      if (!this.options.trainer) this.bpm = this.requestedBpm;
      if (this.nextTime < now) {
        this.interrupted('Playback paused after a timing interruption. Press Start to try again.'); return;
      }
      if (this.count < this.countTotal) {
        this.tone(this.nextTime, this.count % this.bar.info.beats === 0 ? 1400 : 1000, 0.03, 0.12);
        this.queue.push({ time: this.nextTime, kind: 'count', count: this.count + 1, total: this.countTotal });
        this.nextTime += 60 / this.bpm;
        this.count++;
        continue;
      }
      if (this.startedAt === null) {
        this.startedAt = this.nextTime;
        this.endsAt = this.options.seconds ? this.startedAt + this.options.seconds : Infinity;
      }
      if (this.nextTime >= this.endsAt) break;
      const point = this.points[this.pointIndex], bar = this.bar;
      const gap = this.options.gap;
      const silent = gap && this.barIndex % (gap.on + gap.off) >= gap.on;
      if (point.first) this.queue.push({ time: this.nextTime, kind: 'bar', serial: this.barIndex,
        bpm: this.bpm, bar, silent });
      if (point.index !== undefined) {
        const note = bar.notes[point.index];
        const id = `${this.barIndex}:${point.index}`;
        if (note.hand && !note.tieIn) {
          if (this.options.mode === 'play') this.options.scorer.add({ id, time: this.nextTime, bar,
            window: Math.min(0.085, 60 / this.bpm / this.options.settings.divisions * 0.43) });
          if (this.options.guide() && this.options.mode !== 'calibrate') {
            this.playNote(this.nextTime, note.accent ? 1 : 0.65);
          }
        }
        this.queue.push({ time: this.nextTime, kind: 'note', id, note, serial: this.barIndex });
      }
      if (point.beat !== undefined) {
        const state = this.options.beats()[point.beat] ?? (point.beat ? 1 : 2);
        if (this.options.mode === 'calibrate' && !point.sub) {
          this.calibrationTargets.push({ time: this.nextTime, used: false });
          this.tone(this.nextTime, point.beat ? 1000 : 1400, 0.03, 0.12);
        } else if (!silent && state && this.options.click()) {
          this.tone(this.nextTime, point.sub ? 650 : state === 2 ? 1400 : 1000, 0.03,
            this.options.clickVolume() * (point.sub ? 0.065 : 0.12));
        }
      }
      const next = this.points[this.pointIndex + 1]?.tick ?? bar.info.total;
      const warp = (tick) => swingTick(tick, bar.info.pulse, this.options.settings.swing);
      this.nextTime += (warp(next) - warp(point.tick)) / bar.info.pulse * 60 / this.bpm;
      this.pointIndex++;
      if (this.pointIndex === this.points.length) { this.barIndex++; this.prepareBar(); }
    }
  }
  tone(time, frequency, length, volume) {
    if (volume <= 0) return;
    const source = this.context.createOscillator(), gain = this.context.createGain();
    source.type = 'sine'; source.frequency.value = frequency;
    gain.gain.setValueAtTime(Math.max(0.0001, volume), time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + length);
    source.connect(gain).connect(this.master); source.start(time);
    this.track(source, [gain], time + length + 0.005);
  }
  playNote(time, velocity) {
    const volume = this.options.rhythmVolume();
    if (volume <= 0) return;
    if (this.options.sound === 'pad') this.hit(time, 'R', velocity * volume);
    else this.tone(time, this.options.sound === 'wood' ? 720 : 440,
      this.options.sound === 'wood' ? 0.035 : 0.08, velocity * volume * 0.28);
  }
  draw() {
    if (!this.running) return;
    const stamp = this.context.getOutputTimestamp?.();
    const audible = stamp?.performanceTime > 0
      ? stamp.contextTime + (performance.now() - stamp.performanceTime) / 1000
      : this.context.currentTime - (this.context.baseLatency || 0) - (this.context.outputLatency || 0);
    while (this.queue.length && this.queue[0].time <= audible) this.visual(this.queue.shift());
    this.callbacks.progress(Math.max(0, this.startedAt === null ? 0 : audible - this.startedAt));
    this.frame = requestAnimationFrame(() => this.draw());
  }
}
