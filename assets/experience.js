// Reading progress and visual motion for the editorial pages. No app dependencies.
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
    if (!finePointer.matches || reducedMotion.matches) return;
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
        { transform: "translateY(18px)" },
        { transform: "none" }
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
})();
