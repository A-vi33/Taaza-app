import React, { useState } from 'react';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import meatImg from '../../assets/breast.png'; // Use any meat image you have

function CommonLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const auth = getAuth();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setLoading(false);
      if (email === 'admin@taaza.com') {
        navigate('/admin/dashboard');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError('Invalid credentials. ' + (err.message || ''));
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#231f20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'flex', width: '900px', maxWidth: '98vw', background: 'transparent', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 32px rgba(0,0,0,0.18)' }}>
        {/* Left: Form */}
        <div style={{ flex: 1, background: 'transparent', padding: '3.5rem 2.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h2 style={{ color: 'white', fontSize: '2.2rem', fontWeight: 700, marginBottom: 32, textAlign: 'left' }}>Welcome Back</h2>
          <form onSubmit={handleLogin} style={{ width: '100%', maxWidth: 400 }}>
            <div style={{ marginBottom: 18 }}>
              <label style={{ color: '#fff', fontWeight: 500, marginBottom: 6, display: 'block', fontSize: 16 }}>Email</label>
              <input
                type="email"
                placeholder="Enter your email"
                style={{ width: '100%', padding: '0.9rem 1.1rem', borderRadius: 10, border: '1.5px solid #3a3232', background: 'transparent', color: '#fff', fontSize: 16, outline: 'none', marginTop: 4, marginBottom: 2 }}
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ color: '#fff', fontWeight: 500, marginBottom: 6, display: 'block', fontSize: 16 }}>Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                style={{ width: '100%', padding: '0.9rem 1.1rem', borderRadius: 10, border: '1.5px solid #3a3232', background: 'transparent', color: '#fff', fontSize: 16, outline: 'none', marginTop: 4, marginBottom: 2 }}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 18 }}>
              <input type="checkbox" id="remember" checked={remember} onChange={e => setRemember(e.target.checked)} style={{ marginRight: 8 }} />
              <label htmlFor="remember" style={{ color: '#fff', fontSize: 15 }}>Remember Me</label>
            </div>
            <button style={{ width: '100%', background: '#e74c3c', color: 'white', padding: '0.9rem', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 18, marginBottom: 10, cursor: 'pointer', boxShadow: '0 2px 8px rgba(231,76,60,0.10)' }} type="submit" disabled={loading}>
              {loading ? 'Logging in...' : 'Log In'}
            </button>
            {error && <div style={{ color: '#ff7675', marginTop: 8, fontWeight: 500 }}>{error}</div>}
            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <a href="#" style={{ color: '#b2bec3', textDecoration: 'underline', fontSize: 15, textAlign: 'left', width: 'fit-content' }}>Forgot Password?</a>
              <a href="/register" style={{ color: '#b2bec3', textDecoration: 'underline', fontSize: 15, textAlign: 'left', width: 'fit-content' }}>New to Taaza? Register</a>
            </div>
          </form>
        </div>
        {/* Right: Image */}
        <div style={{ flex: 1, background: '#181516', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 420 }}>
          <img src={meatImg} alt="meat" style={{ width: '90%', maxWidth: 370, borderRadius: 18, boxShadow: '0 2px 16px rgba(0,0,0,0.18)' }} />
        </div>
      </div>
    </div>
  );
}

export default CommonLogin; 