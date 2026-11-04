(() => {
  "use strict";

  const header = document.querySelector(".site-header");
  const toggle = header?.querySelector(".nav-toggle");
  const navigation = header?.querySelector("#site-navigation");
  if (!header || !toggle || !navigation) return;

  const groups = [...navigation.querySelectorAll(".nav-group")];
  const mobileViewport = window.matchMedia("(max-width: 900px)");
  const hoverPointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const pageRegions = [...document.querySelectorAll("main, .site-footer")];
  const isMenuOpen = () => toggle.getAttribute("aria-expanded") === "true";

  function focusNavigation(element) {
    if (!element) return;
    element.focus({ preventScroll: true });
    // Scroll the open panel itself without jumping the page behind the sticky header.
    const panel = mobileViewport.matches && isMenuOpen() ? navigation : element.closest(".nav-submenu");
    if (panel) {
      const item = element.getBoundingClientRect();
      const bounds = panel.getBoundingClientRect();
      if (item.top < bounds.top) panel.scrollTop += item.top - bounds.top;
      else if (item.bottom > bounds.bottom) panel.scrollTop += item.bottom - bounds.bottom;
    }
  }

  function setGroup(group, open) {
    if (open) groups.forEach((other) => { if (other !== group) setGroup(other, false); });
    group.open = open;
    group.querySelector("summary").setAttribute("aria-expanded", String(open));
  }

  function closeGroups() {
    groups.forEach((group) => setGroup(group, false));
  }

  function setNavigation(open, restoreFocus = false) {
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
    toggle.querySelector("span").textContent = open ? "\u2212" : "\uff0b";
    navigation.classList.toggle("is-open", open);
    document.body.classList.toggle("menu-open", open);
    pageRegions.forEach((region) => { region.inert = open; });
    if (!open) closeGroups();
    if (restoreFocus) focusNavigation(toggle);
  }

  groups.forEach((group) => {
    const summary = group.querySelector("summary");
    const links = [...group.querySelectorAll("a")];
    let openedByHover = false;
    setGroup(group, false);

    summary.addEventListener("click", (event) => {
      event.preventDefault();
      // A first mouse click pins a menu that has just opened on hover.
      const keepOpen = openedByHover && event.detail > 0 && group.open;
      openedByHover = false;
      setGroup(group, keepOpen || !group.open);
    });
    group.addEventListener("toggle", () => {
      summary.setAttribute("aria-expanded", String(group.open));
    });
    group.addEventListener("pointerenter", (event) => {
      if (mobileViewport.matches || !hoverPointer.matches || event.pointerType !== "mouse") return;
      // Keyboard focus takes priority over an incidental mouse movement.
      if (groups.some((other) => other !== group && other.open && other.contains(document.activeElement))) return;
      if (!group.open) {
        setGroup(group, true);
        openedByHover = true;
      }
    });
    group.addEventListener("pointerleave", () => {
      if (!mobileViewport.matches && !group.contains(document.activeElement)) {
        setGroup(group, false);
        openedByHover = false;
      }
    });
    group.addEventListener("focusout", () => {
      queueMicrotask(() => {
        if (!mobileViewport.matches && !group.contains(document.activeElement)) setGroup(group, false);
      });
    });
    group.addEventListener("keydown", (event) => {
      const index = links.indexOf(document.activeElement);
      if (document.activeElement === summary && ["ArrowDown", "ArrowUp"].includes(event.key)) {
        event.preventDefault();
        openedByHover = false;
        setGroup(group, true);
        focusNavigation(links[event.key === "ArrowDown" ? 0 : links.length - 1]);
      } else if (index !== -1 && ["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
        event.preventDefault();
        const next = event.key === "Home" ? 0 : event.key === "End" ? links.length - 1
          : (index + (event.key === "ArrowDown" ? 1 : -1) + links.length) % links.length;
        focusNavigation(links[next]);
      }
    });
  });

  toggle.addEventListener("click", () => setNavigation(!isMenuOpen()));
  navigation.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setNavigation(false, isMenuOpen()));
  });
  document.addEventListener("click", (event) => {
    if (!navigation.contains(event.target)) closeGroups();
    if (isMenuOpen() && !header.contains(event.target)) setNavigation(false, true);
  });
  document.addEventListener("keydown", (event) => {
    // Leave the Groove Lab orientation dialog's native Escape/focus handling intact.
    if (document.querySelector("dialog[open]")) return;
    if (event.key === "Escape") {
      const openGroup = groups.find((group) => group.open);
      if (openGroup) {
        event.preventDefault();
        setGroup(openGroup, false);
        focusNavigation(openGroup.querySelector("summary"));
      } else if (isMenuOpen()) {
        event.preventDefault();
        setNavigation(false, true);
      }
    }
    if (event.key === "Tab" && isMenuOpen()) {
      const focusable = [toggle, ...navigation.querySelectorAll("a, summary")]
        .filter((element) => element.getClientRects().length > 0);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        focusNavigation(last);
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        focusNavigation(first);
      }
    }
  });
  mobileViewport.addEventListener("change", () => {
    const focused = document.activeElement;
    const group = focused.closest?.(".nav-group");
    const focusInNavigation = navigation.contains(focused);
    setNavigation(false);
    if (focusInNavigation) {
      if (mobileViewport.matches) focusNavigation(toggle);
      else focusNavigation(group?.querySelector("summary"));
    }
  });
  window.addEventListener("pagehide", () => setNavigation(false));
  window.addEventListener("pageshow", () => setNavigation(false));

  function updateHomeLocation() {
    if (window.location.pathname.replace(/index\.html$/, "") !== "/") return;
    const href = ["#about", "#contact"].includes(window.location.hash) ? "/" + window.location.hash : "/";
    document.querySelectorAll('#site-navigation > a, .footer-navigation a').forEach((link) => {
      if (!["/", "/#about", "/#contact"].includes(link.getAttribute("href"))) return;
      if (link.getAttribute("href") === href) link.setAttribute("aria-current", href === "/" ? "page" : "location");
      else link.removeAttribute("aria-current");
    });
  }
  window.addEventListener("hashchange", updateHomeLocation);
  updateHomeLocation();
  header.classList.add("nav-ready");
})();
