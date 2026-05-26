const router = require('express').Router();
const { requireAdmin, supabase } = require('../middleware/auth');

// All admin routes require admin role

// GET /admin/students — all students with progress summary
router.get('/students', requireAdmin, async (req, res) => {
  const [students, progress, quizzes, submissions] = await Promise.all([
    supabase.from('users').select('*').eq('role', 'student').order('created_at'),
    supabase.from('progress').select('*'),
    supabase.from('quiz_attempts').select('*'),
    supabase.from('submissions').select('*').order('submitted_at', { ascending: false }),
  ]);
  res.json({
    students:    students.data,
    progress:    progress.data,
    quizzes:     quizzes.data,
    submissions: submissions.data,
  });
});

// PATCH /admin/submissions/:id/review — mark reviewed
router.patch('/submissions/:id/review', requireAdmin, async (req, res) => {
  const { error } = await supabase
    .from('submissions')
    .update({ reviewed: true, reviewed_at: new Date().toISOString() })
    .eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ ok: true });
});

// PATCH /admin/users/:id/role — promote/demote
router.patch('/users/:id/role', requireAdmin, async (req, res) => {
  const { role } = req.body;
  if (!['student', 'admin'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
  const { error } = await supabase.from('users').update({ role }).eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ ok: true });
});

// PATCH /admin/users/:id/role — promote user to admin
router.post('/users/:id/make-admin', requireAdmin, async (req, res) => {
  const { error } = await supabase.from('users').update({ role: 'admin' }).eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ ok: true });
});

module.exports = router;
