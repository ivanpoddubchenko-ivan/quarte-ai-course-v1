const router = require('express').Router();
const { requireAuth, supabase } = require('../middleware/auth');

// GET /progress — my progress + quiz scores
router.get('/', requireAuth, async (req, res) => {
  const uid = req.user.id;
  const [prog, quiz] = await Promise.all([
    supabase.from('progress').select('lecture_id, done_at').eq('user_id', uid),
    supabase.from('quiz_attempts').select('module_id, score, total, attempted_at').eq('user_id', uid).order('attempted_at', { ascending: false }),
  ]);
  res.json({ progress: prog.data, quizAttempts: quiz.data });
});

// POST /progress/:lectureId — mark done
router.post('/:lectureId', requireAuth, async (req, res) => {
  const { error } = await supabase.from('progress').upsert({
    user_id:    req.user.id,
    lecture_id: Number(req.params.lectureId),
  });
  if (error) return res.status(400).json({ error: error.message });
  res.json({ ok: true });
});

// DELETE /progress/:lectureId — unmark done
router.delete('/:lectureId', requireAuth, async (req, res) => {
  await supabase.from('progress').delete().match({
    user_id:    req.user.id,
    lecture_id: Number(req.params.lectureId),
  });
  res.json({ ok: true });
});

module.exports = router;
