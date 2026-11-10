/* Private comparison only. Candidate fonts are never requested by the website. */
const choices = [...document.querySelectorAll('[name="type-choice"]')];
const fontNameLabel = document.querySelector('[data-type-name]');
choices.forEach(choice => choice.addEventListener('change', () => {
  if (!choice.checked) return;
  document.documentElement.dataset.typeChoice = choice.value;
  fontNameLabel.textContent = choice.closest('label').querySelector('span').textContent;
}));
const sample = document.getElementById('type-sample');
sample?.addEventListener('input', () => {
  const words = sample.value.trim() || 'your week.';
  document.querySelectorAll('[data-type-sample]').forEach(element => { element.textContent = words; });
});
const fontStatus = document.querySelector('[data-type-load-status]');
async function prepareFonts() {
  if (!window.FontFace || !document.fonts) throw new Error('Font loading unavailable');
  fontStatus.textContent = 'Loading the font comparisons…';
  const candidates = [
    ['Demo Allura','allura.ttf','normal','400'],
    ['Demo Alex Brush','alex-brush.ttf','normal','400'],
    ['Demo Parisienne','parisienne.ttf','normal','400'],
    ['Demo Italianno','italianno.ttf','normal','400'],
    ['Demo Cormorant','cormorant.ttf','italic','500'],
    ['Demo Lora','lora.ttf','italic','500']
  ];
  await Promise.all(candidates.map(async ([family,file,style,weight]) => {
    const face = new FontFace(family, 'url("/_preview/fonts/' + file + '")', {style,weight});
    document.fonts.add(await face.load());
  }));
  document.querySelectorAll('.type-grid,.type-live,.type-controls').forEach(element => { element.hidden = false; });
  fontStatus.textContent = 'All six fonts are ready. Choose a card to enlarge it.';
}
prepareFonts().catch(() => { fontStatus.textContent = 'The interactive fonts could not load. Use the comparison image to see all six options.'; });
