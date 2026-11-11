(() => {
  const gallery = document.querySelector('[data-facilities-carousel]');
  if (!gallery) return;
  const image = gallery.querySelector('img');
  const buttons = [...gallery.querySelectorAll('[data-slide]')];
  const photos = ['assets/facilities-reference-room.png', 'assets/facilities-reference-room.png', 'assets/facilities-reference-room.png'];
  let current = 0;
  const show = index => {
    current = (index + photos.length) % photos.length;
    image.src = photos[current];
    image.style.transform = `scale(${[1, 1.08, 1.16][current]})`;
    image.style.transformOrigin = ["center", "left center", "right center"][current];
    image.alt = `Supplied bedroom photograph, framing ${current + 1}`;
    buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === current)));
  };
  buttons.forEach((button, i) => button.addEventListener('click', () => show(i)));
  gallery.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    show(current + (event.key === 'ArrowRight' ? 1 : -1));
    buttons[current].focus();
  });
  let startX = null;
  image.addEventListener('touchstart', event => { startX = event.changedTouches[0].clientX; }, { passive: true });
  image.addEventListener('touchend', event => {
    if (startX === null) return;
    const delta = event.changedTouches[0].clientX - startX;
    if (Math.abs(delta) > 40) show(current + (delta < 0 ? 1 : -1));
    startX = null;
  }, { passive: true });
})();

