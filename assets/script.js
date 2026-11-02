(() => {
  "use strict";

  // Count up once when the lesson highlights enter view. Keep final values as the fallback.
  const counterBanner = document.querySelector(".lesson-highlights");
  const motionPreference = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  );
  if (
    counterBanner &&
    "IntersectionObserver" in window &&
    !motionPreference.matches
  ) {
    const counters = [...counterBanner.querySelectorAll("[data-count-to]")];
    let animationFrame = 0;
    const finishCounters = () => {
      cancelAnimationFrame(animationFrame);
      counters.forEach((counter) => {
        counter.textContent = counter.dataset.countTo;
      });
    };
    counters.forEach((counter) => {
      counter.textContent = "0";
    });
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        if (motionPreference.matches) {
          finishCounters();
          return;
        }
        const start = performance.now();
        const tick = (now) => {
          const progress = Math.min((now - start) / 1200, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          counters.forEach((counter) => {
            counter.textContent = String(
              Math.floor(Number(counter.dataset.countTo) * eased),
            );
          });
          if (progress < 1) animationFrame = requestAnimationFrame(tick);
        };
        animationFrame = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    observer.observe(counterBanner);
    motionPreference.addEventListener("change", () => {
      if (motionPreference.matches) {
        observer.disconnect();
        finishCounters();
      }
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
      document
        .querySelectorAll(
          ".hero .eyebrow, .hero h1, .page-hero .eyebrow, .page-hero h1",
        )
        .forEach((element, index) => {
          animate(
            element,
            [
              { opacity: 0.65, transform: "translate3d(0, 10px, 0)" },
              { opacity: 1, transform: "none" },
            ],
            { duration: 750, delay: index * 90, fill: "backwards" },
          );
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

  // A small desktop-only image offset adds depth without scaling or changing the crop.
  const hero = document.querySelector(".hero");
  const parallaxViewport = window.matchMedia(
    "(min-width: 801px) and (hover: hover) and (pointer: fine)",
  );
  if (hero && "IntersectionObserver" in window) {
    let frame = 0;
    let visible = false;
    let heroObserver;
    const update = () => {
      frame = 0;
      const bounds = hero.getBoundingClientRect();
      const offset = Math.min(bounds.height, Math.max(0, -bounds.top)) * 0.08;
      hero.style.setProperty("--hero-offset", `${offset.toFixed(2)}px`);
    };
    const requestUpdate = () => {
      if (visible && !frame) frame = requestAnimationFrame(update);
    };
    const configureParallax = () => {
      heroObserver?.disconnect();
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      cancelAnimationFrame(frame);
      frame = 0;
      visible = false;
      hero.classList.remove("is-parallax-active");
      hero.style.removeProperty("--hero-offset");
      if (motionPreference.matches || !parallaxViewport.matches) return;
      heroObserver = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        hero.classList.toggle("is-parallax-active", visible);
        requestUpdate();
      });
      heroObserver.observe(hero);
      window.addEventListener("scroll", requestUpdate, { passive: true });
      window.addEventListener("resize", requestUpdate, { passive: true });
    };
    configureParallax();
    parallaxViewport.addEventListener("change", configureParallax);
    motionPreference.addEventListener("change", configureParallax);
  }

  // Move focus into the expanded copy when its Read more control disappears.
  const aboutMore = document.querySelector(".about-more");
  aboutMore?.querySelector("summary")?.addEventListener("click", (event) => {
    if (aboutMore.open) return;
    const expandedCopy = aboutMore.querySelector(".about-extra > p");
    if (!expandedCopy) return;
    event.preventDefault();
    aboutMore.open = true;
    expandedCopy.setAttribute("tabindex", "-1");
    expandedCopy.focus({ preventScroll: true });
  });

  // Responsive navigation. Keep links visible on mobile until enhancement is ready.

  const toggle = document.querySelector(".nav-toggle");
  const navigation = document.querySelector("#site-navigation");
  function closeNavigation() {
    toggle?.setAttribute("aria-expanded", "false");
    navigation?.classList.remove("is-open");
  }
  toggle?.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") !== "true";
    toggle.setAttribute("aria-expanded", String(open));
    navigation?.classList.toggle("is-open", open);
  });
  navigation
    ?.querySelectorAll("a")
    .forEach((link) => link.addEventListener("click", closeNavigation));
  document.addEventListener("click", (event) => {
    if (
      toggle?.getAttribute("aria-expanded") === "true" &&
      !navigation?.contains(event.target) &&
      !toggle.contains(event.target)
    ) {
      closeNavigation();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      toggle?.getAttribute("aria-expanded") === "true"
    ) {
      closeNavigation();
      toggle.focus();
    }
  });
  window
    .matchMedia("(min-width: 801px)")
    .addEventListener("change", closeNavigation);
  if (toggle && navigation) {
    navigation.closest(".site-header")?.classList.add("nav-ready");
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
