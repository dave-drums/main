// Both versions share one audio clock; switching changes gain, never playback position.
export class DrumComparison {
  constructor({ AudioContext, fetchAudio = (url, options) => globalThis.fetch(url, options), onChange = () => {} }) {
    this.AudioContext = AudioContext;
    this.fetchAudio = fetchAudio;
    this.onChange = onChange;
    this.version = 'raw';
    this.offset = 0;
    this.duration = 0;
    this.playing = false;
    this.sources = [];
    this.generation = 0;
    this.disposed = false;
  }

  async load(urls, signal) {
    if (!this.AudioContext) throw new Error('Audio comparison is not supported in this browser.');
    const bytes = await Promise.all(['raw', 'mixed'].map(async version => {
      const response = await this.fetchAudio(urls[version], { signal });
      if (!response.ok) throw new Error('Both audio samples could not be loaded. Please try again.');
      return response.arrayBuffer();
    }));
    if (this.disposed || signal?.aborted) return;
    this.context ||= new this.AudioContext();
    const decoded = await Promise.all(bytes.map(data => this.context.decodeAudioData(data)));
    if (this.disposed || signal?.aborted) return;
    if (!decoded.every(buffer => Number.isFinite(buffer.duration) && buffer.duration > 0)
        || Math.abs(decoded[0].duration - decoded[1].duration) > .1) {
      throw new Error('The raw and mixed samples need matching start points and lengths.');
    }
    this.buffers = { raw: decoded[0], mixed: decoded[1] };
    this.duration = Math.min(...decoded.map(buffer => buffer.duration));
    this.gains ||= Object.fromEntries(['raw', 'mixed'].map(version => {
      const gain = this.context.createGain();
      gain.connect(this.context.destination);
      gain.gain.value = version === this.version ? 1 : 0;
      return [version, gain];
    }));
    this.onChange();
  }

  get position() {
    return this.playing
      ? Math.min(this.duration, Math.max(this.offset, this.context.currentTime - this.startedAt))
      : this.offset;
  }

  setVersion(version) {
    if (!['raw', 'mixed'].includes(version)) return;
    this.version = version;
    if (this.gains) for (const [name, gain] of Object.entries(this.gains)) {
      const now = this.context.currentTime;
      // Retain the instantaneous gain even when someone switches repeatedly mid-fade.
      if (gain.gain.cancelAndHoldAtTime) gain.gain.cancelAndHoldAtTime(now);
      else { gain.gain.cancelScheduledValues(now); gain.gain.setValueAtTime(gain.gain.value, now); }
      gain.gain.linearRampToValueAtTime(name === version ? 1 : 0, now + .015);
    }
    this.onChange();
  }

  async play() {
    if (this.disposed || !this.buffers || this.playing) return;
    const generation = ++this.generation;
    await this.context.resume();
    if (this.disposed || generation !== this.generation) return;
    if (this.offset >= this.duration) this.offset = 0;
    const when = this.context.currentTime + .02;
    this.startedAt = when - this.offset;
    this.playing = true;
    this.sources = ['raw', 'mixed'].map(version => {
      const source = this.context.createBufferSource();
      source.buffer = this.buffers[version];
      source.connect(this.gains[version]);
      source.start(when, this.offset, this.duration - this.offset);
      return source;
    });
    this.sources[0].onended = () => {
      if (!this.playing || generation !== this.generation) return;
      this.offset = this.duration;
      this.playing = false;
      this.stopSources();
      this.onChange();
    };
    this.onChange();
  }

  stopSources() {
    for (const source of this.sources) {
      source.onended = null;
      try { source.stop(); } catch { /* A naturally ended source may already be stopped. */ }
      source.disconnect();
    }
    this.sources = [];
  }

  pause() {
    this.offset = this.position;
    this.playing = false;
    this.generation++;
    this.stopSources();
    this.onChange();
  }

  seek(seconds) {
    const resume = this.playing;
    this.pause();
    this.offset = Math.max(0, Math.min(this.duration, Number(seconds) || 0));
    this.onChange();
    return resume ? this.play() : Promise.resolve();
  }

  dispose() {
    this.pause();
    this.disposed = true;
    this.buffers = undefined;
    Object.values(this.gains || {}).forEach(gain => gain.disconnect());
    return this.context?.close();
  }
}

