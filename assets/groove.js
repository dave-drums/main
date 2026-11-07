(() => {
  "use strict";

  const frame = document.querySelector("#groove-frame");
  const workspace = document.querySelector("#groove-workspace");
  const fullscreenButton = document.querySelector("#groove-fullscreen");
  const feedback = document.querySelector("#groove-feedback");
  if (!frame || !workspace || !fullscreenButton || !feedback) return;

  // Match Practice Vault's groove links without changing the application origin.
  const appURL = new URL(frame.src);
  appURL.search = window.location.search;
  if (frame.src !== appURL.href) frame.src = appURL.href;

  // Like Practice Vault, rotating hides the prompt and tapping dismisses it for this visit.
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
