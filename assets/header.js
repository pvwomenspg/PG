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
