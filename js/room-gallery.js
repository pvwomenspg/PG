/* Compact room carousels: one image frame with previous/next controls. */
(() => {
  document.querySelectorAll('[data-room-carousel]').forEach(gallery => {
    const mainLink = gallery.querySelector('.room-feature-main-link');
    const mainImage = gallery.querySelector('[data-gallery-main]');
    const count = gallery.querySelector('.room-feature-count');
    let images;
    try { images = JSON.parse(gallery.dataset.galleryImages || '[]'); }
    catch { images = []; }
    if (!mainLink || !mainImage || !images.length) return;

    let active = 0;
    const dots = [];
    const show = index => {
      active = (index + images.length) % images.length;
      const item = images[active];
      mainLink.href = item.src;
      mainLink.setAttribute('aria-label', `Open ${item.alt.toLowerCase()}`);
      mainImage.src = item.src;
      mainImage.alt = item.alt;
      if (count) count.textContent = `${active + 1} / ${images.length}`;
      dots.forEach((button, index) => button.setAttribute('aria-pressed', String(index === active)));
    };

    if (gallery.closest('.room-type-editorial') && images.length > 1) {
      const indicators = document.createElement('div');
      indicators.className = 'room-feature-dots';
      indicators.setAttribute('role', 'group');
      indicators.setAttribute('aria-label', 'Choose room photograph');
      images.forEach((item, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.setAttribute('aria-label', `Show photo ${index + 1}: ${item.alt}`);
        button.addEventListener('click', () => show(index));
        button.addEventListener('keydown', (event) => {
          if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
          event.preventDefault();
          show(active + (event.key === 'ArrowRight' ? 1 : -1));
          dots[active].focus();
        });
        dots.push(button);
        indicators.append(button);
      });
      gallery.querySelector('.room-feature-main').append(indicators);
    }
    show(0);

    gallery.querySelectorAll('[data-gallery-step]').forEach(button => {
      button.addEventListener('click', () => show(active + Number(button.dataset.galleryStep)));
    });
    gallery.addEventListener('keydown', event => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      if (event.target.matches('button')) return;
      event.preventDefault();
      show(active + (event.key === 'ArrowRight' ? 1 : -1));
    });
  });
})();
