(() => {
  "use strict";

  // Keep native form controls as a fallback if the shared enhancement cannot load.
  if (document.currentScript?.src && document.querySelector('.enquiry-form select')) {
    import(new URL('tool-select.js', document.currentScript.src).href).catch(() => {});
  }

  const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");

  // Native details stay usable without JavaScript; animation only enhances their presentation.
  const disclosureStates = new WeakMap();
  const movingDisclosures = new Set();
  const disclosureEasing = "cubic-bezier(.22, 1, .36, 1)";
  const prepareDisclosure = details => {
    if (disclosureStates.has(details)) return disclosureStates.get(details);
    const summary = [...details.children].find(child => child.tagName === "SUMMARY");
    if (!summary) return null;
    const content = [...details.children].filter(child => child !== summary);
    const region = details.querySelector(":scope > .nav-submenu") || details;
    const state = {
      details,
      summary,
      content,
      region,
      expanded: details.open,
      animation: null
    };
    disclosureStates.set(details, state);
    details.dataset.disclosureReady = "";
    summary.setAttribute("aria-expanded", String(state.expanded));
    content.forEach(child => {
      child.inert = false;
    });
    details.addEventListener("toggle", () => {
      if (state.animation || details.open === state.expanded) return;
      state.expanded = details.open;
      summary.setAttribute("aria-expanded", String(state.expanded));
      content.forEach(child => {
        child.inert = false;
      });
    });
    return state;
  };
  const setDisclosure = (details, expanded, {
    immediate = false
  } = {}) => {
    const state = prepareDisclosure(details);
    if (!state) return;
    expanded = Boolean(expanded);
    if (!immediate && state.expanded === expanded && (state.animation || details.open === expanded)) return;
    const wasVisible = details.open;
    const startHeight = state.region.getBoundingClientRect().height;
    // A submenu's padding/borders must reach zero with its height to avoid a final snap.
    const spacing = ["paddingTop", "paddingBottom", "borderTopWidth", "borderBottomWidth", "marginTop"];
    const startingStyle = state.region !== details ? getComputedStyle(state.region) : null;
    const fromSpacing = startingStyle ? Object.fromEntries(spacing.map(key => [key, wasVisible ? startingStyle[key] || "0px" : "0px"])) : {};
    const fromOpacity = startingStyle ? wasVisible ? startingStyle.opacity || "1" : "0" : null;
    state.animation?.cancel();
    state.animation = null;
    movingDisclosures.delete(state);
    state.expanded = expanded;
    state.summary.setAttribute("aria-expanded", String(expanded));
    state.content.forEach(child => {
      child.inert = !expanded;
    });
    const finish = () => {
      details.open = state.expanded;
      // Native closed details hide their content without excluding it from find-in-page.
      state.content.forEach(child => {
        child.inert = false;
      });
      state.region.classList.remove("is-disclosure-animating");
      state.animation = null;
      movingDisclosures.delete(state);
    };
    if (immediate || motionPreference.matches || !("animate" in Element.prototype)) {
      finish();
      return;
    }
    let closedHeight = 0;
    if (state.region === details) {
      details.open = false;
      closedHeight = details.getBoundingClientRect().height;
    }
    details.open = true;
    const endHeight = expanded ? state.region.getBoundingClientRect().height : closedHeight;
    const fromHeight = wasVisible ? startHeight : closedHeight;
    if (Math.abs(fromHeight - endHeight) < 1) {
      finish();
      return;
    }
    state.region.classList.add("is-disclosure-animating");
    const naturalStyle = startingStyle ? getComputedStyle(state.region) : null;
    const toSpacing = naturalStyle ? Object.fromEntries(spacing.map(key => [key, expanded ? naturalStyle[key] || "0px" : "0px"])) : {};
    const frames = [{
      height: `${fromHeight}px`,
      ...fromSpacing
    }, {
      height: `${endHeight}px`,
      ...toSpacing
    }];
    if (startingStyle) {
      frames[0].opacity = fromOpacity;
      frames[1].opacity = expanded ? "1" : "0";
    }
    const animation = state.region.animate(frames, {
      duration: 280,
      easing: disclosureEasing
    });
    state.animation = animation;
    movingDisclosures.add(state);
    animation.finished.then(() => {
      if (state.animation === animation) finish();
    }, () => {});
  };
  const disclosureIsOpen = details => disclosureStates.get(details)?.expanded ?? details.open;
  window.DaveDrumsDisclosures = {
    setOpen: setDisclosure,
    isOpen: disclosureIsOpen
  };
  document.querySelectorAll("details:not(.nav-group):not(.tool-guide)").forEach(details => {
    const state = prepareDisclosure(details);
    if (!state) return;
    state.summary.addEventListener("click", event => {
      if (event.target.closest("a,button,input,select,textarea,label")) return;
      event.preventDefault();
      setDisclosure(details, !disclosureIsOpen(details));
    });
  });
  const settleDisclosures = () => [...movingDisclosures].forEach(state => {
    setDisclosure(state.details, state.expanded, {
      immediate: true
    });
  });
  motionPreference.addEventListener("change", () => {
    if (motionPreference.matches) settleDisclosures();
  });
  window.addEventListener("resize", settleDisclosures);

  // Count experience figures once on arrival, keeping their final values accessible.
  const counters = [...document.querySelectorAll(".stat-counter[data-count-to]")];
  if (counters.length && "IntersectionObserver" in window) {
    const states = counters.map(element => ({
      element,
      target: Number(element.dataset.countTo),
      frame: 0
    })).filter(state => Number.isFinite(state.target) && state.target >= 0);
    const finish = state => {
      cancelAnimationFrame(state.frame);
      state.frame = 0;
      state.element.textContent = String(state.target);
    };
    const count = state => {
      if (motionPreference.matches) return;
      // Screen readers retain the actual figure throughout the visual count.
      const accessibleValue = document.createElement("span");
      accessibleValue.className = "visually-hidden";
      accessibleValue.textContent = String(state.target);
      state.element.before(accessibleValue);
      state.element.setAttribute("aria-hidden", "true");
      state.element.textContent = "0";
      let start;
      const tick = time => {
        start ??= time;
        const progress = Math.min((time - start) / 900, 1);
        const eased = 1 - (1 - progress) ** 2;
        state.element.textContent = String(Math.floor(state.target * eased));
        if (progress < 1) state.frame = requestAnimationFrame(tick);else finish(state);
      };
      state.frame = requestAnimationFrame(tick);
    };
    const statesByElement = new Map(states.map(state => [state.element, state]));
    const counterObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting || entry.intersectionRatio < .5) return;
        counterObserver.unobserve(entry.target);
        count(statesByElement.get(entry.target));
      });
    }, {
      threshold: .5,
      rootMargin: "0px 0px -32px 0px"
    });
    if (!motionPreference.matches) {
      states.forEach(state => counterObserver.observe(state.element));
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
    const easing = getComputedStyle(document.documentElement).getPropertyValue("--ease-out").trim() || "ease-out";
    const delays = new WeakMap();
    const animate = (element, keyframes, options) => {
      const animation = element.animate(keyframes, {
        easing,
        ...options
      });
      activeAnimations.add(animation);
      const clear = () => activeAnimations.delete(animation);
      animation.finished.then(clear, clear);
    };
    document.querySelectorAll(".tracks, .feature-grid, .benefit-grid").forEach(group => {
      [...group.children].forEach((element, index) => {
        delays.set(element, Math.min(index, 5) * 55);
      });
    });
    const reveal = (element, withMotion = true) => {
      observer.unobserve(element);
      element.classList.remove("is-reveal-pending");
      element.classList.add("is-revealed");
      if (withMotion && !motionPreference.matches) {
        const isPhoto = element.matches(".about-image,.lesson-home-photo,.recording-preview,.video-player");
        const frames = [{
          opacity: 0,
          transform: "translate3d(0, 16px, 0)"
        }, {
          opacity: 1,
          transform: "none"
        }];
        if (isPhoto) {
          frames[0].clipPath = "inset(10% 0 0 0 round 20px)";
          frames[1].clipPath = "inset(0 round 20px)";
        }
        animate(element, frames, {
          duration: isPhoto ? 680 : 460,
          delay: delays.get(element) || 0,
          fill: "backwards"
        });
      }
    };
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) reveal(entry.target);
      });
    }, {
      threshold: 0.08,
      rootMargin: "0px 0px -20px 0px"
    });
    const targets = document.querySelectorAll(".about h2, .service-copy h2, .contact h2, " + ".about-image, .lesson-home-photo, .recording-preview, .video-player, .lesson-highlights, .track-card, .feature-card, [data-reveal]");
    if (!motionPreference.matches) {
      targets.forEach(element => {
        if (element.getBoundingClientRect().top < window.innerHeight) return;
        element.classList.add("is-reveal-pending");
        observer.observe(element);
      });
    }
    document.addEventListener("focusin", event => {
      const pending = event.target.closest(".is-reveal-pending");
      if (pending) reveal(pending, false);
    });
    motionPreference.addEventListener("change", () => {
      if (!motionPreference.matches) return;
      observer.disconnect();
      targets.forEach(element => element.classList.remove("is-reveal-pending"));
      activeAnimations.forEach(animation => animation.cancel());
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
  }, {
    passive: true
  });
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
    const setStory = opening => {
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
        if (!opening) storyButton.scrollIntoView({
          behavior: motionPreference.matches ? "instant" : "smooth",
          block: "center"
        });
      };
      if (motionPreference.matches || !("animate" in Element.prototype)) {
        finish();
        return;
      }
      story.classList.add("is-animating");
      const endHeight = opening ? story.getBoundingClientRect().height : 0;
      const animation = story.animate([{
        height: `${startHeight}px`
      }, {
        height: `${endHeight}px`
      }], {
        duration: 280,
        easing: disclosureEasing
      });
      storyAnimation = animation;
      animation.finished.then(() => {
        if (storyAnimation === animation) finish();
      }, () => {});
    };
    const closeStory = () => {
      storyButton.focus({
        preventScroll: true
      });
      setStory(false);
    };
    storyButton.addEventListener("click", () => {
      if (expanded) {
        closeStory();
        return;
      }
      setStory(true);
      storyHeading?.focus({
        preventScroll: true
      });
      story.scrollIntoView({
        behavior: motionPreference.matches ? "instant" : "smooth",
        block: "start"
      });
    });
    collapseButton?.addEventListener("click", closeStory);
    window.addEventListener("hashchange", () => {
      if (window.location.hash === "#full-story") setStory(true);
    });
    motionPreference.addEventListener("change", () => {
      if (motionPreference.matches) storyAnimation?.finish();
    });
    window.addEventListener("resize", () => storyAnimation?.finish());
    story.hidden = !expanded;
    story.inert = !expanded;
    updateStory();
    about.classList.add("is-enhanced");
  }

  // A third-party frame cannot report its internal errors; retain the direct score link.
  const scoreFrame = document.querySelector('.notation-frame');
  const scoreStatus = document.querySelector('#score-status');
  if (scoreFrame && scoreStatus) {
    let timeout, loaded = false;
    scoreFrame.addEventListener('load', () => { loaded = true; clearTimeout(timeout); scoreStatus.textContent = ''; }, { once: true });
    scoreFrame.addEventListener('error', () => {
      clearTimeout(timeout);
      scoreStatus.textContent = 'The score could not load. Use the Soundslice link below.';
    });
    const loading = () => {
      if (loaded) return;
      scoreStatus.textContent = 'Loading interactive score…';
      timeout = setTimeout(() => { scoreStatus.textContent = 'Still loading? Open the score using the Soundslice link below.'; }, 15000);
    };
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) { loading(); observer.disconnect(); }
      });
      observer.observe(scoreFrame);
    } else loading();
  }

  // Send enquiries without leaving the page. The native action also works without JavaScript.
  const contactForm = document.querySelector("#enquiry-form");
  const formStatus = document.querySelector("#form-status");
  const sendButton = contactForm?.querySelector('button[type="submit"]');
  const sendButtonLabel = sendButton?.innerHTML;
  const enquiryType = contactForm?.querySelector("#enquiry-type");
  // Dedicated service pages can link to the same form with a recognised enquiry type.
  const requestedEnquiry = new URLSearchParams(window.location.search).get("enquiry");
  if (enquiryType && [...enquiryType.options].some(option => !option.disabled && option.value === requestedEnquiry)) {
    enquiryType.value = requestedEnquiry;
  }
  let submitting = false;
  const formFields = [...(contactForm?.querySelectorAll('input:not([type="hidden"]):not([type="checkbox"]),select,textarea') || [])];
  const fieldErrors = new Map();
  function showFieldError(field) {
    let error = fieldErrors.get(field);
    if (!error) {
      error = document.createElement("span");
      error.id = `${field.id}-error`;
      error.className = "field-error";
      (field.closest(".tool-select") || field).after(error);
      fieldErrors.set(field, error);
      field.setAttribute("aria-describedby", [field.getAttribute("aria-describedby"), error.id].filter(Boolean).join(" "));
    }
    error.textContent = field.validationMessage;
    field.setAttribute("aria-invalid", String(!field.validity.valid));
  }
  formFields.forEach(field => {
    field.addEventListener("invalid", () => showFieldError(field));
    field.addEventListener("input", () => { if (fieldErrors.has(field)) showFieldError(field); });
    field.addEventListener("change", () => { if (fieldErrors.has(field)) showFieldError(field); });
  });
  contactForm?.addEventListener("submit", async event => {
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
          Accept: "application/json"
        },
        body: JSON.stringify(Object.fromEntries(new FormData(contactForm))),
        signal: controller.signal
      });
      const result = await response.json();
      if (!response.ok || result.success !== true) throw new Error("Submission failed");
      formStatus.textContent = "Thanks — your enquiry has been sent. I’ll be in touch.";
      formStatus.dataset.state = "success";
      contactForm.reset();
      formFields.forEach(field => { field.removeAttribute("aria-invalid"); if (fieldErrors.has(field)) fieldErrors.get(field).textContent = ""; });
      if (enquiryType) enquiryType.value = submittedEnquiry;
    } catch {
      formStatus.textContent = "I couldn’t confirm your enquiry was sent. Your message is still here — please try again, or email info@davedrums.com.au using the link below.";
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
  document.querySelectorAll("[data-enquiry]").forEach(link => {
    link.addEventListener("click", () => {
      if (enquiryType) enquiryType.value = link.dataset.enquiry;
    });
  });
})();
