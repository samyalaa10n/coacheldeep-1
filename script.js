/* ---------- API config ---------- */
// عنوان الـ API بعد ما ترفعه (لازم https وبدون / في الآخر)
 var API_BASE = 'https://coacheldeepapi.runasp.net';
//var API_BASE = 'https://localhost:44397';

/* ---------- lightbox (certificates only) ---------- */
function openLightbox(src) {
  document.getElementById('lightbox-img').src = src;
  document.getElementById('lightbox').classList.add('active');
  document.body.classList.add('no-scroll');
}
function closeLightbox() {
  document.getElementById('lightbox').classList.remove('active');
  document.body.classList.remove('no-scroll');
}
document.addEventListener('DOMContentLoaded', function () {
  var lb = document.getElementById('lightbox');
  if (lb) {
    lb.addEventListener('click', function (e) {
      if (e.target === this) closeLightbox();
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeLightbox();
  });
});

/* ---------- mobile nav ---------- */
function toggleMobileNav() {
  var mnav = document.getElementById('mnav');
  var burger = document.querySelector('.burger');
  var isOpen = mnav.classList.toggle('active');
  document.body.classList.toggle('no-scroll', isOpen);
  if (burger) burger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
}

/* ---------- scroll reveal animation ---------- */
var revealObserver = null;

// بتتنده عليها للعناصر الموجودة وللكروت اللي بتتضاف بعد تحميل الـ API
function observeReveal(els) {
  Array.prototype.forEach.call(els, function (el, i) {
    if (!revealObserver) { el.classList.add('in-view'); return; }
    el.style.setProperty('--reveal-delay', (i % 6) * 70 + 'ms');
    revealObserver.observe(el);
  });
}

document.addEventListener('DOMContentLoaded', function () {
  if ('IntersectionObserver' in window) {
    revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
  }

  observeReveal(document.querySelectorAll('.reveal, .client-card, .cert-card, .program, .price-card, .stat'));
});

/* ---------- graceful fallback for missing client photos ---------- */
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.client-photo img').forEach(function (img) {
    img.addEventListener('error', function () {
      this.closest('.client-photo').classList.add('img-missing');
    }, { once: true });
  });
});

/* ---------- client results from the admin API ---------- */
function formatWeeks(w) {
  w = parseInt(w, 10);
  if (!w || w < 1) return '';
  if (w === 1) return 'شهر';
  if (w === 2) return 'شهرين';
  if (w <= 10) return w + ' شهر';
  return w + ' شهر';
}

// بنقبل روابط http/https بس
function safeUrl(u) {
  return typeof u === 'string' && /^https?:\/\//i.test(u) ? u : null;
}

function makePhoto(url, label, alt) {
  var box = document.createElement('div');
  box.className = 'client-photo';

  var img = document.createElement('img');
  img.src = url;
  img.alt = alt;
  img.loading = 'lazy';
  img.addEventListener('error', function () { box.classList.add('img-missing'); }, { once: true });
  box.appendChild(img);

  if (label) {
    var tag = document.createElement('span');
    tag.className = 'ba-label';
    tag.textContent = label;
    box.appendChild(tag);
  }
  return box;
}

function makeCard(c) {
  var before = safeUrl(c.beforePhoto);
  var after = safeUrl(c.afterPhoto);
  if (!before && !after) return null;

  var card = document.createElement('div');
  card.className = 'client-card reveal';

  var media = document.createElement('div');
  if (before && after) {
    media.className = 'client-pair';
    media.appendChild(makePhoto(before, 'قبل', 'صورة المتدرب قبل البرنامج'));
    media.appendChild(makePhoto(after, 'بعد', 'صورة المتدرب بعد البرنامج'));
  } else {
    media.className = 'client-single';   // صورة واحدة بدون تسمية
    media.appendChild(makePhoto(before || after, '', 'نتيجة متدرب قبل وبعد'));
  }
  card.appendChild(media);

  var dur = formatWeeks(c.trainingWeeks);
  if (dur) {
    var info = document.createElement('div');
    info.className = 'client-info';
    var badge = document.createElement('span');
    badge.className = 'duration-badge';
    badge.textContent = dur;
    info.appendChild(badge);
    card.appendChild(info);
  }
  return card;
}

function showStatus(grid, text) {
  grid.textContent = '';
  var p = document.createElement('p');
  p.className = 'grid-status';
  p.textContent = text;
  grid.appendChild(p);
}

document.addEventListener('DOMContentLoaded', function () {
  var grid = document.querySelector('.client-grid[data-goal]');
  if (!grid) return;

  if (API_BASE.indexOf('YOUR-API-DOMAIN') !== -1) {
    console.warn('script.js: غيّر API_BASE لعنوان الـ API الحقيقي');
    showStatus(grid, 'النتائج هتتضاف هنا قريبًا');
    return;
  }

  var controller = new AbortController();
  var timer = setTimeout(function () { controller.abort(); }, 15000);
  var url = API_BASE.replace(/\/+$/, '') + '/api/public/clients?goal=' + encodeURIComponent(grid.dataset.goal);

  fetch(url, { signal: controller.signal, headers: { 'Accept': 'application/json' } })
    .then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    })
    .then(function (list) {
      clearTimeout(timer);
      var cards = (Array.isArray(list) ? list : []).map(makeCard).filter(Boolean);

      if (!cards.length) {
        showStatus(grid, 'النتائج هتتضاف هنا قريبًا');
        return;
      }
      grid.textContent = '';
      cards.forEach(function (card) { grid.appendChild(card); });
      observeReveal(cards);
    })
    .catch(function () {
      clearTimeout(timer);
      showStatus(grid, 'مش قادر أحمّل النتائج دلوقتي، حاول بعد شوية');
    });
});