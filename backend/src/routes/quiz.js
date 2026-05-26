const router = require('express').Router();
const { requireAuth, supabase } = require('../middleware/auth');

// POST /quiz — save a quiz attempt
router.post('/', requireAuth, async (req, res) => {
  const { moduleId, score, total } = req.body;
  if (typeof moduleId !== 'number' || typeof score !== 'number' || typeof total !== 'number') {
    return res.status(400).json({ error: 'Invalid payload' });
  }
  const { error } = await supabase.from('quiz_attempts').insert({
    user_id:   req.user.id,
    module_id: moduleId,
    score,
    total,
  });
  if (error) return res.status(400).json({ error: error.message });
  res.json({ ok: true });
});

module.exports = router;
