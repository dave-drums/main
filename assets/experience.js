// Motion and a small playable instrument for the editorial pages. No app dependencies.
(() => {
  "use strict";

  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
  const canAnimate = typeof Element.prototype.animate === "function";

  // Continuous reading progress and gentle depth on the homepage photograph.
  const header = document.querySelector(".site-header");
  const stage = document.querySelector(".performance-stage");
  const photo = stage?.querySelector(".hero-media");
  const svgNamespace = "http://www.w3.org/2000/svg";
  const progress = document.createElementNS(svgNamespace, "svg");
  progress.setAttribute("class", "site-progress");
  progress.setAttribute("aria-hidden", "true");
  progress.setAttribute("focusable", "false");
  const progressLine = document.createElementNS(svgNamespace, "line");
  progressLine.setAttribute("x1", "0");
  progressLine.setAttribute("y1", "4");
  progressLine.setAttribute("y2", "4");
  const progressDot = document.createElementNS(svgNamespace, "circle");
  progressDot.setAttribute("cy", "4");
  progressDot.setAttribute("r", "3");
  progress.append(progressLine, progressDot);
  header?.append(progress);
  let frame = 0;
  let imageMotion;
  let pointerX = 0;
  let pointerY = 0;
  let imageX = 0;
  let imageY = 0;
  let visible = !document.hidden;

  const update = () => {
    frame = 0;
    const range = document.documentElement.scrollHeight - innerHeight;
    const complete = range > 0 ? Math.min(1, Math.max(0, scrollY / range)) : 0;
    const width = header?.clientWidth || innerWidth;
    const position = Math.min(width - 3, Math.max(3, complete * width)).toFixed(2);
    progressLine.setAttribute("x2", position);
    progressDot.setAttribute("cx", position);
    if (!photo || !canAnimate || !visible || reducedMotion.matches || !finePointer.matches) return;
    const bounds = stage.getBoundingClientRect();
    if (bounds.bottom < 0 || bounds.top > innerHeight) return;
    const x = pointerX * -7;
    const y = pointerY * -5 + Math.max(-1, Math.min(1, -bounds.top / innerHeight)) * 12;
    imageX += (x - imageX) * .14;
    imageY += (y - imageY) * .14;
    const transform = `translate3d(${imageX.toFixed(2)}px,${imageY.toFixed(2)}px,0) scale(1.035)`;
    if (!imageMotion) {
      imageMotion = photo.animate([{ transform }, { transform }], { duration: 1, fill: "both" });
      imageMotion.pause();
    } else {
      imageMotion.effect.setKeyframes([{ transform }, { transform }]);
    }
    if (Math.abs(x - imageX) + Math.abs(y - imageY) > .05) requestUpdate();
  };
  const requestUpdate = () => {
    if (!frame && visible) frame = requestAnimationFrame(update);
  };
  const resetDepth = () => {
    imageMotion?.cancel();
    imageMotion = undefined;
    pointerX = pointerY = imageX = imageY = 0;
    requestUpdate();
  };
  stage?.addEventListener("pointermove", event => {
    if (!finePointer.matches || reducedMotion.matches || event.target.closest(".hero-rhythm")) return;
    const bounds = stage.getBoundingClientRect();
    pointerX = (event.clientX - bounds.left) / bounds.width * 2 - 1;
    pointerY = (event.clientY - bounds.top) / bounds.height * 2 - 1;
    requestUpdate();
  }, { passive: true });
  stage?.addEventListener("pointerleave", () => {
    pointerX = pointerY = 0;
    requestUpdate();
  });
  addEventListener("scroll", requestUpdate, { passive: true });
  addEventListener("resize", requestUpdate);
  addEventListener("load", requestUpdate);
  if ("ResizeObserver" in window) new ResizeObserver(requestUpdate).observe(document.body);
  reducedMotion.addEventListener("change", resetDepth);
  finePointer.addEventListener("change", resetDepth);
  const entranceAnimations = [];
  if (canAnimate && !reducedMotion.matches && stage) {
    stage.querySelectorAll(".hero-copy h1,.hero-role").forEach((element, index) => {
      entranceAnimations.push(element.animate([
        { opacity: 0, transform: "translateY(18px)" },
        { opacity: 1, transform: "none" }
      ], { duration: 720, delay: index * 100, easing: "cubic-bezier(.22,1,.36,1)", fill: "backwards" }));
    });
  }
  reducedMotion.addEventListener("change", () => {
    if (reducedMotion.matches) entranceAnimations.forEach(animation => animation.cancel());
  });
  document.addEventListener("visibilitychange", () => {
    visible = !document.hidden;
    if (!visible) {
      cancelAnimationFrame(frame);
      frame = 0;
    } else requestUpdate();
  });
  requestUpdate();

  // Light follows the pointer inside selected surfaces; text and layout stay fixed.
  const clearLights = [];
  if (canAnimate) {
    document.querySelectorAll(".service-path,.hero-tool,.track-card,.recording-preview-item,.feature-card").forEach(card => {
      let light;
      let animation;
      let pending = 0;
      let bounds;
      let point;
      const clear = () => {
        cancelAnimationFrame(pending);
        pending = 0;
        animation?.cancel();
        animation = undefined;
        card.classList.remove("is-pointer-inside");
      };
      const draw = () => {
        pending = 0;
        const transform = `translate(${Math.round(point.x - bounds.left - 180)}px,${Math.round(point.y - bounds.top - 180)}px)`;
        if (!animation) {
          animation = light.animate([{ transform }, { transform }], { duration: 1, fill: "both" });
          animation.pause();
        } else animation.effect.setKeyframes([{ transform }, { transform }]);
      };
      card.addEventListener("pointerenter", () => {
        if (!finePointer.matches || reducedMotion.matches) return;
        if (!light) {
          light = document.createElement("span");
          light.className = "surface-light";
          light.setAttribute("aria-hidden", "true");
          card.append(light);
          card.classList.add("motion-surface");
        }
        bounds = card.getBoundingClientRect();
        card.classList.add("is-pointer-inside");
      });
      card.addEventListener("pointermove", event => {
        if (!card.classList.contains("is-pointer-inside")) return;
        point = { x: event.clientX, y: event.clientY };
        if (!pending) pending = requestAnimationFrame(draw);
      }, { passive: true });
      card.addEventListener("pointerleave", clear);
      card.addEventListener("pointercancel", clear);
      clearLights.push(clear);
    });
  }
  const clearSurfaceMotion = () => clearLights.forEach(clear => clear());
  reducedMotion.addEventListener("change", clearSurfaceMotion);
  finePointer.addEventListener("change", clearSurfaceMotion);
  addEventListener("resize", clearSurfaceMotion);
  addEventListener("pagehide", () => {
    visible = false;
    cancelAnimationFrame(frame);
    frame = 0;
    resetDepth();
    clearSurfaceMotion();
    entranceAnimations.forEach(animation => animation.cancel());
  });
  addEventListener("pageshow", () => {
    visible = !document.hidden;
    requestUpdate();
  });

  // All sound starts with a deliberate pad, key or demo press. The voices are synthesized locally.
  const instrument = document.querySelector("[data-rhythm]");
  const Audio = window.AudioContext || window.webkitAudioContext;
  if (!instrument || !Audio) return;
  const trigger = instrument.querySelector(".rhythm-trigger");
  const panel = instrument.querySelector(".rhythm-panel");
  const pads = [...instrument.querySelectorAll("[data-pad]")];
  const demo = instrument.querySelector(".rhythm-demo");
  const feedback = instrument.querySelector(".rhythm-feedback");
  const timers = new Set();
  const flashes = new Map();
  const voices = new Set();
  let context;
  let master;
  let compressor;
  let noise;
  let panelAnimation;
  let playing = false;
  let generation = 0;

  const schedule = (callback, delay) => {
    const timer = setTimeout(() => { timers.delete(timer); callback(); }, delay);
    timers.add(timer);
    return timer;
  };
  const prepareAudio = async () => {
    if (!context || context.state === "closed") {
      context = new Audio({ latencyHint: "interactive" });
      master = context.createGain();
      master.gain.value = .28;
      compressor = context.createDynamicsCompressor();
      compressor.threshold.value = -18;
      compressor.ratio.value = 4;
      master.connect(compressor);
      compressor.connect(context.destination);
      noise = context.createBuffer(1, Math.ceil(context.sampleRate * .5), context.sampleRate);
      const channel = noise.getChannelData(0);
      for (let i = 0; i < channel.length; i++) channel[i] = Math.random() * 2 - 1;
    }
    if (context.state !== "running") await context.resume();
  };
  const envelope = (time, level, length) => {
    const gain = context.createGain();
    gain.gain.setValueAtTime(.0001, time);
    gain.gain.exponentialRampToValueAtTime(level, time + .003);
    gain.gain.exponentialRampToValueAtTime(.0001, time + length);
    gain.connect(master);
    return gain;
  };
  const startVoice = (source, time, length, nodes) => {
    voices.add(source);
    source.onended = () => {
      voices.delete(source);
      source.disconnect();
      nodes.forEach(node => node.disconnect());
    };
    source.start(time);
    source.stop(time + length + .02);
  };
  const tone = (time, from, to, length, level, type = "sine") => {
    const source = context.createOscillator();
    source.type = type;
    source.frequency.setValueAtTime(from, time);
    source.frequency.exponentialRampToValueAtTime(to, time + length * .65);
    const gain = envelope(time, level, length);
    source.connect(gain);
    startVoice(source, time, length, [gain]);
  };
  const noiseHit = (time, frequency, length, level) => {
    const source = context.createBufferSource();
    source.buffer = noise;
    const filter = context.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = frequency;
    const gain = envelope(time, level, length);
    source.connect(filter);
    filter.connect(gain);
    startVoice(source, time, length, [filter, gain]);
  };
  const hit = (name, time) => {
    if (name === "kick") tone(time, 145, 43, .36, .95);
    if (name === "snare") {
      tone(time, 185, 110, .12, .45, "triangle");
      noiseHit(time, 1400, .16, .75);
    }
    if (name === "hat") noiseHit(time, 7600, .055, .3);
  };
  const flash = name => {
    const pad = pads.find(button => button.dataset.pad === name);
    const prior = flashes.get(pad);
    if (prior) { clearTimeout(prior); timers.delete(prior); }
    pad.classList.add("is-hit");
    flashes.set(pad, schedule(() => { pad.classList.remove("is-hit"); flashes.delete(pad); }, 120));
  };
  const stopDemo = () => {
    generation++;
    playing = false;
    timers.forEach(clearTimeout);
    timers.clear();
    flashes.clear();
    pads.forEach(pad => pad.classList.remove("is-hit"));
    for (const source of voices) {
      try { source.stop(); } catch { /* A completed voice may be awaiting its ended event. */ }
    }
    demo.setAttribute("aria-pressed", "false");
    demo.firstChild.textContent = "Hear a groove ";
    demo.querySelector("use").setAttribute("href", "/assets/icons.svg#play");
  };
  const releaseAudio = () => {
    stopDemo();
    if (context) {
      master.disconnect();
      compressor.disconnect();
      const closing = context;
      context = undefined;
      closing.close().catch(() => {});
    }
  };
  const setOpen = (open, returnFocus = false) => {
    panelAnimation?.cancel();
    panelAnimation = undefined;
    trigger.setAttribute("aria-expanded", String(open));
    panel.hidden = !open;
    if (open) {
      feedback.textContent = "";
      if (canAnimate && !reducedMotion.matches) panelAnimation = panel.animate([
        { opacity: 0, transform: "translateY(-8px)" },
        { opacity: 1, transform: "none" }
      ], { duration: 260, easing: "cubic-bezier(.22,1,.36,1)" });
    } else releaseAudio();
    if (returnFocus) trigger.focus({ preventScroll: true });
  };
  const playPad = async name => {
    const token = generation;
    try {
      await prepareAudio();
      if (panel.hidden || token !== generation || document.hidden) return;
      feedback.textContent = "";
      hit(name, context.currentTime + .005);
      flash(name);
    } catch {
      feedback.textContent = "Sound couldn’t start. Try tapping a pad again.";
    }
  };
  trigger.addEventListener("click", () => setOpen(panel.hidden));
  pads.forEach(pad => {
    pad.addEventListener("click", () => playPad(pad.dataset.pad));
  });
  instrument.addEventListener("keydown", event => {
    if (event.key === "Escape" && !panel.hidden) {
      event.preventDefault();
      setOpen(false, true);
      return;
    }
    if (panel.hidden || event.ctrlKey || event.altKey || event.metaKey || event.repeat) return;
    const index = ["1", "2", "3"].indexOf(event.key);
    if (index < 0) return;
    event.preventDefault();
    playPad(pads[index].dataset.pad);
  });
  demo.addEventListener("click", async () => {
    if (playing) { stopDemo(); return; }
    playing = true;
    const token = ++generation;
    demo.setAttribute("aria-pressed", "true");
    demo.firstChild.textContent = "Stop groove ";
    demo.querySelector("use").setAttribute("href", "/assets/icons.svg#stop");
    try {
      await prepareAudio();
      if (!playing || token !== generation || panel.hidden || document.hidden) return;
      feedback.textContent = "";
      const start = context.currentTime + .035;
      const stepLength = 60 / 96 / 2;
      for (let step = 0; step < 16; step++) {
        const sounds = ["hat"];
        if (step % 4 === 0 || step === 11) sounds.push("kick");
        if (step % 4 === 2) sounds.push("snare");
        sounds.forEach(name => {
          hit(name, start + step * stepLength);
          if (!reducedMotion.matches) schedule(() => {
            if (!reducedMotion.matches) flash(name);
          }, 35 + step * stepLength * 1000);
        });
      }
      schedule(stopDemo, (16 * stepLength + .4) * 1000);
    } catch {
      stopDemo();
      feedback.textContent = "Sound couldn’t start. Try tapping a pad again.";
    }
  });
  document.addEventListener("pointerdown", event => {
    if (!panel.hidden && !instrument.contains(event.target)) setOpen(false);
  }, { passive: true });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) releaseAudio();
  });
  reducedMotion.addEventListener("change", () => {
    if (reducedMotion.matches) panelAnimation?.cancel();
  });
  addEventListener("pagehide", () => {
    panelAnimation?.cancel();
    releaseAudio();
  });
  instrument.hidden = false;
})();
