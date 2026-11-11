/* The dedicated Gallery owns category selection and the property-photo viewer. */
(() => {
  const section = document.querySelector('.gallery-page-collection');
  if (!section) return;

  const grid = section.querySelector('[data-gallery-grid]');
  const tiles = [...grid.querySelectorAll('.gallery-page-tile')];
  const filters = [...section.querySelectorAll('[data-gallery-filter]')];
  const status = section.querySelector('[data-gallery-results]');
  const filterBar = section.querySelector('.gallery-page-filters');
  const highlightsHeading = section.querySelector('[data-gallery-highlights-heading]');
  const featuredGrid = section.querySelector('[data-gallery-featured-grid]');
  const previewCount = section.querySelector('[data-gallery-preview-count]');
  const moreButton = section.querySelector('[data-gallery-more]');
  const categoryNames = new Map(filters.map(button => [button.dataset.galleryFilter, button.textContent.trim().replace(/\s*\(\d+\)$/, '')]));
  const aliases = { dining: 'dining-hall', bathrooms: 'bathrooms-and-washbasins', property: 'building-exterior' };
  let selected = 'all';
  let visible = [];
  let current = 0;
  let trigger;
  const pageSize = 12;
  let previewLimit = pageSize;

  // Featured cards are views of these same records, not additional photographs.
  const featuredLinks = [];
  if (featuredGrid) {
    ['room', 'dining', 'bathroom'].forEach(kind => {
      const source = tiles.find(tile => tile.dataset.galleryHighlight === kind);
      if (!source) return;
      const view = source.cloneNode(true);
      ['categories', 'sources', 'captions', 'primary'].forEach(name => view.removeAttribute(`data-gallery-${name}`));
      view.setAttribute('data-gallery-projection', '');
      const link = view.querySelector('a');
      link.removeAttribute('data-gallery-photo');
      featuredGrid.append(view);
      featuredLinks.push({ source, link });
    });
  }

  const dialog = document.createElement('dialog');
  dialog.className = 'gallery-page-lightbox';
  dialog.setAttribute('aria-label', 'Property photograph viewer');
  dialog.setAttribute('aria-describedby', 'gallery-page-photo-caption');
  const controls = document.createElement('div');
  controls.className = 'gallery-page-lightbox-controls';
  const makeButton = (label, text) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-label', label);
    button.textContent = text;
    return button;
  };
  const previous = makeButton('Previous photograph', '←');
  const close = makeButton('Close photo viewer', 'Close ×');
  const next = makeButton('Next photograph', '→');
  const image = document.createElement('img');
  const caption = document.createElement('p');
  caption.id = 'gallery-page-photo-caption';
  caption.setAttribute('aria-live', 'polite');
  controls.append(previous, close, next);
  dialog.append(controls, image, caption);
  document.body.append(dialog);

  const normalizeCategory = value => {
    const id = String(value || 'all').trim().toLowerCase();
    const resolved = aliases[id] || id;
    return categoryNames.has(resolved) ? resolved : 'all';
  };

  // Reveal the selected pill inside the mobile scroller without moving the page.
  const revealActiveFilter = () => {
    if (!filterBar || filterBar.scrollWidth <= filterBar.clientWidth) return;
    const active = filters.find(button => button.dataset.galleryFilter === selected);
    const barRect = filterBar.getBoundingClientRect();
    const activeRect = active.getBoundingClientRect();
    if (activeRect.left < barRect.left + 8) {
      filterBar.scrollBy({ left: activeRect.left - barRect.left - 8, behavior: 'auto' });
    } else if (activeRect.right > barRect.right - 8) {
      filterBar.scrollBy({ left: activeRect.right - barRect.right + 8, behavior: 'auto' });
    }
  };

  const readPreviewLimit = () => {
    const value = new URL(window.location.href).searchParams.get('photos');
    if (value === 'all') return Infinity;
    const number = Number(value);
    return Number.isSafeInteger(number) && number >= pageSize
      ? Math.floor(number / pageSize) * pageSize : pageSize;
  };

  const updateURL = () => {
    const url = new URL(window.location.href);
    if (selected === 'all') url.searchParams.delete('category');
    else url.searchParams.set('category', selected);
    if (previewLimit <= pageSize || visible.length <= pageSize) url.searchParams.delete('photos');
    else url.searchParams.set('photos', previewLimit >= visible.length ? 'all' : String(previewLimit));
    if (url.href !== window.location.href) window.history.pushState(null, '', url.href);
  };

  const updatePreview = () => {
    const shown = Math.min(previewLimit, visible.length);
    const displayed = new Set(visible.slice(0, shown));
    tiles.forEach(tile => { tile.hidden = !displayed.has(tile); });
    grid.dataset.visibleCount = String(visible.length);
    if (previewCount) previewCount.textContent = shown === visible.length
      ? `Showing ${shown} ${shown === 1 ? 'photograph' : 'photographs'}`
      : `Showing ${shown} of ${visible.length} photographs`;
    if (moreButton) {
      const expanded = shown === visible.length;
      moreButton.hidden = visible.length <= pageSize;
      moreButton.setAttribute('aria-expanded', String(expanded));
      moreButton.querySelector('span').textContent = expanded ? 'Show Less' : 'View More Photos';
      moreButton.querySelector('i').className = `fa-solid fa-chevron-${expanded ? 'up' : 'down'}`;
    }
  };

  const selectCategory = (value, updateHistory = false, limit = pageSize) => {
    if (dialog.open) dialog.close();
    selected = normalizeCategory(value);
    if (highlightsHeading) highlightsHeading.hidden = selected !== 'all';
    if (featuredGrid) featuredGrid.hidden = selected !== 'all';
    previewLimit = limit;
    filters.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.galleryFilter === selected)));
    revealActiveFilter();
    tiles.forEach(tile => {
      const categories = tile.dataset.galleryCategories.split(' ');
      const category = categories.includes(selected) && !['rooms', 'common-areas'].includes(selected) ? selected : tile.dataset.galleryPrimary;
      const captions = JSON.parse(tile.dataset.galleryCaptions);
      const text = captions[category];
      tile.querySelector('.gallery-page-category').textContent = categoryNames.get(category);
      const view = text.match(/view\s+(\d+)/i);
      tile.querySelector('.gallery-page-caption').textContent = view ? `View ${view[1]}` : text;
      tile.querySelector('img').alt = text;
      tile.querySelector('a').setAttribute('aria-label', `Enlarge: ${text}`);
    });
    visible = tiles.filter(tile => selected === 'all' || tile.dataset.galleryCategories.split(' ').includes(selected));
    updatePreview();
    status.textContent = selected === 'all'
      ? `Showing all ${visible.length} photographs`
      : `${categoryNames.get(selected)} — ${visible.length} ${visible.length === 1 ? 'photograph' : 'photographs'}`;
    if (updateHistory) updateURL();
  };

  filters.forEach(button => button.addEventListener('click', () => selectCategory(button.dataset.galleryFilter, true)));
  window.addEventListener('popstate', () => selectCategory(new URL(window.location.href).searchParams.get('category'), false, readPreviewLimit()));
  window.addEventListener('resize', revealActiveFilter);
  selectCategory(new URL(window.location.href).searchParams.get('category'), false, readPreviewLimit());
  moreButton?.addEventListener('click', () => {
    previewLimit = previewLimit >= visible.length ? pageSize : Math.min(previewLimit + pageSize, visible.length);
    updatePreview();
    updateURL();
  });

  const show = index => {
    if (!visible.length) return;
    current = (index + visible.length) % visible.length;
    const tile = visible[current];
    const link = tile.querySelector('a');
    image.src = link.href;
    image.alt = tile.querySelector('img').alt;
    caption.textContent = `${tile.querySelector('.gallery-page-category').textContent} · ${image.alt} — ${current + 1} of ${visible.length}`;
    previous.disabled = next.disabled = visible.length < 2;
  };
  const attachPhoto = (tile, link) => {
    link.addEventListener('click', event => {
      if (typeof dialog.showModal !== 'function' || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button > 0) return;
      const index = visible.indexOf(tile);
      if (index < 0) return;
      event.preventDefault();
      trigger = link;
      show(index);
      dialog.showModal();
      document.body.classList.add('gallery-page-photo-open');
      close.focus();
    });
  };
  tiles.forEach(tile => attachPhoto(tile, tile.querySelector('a')));
  featuredLinks.forEach(({ source, link }) => attachPhoto(source, link));
  previous.addEventListener('click', () => show(current - 1));
  next.addEventListener('click', () => show(current + 1));
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      show(current + (event.key === 'ArrowRight' ? 1 : -1));
    }
    // Escape uses the native dialog cancel behavior and focus containment.
  });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('gallery-page-photo-open');
    image.removeAttribute('src');
    trigger?.focus();
  });
  let touchStart = null;
  image.addEventListener('touchstart', event => {
    if (event.touches.length !== 1) { touchStart = null; return; }
    touchStart = { x: event.touches[0].clientX, y: event.touches[0].clientY };
  }, { passive: true });
  image.addEventListener('touchend', event => {
    if (!touchStart) return;
    const dx = event.changedTouches[0].clientX - touchStart.x;
    const dy = event.changedTouches[0].clientY - touchStart.y;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) show(current + (dx < 0 ? 1 : -1));
    touchStart = null;
  }, { passive: true });
  image.addEventListener('touchcancel', () => { touchStart = null; }, { passive: true });
})();
