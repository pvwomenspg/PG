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
  const links = Array.from(document.querySelectorAll('a[href]')).filter((link) => /^(book\s*(a\s*)?visit|arrange a visit)$/i.test(link.textContent.trim()));
  if (!links.length || !HTMLDialogElement.prototype.showModal) return;
  const css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = new URL('../css/visit-booking.css', document.currentScript.src).href;
  document.head.append(css);
  const accountModuleUrl = new URL('auth-client.js', document.currentScript.src).href;
  const bookingModuleUrl = new URL('booking-store.js', document.currentScript.src).href;
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
      <p id="pv-visit-description">Share your details and preferred visit time. Submit a visit request. Management will review your preferred date and time.</p>
      <div class="pv-visit-account"><span class="pv-visit-identity"></span><button type="button" class="pv-visit-signout">Sign Out</button></div>
      <form>
        <div class="pv-visit-fields">
          <label>Full name *<input name="fullName" autocomplete="name" maxlength="100" required autofocus placeholder="Your full name"></label>
          <label>Phone number *<input name="phone" type="tel" autocomplete="tel" inputmode="tel" maxlength="20" required placeholder="10-digit mobile number"></label>
          <label>Student or working professional *<select name="occupation" required><option value="">Select an option</option><option>Student</option><option>Working Professional</option><option>Other</option></select></label>
          <label>Preferred room type *<select name="room" required><option value="">Select an option</option><option>Twin Sharing</option><option>Three Sharing</option><option>General Enquiry</option></select></label>
          <label>Preferred visit date *<input name="visitDate" type="date" required></label>
          <label>Preferred visit time (IST) *<input name="visitTime" type="time" required></label>
          <label class="pv-visit-wide">Additional message (Optional)<textarea name="message" rows="3" maxlength="1000" placeholder="Share any questions or visit requirements"></textarea></label>
        </div>
        <button class="pv-visit-submit" type="submit">Submit Visit Request</button>
        <p class="pv-visit-status" role="status" aria-live="polite" tabindex="-1" hidden></p>
        <button class="pv-visit-new" type="button" hidden>Plan Another Visit</button>
        <p class="pv-visit-privacy">Your details will be saved securely to your account in our booking database for management to review. Submitting a request does not confirm your visit.</p>
      </form>
    </div>`;
  document.body.append(dialog);
  const form = dialog.querySelector('form');
  const nameInput = form.elements.namedItem('fullName');
  const phoneInput = form.elements.namedItem('phone');
  const dateInput = form.elements.namedItem('visitDate');
  const submitButton = dialog.querySelector('.pv-visit-submit');
  const statusMessage = dialog.querySelector('.pv-visit-status');
  const newVisitButton = dialog.querySelector('.pv-visit-new');
  let saving = false;
  let submitted = false;
  let requestId;
  let requestFingerprint;
  let trigger;
  function updateMinimumDate() {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(new Date());
    const part = (type) => parts.find((entry) => entry.type === type).value;
    dateInput.min = [part('year'), part('month'), part('day')].join('-');
  }
  let opening = false;
  async function openBooking(event, link) {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (opening) return;
    opening = true;
    link.setAttribute('aria-busy', 'true');
    try {
      const { requireBookingAccount } = await import(accountModuleUrl);
      const user = await requireBookingAccount();
      if (!user) return;
      trigger = link;
      if (!submitted) nameInput.value = user.user_metadata?.full_name || nameInput.value;
      dialog.querySelector('.pv-visit-identity').textContent = 'Signed in as ' + user.email;
      updateMinimumDate();
      dialog.showModal();
      document.body.classList.add('pv-visit-open');
    } catch (error) {
      alert('Unable to open account access. Please try again.');
    } finally {
      opening = false;
      link.removeAttribute('aria-busy');
    }
  }
  links.forEach((link) => {
    link.setAttribute('aria-haspopup', 'dialog');
    link.setAttribute('aria-controls', dialog.id);
    link.addEventListener('click', (event) => openBooking(event, link));
  });
  dialog.querySelector('.pv-visit-signout').addEventListener('click', async (event) => {
    if (saving) return;
    event.currentTarget.disabled = true;
    try {
      const { getAuthClient } = await import(accountModuleUrl);
      const client = await getAuthClient();
      const { error } = await client.auth.signOut();
      if (error) throw error;
      resetVisitForm();
      dialog.close();
    } catch (error) {
      alert('Unable to sign out. Please try again.');
    } finally {
      dialog.querySelector('.pv-visit-signout').disabled = false;
    }
  });
  const bookingUrl = new URL(location.href);
  if (bookingUrl.searchParams.get('book') === '1') {
    bookingUrl.searchParams.delete('book');
    history.replaceState(history.state, '', bookingUrl.href);
    const visibleLink = Array.from(links).find((link) => link.getClientRects().length) || links[0];
    openBooking({ preventDefault() {} }, visibleLink);
  }
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
  function resetVisitForm() {
    form.reset();
    for (const control of form.elements) control.disabled = false;
    saving = false;
    submitted = false;
    requestId = undefined;
    requestFingerprint = undefined;
    statusMessage.textContent = '';
    statusMessage.hidden = true;
    newVisitButton.hidden = true;
    submitButton.textContent = 'Submit Visit Request';
    form.removeAttribute('aria-busy');
    nameInput.setCustomValidity('');
    phoneInput.setCustomValidity('');
  }
  newVisitButton.addEventListener('click', () => {
    resetVisitForm();
    updateMinimumDate();
    nameInput.focus();
  });
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (saving || submitted) return;
    updateMinimumDate();
    nameInput.setCustomValidity(nameInput.value.trim() ? '' : 'Please enter your full name.');
    const phone = phoneInput.value.trim().replace(/[\s()-]/g, '');
    phoneInput.setCustomValidity(/^(?:\+?91)?[6-9]\d{9}$/.test(phone) ? '' : 'Enter a valid 10-digit Indian mobile number, with or without +91.');
    if (!form.reportValidity()) return;
    const values = new FormData(form);
    const requestedTime = new Date(values.get('visitDate') + 'T' + values.get('visitTime') + ':00+05:30');
    if (requestedTime <= new Date()) {
      statusMessage.textContent = 'Please choose a future visit date and time (IST).';
      statusMessage.hidden = false;
      return;
    }
    saving = true;
    form.setAttribute('aria-busy', 'true');
    for (const control of form.elements) control.disabled = true;
    dialog.querySelector('.pv-visit-signout').disabled = true;
    submitButton.textContent = 'Saving request…';
    statusMessage.hidden = true;
    try {
      const { requireBookingAccount } = await import(accountModuleUrl);
      const account = await requireBookingAccount();
      if (!account) return;
      const details = {
        user_id: account.id,
        full_name: values.get('fullName').trim(),
        phone: '+91' + phone.slice(-10),
        email: account.email,
        occupation: values.get('occupation'),
        room_type: values.get('room'),
        visit_date: values.get('visitDate'),
        visit_time: values.get('visitTime'),
        message: values.get('message').trim()
      };
      const fingerprint = JSON.stringify(details);
      if (fingerprint !== requestFingerprint) {
        requestId = crypto.randomUUID();
        requestFingerprint = fingerprint;
      }
      const { saveVisitBooking } = await import(bookingModuleUrl);
      const saved = await saveVisitBooking({ id: requestId, ...details });
      submitted = true;
      submitButton.textContent = 'Request Saved';
      statusMessage.textContent = 'Your visit request has been saved and is awaiting management confirmation. Reference: ' + saved.id;
      statusMessage.hidden = false;
      newVisitButton.hidden = false;
      newVisitButton.disabled = false;
      statusMessage.focus();
    } catch (error) {
      statusMessage.textContent = error.code === '23514'
        ? 'Please check your details and choose a future visit time, then try again.'
        : 'We could not save your visit request. Your details are still here. Please try again or contact management.';
      statusMessage.hidden = false;
      statusMessage.focus();
    } finally {
      saving = false;
      form.removeAttribute('aria-busy');
      dialog.querySelector('.pv-visit-signout').disabled = false;
      if (!submitted) {
        for (const control of form.elements) control.disabled = false;
        submitButton.textContent = 'Submit Visit Request';
      }
    }
  });
})();
