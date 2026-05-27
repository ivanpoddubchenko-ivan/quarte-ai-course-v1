import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useProgress } from '../../hooks/useProgress';
import ConceptsGrid from '../lecture/ConceptsGrid';
import BadGoodExample from '../lecture/BadGoodExample';
import TipsGrid from '../lecture/TipsGrid';
import PromptLibrary from '../lecture/PromptLibrary';
import CodeBlock from '../lecture/CodeBlock';
import PracticalTask from '../lecture/PracticalTask';
import QuizModal from '../lecture/QuizModal';
import courseData from '../../data/course.json';

const { modules, lectures } = courseData;

export default function LecturePage({ lectureId, onNavigate }) {
  const { user } = useAuth();
  const { done, lecQuizScores, toggleDone, saveLectureQuiz } = useProgress();
  const [quizOpen, setQuizOpen] = useState(false);
  const [taskSubmitted, setTaskSubmitted] = useState(false);

  const lec    = lectures.find((l) => l.id === lectureId);
  const mod    = modules[lec?.moduleId ?? 0];
  const allIds = lectures.map((l) => l.id);
  const idx    = allIds.indexOf(lectureId);
  const prevId = idx > 0 ? allIds[idx - 1] : null;
  const nextId = idx < allIds.length - 1 ? allIds[idx + 1] : null;
  const isDone = done.has(lectureId);

  // For submittable lectures — check if student already submitted (component remounts per lecture via key=)
  useEffect(() => {
    if (!lec?.submittable || !user) return;
    supabase
      .from('submissions')
      .select('id')
      .eq('user_id', user.id)
      .eq('lecture_id', lectureId)
      .maybeSingle()
      .then(({ data }) => { if (data) setTaskSubmitted(true); });
  }, [lec?.submittable, user, lectureId]);

  if (!lec || !mod) return null;

  const c            = lec.content;
  const lecQuiz      = c.quiz;                       // per-lecture quiz from course.json
  const lecQuizScore = lecQuizScores?.[lectureId];   // best score for this lecture

  // Gate: quiz must be done; if submittable, submission is also required
  const quizRequired   = !!lecQuiz && !lecQuizScore;
  const submitRequired = !!lec.submittable && !taskSubmitted;
  const taskLocked     = quizRequired || submitRequired;

  const lockHint = submitRequired && quizRequired
    ? 'Спочатку здай завдання та пройди тест'
    : submitRequired
      ? 'Спочатку здай практичне завдання'
      : 'Спочатку пройди тест до цієї лекції';

  return (
    <div className="lecture-page">
      {/* Breadcrumb */}
      <div className="lec-breadcrumb">
        <span className="lec-module-chip" style={{ background: mod.bgColor, color: mod.textColor }}>
          {mod.name}
        </span>
        <span className="lec-meta">
          Лекція {lec.id} з {lectures.length} · {mod.week}
        </span>
      </div>

      {/* Title */}
      <h1 className="lec-title">{lec.title}</h1>
      <p className="lec-subtitle">{lec.subtitle}</p>

      {/* Intro box */}
      {c.intro && (
        <div className="intro-box" style={{ borderLeftColor: mod.color }}>
          <p dangerouslySetInnerHTML={{ __html: c.intro }} />
        </div>
      )}

      {/* Content sections */}
      <ConceptsGrid concepts={c.concepts} />
      <BadGoodExample bvg={c.badGood} />
      <TipsGrid tips={c.tips} bgColor={mod.bgColor} />
      <PromptLibrary lib={c.promptLibrary} accentColor={mod.color} />
      <CodeBlock code={c.codeBlock} />
      <PracticalTask
        task={c.task}
        lecture={lec}
        accentColor={mod.color}
        bgColor={mod.bgColor}
        textColor={mod.textColor}
        onSubmitted={() => setTaskSubmitted(true)}
      />

      {/* Per-lecture quiz trigger */}
      {lecQuiz && (
        <div className="quiz-trigger">
          <button
            className="quiz-trigger-btn"
            style={{ borderColor: mod.color + '44', color: mod.textColor }}
            onClick={() => setQuizOpen(true)}
          >
            ▶{' '}
            {lecQuizScore
              ? `Повторити тест (${lecQuizScore.score}/${lecQuizScore.total})`
              : `Пройти тест — ${lecQuiz.qs.length} запитання`}
          </button>
        </div>
      )}

      {/* Nav footer */}
      <div className="lec-nav">
        <button className="nav-btn" onClick={() => prevId && onNavigate(prevId)} disabled={!prevId}>
          ← Попередня
        </button>
        <button
          className={`done-btn${isDone ? ' is-done' : ''}`}
          onClick={() => toggleDone(lectureId)}
          disabled={taskLocked && !isDone}
          title={taskLocked && !isDone ? lockHint : undefined}
        >
          {isDone ? '↩ Скасувати' : '✓ Виконано'}
        </button>
        <button
          className="nav-btn"
          onClick={() => nextId && onNavigate(nextId)}
          disabled={!nextId || taskLocked}
          title={taskLocked && nextId ? lockHint : undefined}
        >
          Наступна →
        </button>
      </div>

      {/* Lock hint shown below nav when task is not yet complete */}
      {taskLocked && (
        <p className="task-lock-hint">🔒 {lockHint}</p>
      )}

      {/* Quiz modal */}
      {quizOpen && lecQuiz && (
        <QuizModal
          quiz={lecQuiz}
          moduleColor={mod.color}
          onClose={() => setQuizOpen(false)}
          onSave={(score, total) => saveLectureQuiz(lectureId, score, total)}
        />
      )}
    </div>
  );
}