function mountComparison(section) {
  const doc = section.ownerDocument;
  const view = doc.defaultView;
  const play = section.querySelector('[data-compare-play]');
  const playLabel = play.querySelector('span');
  const playIcon = play.querySelector('use');
  const seek = section.querySelector('[data-compare-seek]');
  const elapsed = section.querySelector('[data-compare-elapsed]');
  const total = section.querySelector('[data-compare-duration]');
  const status = section.querySelector('[data-compare-status]');
  const caption = section.querySelector('[data-compare-description]');
  const canvas = section.querySelector('canvas');
  const choices = [...section.querySelectorAll('[data-compare-version]')];
  const abort = new view.AbortController();
  const time = seconds => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
  let loading;
  let failed = false;
  let frame;
  let peaks;
  let scrub;
  const engine = new DrumComparison({ AudioContext: view.AudioContext || view.webkitAudioContext, onChange: render });

  function draw() {
    const ctx = canvas.getContext('2d');
    const width = canvas.clientWidth;
    if (!ctx || !width || !peaks) return;
    const height = 80;
    const scale = view.devicePixelRatio || 1;
    if (canvas.width !== Math.round(width * scale) || canvas.height !== height * scale) {
      canvas.width = Math.round(width * scale);
      canvas.height = height * scale;
    }
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.clearRect(0, 0, width, height);
    const colors = view.getComputedStyle(section);
    const progress = engine.duration ? engine.position / engine.duration : 0;
    const samples = peaks[engine.version];
    samples.forEach((peak, index) => {
      const bar = Math.max(3, Math.sqrt(peak) * 72);
      ctx.fillStyle = index / samples.length < progress ? colors.getPropertyValue('--link-color') : colors.getPropertyValue('--line');
      ctx.fillRect(index * width / samples.length, (height - bar) / 2, Math.max(1, width / samples.length - 2), bar);
    });
    ctx.fillStyle = colors.getPropertyValue('--link-color');
    ctx.fillRect(Math.min(width - 2, progress * width), 0, 2, height);
  }

  function render() {
    view.cancelAnimationFrame(frame);
    play.disabled = !engine.buffers && !failed;
    seek.disabled = !engine.buffers;
    seek.max = String(engine.duration || 1);
    seek.value = String(engine.position);
    seek.setAttribute('aria-valuetext', `${time(engine.position)} of ${time(engine.duration)}`);
    elapsed.textContent = time(engine.position);
    total.textContent = time(engine.duration);
    playLabel.textContent = failed ? 'Try again' : engine.playing ? 'Pause' : 'Play';
    play.setAttribute('aria-label', engine.playing ? 'Pause drum comparison' : `Play ${engine.version} drums`);
    playIcon.setAttribute('href', `/assets/icons.svg#${engine.playing ? 'pause' : 'play'}`);
    choices.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.compareVersion === engine.version)));
    caption.textContent = engine.version === 'raw'
      ? 'Unprocessed drums recorded straight from the microphones, ready to shape in your own mix. Hear the natural sound of the kit and room before any added processing.'
      : 'Mixed and processed drums, ready to drop into a track with other instruments. Reverb and ambience are designed to blend with the music in a full mix.';
    draw();
    if (engine.playing) frame = view.requestAnimationFrame(render);
  }

  async function preload() {
    if (loading) return loading;
    failed = false;
    status.textContent = 'Loading both versions…';
    section.setAttribute('aria-busy', 'true');
    loading = engine.load({ raw: section.dataset.audioRaw, mixed: section.dataset.audioMixed }, abort.signal).then(() => {
      if (!engine.buffers) return;
      peaks = Object.fromEntries(Object.entries(engine.buffers).map(([version, buffer]) => {
        const data = buffer.getChannelData(0);
        const bins = Array.from({ length: 96 }, (_, index) => {
          let peak = 0;
          const start = Math.floor(index * data.length / 96), end = Math.floor((index + 1) * data.length / 96);
          for (let i = start; i < end; i += 4) peak = Math.max(peak, Math.abs(data[i]));
          return peak;
        });
        return [version, bins];
      }));
      status.textContent = '';
    }).catch(error => {
      if (abort.signal.aborted) return;
      failed = true;
      loading = undefined;
      status.textContent = error.message || 'The samples could not be loaded. Please try again.';
    }).finally(() => {
      section.setAttribute('aria-busy', 'false');
      render();
    });
    render();
    return loading;
  }

  choices.forEach(button => button.addEventListener('click', () => engine.setVersion(button.dataset.compareVersion)));
  play.addEventListener('click', async () => {
    if (engine.playing) { engine.pause(); return; }
    await preload();
    if (!engine.buffers) return;
    try { await engine.play(); }
    catch { status.textContent = 'Playback could not start. Press Play to try again.'; }
  });
  const seekTo = seconds => engine.seek(seconds).catch(() => { status.textContent = 'Press Play to resume playback.'; });
  seek.addEventListener('input', () => seekTo(seek.value));
  seek.addEventListener('keydown', event => {
    if (!engine.buffers || event.altKey || event.ctrlKey || event.metaKey) return;
    const step = event.shiftKey ? 5 : 1;
    const targets = { ArrowLeft: engine.position - step, ArrowDown: engine.position - step,
      ArrowRight: engine.position + step, ArrowUp: engine.position + step,
      PageDown: engine.position - 5, PageUp: engine.position + 5, Home: 0, End: engine.duration };
    if (!(event.key in targets)) return;
    event.preventDefault();
    seekTo(targets[event.key]);
  });
  seek.addEventListener('pointerdown', event => {
    if (!engine.buffers || seek.disabled || (event.pointerType === 'mouse' && event.button !== 0)) return;
    scrub = { pointerId: event.pointerId, resume: engine.playing };
    engine.pause();
    seek.setPointerCapture?.(event.pointerId);
  });
  const finishScrub = event => {
    if (!scrub || event.pointerId !== scrub.pointerId) return;
    const resume = scrub.resume;
    scrub = undefined;
    if (resume) engine.play().catch(() => { status.textContent = 'Press Play to resume playback.'; });
  };
  seek.addEventListener('lostpointercapture', finishScrub);
  doc.addEventListener('pointerup', finishScrub);
  doc.addEventListener('pointercancel', finishScrub);
  if ('ResizeObserver' in view) new view.ResizeObserver(draw).observe(canvas);
  if ('IntersectionObserver' in view) {
    const observer = new view.IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      observer.disconnect();
      preload();
    }, { rootMargin: '300px' });
    observer.observe(section);
  } else preload();
  view.addEventListener('pagehide', event => {
    scrub = undefined;
    engine.pause();
    view.cancelAnimationFrame(frame);
    if (!event.persisted) { abort.abort(); engine.dispose(); }
  });
}

if (typeof document !== 'undefined') document.querySelectorAll('[data-drum-comparison]').forEach(mountComparison);
