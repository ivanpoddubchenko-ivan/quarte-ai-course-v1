const router = require('express').Router();

// Auth is handled entirely by Supabase + Google OAuth on the client.
// This route exists as a health-check and for future server-side callbacks.

router.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'ai-course-bff' });
});

module.exports = router;
