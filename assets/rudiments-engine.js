// AudioContext time is the transport clock. Timers only fill the lookahead queue.
export const LOOKAHEAD = 0.12;
export const SCHEDULER_MS = 25;
export const TICKS_PER_BEAT = 96;

// Rational musical positions avoid float comparisons for tuplets. Click points
// exist independently of note onsets, including across rests and sustained notes.
export function compileTimeline(rudiment) {
  const points = new Map();
  let totalTicks = 0;
  rudiment.notes.forEach((note, index) => {
    points.set(totalTicks, { ticks: totalTicks, index });
    totalTicks += note.ticks ?? Math.round(note.beats * TICKS_PER_BEAT);
  });
  const barTicks = rudiment.meter[0] * TICKS_PER_BEAT * 4 / rudiment.meter[1];
  for (let ticks = 0; ticks < totalTicks; ticks += TICKS_PER_BEAT) {
    const point = points.get(ticks) || { ticks };
    points.set(ticks, { ...point, click: true, downbeat: ticks % barTicks === 0 });
  }
  return { points: [...points.values()].sort((a, b) => a.ticks - b.ticks), totalTicks };
}

export function graceGap(bpm) {
  // An expressive, unmeasured ornament, never an extra metrical subdivision.
  return Math.min(0.024, (60 / bpm) * 0.065);
}

export function strokeEvents(note, time, bpm, index) {
  if (!note.hand) return [];
  const gap = graceGap(bpm);
  if (note.buzz) {
    return [{ hand: note.hand, time, velocity: note.accent ? 1 : 0.62,
      key: `${index}:main`, buzz: true, duration: note.beats * 60 / bpm }];
  }
  return [
    ...note.grace.map((hand, i) => ({ hand, time: time - gap * (note.grace.length - i),
      velocity: 0.27, key: `${index}:g${i}` })),
    { hand: note.hand, time, velocity: note.accent ? 1 : 0.62, key: `${index}:main` },
  ];
}

export function rampTempo(start, target, increase, every, completed) {
  return Math.min(target, start + Math.floor(completed / every) * increase);
}

export class RudimentEngine {
  constructor(context, { visual, interrupted }) {
    this.context = context;
    this.visual = visual;
    this.interrupted = interrupted;
    this.sources = new Set();
    this.queue = [];
    this.master = context.createGain();
    this.master.gain.value = 0.7;
    this.master.connect(context.destination);
    this.noise = context.createBuffer(1, Math.ceil(context.sampleRate * 0.14), context.sampleRate);
    const data = this.noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    this.context.onstatechange = () => {
      if (this.running && context.state !== 'running') this.interrupted('Audio paused. Press Start to resume your practice.');
    };
  }

  start(rudiment, bpm, options) {
    this.stop();
    this.rudiment = rudiment;
    this.options = options;
    this.requestedBpm = bpm;
    this.bpm = options.ramp ? options.ramp.start : bpm;
    this.index = 0;
    this.completed = 0;
    const timeline = compileTimeline(rudiment);
    this.points = timeline.points;
    this.totalTicks = timeline.totalTicks;
    // Leave room for the very first ornament, including after every restart.
    this.nextTime = this.context.currentTime + 0.16;
    this.running = true;
    this.master.gain.setValueAtTime(options.volume, this.context.currentTime);
    this.tick();
    this.timer = setInterval(() => this.tick(), SCHEDULER_MS);
    this.frame = requestAnimationFrame(() => this.draw());
  }

  tick() {
    if (!this.running) return;
    while (this.nextTime - 0.048 < this.context.currentTime + LOOKAHEAD) {
      const point = this.points[this.index];
      if (this.index === 0 && this.options.ramp) {
        const r = this.options.ramp;
        this.bpm = rampTempo(r.start, r.target, r.increase, r.every, this.completed);
      } else if (!this.options.ramp) this.bpm = this.requestedBpm;
      const note = point.index === undefined ? null : this.rudiment.notes[point.index];
      const events = note ? strokeEvents(note, this.nextTime, this.bpm, point.index) : [];
      if ((events[0]?.time ?? this.nextTime) < this.context.currentTime) {
        // A throttled/background thread must not produce a burst of late hits.
        this.interrupted('Playback paused after a timing interruption. Press Start to continue.');
        return;
      }
      for (const event of events) {
        if (event.buzz) this.hitBuzz(event.time, event.hand, event.velocity, event.duration);
        else this.hit(event.time, event.hand, event.velocity);
        this.queue.push({ ...event, index: point.index, bpm: this.bpm, completed: this.completed });
      }
      if (note && !note.hand) this.queue.push({ time: this.nextTime, index: point.index,
        key: `${point.index}:main`, bpm: this.bpm, completed: this.completed });
      // Keep visual events ordered by the same clock as the audible events.
      this.queue.sort((a, b) => a.time - b.time);
      if (point.click && this.options.click()) this.click(this.nextTime, point.downbeat);
      const nextTicks = this.points[this.index + 1]?.ticks ?? this.totalTicks;
      this.nextTime += (60 / this.bpm) * (nextTicks - point.ticks) / TICKS_PER_BEAT;
      this.index++;
      if (this.index === this.points.length) {
        this.index = 0;
        this.completed++;
      }
    }
  }

