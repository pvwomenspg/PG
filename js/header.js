(() => {
  const pageByFile = {
    'index.html': 'home',
    'rooms.html': 'rooms',
    'facilities.html': 'facilities',
    'gallery.html': 'gallery',
    'about-us.html': 'about',
    'contact.html': 'contact',
    'rules.html': 'rules'
  };
  const currentFile = window.location.pathname.split('/').filter(Boolean).pop() || 'index.html';
  const currentPage = document.body.dataset.page || pageByFile[currentFile.toLowerCase()];
  const headerLinks = document.querySelectorAll('body > header nav a[href], body > header #mobile-menu > a[href]');

  headerLinks.forEach((link) => {
    const target = new URL(link.href, window.location.href);
    const targetFile = target.pathname.split('/').filter(Boolean).pop() || 'index.html';
    const targetPage = pageByFile[targetFile.toLowerCase()];
    if (targetPage && targetPage === currentPage && !target.search && !target.hash) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });

  const menuButton = document.getElementById('menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  if (menuButton && mobileMenu) {
    menuButton.addEventListener('click', () => {
      menuButton.setAttribute('aria-expanded', String(!mobileMenu.classList.contains('hidden')));
    });
  }
})();

/* Navbar visit request form, shared by every page. */
(() => {
  const links = document.querySelectorAll('body > header .site-header-actions > a:last-child, body > header .site-mobile-header-actions > a:last-child');
  if (!links.length || !HTMLDialogElement.prototype.showModal) return;
  const css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = new URL('../css/visit-booking.css', document.currentScript.src).href;
  document.head.append(css);
  const dialog = document.createElement('dialog');
  dialog.id = 'pv-visit-dialog';
  dialog.className = 'pv-visit-dialog';
  dialog.setAttribute('aria-labelledby', 'pv-visit-heading');
  dialog.setAttribute('aria-describedby', 'pv-visit-description');
  dialog.innerHTML = `
    <div class="pv-visit-panel">
      <button class="pv-visit-close" type="button" aria-label="Close visit form">&times;</button>
      <p class="pv-visit-eyebrow">PV ASSOCIATES WOMEN'S PG</p>
      <h2 id="pv-visit-heading">Plan your property visit</h2>
      <p id="pv-visit-description">Share your details and preferred visit time. Management will confirm availability on WhatsApp.</p>
      <form>
        <div class="pv-visit-fields">
          <label>Full name *<input name="fullName" autocomplete="name" maxlength="100" required autofocus placeholder="Your full name"></label>
          <label>Phone number *<input name="phone" type="tel" autocomplete="tel" inputmode="tel" maxlength="20" required placeholder="10-digit mobile number"></label>
          <label>Student or working professional *<select name="occupation" required><option value="">Select an option</option><option>Student</option><option>Working Professional</option><option>Other</option></select></label>
          <label>Preferred room type *<select name="room" required><option value="">Select an option</option><option>Twin Sharing</option><option>Three Sharing</option><option>General Enquiry</option></select></label>
          <label>Preferred visit date *<input name="visitDate" type="date" required></label>
          <label>Preferred visit time *<input name="visitTime" type="time" required></label>
          <label class="pv-visit-wide">Additional message (Optional)<textarea name="message" rows="3" maxlength="1000" placeholder="Share any questions or visit requirements"></textarea></label>
        </div>
        <button class="pv-visit-submit" type="submit"><i class="fa-brands fa-whatsapp" aria-hidden="true"></i>Continue to WhatsApp</button>
        <p class="pv-visit-privacy">This form prepares a WhatsApp message on your device. Your details are not saved on a server. Review the message and press Send in WhatsApp. Your visit is confirmed only after management replies.</p>
      </form>
    </div>`;
  document.body.append(dialog);
  const form = dialog.querySelector('form');
  const nameInput = form.elements.namedItem('fullName');
  const phoneInput = form.elements.namedItem('phone');
  const dateInput = form.elements.namedItem('visitDate');
  let trigger;
  function updateMinimumDate() {
    const today = new Date();
    dateInput.min = [today.getFullYear(), String(today.getMonth() + 1).padStart(2, '0'), String(today.getDate()).padStart(2, '0')].join('-');
  }
  links.forEach((link) => {
    link.setAttribute('aria-haspopup', 'dialog');
    link.setAttribute('aria-controls', dialog.id);
    link.addEventListener('click', (event) => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      trigger = link;
      updateMinimumDate();
      dialog.showModal();
      document.body.classList.add('pv-visit-open');
    });
  });
  dialog.querySelector('.pv-visit-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('pv-visit-open');
    trigger?.focus({ preventScroll: true });
  });
  nameInput.addEventListener('input', () => nameInput.setCustomValidity(''));
  phoneInput.addEventListener('input', () => phoneInput.setCustomValidity(''));
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    updateMinimumDate();
    nameInput.setCustomValidity(nameInput.value.trim() ? '' : 'Please enter your full name.');
    const phone = phoneInput.value.trim().replace(/[\s()-]/g, '');
    phoneInput.setCustomValidity(/^(?:\+?91)?[6-9]\d{9}$/.test(phone) ? '' : 'Enter a valid 10-digit Indian mobile number, with or without +91.');
    if (!form.reportValidity()) return;
    const values = new FormData(form);
    const visitDate = new Date(values.get('visitDate') + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    const message = [
      "Hello, I would like to request a visit to PV Associates Women's PG.",
      '',
      'Full name: ' + nameInput.value.trim(),
      'Phone: ' + phoneInput.value.trim(),
      'Student / working professional: ' + values.get('occupation'),
      'Preferred room type: ' + values.get('room'),
      'Preferred visit date: ' + visitDate,
      'Preferred visit time: ' + values.get('visitTime'),
      'Additional message: ' + (values.get('message').trim() || 'None'),
      '',
      'Please confirm whether this visit time is available.'
    ].join('\n');
    window.open('https://wa.me/917200060377?text=' + encodeURIComponent(message), '_blank', 'noopener,noreferrer');
  });
})();
