import { useState } from 'react';

export default function QuizModal({ quiz, moduleColor, onClose, onSave }) {
  const [qi, setQi]           = useState(0);
  const [score, setScore]     = useState(0);
  const [answered, setAnswered] = useState(false);
  const [picked, setPicked]   = useState(null);
  const [done, setDone]       = useState(false);

  if (!quiz) return null;
  const qs    = quiz.qs;
  const total = qs.length;
  const q     = qs[qi];
  const pct   = Math.round(((qi + 1) / total) * 100);

  function pick(i) {
    if (answered) return;
    setAnswered(true);
    setPicked(i);
    if (i === q.ans) setScore((s) => s + 1);
  }

  function next() {
    if (qi + 1 >= total) {
      onSave(score, total);
      setDone(true);
      return;
    }
    setQi((n) => n + 1);
    setAnswered(false);
    setPicked(null);
  }

  const finalScore = score;
  const finalPct   = Math.round((finalScore / total) * 100);
  const msgs = [
    'Ще є над чим попрацювати — перечитай лекції модуля!',
    'Непогано! Кілька концепцій варто повторити.',
    'Добре! Ти добре засвоїла матеріал.',
    'Відмінно! Модуль освоєно на 100%! 🚀',
  ];
  const msgIdx = finalPct < 50 ? 0 : finalPct < 75 ? 1 : finalPct < 100 ? 2 : 3;

  return (
    <div className="quiz-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="quiz-modal">
        <div className="quiz-header">
          <div className="quiz-title">{quiz.title}</div>
          <button className="quiz-close" onClick={onClose}>✕</button>
        </div>

        {!done ? (
          <>
            <div className="quiz-progress-row">
              <span>{qi + 1} / {total}</span>
              <div className="quiz-pbar-track">
                <div className="quiz-pbar-fill" style={{ width: pct + '%', background: moduleColor }} />
              </div>
            </div>

            <div className="quiz-body">
              <div className="quiz-q-text">{q.q}</div>
              <div className="quiz-options">
                {q.opts.map((opt, i) => {
                  let cls = 'quiz-opt';
                  if (answered) {
                    if (i === q.ans) cls += ' correct';
                    else if (i === picked) cls += ' wrong';
                  }
                  return (
                    <button key={i} className={cls} onClick={() => pick(i)} disabled={answered}>
                      {opt}
                    </button>
                  );
                })}
              </div>
              {answered && (
                <div className={`quiz-feedback ${picked === q.ans ? 'ok' : 'no'}`}>
                  {picked === q.ans ? '✓ ' : '✗ '}{q.exp}
                </div>
              )}
            </div>

            <div className="quiz-actions">
              <button className="quiz-next-btn" onClick={next} disabled={!answered}>
                {qi + 1 >= total ? 'Завершити' : 'Далі →'}
              </button>
            </div>
          </>
        ) : (
          <div className="quiz-result">
            <div className="quiz-score" style={{ color: moduleColor }}>{finalScore}/{total}</div>
            <div className="quiz-score-sub">{finalPct}% правильних відповідей</div>
            <div className="quiz-result-msg">{msgs[msgIdx]}</div>
            <button className="quiz-retry-btn" onClick={onClose}>Закрити</button>
          </div>
        )}
      </div>
    </div>
  );
}