  track(source, nodes, end) {
    this.sources.add(source);
    source.onended = () => {
      this.sources.delete(source);
      source.disconnect();
      nodes.forEach((node) => node.disconnect());
    };
    source.stop(end);
  }

  hit(time, hand, velocity) {
    const c = this.context;
    const pan = c.createStereoPanner();
    pan.pan.value = hand === 'R' ? 0.12 : -0.12;
    pan.connect(this.master);
    const noise = c.createBufferSource();
    noise.buffer = this.noise;
    const filter = c.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = hand === 'R' ? 1500 : 1350;
    const snap = c.createGain();
    snap.gain.setValueAtTime(velocity * 0.5, time);
    snap.gain.exponentialRampToValueAtTime(0.0001, time + 0.09);
    noise.connect(filter).connect(snap).connect(pan);
    const body = c.createOscillator();
    body.type = 'triangle';
    body.frequency.setValueAtTime(hand === 'R' ? 190 : 180, time);
    body.frequency.exponentialRampToValueAtTime(95, time + 0.055);
    const tone = c.createGain();
    tone.gain.setValueAtTime(velocity * 0.32, time);
    tone.gain.exponentialRampToValueAtTime(0.0001, time + 0.075);
    body.connect(tone).connect(pan);
    noise.start(time);
    body.start(time);
    this.track(noise, [filter, snap, pan], time + 0.11);
    this.track(body, [tone], time + 0.085);
  }

  hitBuzz(time, hand, velocity, duration) {
    // An uncounted, sustained press-roll texture. The Z-marked hand-change
    // pulse is measured; its dense rebounds are not presented as counted notes.
    const c = this.context;
    const length = duration + 0.008;
    const buffer = c.createBuffer(1, Math.ceil(c.sampleRate * length), c.sampleRate);
    const data = buffer.getChannelData(0);
    let phase = Math.random();
    for (let i = 0; i < data.length; i++) {
      const t = i / c.sampleRate;
      phase += (68 + 36 * t / length) / c.sampleRate;
      const bounce = 0.35 + 0.65 * Math.exp(-7 * (phase % 1));
      const envelope = Math.min(1, t / 0.003) * Math.min(1, (length - t) / 0.012);
      data[i] = (Math.random() * 2 - 1) * bounce * envelope;
    }
    const source = c.createBufferSource();
    source.buffer = buffer;
    const filter = c.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = hand === 'R' ? 1250 : 1150;
    const gain = c.createGain();
    gain.gain.value = velocity * 0.48;
    const pan = c.createStereoPanner();
    pan.pan.value = hand === 'R' ? 0.12 : -0.12;
    source.connect(filter).connect(gain).connect(pan).connect(this.master);
    source.start(time);
    this.track(source, [filter, gain, pan], time + length);
  }

  click(time, downbeat) {
    const source = this.context.createOscillator();
    const gain = this.context.createGain();
    source.frequency.value = downbeat ? 1400 : 1000;
    gain.gain.setValueAtTime(0.12, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.025);
    source.connect(gain).connect(this.master);
    source.start(time);
    this.track(source, [gain], time + 0.03);
  }

  draw() {
    if (!this.running) return;
    const stamp = this.context.getOutputTimestamp?.();
    const audibleTime = stamp?.performanceTime > 0
      ? stamp.contextTime + (performance.now() - stamp.performanceTime) / 1000
      : this.context.currentTime - (this.context.outputLatency || this.context.baseLatency || 0);
    let latest;
    while (this.queue.length && this.queue[0].time <= audibleTime) latest = this.queue.shift();
    if (latest) this.visual(latest);
    this.frame = requestAnimationFrame(() => this.draw());
  }

  stop() {
    this.running = false;
    clearInterval(this.timer);
    cancelAnimationFrame(this.frame);
    this.master.gain.cancelScheduledValues(this.context.currentTime);
    this.master.gain.setValueAtTime(0, this.context.currentTime);
    for (const source of this.sources) {
      try { source.stop(); } catch { /* An already-ended node needs no work. */ }
    }
    this.queue.length = 0;
  }

  dispose() {
    this.stop();
    this.context.onstatechange = null;
    this.master.disconnect();
    return this.context.close();
  }
}
