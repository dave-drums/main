(() => {
  "use strict";

  // Keep the instructions in HTML, with native details as the no-JS fallback.
  // Modern browsers open the same content in a modal inside its workspace,
  // so help is also available while either tool is fullscreen.
  document.querySelectorAll("[data-tool-help]").forEach((button) => {
    const guide = document.getElementById(button.dataset.toolHelp);
    const content = guide?.querySelector(".tool-guide-content");
    const heading = content?.querySelector("h2");
    if (!guide || !content || !heading) return;
    const dialog = document.createElement("dialog");
    if (typeof dialog.showModal !== "function") return;

    dialog.id = guide.id;
    dialog.className = "tool-guide-dialog";
    dialog.setAttribute("aria-labelledby", heading.id);
    const header = document.createElement("div");
    header.className = "tool-guide-dialog-header";
    const close = document.createElement("button");
    close.type = "button";
    close.className = "button tool-button tool-guide-close";
    close.textContent = "Close";
    heading.tabIndex = -1;
    header.append(heading, close);
    dialog.append(header, content);
    guide.replaceWith(dialog);
    const workspace = dialog.closest(".app-workspace");

    button.addEventListener("click", () => {
      if (dialog.open) return;
      dialog.showModal();
      button.setAttribute("aria-expanded", "true");
      document.body.classList.add("tool-help-open");
      workspace?.classList.add("tool-help-open");
      heading.focus({ preventScroll: true });
    });
    close.addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", (event) => {
      const bounds = dialog.getBoundingClientRect();
      if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right
          || event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close();
    });
    // Escape uses the dialog's native cancel/close behaviour and focus trap.
    dialog.addEventListener("close", () => {
      button.setAttribute("aria-expanded", "false");
      document.body.classList.remove("tool-help-open");
      workspace?.classList.remove("tool-help-open");
      button.focus({ preventScroll: true });
    });
    button.setAttribute("aria-haspopup", "dialog");
    button.hidden = false;
  });

  // The metronome stays mounted: fullscreen changes only its containing page.
  // Groove Lab retains its existing handler in groove.js.
  document.querySelectorAll("[data-tool-fullscreen]").forEach((button) => {
    const workspace = document.getElementById(button.dataset.toolFullscreen);
    const feedback = document.getElementById("metronome-feedback");
    if (!workspace || !document.fullscreenEnabled || !workspace.requestFullscreen) return;
    const sync = () => {
      const expanded = document.fullscreenElement === workspace;
      button.setAttribute("aria-pressed", String(expanded));
      button.textContent = expanded ? "Exit full screen" : "Full screen";
      if (feedback) feedback.textContent = "";
    };
    button.addEventListener("click", async () => {
      try {
        if (document.fullscreenElement === workspace) {
          await document.exitFullscreen();
        } else {
          await workspace.requestFullscreen();
        }
      } catch {
        if (feedback) feedback.textContent = "Full screen isn’t available here. You can continue using the metronome on this page.";
      }
    });
    document.addEventListener("fullscreenchange", sync);
    button.hidden = false;
    sync();
  });
})();
