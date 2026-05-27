import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ProgressProvider } from './hooks/useProgress';
import LoginPage from './components/auth/LoginPage';
import AuthCallback from './pages/AuthCallback';
import Sidebar from './components/layout/Sidebar';
import WelcomePage from './components/layout/WelcomePage';
import LecturePage from './components/layout/LecturePage';
import AdminDashboard from './components/admin/AdminDashboard';
import StudentProgress from './pages/StudentProgress';
import courseData from './data/course.json';

const { lectures } = courseData;

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login"          element={<LoginPage />} />
          <Route path="/auth/callback"  element={<AuthCallback />} />
          <Route path="/admin"          element={<Protected admin><AdminDashboard /></Protected>} />
          <Route path="/*"              element={<Protected><CourseApp /></Protected>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

/* ── Auth guard ─────────────────────────────────────── */
function Protected({ children, admin }) {
  const { user, profile, loading, isAdmin } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user)   return <Navigate to="/login" replace />;
  if (admin && !isAdmin) return <Navigate to="/" replace />;

  // Domain check (belt-and-suspenders on top of BFF)
  if (user.email && !user.email.endsWith('@inveritasoft.com')) {
    return (
      <div className="error-screen">
        <h2>Доступ заборонено</h2>
        <p>Тільки акаунти @inveritasoft.com</p>
      </div>
    );
  }

  return children;
}

/* ── Main course layout ──────────────────────────────── */
function CourseApp() {
  return (
    <ProgressProvider>
      <CourseAppInner />
    </ProgressProvider>
  );
}

function CourseAppInner() {
  const { isAdmin } = useAuth();
  const [view, setView]               = useState('welcome'); // welcome | lecture | progress
  const [currentLectureId, setLectureId] = useState(null);
  const [sidebarOpen, setSidebarOpen]   = useState(false);

  function openLecture(id) {
    setLectureId(id);
    setView('lecture');
    setSidebarOpen(false); // close drawer on mobile after selecting
  }

  function openFirstInModule(moduleId) {
    const first = lectures.find((l) => l.moduleId === moduleId);
    if (first) openLecture(first.id);
  }

  return (
    <div className="app-shell">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div className="sb-backdrop" onClick={() => setSidebarOpen(false)} />
      )}
      <Sidebar
        currentLectureId={currentLectureId}
        onSelectLecture={openLecture}
        onHome={() => { setView('welcome'); setSidebarOpen(false); }}
        mobileOpen={sidebarOpen}
      />
      <main className="main-content">
        <div className="top-bar">
          {/* Hamburger — only visible on mobile */}
          <button
            className="hamburger-btn"
            onClick={() => setSidebarOpen((o) => !o)}
            aria-label="Відкрити меню"
          >
            ☰
          </button>
          <button className="top-bar-link" onClick={() => setView('progress')}>📊 Мій прогрес</button>
          {isAdmin && <a href="/admin" className="top-bar-link">⚙ Admin Dashboard</a>}
        </div>
        {view === 'welcome' && (
          <WelcomePage onSelectModule={openFirstInModule} />
        )}
        {view === 'lecture' && currentLectureId && (
          <LecturePage
            key={currentLectureId}
            lectureId={currentLectureId}
            onNavigate={openLecture}
          />
        )}
        {view === 'progress' && (
          <StudentProgress
            onBack={() => setView(currentLectureId ? 'lecture' : 'welcome')}
            onSelectLecture={openLecture}
          />
        )}
      </main>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh' }}>
      <span style={{ fontFamily:'DM Sans, sans-serif', fontSize:14, color:'#6b7280' }}>
        Завантаження…
      </span>
    </div>
  );
}
