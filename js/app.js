const pageCache = new Map();

async function fetchText(url) {
  if (pageCache.has(url)) return pageCache.get(url);
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to load ' + url);
  const txt = await res.text();
  pageCache.set(url, txt);
  return txt;
}

async function loadFragment(selector, url) {
  const el = document.querySelector(selector);
  try {
    const html = await fetchText(url);
    el.innerHTML = html;
    if (selector === '#site-footer') {
      const y = new Date().getFullYear();
      const yel = el.querySelector('#year');
      if (yel) yel.textContent = y;
    }
  } catch (err) {
    el.innerHTML = '<div class="p-4 text-danger">Không thể tải ' + url + '</div>';
  }
}

function setActiveNav(page) {
  document.querySelectorAll('[data-link]').forEach(a => {
    try {
      const href = a.getAttribute('href') || '';
      const url = new URL(href, location.origin);
      const hrefPage = url.searchParams.get('page') || 'home';
      if (hrefPage === page || (hrefPage === 'home' && page === '/')) {
        a.classList.add('active');
      } else a.classList.remove('active');
    } catch (e) {}
  });
}

function revealContent(root = document) {
  const els = root.querySelectorAll('.fade-in');
  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach(ent => {
      if (ent.isIntersecting) {
        ent.target.classList.add('show');
        obs.unobserve(ent.target);
      }
    });
  }, { threshold: 0.12 });
  els.forEach(el => io.observe(el));
}

// -------------------------
// ROUTE MAP
// -------------------------
const routeMap = {
  '/': 'pages/home.html',
  'home': 'pages/home.html',
  'about': 'pages/about.html',
  'services': 'pages/services.html',
  'gallery': 'pages/gallery.html',
  'contact': 'pages/contact.html'
};

function currentPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const page = urlParams.get('page');
  return page && routeMap[page] ? page : 'home';
}

async function loadPage(page, push = true) {
  const file = routeMap[page] || routeMap['home'];
  const contentEl = document.getElementById('content');

  // Lưu route vào localStorage
  localStorage.setItem('lastPage', page);

  contentEl.style.transition = 'opacity .28s ease';
  contentEl.style.opacity = 0;

  setTimeout(async () => {
    try {
      const html = await fetchText(file);
      contentEl.innerHTML = html;

      if (push) {
        const newUrl = `index.html?page=${page}`;
        history.pushState({ page }, '', newUrl);
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
      revealContent(contentEl);
      attachPageScripts(contentEl);

      requestAnimationFrame(() => { contentEl.style.opacity = 1; });
    } catch (err) {
      contentEl.innerHTML = '<div class="p-4 text-danger">Không thể tải trang</div>';
      contentEl.style.opacity = 1;
    }
  }, 260);
}

function attachGlobalHandlers() {
  document.body.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-link]');
    if (!a) return;
    const href = a.getAttribute('href');
    const url = new URL(href, location.origin);
    const page = url.searchParams.get('page');
    if (page && routeMap[page]) {
      e.preventDefault();
      loadPage(page);
    }
  });

  window.addEventListener('popstate', (e) => {
    const page = (e.state && e.state.page) || currentPage();
    loadPage(page, false);
  });
}

function attachPageScripts(root = document) {
  const form = root.querySelector('#contactForm');
  if (form && !form.dataset.bound) {
    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const alertEl = root.querySelector('#contactAlert');
      if (alertEl) {
        alertEl.style.display = 'block';
        alertEl.className = 'alert alert-success';
        alertEl.textContent = 'Cảm ơn! Chúng tôi đã nhận được yêu cầu. Đội ngũ sẽ phản hồi trong vòng 24h.';
      }
      form.reset();
      setTimeout(() => { if (alertEl) alertEl.style.display = 'none'; }, 4500);
    });
    form.dataset.bound = '1';
  }
}

// -------------------------
// INIT
// -------------------------
(async function init() {
  await loadFragment('#site-header', 'header.html');
  await loadFragment('#site-footer', 'footer.html');
  attachGlobalHandlers();

  // Nếu localStorage có route trước đó, load trang đó
  const savedPage = localStorage.getItem('lastPage');
  const initialPage = savedPage && routeMap[savedPage] ? savedPage : currentPage();
  loadPage(initialPage, false);
})();


