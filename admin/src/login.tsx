// LoginPage.tsx
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useState } from 'react';
import logo from './assets/logo_sutfindback.png';
import { auth, db } from './firebase';
interface Props {
  onLogin: () => void;
}

export default function Login({ onLogin }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const adminDoc = await getDoc(doc(db, 'admins', cred.user.uid));
      if (!adminDoc.exists()) {
        await signOut(auth);
        setError('คุณไม่มีสิทธิ์เข้าใช้งานระบบ admin');
        setLoading(false);
        return;
      }
      onLogin();
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      } else if (err.code === 'auth/user-not-found') {
        setError('ไม่พบบัญชีนี้ในระบบ');
      } else {
        setError('เกิดข้อผิดพลาด กรุณาลองใหม่');
      }
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-header">
       <img src={logo} alt="SUT Find Back" className="login-logo-img"/>
      </div>

      <div className="login-card">
        <div className="login-title">Login</div>

        <form onSubmit={handleLogin} className="login-form">
          <input
            className="login-input"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email"
            required
            autoComplete="email"
          />

          <div className="pass-field">
            <input
              className="login-input"
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password"
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              className="pass-toggle"
              onClick={() => setShowPass(v => !v)}
            >
              {showPass ? '⌣' : '👁'}
            </button>
          </div>

          {error && <div className="login-error">{error}</div>}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'กำลังตรวจสอบ...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}