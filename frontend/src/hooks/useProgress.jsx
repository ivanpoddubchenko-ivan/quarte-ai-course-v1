import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import courseData from '../data/course.json';

const ProgressContext = createContext(null);

export function ProgressProvider({ children }) {
  const { user } = useAuth();
  const [done, setDone]             = useState(new Set());   // Set<lectureId>
  const [quizScores, setQuizScores] = useState({});           // { moduleId: { score, total, attempted_at } }
  const [loading, setLoading]       = useState(true);

  const TOTAL = courseData.lectures.length;

  const load = useCallback(async () => {
    if (!user) { setDone(new Set()); setLoading(false); return; }
    setLoading(true);

    const [progRes, quizRes] = await Promise.all([
      supabase.from('progress').select('lecture_id').eq('user_id', user.id),
      supabase
        .from('quiz_attempts')
        .select('module_id, score, total, attempted_at')
        .eq('user_id', user.id)
        .order('attempted_at', { ascending: false }),
    ]);

    if (progRes.data) {
      setDone(new Set(progRes.data.map((r) => r.lecture_id)));
    }

    if (quizRes.data) {
      const best = {};
      quizRes.data.forEach((r) => {
        if (!best[r.module_id] || r.score > best[r.module_id].score) {
          best[r.module_id] = r;
        }
      });
      setQuizScores(best);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  async function toggleDone(lectureId) {
    const isDone = done.has(lectureId);
    // Optimistic update
    setDone((prev) => {
      const next = new Set(prev);
      isDone ? next.delete(lectureId) : next.add(lectureId);
      return next;
    });

    if (isDone) {
      await supabase.from('progress').delete().match({ user_id: user.id, lecture_id: lectureId });
    } else {
      await supabase.from('progress').upsert({ user_id: user.id, lecture_id: lectureId });
    }
  }

  async function saveQuiz(moduleId, score, total) {
    await supabase.from('quiz_attempts').insert({ user_id: user.id, module_id: moduleId, score, total });
    setQuizScores((prev) => {
      const existing = prev[moduleId];
      if (!existing || score > existing.score) {
        return { ...prev, [moduleId]: { score, total, attempted_at: new Date().toISOString() } };
      }
      return prev;
    });
  }

  const pct = Math.round((done.size / TOTAL) * 100);

  return (
    <ProgressContext.Provider value={{ done, quizScores, loading, pct, totalLectures: TOTAL, toggleDone, saveQuiz, reload: load }}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  return useContext(ProgressContext);
}
