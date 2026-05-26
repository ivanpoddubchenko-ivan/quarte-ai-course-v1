import { useEffect, useState } from 'react';
import { useProgress } from '../hooks/useProgress';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import courseData from '../data/course.json';

const { modules, lectures } = courseData;

export default function StudentProgress({ onBack, onSelectLecture }) {
  const { done, quizScores, totalLectures, pct } = useProgress();
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('submissions')
      .select('lecture_id, file_name, figma_url, submitted_at, reviewed')
      .eq('user_id', user.id)
      .order('submitted_at', { ascending: false })
      .then(({ data }) => setSubmissions(data ?? []));
  }, [user]);

  return (
    <div className="progress-page">
      {/* Header */}
      <div className="progress-page-header">
        <button className="progress-back-btn" onClick={onBack}>← Назад до курсу</button>
        <h1 className="progress-page-title">Мій прогрес</h1>
      </div>

      {/* Overall stats */}
      <div className="progress-stats-row">
        <div className="progress-stat-card">
          <div className="progress-stat-num">{done.size}</div>
          <div className="progress-stat-label">лекцій виконано</div>
        </div>
        <div className="progress-stat-card">
          <div className="progress-stat-num">{totalLectures - done.size}</div>
          <div className="progress-stat-label">ще попереду</div>
        </div>
        <div className="progress-stat-card">
          <div className="progress-stat-num">{pct}%</div>
          <div className="progress-stat-label">загальний прогрес</div>
        </div>
        <div className="progress-stat-card">
          <div className="progress-stat-num">{Object.keys(quizScores).length}</div>
          <div className="progress-stat-label">тестів пройдено</div>
        </div>
      </div>

      {/* Per-module breakdown */}
      <div className="progress-modules-section">
        <h2 className="progress-section-title">Прогрес по модулях</h2>
        <div className="progress-modules-grid">
          {modules.map((mod) => {
            const modLecs = lectures.filter((l) => l.moduleId === mod.id);
            const modDone = modLecs.filter((l) => done.has(l.id)).length;
            const modPct  = modLecs.length ? Math.round((modDone / modLecs.length) * 100) : 0;
            const quiz    = quizScores[mod.id];

            return (
              <div key={mod.id} className="progress-module-card">
                {/* Module color bar */}
                <div className="progress-module-bar" style={{ background: mod.bgColor || '#f3f4f6' }}>
                  <div className="progress-module-dot" style={{ background: mod.color }} />
                  <div className="progress-module-name" style={{ color: mod.textColor || 'var(--t1)' }}>
                    {mod.name}
                  </div>
                  <div className="progress-module-week" style={{ color: mod.textColor || 'var(--t3)' }}>
                    {mod.week}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="progress-module-body">
                  <div className="progress-lec-row">
                    <span className="progress-lec-count">{modDone}/{modLecs.length} лекцій</span>
                    <span className="progress-lec-pct">{modPct}%</span>
                  </div>
                  <div className="progress-bar-track">
                    <div
                      className="progress-bar-fill"
                      style={{ width: modPct + '%', background: mod.color }}
                    />
                  </div>

                  {/* Quiz score */}
                  {quiz ? (
                    <div className="progress-quiz-score">
                      <span className="progress-quiz-icon">✓</span>
                      Тест: {quiz.score}/{quiz.total}
                      <span className="progress-quiz-pct">
                        ({Math.round((quiz.score / quiz.total) * 100)}%)
                      </span>
                    </div>
                  ) : mod.quiz ? (
                    <div className="progress-quiz-score pending">
                      <span className="progress-quiz-icon">○</span>
                      Тест ще не пройдено
                    </div>
                  ) : null}

                  {/* Lecture checklist preview */}
                  <div className="progress-lec-list">
                    {modLecs.map((lec) => (
                      <button
                        key={lec.id}
                        className={`progress-lec-item ${done.has(lec.id) ? 'done' : ''}`}
                        onClick={() => onSelectLecture(lec.id)}
                        title={lec.title}
                      >
                        <span className="progress-lec-check">{done.has(lec.id) ? '✓' : lec.id}</span>
                        <span className="progress-lec-name">{lec.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Submissions */}
      {submissions.length > 0 && (
        <div className="progress-submissions-section">
          <h2 className="progress-section-title">Мої роботи</h2>
          <div className="progress-submissions-list">
            {submissions.map((sub) => {
              const lec = lectures.find((l) => l.id === sub.lecture_id);
              return (
                <div key={`${sub.lecture_id}-${sub.submitted_at}`} className="progress-sub-row">
                  <div className="progress-sub-info">
                    <div className="progress-sub-lec">
                      Лекція {sub.lecture_id}{lec ? ` · ${lec.title}` : ''}
                    </div>
                    <div className="progress-sub-meta">
                      {new Date(sub.submitted_at).toLocaleDateString('uk-UA', {
                        day: 'numeric', month: 'long', year: 'numeric'
                      })}
                      {sub.file_name && ` · ${sub.file_name}`}
                    </div>
                  </div>
                  <div className={`progress-sub-status ${sub.reviewed ? 'reviewed' : 'pending'}`}>
                    {sub.reviewed ? '✓ Перевірено' : '○ На перевірці'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
