const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY  // service role for server-side validation
);

const ALLOWED_DOMAIN = 'inveritasoft.com';

async function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' });

  const token = header.slice(7);
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) return res.status(401).json({ error: 'Invalid token' });

  // Domain enforcement — belt-and-suspenders
  if (!user.email?.endsWith(`@${ALLOWED_DOMAIN}`)) {
    return res.status(403).json({ error: `Only @${ALLOWED_DOMAIN} accounts allowed` });
  }

  req.user = user;
  next();
}

async function requireAdmin(req, res, next) {
  await requireAuth(req, res, async () => {
    const { data } = await supabase
      .from('users')
      .select('role')
      .eq('id', req.user.id)
      .single();

    if (data?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    next();
  });
}

module.exports = { requireAuth, requireAdmin, supabase };
