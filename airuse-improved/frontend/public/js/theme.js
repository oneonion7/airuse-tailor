/**
 * js/theme.js — Shared dark/light theme toggle
 * Loaded FIRST in <head> (before CSS renders) to prevent flash.
 */
(function () {
  const ROOT = document.documentElement;

  // ── Apply immediately (no flash) ──────────────────────────────────────────
  const saved = localStorage.getItem('theme') || 'dark';
  ROOT.setAttribute('data-theme', saved);

  // ── Toggle logic ───────────────────────────────────────────────────────────
  function applyTheme(theme) {
    ROOT.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }

  // Delegated click — works for dynamically added buttons too
  document.addEventListener('click', function (e) {
    if (e.target.closest('.theme-toggle')) {
      const current = ROOT.getAttribute('data-theme') || 'dark';
      applyTheme(current === 'dark' ? 'light' : 'dark');
    }
  });

  // Expose for programmatic use
  window._theme = { apply: applyTheme, get: () => ROOT.getAttribute('data-theme') };
})();
