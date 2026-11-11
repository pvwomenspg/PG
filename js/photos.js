
(() => {
 document.querySelectorAll('.pg-slider').forEach(slider => {
  const slides = [...slider.querySelectorAll('.pg-slide')]; let index = 0;
  const show = next => {
   slides[index].hidden = true; index = (next + slides.length) % slides.length;
   slides[index].hidden = false; slider.querySelector('[aria-live]').textContent = `${index + 1} / ${slides.length}`;
   slider.querySelectorAll('[data-slide]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.slide) === index)));
  };
  slider.querySelectorAll('[data-step]').forEach(button => button.addEventListener('click', () => show(index + Number(button.dataset.step))));
  slider.querySelectorAll('[data-slide]').forEach(button => button.addEventListener('click', () => show(Number(button.dataset.slide))));
 });
 const dialog = document.createElement('dialog'); dialog.className = 'pg-lightbox'; dialog.setAttribute('aria-label', 'Property photo');
 const close = document.createElement('button'); close.type = 'button'; close.textContent = 'Close ×';
 const img = document.createElement('img'); const caption = document.createElement('p');
 dialog.append(close, img, caption); document.body.append(dialog); let trigger;
 document.querySelectorAll('[data-photo]').forEach(link => link.addEventListener('click', event => {
  if (!dialog.showModal) return; event.preventDefault(); trigger = link;
  img.src = link.href; img.alt = link.querySelector('img').alt; caption.textContent = img.alt;
  dialog.showModal(); document.body.classList.add('pg-photo-open');
 }));
 close.addEventListener('click', () => dialog.close());
 dialog.addEventListener('click', event => {if(event.target === dialog) dialog.close();});
 dialog.addEventListener('close', () => {document.body.classList.remove('pg-photo-open'); if(trigger) trigger.focus();});
})();
