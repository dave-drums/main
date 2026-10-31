(() => {
  "use strict";

  // Count up once when the lesson highlights enter view. Keep final values as the fallback.
  const counterBanner = document.querySelector(".lesson-highlights");
  const counterMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (
    counterBanner &&
    "IntersectionObserver" in window &&
    !counterMotion.matches
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
        if (counterMotion.matches) {
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
    counterMotion.addEventListener("change", () => {
      if (counterMotion.matches) {
        observer.disconnect();
        finishCounters();
      }
    });
  }

  // Responsive navigation.

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

  // Send enquiries without leaving the page. The native action also works without JavaScript.
  const contactForm = document.querySelector("#enquiry-form");
  const formStatus = document.querySelector("#form-status");
  const sendButton = contactForm?.querySelector('button[type="submit"]');
  const sendButtonLabel = sendButton?.innerHTML;
  const enquiryType = contactForm?.querySelector("#enquiry-type");
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
