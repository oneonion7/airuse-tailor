/**
 * backend/middleware/auth.js
 * Verifies the Supabase JWT from the Authorization header.
 * Attaches req.user on success — rejects with 401 if invalid/missing.
 */

const { createClient } = require('@supabase/supabase-js');

// Admin client — uses the service role key to verify tokens
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

/**
 * requireAuth middleware
 * Use on any route that needs a logged-in user.
 *
 * On success: sets req.user = { id, email, ... } and calls next()
 * On failure: responds with 401
 */
async function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized — missing token.' });
  }

  const token = authHeader.slice(7); // strip "Bearer "

  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Unauthorized — invalid or expired token.' });
    }

    req.user = user;   // attach user to request for downstream handlers
    next();
  } catch (err) {
    console.error('[auth middleware] Error:', err.message);
    return res.status(500).json({ error: 'Auth check failed.' });
  }
}

module.exports = { requireAuth, supabaseAdmin };
