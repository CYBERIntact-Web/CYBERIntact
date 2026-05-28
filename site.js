document.addEventListener('DOMContentLoaded', function () {

  /* ── Sticky header shadow ── */
  var header = document.querySelector('header.wrap');
  if (header) {
    window.addEventListener('scroll', function () {
      header.classList.toggle('scrolled', window.scrollY > 12);
    }, { passive: true });
  }

  /* ── Theme toggle ── */
  var THEME_KEY = 're-theme';

  /* BroadcastChannel lets every open page hear the change instantly */
  var bc = null;
  try { bc = new BroadcastChannel(THEME_KEY); } catch (e) {}

  function getTheme() {
    return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
  }

  function applyTheme(theme, animate, broadcast) {
    if (animate) {
      document.documentElement.classList.add('theme-transitioning');
      setTimeout(function () {
        document.documentElement.classList.remove('theme-transitioning');
      }, 400);
    }

    if (theme === 'light') {
      document.documentElement.dataset.theme = 'light';
    } else {
      document.documentElement.removeAttribute('data-theme');
    }

    /* Save to both storages so whatever works on this browser persists */
    try { localStorage.setItem(THEME_KEY, theme); }   catch (e) {}
    try { sessionStorage.setItem(THEME_KEY, theme); } catch (e) {}

    syncIcons(theme);

    /* Tell every other open page to switch too */
    if (broadcast && bc) {
      try { bc.postMessage(theme); } catch (e) {}
    }
  }

  function syncIcons(theme) {
    document.querySelectorAll('.theme-toggle').forEach(function (btn) {
      btn.setAttribute(
        'aria-label',
        theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'
      );
    });
  }

  /* Sync icons to whatever the inline script already applied on load */
  syncIcons(getTheme());

  /* Button click on this page */
  document.querySelectorAll('.theme-toggle').forEach(function (btn) {
    btn.addEventListener('click', function () {
      applyTheme(getTheme() === 'light' ? 'dark' : 'light', true, true);
    });
  });

  /* Another page changed the theme — apply it here immediately */
  if (bc) {
    bc.onmessage = function (e) {
      applyTheme(e.data === 'light' ? 'light' : 'dark', false, false);
    };
  }

  /* Fallback for browsers that don't support BroadcastChannel */
  window.addEventListener('storage', function (e) {
    if (e.key === THEME_KEY) {
      applyTheme(e.newValue === 'light' ? 'light' : 'dark', false, false);
    }
  });

  /* ── Scroll-reveal ── */
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var revealSel = [
      '.phero', '.svc-card', '.svc-row',
      '.ch', '.doctrine li', 'footer.site'
    ].join(', ');

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.06, rootMargin: '0px 0px -28px 0px' });

    document.querySelectorAll(revealSel).forEach(function (el) {
      var rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight - 20) return;
      el.classList.add('sr');
      observer.observe(el);
    });

    ['.svc-card', '.svc-row', '.ch', '.doctrine li'].forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (el, i) {
        if (el.classList.contains('sr')) {
          el.style.transitionDelay = (i * 0.08) + 's';
        }
      });
    });
  }

});
