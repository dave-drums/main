// The production embed owns its React app and stylesheet inside Shadow DOM.
const host = document.querySelector("#metronome-app");
const status = document.querySelector("#metronome-status");
const error = document.querySelector("#metronome-error");

status.textContent = "Loading metronome…";
const slowLoad = window.setTimeout(() => {
  status.textContent = "Still loading the metronome. Please check your connection if this continues.";
}, 15000);

try {
  const { mountMetronome } = await import(
    "https://dave-drums.github.io/metronome/embed/metronome.js"
  );
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
