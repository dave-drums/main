// The production embed owns its React app and stylesheet inside Shadow DOM.
const host = document.querySelector("#metronome-app");
const status = document.querySelector("#metronome-status");
const error = document.querySelector("#metronome-error");

status.textContent = "Loading metronome…";
const slowLoad = window.setTimeout(() => {
  status.textContent = "Still loading the metronome. Please check your connection if this continues.";
}, 15000);

try {
  const app = new URL("../metronome/app/", import.meta.url);
  const response = await fetch(new URL("version.json", app), { cache: "no-store" });
  if (!response.ok) throw new Error("Metronome build is unavailable");
  const { version } = await response.json();
  if (typeof version !== "string") throw new Error("Invalid metronome build version");
  const moduleURL = new URL("embed/metronome.js", app);
  moduleURL.searchParams.set("v", version);
  const { mountMetronome } = await import(moduleURL.href);
  await mountMetronome("#metronome-app");
  status.textContent = "";
} catch (cause) {
  host.hidden = true;
  status.textContent = "";
  error.hidden = false;
  console.error("Unable to load the metronome.", cause);
} finally {
  window.clearTimeout(slowLoad);
  host.setAttribute("aria-busy", "false");
}
