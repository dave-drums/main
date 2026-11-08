// Preserve every original review; only add optional reading and source controls.
document.querySelectorAll('.testimonial-card').forEach((card, index) => {
  const quote = card.querySelector('blockquote');
  const figure = card.querySelector('figure');
  if (!quote || !figure) return;
  quote.id ||= `student-review-${index + 1}`;
  card.classList.add('has-review-details');
  const more = document.createElement('button');
  more.type = 'button';
  more.className = 'review-read-more';
  more.textContent = 'Read more';
  more.hidden = true;
  more.setAttribute('aria-expanded', 'false');
  more.setAttribute('aria-controls', quote.id);
  more.setAttribute('aria-label', `Read more of ${card.querySelector('cite').textContent}'s review`);
  figure.append(more);
  const update = () => {
    more.hidden = !card.classList.contains('is-expanded') && quote.scrollHeight <= quote.clientHeight + 1;
  };
  more.addEventListener('click', () => {
    const expanded = card.classList.toggle('is-expanded');
    more.setAttribute('aria-expanded', String(expanded));
    more.textContent = expanded ? 'Show less' : 'Read more';
    more.setAttribute('aria-label', `${expanded ? 'Show less' : 'Read more'} of ${card.querySelector('cite').textContent}'s review`);
    update();
  });
  if ('ResizeObserver' in window) new ResizeObserver(update).observe(quote);
  else window.addEventListener('resize', update);
  document.fonts?.ready.then(update);
  update();
});
