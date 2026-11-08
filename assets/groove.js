(() => {
  "use strict";

  const frame = document.querySelector("#groove-frame");
  if (!frame) return;

  // The public page and its editor now share this repository and origin.
  const appURL = new URL(frame.src);
  appURL.search = window.location.search;
  if (frame.src !== appURL.href) frame.src = appURL.href;

  // Keep reloads and bookmarks on the public URL as the pattern changes.
  window.addEventListener("message", (event) => {
    if (event.origin !== window.location.origin || event.source !== frame.contentWindow
        || event.data?.type !== "dave-drums:groove-change" || typeof event.data.search !== "string") return;
    const next = new URL(window.location.href);
    next.search = event.data.search;
    window.history.replaceState(null, "", next.href);
  });

  // Rotating hides the prompt; tapping dismisses it for this visit.
  const orientationPrompt = document.querySelector("#groove-orientation");
  if (orientationPrompt && typeof orientationPrompt.showModal === "function") {
    const mobilePortrait = window.matchMedia(
      "(max-width: 900px) and (orientation: portrait) and (pointer: coarse)",
    );
    let dismissed = false;
    const updateOrientationPrompt = () => {
      if (mobilePortrait.matches && !dismissed) {
        if (!orientationPrompt.open) orientationPrompt.showModal();
      } else if (orientationPrompt.open) {
        orientationPrompt.close();
      }
    };
    orientationPrompt.addEventListener("click", () => {
      dismissed = true;
      orientationPrompt.close();
    });
    orientationPrompt.addEventListener("cancel", () => {
      dismissed = true;
    });
    mobilePortrait.addEventListener("change", updateOrientationPrompt);
    window.addEventListener("pageshow", updateOrientationPrompt);
    updateOrientationPrompt();
  }

  // Shared fullscreen controls in tools.js preserve the mounted editor.
})();
