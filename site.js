/* Runs once the HTML is fully parsed and ready */
document.addEventListener('DOMContentLoaded', function () {

  /* ── Sticky header ──────────────────────────────────────────────────
     Adds a .scrolled class to the <header> after the user scrolls 12px
     down. CSS uses that class to reveal a bottom border, visually
     separating the header from the page content.                       */
  var header = document.querySelector('header');
  if (header) {
    window.addEventListener('scroll', function () {
      header.classList.toggle('scrolled', window.scrollY > 12);
    }, { passive: true }); /* passive: true improves scroll performance */
  }

  /* ── Theme toggle ───────────────────────────────────────────────────
     Manages dark / light mode switching. The chosen theme is saved to
     localStorage so it persists when the user navigates between pages. */
  var THEME_KEY = 're-theme'; /* key used in localStorage and BroadcastChannel */

  /* Open a BroadcastChannel so all open tabs receive theme changes instantly */
  var bc = null;
  try { bc = new BroadcastChannel(THEME_KEY); } catch (e) {}

  /* Returns the active theme name by reading the data-theme attribute on <html> */
  function getTheme() {
    return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
  }

  /* Applies a named theme to the page.
     animate   = true → smooth colour transition via .theme-transitioning class
     broadcast = true → sends the change to all other open tabs               */
  function applyTheme(theme, animate, broadcast) {

    /* Temporarily add a class that enables CSS transitions on all colour properties */
    if (animate) {
      document.documentElement.classList.add('theme-transitioning');
      setTimeout(function () {
        document.documentElement.classList.remove('theme-transitioning');
      }, 400);
    }

    /* Set or remove data-theme="light" on <html>; CSS variables handle the rest */
    if (theme === 'light') {
      document.documentElement.dataset.theme = 'light';
    } else {
      document.documentElement.removeAttribute('data-theme');
    }

    /* Save to both storages so the preference survives a page reload */
    try { localStorage.setItem(THEME_KEY, theme); }   catch (e) {}
    try { sessionStorage.setItem(THEME_KEY, theme); } catch (e) {}

    syncIcons(theme);

    /* Broadcast to every other open tab so they switch without a reload */
    if (broadcast && bc) {
      try { bc.postMessage(theme); } catch (e) {}
    }
  }

  /* Updates the aria-label on every theme toggle button to match the current theme */
  function syncIcons(theme) {
    document.querySelectorAll('.theme-toggle').forEach(function (btn) {
      btn.setAttribute(
        'aria-label',
        theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'
      );
    });
  }

  /* Sync button labels to whichever theme the inline <script> already applied on load */
  syncIcons(getTheme());

  /* Wire up click handlers on every toggle button found on the page */
  document.querySelectorAll('.theme-toggle').forEach(function (btn) {
    btn.addEventListener('click', function () {
      applyTheme(getTheme() === 'light' ? 'dark' : 'light', true, true);
    });
  });

  /* Receive a theme change broadcast from another open tab and apply it silently */
  if (bc) {
    bc.onmessage = function (e) {
      applyTheme(e.data === 'light' ? 'light' : 'dark', false, false);
    };
  }

  /* Fallback for browsers that do not support BroadcastChannel:
     listen for localStorage writes from other tabs via the storage event */
  window.addEventListener('storage', function (e) {
    if (e.key === THEME_KEY) {
      applyTheme(e.newValue === 'light' ? 'light' : 'dark', false, false);
    }
  });

  /* ── Scroll-reveal ──────────────────────────────────────────────────
     Fades and slides listed elements into view as the user scrolls down.
     The entire block is skipped for users who prefer reduced motion.    */
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {

    /* CSS selectors for every element type that should animate on scroll */
    var revealSel = [
      '.phero', '.svc-card', '.svc-row',
      '.ch', '.doctrine li', 'footer.site'
    ].join(', ');

    /* IntersectionObserver fires when an element enters the viewport.
       Adding .in triggers the fade-in transition defined in CSS.      */
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          observer.unobserve(entry.target); /* stop watching once revealed */
        }
      });
    }, { threshold: 0.06, rootMargin: '0px 0px -28px 0px' });

    /* Add .sr (start hidden) only to elements currently off-screen;
       elements already visible on load are left alone to avoid a flash */
    document.querySelectorAll(revealSel).forEach(function (el) {
      var rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight - 20) return;
      el.classList.add('sr');
      observer.observe(el);
    });

    /* Add a staggered delay to sibling elements so they cascade in one by one */
    ['.svc-card', '.svc-row', '.ch', '.doctrine li'].forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (el, i) {
        if (el.classList.contains('sr')) {
          el.style.transitionDelay = (i * 0.08) + 's';
        }
      });
    });
  }

});
