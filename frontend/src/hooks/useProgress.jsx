import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import courseData from '../data/course.json';

const ProgressContext = createContext(null);

export function ProgressProvider({ children }) {
  const { user } = useAuth();
  const [done, setDone]               = useState(new Set());   // Set<lectureId>
  const [quizScores, setQuizScores]   = useState({});           // { moduleId: { score, total } }  — module quizzes
  const [lecQuizScores, setLecQuizScores] = useState({});       // { lectureId: { score, total } } — per-lecture quizzes
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
      const bestMod = {};
      const bestLec = {};
      quizRes.data.forEach((r) => {
        if (r.module_id >= 1000) {
          // per-lecture quiz: key = module_id - 1000
          const lid = r.module_id - 1000;
          if (!bestLec[lid] || r.score > bestLec[lid].score) bestLec[lid] = r;
        } else {
          if (!bestMod[r.module_id] || r.score > bestMod[r.module_id].score) bestMod[r.module_id] = r;
        }
      });
      setQuizScores(bestMod);
      setLecQuizScores(bestLec);
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
      if (!existing || score > existing.score) return { ...prev, [moduleId]: { score, total } };
      return prev;
    });
  }

  async function saveLectureQuiz(lectureId, score, total) {
    // Store per-lecture scores using module_id >= 1000 (1000 + lectureId) — no schema change needed
    const key = 1000 + lectureId;
    await supabase.from('quiz_attempts').insert({ user_id: user.id, module_id: key, score, total });
    setLecQuizScores((prev) => {
      const existing = prev[lectureId];
      if (!existing || score > existing.score) return { ...prev, [lectureId]: { score, total } };
      return prev;
    });
  }

  const pct = Math.round((done.size / TOTAL) * 100);

  return (
    <ProgressContext.Provider value={{ done, quizScores, lecQuizScores, loading, pct, totalLectures: TOTAL, toggleDone, saveQuiz, saveLectureQuiz, reload: load }}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  return useContext(ProgressContext);
}
