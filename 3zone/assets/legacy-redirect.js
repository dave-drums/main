/* Resolve against this asset so forwards stay inside a hosted subfolder. */
(() => {
  const script = document.currentScript;
  const route = script?.dataset.route;
  const old = window.location.hash.slice(1);
  const zones = ['sauna', 'water', 'compression'];
  let destination = 'our-space';
  if (route === 'services') destination = zones.includes(old) ? old : 'zones';
  if (route === 'about' && old === 'first-visit') destination = 'first-visit';
  const target = new URL('../', script.src);
  target.hash = destination;
  window.location.replace(target.href);
})();
