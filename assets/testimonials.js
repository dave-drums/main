(() => {
  "use strict";

  document.querySelectorAll("[data-testimonials]").forEach((section) => {
    const rail = section?.querySelector(".testimonial-list");
    const controls = section?.querySelector(".testimonial-controls");
    const previous = section?.querySelector("[data-review-previous]");
    const next = section?.querySelector("[data-review-next]");
    if (!rail || !controls || !previous || !next || !rail.scrollTo) return;

    const cards = [...rail.children];
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let timer;
    let direction = 1;
    let hovered = false;
    let focused = false;
    let interacting = false;
    let inView = !("IntersectionObserver" in window);

    const stop = () => {
      window.clearTimeout(timer);
      timer = undefined;
    };
    const stops = () => {
      const maximum = Math.max(0, rail.scrollWidth - rail.clientWidth);
      return [...new Set([0, ...cards.map((card) =>
        Math.min(maximum, card.offsetLeft - cards[0].offsetLeft)), maximum])];
    };
    const target = (step) => step > 0
      ? stops().find((point) => point > rail.scrollLeft + 2)
      : stops().reverse().find((point) => point < rail.scrollLeft - 2);
    const updateControls = () => {
      previous.disabled = target(-1) === undefined;
      next.disabled = target(1) === undefined;
    };
    const advance = (step) => {
      const left = target(step);
      if (left === undefined) return false;
      rail.scrollTo({ left, behavior: motion.matches ? "auto" : "smooth" });
      return true;
    };
    const schedule = () => {
      stop();
      if (motion.matches || hovered || focused || interacting || !inView || document.hidden
          || rail.scrollWidth <= rail.clientWidth + 2) return;
      timer = window.setTimeout(() => {
        // Reverse at each end without jumping back or duplicating reviews.
        if (!advance(direction)) {
          direction *= -1;
          advance(direction);
        }
        schedule();
      }, 10000);
    };

    previous.addEventListener("click", () => { advance(-1); schedule(); });
    next.addEventListener("click", () => { advance(1); schedule(); });
    section.addEventListener("pointerenter", (event) => {
      if (event.pointerType === "touch") return;
      hovered = true;
      stop();
    });
    section.addEventListener("pointerleave", () => { hovered = false; schedule(); });
    section.addEventListener("focusin", () => { focused = true; stop(); });
    section.addEventListener("focusout", () => {
      queueMicrotask(() => {
        focused = section.contains(document.activeElement);
        schedule();
      });
    });
    rail.addEventListener("pointerdown", () => { interacting = true; stop(); });
    const endInteraction = () => {
      if (!interacting) return;
      interacting = false;
      schedule();
    };
    window.addEventListener("pointerup", endInteraction);
    window.addEventListener("pointercancel", endInteraction);
    rail.addEventListener("wheel", schedule, { passive: true });
    rail.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        advance(event.key === "ArrowLeft" ? -1 : 1);
      } else if (event.key === "Home" || event.key === "End") {
        event.preventDefault();
        rail.scrollTo({ left: event.key === "Home" ? 0 : rail.scrollWidth, behavior: "auto" });
      }
    });
    rail.addEventListener("scroll", () => { updateControls(); schedule(); }, { passive: true });
    window.addEventListener("resize", () => { updateControls(); schedule(); });
    document.addEventListener("visibilitychange", schedule);
    motion.addEventListener("change", schedule);
    if ("IntersectionObserver" in window) {
      new window.IntersectionObserver((entries) => {
        inView = entries.some((entry) => entry.isIntersecting);
        schedule();
      }, { threshold: .15 }).observe(section);
    }

    controls.hidden = false;
    updateControls();
    schedule();
  });
})();
