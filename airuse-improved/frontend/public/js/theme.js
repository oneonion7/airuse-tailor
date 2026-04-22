/**
 * js/theme.js — Shared dark/light theme toggle
 * Include this on every page BEFORE other scripts.
 * Reads localStorage so the theme persists across pages.
 */

(function () {
  // Apply saved theme immediately to prevent flash
  const saved = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);

    // Update all toggle button icons on the page
    document.querySelectorAll('.theme-toggle').forEach(btn => {
      btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
      btn.setAttribute('title',      theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    });
  }

  // Wire up any toggle buttons that already exist (and future ones via delegated click)
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('.theme-toggle');
    if (!btn) return;
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    applyTheme(current === 'dark' ? 'light' : 'dark');
  });

  // Re-apply on DOMContentLoaded so aria labels are set after HTML renders
  document.addEventListener('DOMContentLoaded', function () {
    applyTheme(localStorage.getItem('theme') || 'dark');
  });
})();
