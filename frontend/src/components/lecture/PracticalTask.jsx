import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import courseData from '../../data/course.json';

const SPACES = courseData.spaces;

export default function PracticalTask({ task, lecture, accentColor, bgColor, textColor }) {
  if (!task) return null;

  const space = SPACES[lecture.space] || SPACES.chat;

  return (
    <section className="section">
      <div className="section-label">Практичне завдання</div>
      <div className="where-row">
        <span className="where-label">Де працювати</span>
        <span className={`sp-badge sp-${lecture.space}`} title={space.tip}>
          {space.icon} {space.label}
        </span>
      </div>
      <div className="task-card">
        <div className="task-head" style={{ background: bgColor }}>
          <span
            className="task-chip"
            style={{ background: accentColor + '28', color: textColor }}
          >
            Завдання {lecture.id}
          </span>
          <div className="task-title">{task.t}</div>
        </div>
        <div className="task-body">
          {task.ss.map((step, i) => (
            <div key={i} className="task-step">
              <div className="step-num">{i + 1}</div>
              <div
                className="step-text"
                dangerouslySetInnerHTML={{ __html: step }}
              />
            </div>
          ))}
        </div>
      </div>

      {lecture.submittable && <SubmissionBlock lecture={lecture} accentColor={accentColor} />}
    </section>
  );
}

function SubmissionBlock({ lecture, accentColor }) {
  const { user } = useAuth();
  const [file, setFile]       = useState(null);
  const [figmaUrl, setFigmaUrl] = useState('');
  const [comment, setComment] = useState('');
  const [status, setStatus]   = useState('idle'); // idle | uploading | done | error
  const [existing, setExisting] = useState(null);

  useState(() => {
    if (!user) return;
    supabase
      .from('submissions')
      .select('*')
      .eq('user_id', user.id)
      .eq('lecture_id', lecture.id)
      .maybeSingle()
      .then(({ data }) => { if (data) setExisting(data); });
  }, [user, lecture.id]);

  async function submit() {
    if (!user || (!file && !figmaUrl.trim())) return;
    setStatus('uploading');
    try {
      let file_url = null;
      let file_name = null;

      if (file) {
        const ext  = file.name.split('.').pop();
        const path = `${user.id}/${lecture.id}-${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from('submissions')
          .upload(path, file, { upsert: true });
        if (upErr) throw upErr;
        file_url  = path;
        file_name = file.name;
      }

      const { error } = await supabase.from('submissions').upsert({
        user_id:    user.id,
        lecture_id: lecture.id,
        file_url,
        file_name,
        figma_url:  figmaUrl.trim() || null,
        comment:    comment.trim() || null,
      });
      if (error) throw error;
      setStatus('done');
      setExisting({ file_url, file_name, figma_url: figmaUrl, comment, reviewed: false });
    } catch {
      setStatus('error');
    }
  }

  if (existing) {
    return (
      <div className="submission-box submitted">
        <span className="sub-icon">📎</span>
        <div>
          <div className="sub-title">Роботу здано</div>
          <div className="sub-meta">
            {existing.file_name && <span>{existing.file_name}</span>}
            {existing.figma_url && <span>Figma link</span>}
            {existing.reviewed && <span className="sub-reviewed">✓ Переглянуто</span>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="submission-box" style={{ borderColor: accentColor + '44' }}>
      <div className="sub-heading">
        <span className="sub-icon">📎</span>
        <strong>Прикріпити роботу</strong>
      </div>

      <label className="sub-file-label">
        <input
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.html,.zip"
          onChange={(e) => setFile(e.target.files[0])}
          className="sub-file-input"
        />
        {file ? `📄 ${file.name}` : 'Файл (PDF, PNG, HTML, ZIP)'}
      </label>

      <input
        type="url"
        placeholder="Або вставте Figma URL"
        value={figmaUrl}
        onChange={(e) => setFigmaUrl(e.target.value)}
        className="sub-input"
      />

      <textarea
        placeholder="Коментар (необов'язково)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={2}
        className="sub-textarea"
      />

      <button
        className="sub-btn"
        style={{ background: accentColor }}
        onClick={submit}
        disabled={status === 'uploading' || (!file && !figmaUrl.trim())}
      >
        {status === 'uploading' ? 'Завантаження…' : status === 'error' ? 'Помилка — спробуй ще' : 'Здати роботу'}
      </button>
      {status === 'done' && <div className="sub-success">✓ Здано!</div>}
    </div>
  );
}
