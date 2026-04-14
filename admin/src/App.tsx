import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import './App.css';
import logo from './assets/logo_sutfindback.png';
import { auth, db } from './firebase';
import LoginPage from './login';
import DashboardPage from './pages/dashboard';

function PostManagementPage() {
  return <h2>📦 Post Management</h2>;
}

function ReportsPage() {
  return <h2>🚩 Reports</h2>;
}

function UsersPage() {
  return <h2>👤 User Management</h2>;
}

// ─────────────────────────────────────

export default function App() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [activePage, setActivePage] = useState('dashboard');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async user => {
      if (!user) {
        setAuthed(false);
        return;
      }

      const adminDoc = await getDoc(doc(db, 'admins', user.uid));
      setAuthed(adminDoc.exists());
    });

    return () => unsub();
  }, []);

  // loading
  if (authed === null) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
      </div>
    );
  }

  // not admin
  if (!authed) {
    return <LoginPage onLogin={() => setAuthed(true)} />;
  }

  return (
    <div className="admin">

      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="logo">
          <img src={logo} alt="logo" className="login-logo-img" />
        </div>

        <nav className="nav">
          <button
            className={`nav-item ${activePage === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActivePage('dashboard')}
          >
            📊 Dashboard
          </button>

          <button
            className={`nav-item ${activePage === 'posts' ? 'active' : ''}`}
            onClick={() => setActivePage('posts')}
          >
            📦 Post Management
          </button>

          <button
            className={`nav-item ${activePage === 'reports' ? 'active' : ''}`}
            onClick={() => setActivePage('reports')}
          >
            🚩 Reports
          </button>

          <button
            className={`nav-item ${activePage === 'users' ? 'active' : ''}`}
            onClick={() => setActivePage('users')}
          >
            👤 User Management
          </button>
        </nav>

        <button className="logout-btn" onClick={() => signOut(auth)}>
          Logout
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main">

        {activePage === 'dashboard' && <DashboardPage />}
        {activePage === 'posts' && <PostManagementPage />}
        {activePage === 'reports' && <ReportsPage />}
        {activePage === 'users' && <UsersPage />}

      </main>
    </div>
  );
}