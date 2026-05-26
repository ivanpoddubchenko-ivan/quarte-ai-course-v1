const router = require('express').Router();
const { requireAuth, supabase } = require('../middleware/auth');

// GET /submissions — my submissions
router.get('/', requireAuth, async (req, res) => {
  const { data } = await supabase
    .from('submissions')
    .select('*')
    .eq('user_id', req.user.id)
    .order('submitted_at', { ascending: false });
  res.json(data);
});

// POST /submissions — create/update submission metadata
// (File is uploaded directly from browser to Supabase Storage;
//  this endpoint just records the storage path + comment)
router.post('/', requireAuth, async (req, res) => {
  const { lectureId, stepIndex, fileUrl, fileName, figmaUrl, comment } = req.body;
  if (!lectureId) return res.status(400).json({ error: 'lectureId required' });

  const { error } = await supabase.from('submissions').upsert({
    user_id:    req.user.id,
    lecture_id: lectureId,
    step_index: stepIndex ?? null,
    file_url:   fileUrl ?? null,
    file_name:  fileName ?? null,
    figma_url:  figmaUrl ?? null,
    comment:    comment ?? null,
  });
  if (error) return res.status(400).json({ error: error.message });
  res.json({ ok: true });
});

module.exports = router;
