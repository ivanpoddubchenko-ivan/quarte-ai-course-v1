import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useProgress } from '../../hooks/useProgress';
import courseData from '../../data/course.json';

const { modules, lectures } = courseData;

export default function Sidebar({ currentLectureId, onSelectLecture, onHome, mobileOpen }) {
  const { profile, isAdmin, signOut } = useAuth();
  const { done, pct, totalLectures }  = useProgress();
  const [openModule, setOpenModule]   = useState(null);
  const [search, setSearch]           = useState('');

  const sq = search.toLowerCase().trim();

  // Determine which module the current lecture belongs to
  const curLec = lectures.find((l) => l.id === currentLectureId);
  const effectiveOpenModule = sq ? null : (openModule ?? curLec?.moduleId ?? 0);

  const circumference = 81.68;
  const offset = circumference - (pct / 100) * circumference;
  const strokeColor = modules[curLec?.moduleId ?? 0]?.color ?? '#8b7cf8';

  return (
    <aside className={`sidebar${mobileOpen ? ' sidebar--open' : ''}`}>
      {/* Header */}
      <div className="sb-header">
        <div className="sb-eyebrow">AI Course · Claude веде · v3.0</div>
        <div className="sb-course-name" onClick={onHome} style={{ cursor: 'pointer' }}>
          AI-стек для<br />Product Designer
        </div>
        <div className="progress-row">
          <div className="progress-ring-wrap">
            <svg className="progress-svg" viewBox="0 0 34 34">
              <circle className="ring-bg" cx="17" cy="17" r="13" />
              <circle
                className="ring-fg"
                cx="17" cy="17" r="13"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                stroke={strokeColor}
              />
            </svg>
            <div className="ring-pct">{pct}%</div>
          </div>
          <div className="progress-info">
            <b>{done.size} / {totalLectures} лекцій</b>
            виконано
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="sb-search">
        <span className="sb-search-icon">🔍</span>
        <input
          className="sb-search-input"
          type="text"
          placeholder="Пошук лекцій…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Module list */}
      <div className="sb-scroll">
        {modules.map((mod) => {
          const modLecs = lectures.filter((l) => l.moduleId === mod.id);
          const visLecs = sq
            ? modLecs.filter(
                (l) =>
                  l.title.toLowerCase().includes(sq) ||
                  l.subtitle.toLowerCase().includes(sq)
              )
            : modLecs;

          if (sq && visLecs.length === 0) return null;

          const isOpen = sq ? true : effectiveOpenModule === mod.id;

          return (
            <div key={mod.id}>
              <button
                className={`module-btn${isOpen ? ' open' : ''}`}
                onClick={() => setOpenModule(isOpen ? null : mod.id)}
              >
                <div className="module-dot" style={{ background: mod.color }} />
                <div className="module-name">{mod.name}</div>
                <div className="module-count">{modLecs.length}</div>
              </button>

              {isOpen && (
                <div className="lecture-list">
                  {visLecs.map((lec) => {
                    const isCur  = lec.id === currentLectureId;
                    const isDone = done.has(lec.id);
                    const label  = sq
                      ? highlightMatch(lec.title, sq)
                      : lec.title;

                    return (
                      <button
                        key={lec.id}
                        className={`lecture-btn${isCur ? ' current' : ''}${isDone ? ' done' : ''}`}
                        onClick={() => onSelectLecture(lec.id)}
                      >
                        <div
                          className="lec-num"
                          style={isCur ? { background: mod.color + '28', color: mod.color } : {}}
                        >
                          {isDone ? '✓' : lec.id}
                        </div>
                        <div
                          className="lec-title"
                          dangerouslySetInnerHTML={{ __html: label }}
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {sq && lectures.filter((l) =>
          l.title.toLowerCase().includes(sq) || l.subtitle.toLowerCase().includes(sq)
        ).length === 0 && (
          <div className="sb-no-results">Нічого не знайдено</div>
        )}
      </div>

      {/* Footer */}
      <div className="sb-footer">
        <div className="sb-avatar">{profile?.full_name?.[0] ?? '?'}</div>
        <div className="sb-user-info">
          <b>{profile?.full_name ?? profile?.email}</b>
          {isAdmin && <span className="admin-badge">Admin</span>}
        </div>
        <button className="sb-signout" onClick={signOut} title="Вийти">↩</button>
      </div>
    </aside>
  );
}

function highlightMatch(text, query) {
  const re = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(re, '<mark class="hl">$1</mark>');
}
