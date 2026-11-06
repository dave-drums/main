(() => {
  "use strict";

  let activePlayer;
  const localPreview = ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname);

  document.querySelectorAll("[data-video-launch]").forEach((launch) => {
    const shell = launch.closest(".video-shell");
    const close = shell?.parentElement.querySelector("[data-video-close]");
    const provider = launch.dataset.videoProvider;
    const id = launch.dataset.videoId;
    const instagramType = launch.dataset.instagramType || "reel";
    if (!shell || !close) return;
    if (provider === "youtube" ? !/^[\w-]{11}$/.test(id || "")
      : provider !== "instagram" || !/^[\w-]+$/.test(id || "")) return;
    if (provider === "instagram" && !["p", "reel"].includes(instagramType)) return;
    // YouTube rejects this cover on loopback origins; preserve a usable preview link.
    if (provider === "youtube" && localPreview) {
      launch.setAttribute("aria-label", `Watch ${launch.dataset.videoTitle} on YouTube (opens in a new tab)`);
      return;
    }

    let detachFrameEvents = () => {};
    const restore = (returnFocus = false) => {
      detachFrameEvents();
      shell.replaceChildren(launch);
      shell.classList.remove("is-playing");
      shell.removeAttribute("aria-busy");
      close.hidden = true;
      if (activePlayer === restore) activePlayer = undefined;
      if (returnFocus) launch.focus({ preventScroll: true });
    };

    launch.setAttribute("role", "button");
    launch.setAttribute("aria-controls", shell.id);
    launch.addEventListener("keydown", (event) => {
      if (event.key !== " ") return;
      event.preventDefault();
      launch.click();
    });
    launch.addEventListener("click", (event) => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      activePlayer?.();
      const frame = document.createElement("iframe");
      frame.title = launch.dataset.videoTitle;
      frame.className = "video-frame";
      if (provider === "instagram") {
        frame.classList.add("video-frame--instagram");
        frame.height = String(Math.ceil(shell.clientWidth * 16 / 9 + 120));
        const measure = (message) => {
          if (message.origin !== "https://www.instagram.com" || message.source !== frame.contentWindow) return;
          let data = message.data;
          if (typeof data === "string") {
            try { data = JSON.parse(data); } catch { return; }
          }
          const height = data?.details?.height;
          if (data?.type === "MEASURE" && Number.isFinite(height) && height >= 200 && height <= 2400) {
            frame.height = String(Math.ceil(height));
          }
        };
        window.addEventListener("message", measure);
        detachFrameEvents = () => window.removeEventListener("message", measure);
      }
      frame.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen; web-share";
      frame.allowFullscreen = true;
      frame.referrerPolicy = "strict-origin-when-cross-origin";
      const url = provider === "youtube"
        ? new URL(`https://www.youtube-nocookie.com/embed/${id}`)
        : new URL(`https://www.instagram.com/${instagramType}/${id}/embed/`);
      if (provider === "youtube") {
        url.searchParams.set("autoplay", "1");
        url.searchParams.set("playsinline", "1");
      }
      shell.setAttribute("aria-busy", "true");
      frame.addEventListener("load", () => shell.removeAttribute("aria-busy"), { once: true });
      frame.src = url.href;
      shell.replaceChildren(frame);
      shell.classList.add("is-playing");
      close.hidden = false;
      activePlayer = restore;
      frame.focus({ preventScroll: true });
    });
    close.addEventListener("click", () => restore(true));
  });
})();
