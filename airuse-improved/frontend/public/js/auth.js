/**
 * js/auth.js
 * Shared Supabase client for all frontend pages.
 * Loaded via <script> tag — exposes window._supabase and window._auth helpers.
 *
 * IMPORTANT: This file is loaded BEFORE page-specific scripts.
 */

// ── Initialize Supabase client ─────────────────────────────────────────────
// These are the PUBLIC (anon/publishable) keys — safe to expose in frontend.
const SUPABASE_URL      = 'https://xlcnkjzczobpoopyavmd.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_or_gpfHZ5_dkIndoWT8zCQ_n_8FmWs7';

window._supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── Auth helpers ───────────────────────────────────────────────────────────

/**
 * Get the currently logged-in user (or null if not logged in).
 * Usage: const user = await _auth.getUser();
 */
window._auth = {

  async getUser() {
    const { data: { user } } = await window._supabase.auth.getUser();
    return user;
  },

  async getSession() {
    const { data: { session } } = await window._supabase.auth.getSession();
    return session;
  },

  /**
   * Sign the user out and redirect to login page.
   */
  async signOut() {
    await window._supabase.auth.signOut();
    window.location.href = 'login.html';
  },

  /**
   * Redirect to login if not authenticated.
   * Call this at the top of any page that requires auth.
   * Returns the user object if authenticated.
   */
  async requireAuth() {
    const user = await this.getUser();
    if (!user) {
      const currentPage = encodeURIComponent(window.location.pathname.split('/').pop());
      window.location.href = `login.html?redirect=${currentPage}`;
      return null;
    }
    return user;
  },

  /**
   * Get the auth token (JWT) for backend API calls.
   * Send this in the Authorization header.
   */
  async getToken() {
    const session = await this.getSession();
    return session?.access_token || null;
  },

  /**
   * Helper: makes an authenticated fetch to the backend.
   * Automatically attaches the JWT Authorization header.
   */
  async apiFetch(url, options = {}) {
    const token = await this.getToken();
    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });
  },

};

// ── Redirect logged-in users away from auth pages ──────────────────────────
// If a logged-in user visits login.html or signup.html, send them to dashboard.
(async () => {
  const currentPage = window.location.pathname.split('/').pop();
  const authPages   = ['login.html', 'signup.html'];

  if (authPages.includes(currentPage)) {
    const user = await window._auth.getUser();
    if (user) {
      window.location.href = 'dashboard.html';
    }
  }
})();
