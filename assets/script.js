(() => {
  "use strict";

  const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");

  // Count experience figures once on arrival, keeping their final values accessible.
  const counters = [...document.querySelectorAll(".stat-counter[data-count-to]")];
  if (counters.length && "IntersectionObserver" in window) {
    const states = counters.map((element) => ({
      element,
      target: Number(element.dataset.countTo),
      frame: 0,
    })).filter((state) => Number.isFinite(state.target) && state.target >= 0);
    const finish = (state) => {
      cancelAnimationFrame(state.frame);
      state.frame = 0;
      state.element.textContent = String(state.target);
    };
    const count = (state) => {
      if (motionPreference.matches) return;
      // Screen readers retain the actual figure throughout the visual count.
      const accessibleValue = document.createElement("span");
      accessibleValue.className = "visually-hidden";
      accessibleValue.textContent = String(state.target);
      state.element.before(accessibleValue);
      state.element.setAttribute("aria-hidden", "true");
      state.element.textContent = "0";
      let start;
      const tick = (time) => {
        start ??= time;
        const progress = Math.min((time - start) / 4200, 1);
        const eased = 1 - (1 - progress) ** 2;
        state.element.textContent = String(Math.floor(state.target * eased));
        if (progress < 1) state.frame = requestAnimationFrame(tick);
        else finish(state);
      };
      state.frame = requestAnimationFrame(tick);
    };
    const statesByElement = new Map(states.map((state) => [state.element, state]));
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting || entry.intersectionRatio < .5) return;
        counterObserver.unobserve(entry.target);
        count(statesByElement.get(entry.target));
      });
    }, { threshold: .5, rootMargin: "0px 0px -32px 0px" });
    if (!motionPreference.matches) {
      states.forEach((state) => counterObserver.observe(state.element));
    }
    motionPreference.addEventListener("change", () => {
      if (!motionPreference.matches) return;
      counterObserver.disconnect();
      states.forEach(finish);
    });
  }

  // Reveal visual groups once; paragraphs and form fields remain immediately readable.
  if ("IntersectionObserver" in window && "animate" in Element.prototype) {
    const activeAnimations = new Set();
    const easing =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--ease-out")
        .trim() || "ease-out";
    const delays = new WeakMap();
    const animate = (element, keyframes, options) => {
      const animation = element.animate(keyframes, { easing, ...options });
      activeAnimations.add(animation);
      const clear = () => activeAnimations.delete(animation);
      animation.finished.then(clear, clear);
    };
    document
      .querySelectorAll(".service-list, .tracks, .feature-grid, .benefit-grid")
      .forEach((group) => {
        [...group.children].forEach((element, index) => {
          delays.set(element, Math.min(index, 5) * 55);
        });
      });
    const reveal = (element, withMotion = true) => {
      observer.unobserve(element);
      element.classList.remove("is-reveal-pending");
      element.classList.add("is-revealed");
      if (withMotion && !motionPreference.matches) {
        animate(
          element,
          [
            { opacity: 0, transform: "translate3d(0, 16px, 0)" },
            { opacity: 1, transform: "none" },
          ],
          { duration: 650, delay: delays.get(element) || 0, fill: "backwards" },
        );
      }
    };
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) reveal(entry.target);
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -20px 0px" },
    );
    const targets = document.querySelectorAll(
      ".about h2, .service-copy h2, .contact h2, .recordings h3, " +
        ".about-image, .service-photo, .lesson-highlights, .service-genres, " +
        ".service-list li, .track-card, .feature-card, [data-reveal]",
    );
    if (!motionPreference.matches) {
      targets.forEach((element) => {
        if (element.getBoundingClientRect().top < window.innerHeight) return;
        element.classList.add("is-reveal-pending");
        observer.observe(element);
      });
    }
    document.addEventListener("focusin", (event) => {
      const pending = event.target.closest(".is-reveal-pending");
      if (pending) reveal(pending, false);
    });
    motionPreference.addEventListener("change", () => {
      if (!motionPreference.matches) return;
      observer.disconnect();
      targets.forEach((element) =>
        element.classList.remove("is-reveal-pending"),
      );
      activeAnimations.forEach((animation) => animation.cancel());
      activeAnimations.clear();
    });
  }

  // Keep the compact sticky header in sync without running work on every scroll.
  const header = document.querySelector(".site-header");
  let headerFrame = 0;
  const updateHeader = () => {
    header?.classList.toggle("is-scrolled", window.scrollY > 40);
    headerFrame = 0;
  };
  window.addEventListener("scroll", () => {
    if (!headerFrame) headerFrame = requestAnimationFrame(updateHeader);
  }, { passive: true });
  updateHeader();

  // The story remains readable without JavaScript; enhancement adds two toggle controls.
  const about = document.querySelector(".about");
  const story = document.querySelector(".about-more");
  const storyButton = document.querySelector(".story-link");
  if (about && story && storyButton) {
    const storyHeading = story.querySelector(".story-heading");
    const collapseButton = story.querySelector(".story-collapse");
    let expanded = window.location.hash === "#full-story";
    let storyAnimation;
    const updateStory = () => {
      storyButton.setAttribute("aria-expanded", String(expanded));
      collapseButton?.setAttribute("aria-expanded", String(expanded));
      storyButton.firstChild.textContent = expanded ? "Close my story " : "Read my story ";
    };
    const setStory = (opening) => {
      const startHeight = story.hidden ? 0 : story.getBoundingClientRect().height;
      storyAnimation?.cancel();
      expanded = opening;
      story.hidden = false;
      story.inert = !opening;
      updateStory();
      const finish = () => {
        story.hidden = !opening;
        story.classList.remove("is-animating");
        storyAnimation = null;
        if (!opening) storyButton.scrollIntoView({ behavior: motionPreference.matches ? "instant" : "smooth", block: "center" });
      };
      if (motionPreference.matches || !("animate" in Element.prototype)) {
        finish();
        return;
      }
      story.classList.add("is-animating");
      storyAnimation = story.animate([
        { height: `${startHeight}px` },
        { height: `${opening ? story.scrollHeight : 0}px` }
      ], { duration: 320, easing: "cubic-bezier(.22, 1, .36, 1)" });
      storyAnimation.finished.then(finish, () => {});
    };
    const closeStory = () => {
      storyButton.focus({ preventScroll: true });
      setStory(false);
    };
    storyButton.addEventListener("click", () => {
      if (expanded) { closeStory(); return; }
      setStory(true);
      storyHeading?.focus({ preventScroll: true });
      story.scrollIntoView({ behavior: motionPreference.matches ? "instant" : "smooth", block: "start" });
    });
    collapseButton?.addEventListener("click", closeStory);
    window.addEventListener("hashchange", () => {
      if (window.location.hash === "#full-story") setStory(true);
    });
    motionPreference.addEventListener("change", () => {
      if (motionPreference.matches) storyAnimation?.finish();
    });
    story.hidden = !expanded;
    story.inert = !expanded;
    updateStory();
    about.classList.add("is-enhanced");
  }

  // Send enquiries without leaving the page. The native action also works without JavaScript.
  const contactForm = document.querySelector("#enquiry-form");
  const formStatus = document.querySelector("#form-status");
  const sendButton = contactForm?.querySelector('button[type="submit"]');
  const sendButtonLabel = sendButton?.innerHTML;
  const enquiryType = contactForm?.querySelector("#enquiry-type");
  // Dedicated service pages can link to the same form with a recognised enquiry type.
  const requestedEnquiry = new URLSearchParams(window.location.search).get(
    "enquiry",
  );
  if (
    enquiryType &&
    [...enquiryType.options].some(
      (option) => !option.disabled && option.value === requestedEnquiry,
    )
  ) {
    enquiryType.value = requestedEnquiry;
  }
  let submitting = false;

  contactForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (submitting || !contactForm.reportValidity()) return;
    const submittedEnquiry = enquiryType?.value;
    submitting = true;
    sendButton.disabled = true;
    sendButton.textContent = "Sending…";
    contactForm.setAttribute("aria-busy", "true");
    formStatus.textContent = "Sending your enquiry…";
    formStatus.dataset.state = "pending";

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(contactForm.action, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(Object.fromEntries(new FormData(contactForm))),
        signal: controller.signal,
      });
      const result = await response.json();
      if (!response.ok || result.success !== true)
        throw new Error("Submission failed");
      formStatus.textContent =
        "Thanks — your enquiry has been sent. I’ll be in touch.";
      formStatus.dataset.state = "success";
      contactForm.reset();
      if (enquiryType) enquiryType.value = submittedEnquiry;
    } catch {
      formStatus.textContent =
        "I couldn’t confirm your enquiry was sent. Your message is still here — please try again, or get in touch on Instagram.";
      formStatus.dataset.state = "error";
    } finally {
      clearTimeout(timeout);
      submitting = false;
      sendButton.disabled = false;
      sendButton.innerHTML = sendButtonLabel;
      contactForm.removeAttribute("aria-busy");
    }
  });

  // Carry the chosen service into the enquiry form without changing keyboard focus.
  document.querySelectorAll("[data-enquiry]").forEach((link) => {
    link.addEventListener("click", () => {
      if (enquiryType) enquiryType.value = link.dataset.enquiry;
    });
  });
})();
