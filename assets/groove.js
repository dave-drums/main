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

  // Full screen preserves the running editor, including unsaved changes.
  if (!document.fullscreenEnabled || !workspace.requestFullscreen) return;
  fullscreenButton.hidden = false;

  document.addEventListener("fullscreenchange", () => {
    const expanded = document.fullscreenElement === workspace;
    fullscreenButton.setAttribute("aria-pressed", String(expanded));
    fullscreenButton.firstChild.textContent = expanded ? "Exit full screen " : "Full screen ";
    feedback.textContent = "";
  });

  fullscreenButton.addEventListener("click", async () => {
    try {
      if (document.fullscreenElement === workspace) {
        await document.exitFullscreen();
      } else {
        await workspace.requestFullscreen();
      }
    } catch {
      feedback.textContent = "Full screen isn’t available here. You can continue using the editor on this page.";
    }
  });
})();
