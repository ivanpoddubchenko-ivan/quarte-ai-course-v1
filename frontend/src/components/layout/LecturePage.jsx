import { useState } from 'react';
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
  const { done, lecQuizScores, toggleDone, saveLectureQuiz } = useProgress();
  const [quizOpen, setQuizOpen] = useState(false);

  const lec     = lectures.find((l) => l.id === lectureId);
  const mod     = modules[lec?.moduleId ?? 0];
  const allIds  = lectures.map((l) => l.id);
  const idx     = allIds.indexOf(lectureId);
  const prevId  = idx > 0 ? allIds[idx - 1] : null;
  const nextId  = idx < allIds.length - 1 ? allIds[idx + 1] : null;
  const isDone      = done.has(lectureId);
  const lecQuiz     = c.quiz;                        // per-lecture quiz from course.json
  const lecQuizScore = lecQuizScores?.[lectureId];   // best score for this lecture

  if (!lec || !mod) return null;

  const c = lec.content;

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
        >
          {isDone ? '↩ Скасувати' : '✓ Виконано'}
        </button>
        <button className="nav-btn" onClick={() => nextId && onNavigate(nextId)} disabled={!nextId}>
          Наступна →
        </button>
      </div>

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
