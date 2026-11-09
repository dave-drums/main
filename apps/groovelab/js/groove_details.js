// Presentation controls only. Metadata values and export logic remain owned by
// GrooveWriter and its original tuneTitle/tuneAuthor/tuneComments inputs.
(() => {
  "use strict";

  const dialog = document.getElementById("grooveDetailsDialog");
  const opener = document.getElementById("grooveDetailsButton");
  const close = document.getElementById("grooveDetailsClose");
  const grooves = document.getElementById("groovesAnchor");
  const picker = document.getElementById("grooveListWrapper");
  if (!dialog || !opener || !close || !grooves) return;

  const commitPendingEdit = () => {
    const active = document.activeElement;
    // Blurring fires the existing onchange handler, including on Escape/Done.
    if (active && dialog.contains(active)) active.blur();
  };
  const closeDetails = () => {
    commitPendingEdit();
    if (typeof dialog.close === "function") dialog.close();
    else {
      dialog.removeAttribute("open");
      grooves.focus({ preventScroll: true });
    }
  };

  opener.addEventListener("click", () => {
    if (dialog.open) return;
    const utils = window.myGrooveWriter && window.myGrooveWriter.myGrooveUtils;
    if (utils) utils.hideContextMenu(document.getElementById("grooveListWrapper"));
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
    document.getElementById("tuneTitle").focus();
  });
  close.addEventListener("click", closeDetails);
  dialog.addEventListener("cancel", commitPendingEdit);
  dialog.addEventListener("close", () => grooves.focus({ preventScroll: true }));
  dialog.addEventListener("keydown", (event) => {
    // Dialog button keystrokes must not trigger the editor's playback hotkeys.
    event.stopPropagation();
    if (event.key === "Escape" && typeof dialog.close !== "function") {
      event.preventDefault();
      closeDetails();
    }
  });
  grooves.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    event.stopPropagation();
    grooves.click();
  });
  function bindPicker(menu, returnTo) {
    const utils = window.myGrooveWriter.myGrooveUtils;
    menu.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        utils.hideContextMenu(menu);
        returnTo().focus({ preventScroll: true });
        return;
      }
      if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      event.stopPropagation();
      const items = [...menu.querySelectorAll('button:not(:disabled), [role="button"]:not([disabled])')]
        .filter(item => item.getClientRects().length);
      const index = items.indexOf(document.activeElement);
      const next = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1
        : (index + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
      items[next]?.focus();
    });
    menu.addEventListener("focusout", (event) => {
      if (utils.visible_context_menu === menu && event.relatedTarget && !menu.contains(event.relatedTarget) && event.relatedTarget !== returnTo()) {
        utils.hideContextMenu(menu);
      }
    });
  }
  bindPicker(picker, () => grooves);
  const metronome = document.getElementById("gl-metronome-toggle");
  bindPicker(document.getElementById("gl-metronome-menu"), () => metronome);
  for (const id of ["metronomeOptionsOffsetClickContextMenu", "metronomeOptionsOffsetClickForTripletsContextMenu"]) {
    const menu = document.getElementById(id);
    const returnTo = () => metronome;
    bindPicker(menu, returnTo);
    menu.addEventListener("click", event => {
      if (!event.target.closest("li[onclick]")) return;
      window.myGrooveWriter.myGrooveUtils.hideContextMenu(menu);
      returnTo().focus({ preventScroll: true });
    });
  }
  document.getElementById("fullURLPopup").addEventListener("keydown", event => {
    event.stopPropagation();
    if (event.key === "Escape") {
      event.preventDefault();
      window.myGrooveWriter.close_FullURLPopup();
    }
  });
})();
