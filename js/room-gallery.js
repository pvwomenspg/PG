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
    const show = index => {
      active = (index + images.length) % images.length;
      const item = images[active];
      mainLink.href = item.src;
      mainLink.setAttribute('aria-label', `Open ${item.alt.toLowerCase()}`);
      mainImage.src = item.src;
      mainImage.alt = item.alt;
      count.textContent = `${active + 1} / ${images.length}`;
    };

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
