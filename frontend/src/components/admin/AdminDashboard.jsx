import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import courseData from '../../data/course.json';

const { modules, lectures } = courseData;

export default function AdminDashboard() {
  const [students, setStudents]       = useState([]);
  const [progress, setProgress]       = useState([]);   // all rows from progress table
  const [submissions, setSubmissions] = useState([]);
  const [quizzes, setQuizzes]         = useState([]);
  const [tab, setTab]                 = useState('cohort'); // cohort | submissions
  const [selected, setSelected]       = useState(null);    // selected student id
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    async function load() {
      const [s, p, sub, q] = await Promise.all([
        supabase.from('users').select('*').eq('role', 'student').order('created_at'),
        supabase.from('progress').select('*'),
        supabase.from('submissions').select('*').order('submitted_at', { ascending: false }),
        supabase.from('quiz_attempts').select('*'),
      ]);
      setStudents(s.data ?? []);
      setProgress(p.data ?? []);
      setSubmissions(sub.data ?? []);
      setQuizzes(q.data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  async function markReviewed(subId) {
    await supabase
      .from('submissions')
      .update({ reviewed: true, reviewed_at: new Date().toISOString() })
      .eq('id', subId);
    setSubmissions((prev) =>
      prev.map((s) => (s.id === subId ? { ...s, reviewed: true } : s))
    );
  }

  async function exportCSV() {
    const rows = [['Email', 'Name', ...modules.map((m) => m.name), 'Total %']];
    students.forEach((st) => {
      const doneIds = new Set(
        progress.filter((p) => p.user_id === st.id).map((p) => p.lecture_id)
      );
      const modPcts = modules.map((mod) => {
        const modLecs = lectures.filter((l) => l.moduleId === mod.id);
        return Math.round((modLecs.filter((l) => doneIds.has(l.id)).length / modLecs.length) * 100) + '%';
      });
      const total = Math.round((doneIds.size / lectures.length) * 100) + '%';
      rows.push([st.email, st.full_name ?? '', ...modPcts, total]);
    });
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'cohort-progress.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <div className="admin-loading">Завантаження…</div>;

  return (
    <div className="admin-root">
      <div className="admin-header">
        <h1 className="admin-title">Admin Dashboard</h1>
        <div className="admin-tabs">
          <button className={`atab${tab === 'cohort' ? ' active' : ''}`} onClick={() => setTab('cohort')}>
            Прогрес когорти
          </button>
          <button className={`atab${tab === 'submissions' ? ' active' : ''}`} onClick={() => setTab('submissions')}>
            Роботи ({submissions.filter((s) => !s.reviewed).length} нових)
          </button>
        </div>
        <button className="export-btn" onClick={exportCSV}>⬇ CSV</button>
      </div>

      {tab === 'cohort' && (
        selected
          ? <StudentDetail
              student={students.find((s) => s.id === selected)}
              progress={progress.filter((p) => p.user_id === selected)}
              quizzes={quizzes.filter((q) => q.user_id === selected)}
              submissions={submissions.filter((s) => s.user_id === selected)}
              onBack={() => setSelected(null)}
            />
          : <CohortTable
              students={students}
              progress={progress}
              onSelect={setSelected}
            />
      )}

      {tab === 'submissions' && (
        <SubmissionsPanel
          submissions={submissions}
          students={students}
          onMarkReviewed={markReviewed}
        />
      )}
    </div>
  );
}

/* ── Cohort Table ─────────────────────────────────────── */
function CohortTable({ students, progress, onSelect }) {
  return (
    <div className="cohort-wrap">
      <table className="cohort-table">
        <thead>
          <tr>
            <th>Студент</th>
            {modules.map((m) => (
              <th key={m.id} title={m.name} style={{ color: m.color }}>
                M{m.id}
              </th>
            ))}
            <th>Всього</th>
          </tr>
        </thead>
        <tbody>
          {students.map((st) => {
            const doneIds = new Set(
              progress.filter((p) => p.user_id === st.id).map((p) => p.lecture_id)
            );
            const total = Math.round((doneIds.size / lectures.length) * 100);
            return (
              <tr key={st.id} onClick={() => onSelect(st.id)} className="cohort-row">
                <td className="student-cell">
                  <div className="student-avatar">{(st.full_name ?? st.email)[0]}</div>
                  <div>
                    <div className="student-name">{st.full_name ?? '—'}</div>
                    <div className="student-email">{st.email}</div>
                  </div>
                </td>
                {modules.map((mod) => {
                  const modLecs  = lectures.filter((l) => l.moduleId === mod.id);
                  const modDone  = modLecs.filter((l) => doneIds.has(l.id)).length;
                  const modPct   = Math.round((modDone / modLecs.length) * 100);
                  return (
                    <td key={mod.id}>
                      <div className="pct-pill" style={{ background: pctColor(modPct) + '22', color: pctColor(modPct) }}>
                        {modPct}%
                      </div>
                    </td>
                  );
                })}
                <td>
                  <div className="pct-pill total" style={{ background: pctColor(total) + '22', color: pctColor(total) }}>
                    {total}%
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ── Student Detail ───────────────────────────────────── */
function StudentDetail({ student, progress, quizzes, submissions, onBack }) {
  const doneIds = new Set(progress.map((p) => p.lecture_id));

  return (
    <div className="student-detail">
      <button className="back-btn" onClick={onBack}>← Назад</button>
      <div className="student-detail-header">
        <div className="student-avatar lg">{(student.full_name ?? student.email)[0]}</div>
        <div>
          <h2>{student.full_name ?? '—'}</h2>
          <div className="student-email">{student.email}</div>
          <div className="student-joined">З {new Date(student.created_at).toLocaleDateString('uk')}</div>
        </div>
      </div>

      {modules.map((mod) => {
        const modLecs  = lectures.filter((l) => l.moduleId === mod.id);
        const modDone  = modLecs.filter((l) => doneIds.has(l.id)).length;
        const quiz     = quizzes.find((q) => q.module_id === mod.id);
        return (
          <div key={mod.id} className="module-progress-row">
            <div className="mp-header">
              <div className="module-dot" style={{ background: mod.color }} />
              <span className="mp-name">{mod.name}</span>
              <span className="mp-count">{modDone}/{modLecs.length}</span>
              {quiz && <span className="mp-quiz">Тест: {quiz.score}/{quiz.total}</span>}
            </div>
            <div className="mp-bar-track">
              <div
                className="mp-bar-fill"
                style={{ width: (modDone / modLecs.length * 100) + '%', background: mod.color }}
              />
            </div>
          </div>
        );
      })}

      {submissions.length > 0 && (
        <div className="detail-submissions">
          <h3>Здані роботи</h3>
          {submissions.map((s) => (
            <div key={s.id} className="sub-row">
              <div>Лекція {s.lecture_id} · {new Date(s.submitted_at).toLocaleDateString('uk')}</div>
              {s.file_name && <FileLink filePath={s.file_url} fileName={s.file_name} className="sub-link" />}
              {s.figma_url && <a href={s.figma_url} target="_blank" rel="noreferrer" className="sub-link">Figma →</a>}
              {s.comment && <div className="sub-comment">"{s.comment}"</div>}
              <span className={`sub-status ${s.reviewed ? 'reviewed' : 'pending'}`}>
                {s.reviewed ? '✓ Переглянуто' : 'Очікує'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Submissions Panel ────────────────────────────────── */
function SubmissionsPanel({ submissions, students, onMarkReviewed }) {
  const [filter, setFilter] = useState('all'); // all | pending | reviewed

  const filtered = submissions.filter((s) =>
    filter === 'all' ? true : filter === 'pending' ? !s.reviewed : s.reviewed
  );

  return (
    <div className="submissions-panel">
      <div className="sub-filters">
        {['all', 'pending', 'reviewed'].map((f) => (
          <button key={f} className={`sfil${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>
            {f === 'all' ? 'Всі' : f === 'pending' ? 'Очікують' : 'Переглянуті'}
          </button>
        ))}
      </div>

      {filtered.length === 0 && <div className="sub-empty">Немає робіт</div>}

      {filtered.map((s) => {
        const st = students.find((u) => u.id === s.user_id);
        const lec = lectures.find((l) => l.id === s.lecture_id);
        return (
          <div key={s.id} className={`sub-item${s.reviewed ? ' reviewed' : ''}`}>
            <div className="sub-item-meta">
              <strong>{st?.full_name ?? st?.email ?? '—'}</strong>
              <span>Лекція {s.lecture_id}: {lec?.title}</span>
              <span className="sub-date">{new Date(s.submitted_at).toLocaleDateString('uk')}</span>
            </div>
            <div className="sub-item-files">
              {s.file_name && <FileLink filePath={s.file_url} fileName={s.file_name} className="sub-file-tag" />}
              {s.figma_url && (
                <a href={s.figma_url} target="_blank" rel="noreferrer" className="sub-file-tag figma">
                  🎨 Figma
                </a>
              )}
            </div>
            {s.comment && <div className="sub-item-comment">"{s.comment}"</div>}
            {!s.reviewed && (
              <button className="mark-reviewed-btn" onClick={() => onMarkReviewed(s.id)}>
                Позначити як переглянуто
              </button>
            )}
            {s.reviewed && <span className="reviewed-badge">✓ Переглянуто</span>}
          </div>
        );
      })}
    </div>
  );
}

/* ── File download link (generates a signed Supabase Storage URL on click) ── */
function FileLink({ filePath, fileName, className = 'sub-link' }) {
  const [busy, setBusy] = useState(false);

  async function open() {
    if (!filePath) return;
    setBusy(true);
    try {
      const { data, error } = await supabase.storage
        .from('submissions')
        .createSignedUrl(filePath, 3600); // valid for 1 hour
      if (error) throw error;
      window.open(data.signedUrl, '_blank');
    } catch {
      alert('Не вдалося отримати посилання на файл');
    } finally {
      setBusy(false);
    }
  }

  return (
    <button onClick={open} disabled={busy} className={className} style={{ cursor: busy ? 'wait' : 'pointer' }}>
      {busy ? '…' : `📄 ${fileName}`}
    </button>
  );
}

function pctColor(pct) {
  if (pct >= 80) return '#16a34a';
  if (pct >= 40) return '#d97706';
  return '#dc2626';
}
