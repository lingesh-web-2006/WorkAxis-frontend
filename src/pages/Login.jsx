import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';
import toast from 'react-hot-toast';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(false);
  const { login, logout } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    logout();
  }, [logout]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error('Please enter username and password');
      return;
    }
    setLoading(true);
    try {
      await login(username, password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleInit = async () => {
    setInitLoading(true);
    try {
      const res = await authService.initAdmin();
      toast.success(res.data.message);
    } catch (err) {
      toast.error('Initialization failed');
    } finally {
      setInitLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-primary)' }}>
      {/* Left Panel */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '40px',
        background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(168,85,247,0.06) 100%)',
        borderRight: '1px solid var(--border-color)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background decoration */}
        <div style={{
          position: 'absolute',
          top: '10%', right: '-10%',
          width: '400px', height: '400px',
          background: 'radial-gradient(circle, rgba(99,102,241,0.12), transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '5%', left: '-5%',
          width: '300px', height: '300px',
          background: 'radial-gradient(circle, rgba(168,85,247,0.1), transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none'
        }} />

        <div style={{ position: 'relative', textAlign: 'center', maxWidth: '420px' }}>
          <div style={{
            width: '72px', height: '72px',
            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
            borderRadius: '20px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 28px',
            boxShadow: '0 8px 32px rgba(99,102,241,0.35)',
            fontSize: '32px'
          }}>💼</div>

          <h1 style={{
            fontSize: '32px',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #f1f5f9, #94a3b8)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '12px',
            lineHeight: 1.2
          }}>PayrollPro</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.7, marginBottom: '40px' }}>
            Enterprise-grade payroll management system with automated calculations, role-based access, and comprehensive reporting.
          </p>

          {/* Feature highlights */}
          {[
            { icon: '⚡', text: 'Automated salary calculations' },
            { icon: '🛡️', text: 'Role-based access control' },
            { icon: '📊', text: 'Real-time analytics & reports' },
            { icon: '🧾', text: 'Digital salary slip generation' },
          ].map((f, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '10px 16px',
              background: 'rgba(255,255,255,0.04)',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.06)',
              marginBottom: '8px',
              textAlign: 'left'
            }}>
              <span style={{ fontSize: '18px' }}>{f.icon}</span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '13.5px' }}>{f.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div style={{
        width: '480px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '60px 48px',
        background: 'var(--bg-secondary)'
      }}>
        <div style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px' }}>
            Sign in to your account
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Enter your credentials to access the dashboard
          </p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              className="form-control"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoFocus
            />
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label">Password</label>
            <input
              className="form-control"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full btn-lg"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', marginBottom: '16px' }}
          >
            {loading ? (
              <><span className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} /> Signing in...</>
            ) : 'Sign In'}
          </button>
        </form>

        {/* Demo credentials */}
        <div style={{
          background: 'var(--bg-input)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '16px',
          marginBottom: '16px'
        }}>
          <p style={{ fontSize: '11.5px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            Demo Credentials
          </p>
          {[
           // { role: 'Admin', user: 'admin', pass: 'admin123', color: '#6366f1' },
            { role: 'Employee', user: 'employee', pass: 'employee123', color: '#10b981' },
          ].map(c => (
            <div
              key={c.role}
              onClick={() => { setUsername(c.user); setPassword(c.pass); }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 0',
                cursor: 'pointer',
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: '8px',
                marginBottom: '8px'
              }}
            >
              <span style={{ fontSize: '12px', fontWeight: '600', color: c.color }}>
                {c.role}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {c.user} / {c.pass}
              </span>
            </div>
          ))}
          <button
            onClick={handleInit}
            disabled={initLoading}
            style={{
              background: 'none', border: 'none', color: 'var(--accent-primary)',
              fontSize: '12px', cursor: 'pointer', marginTop: '4px', padding: '0',
              fontFamily: 'var(--font-main)'
            }}
          >
            {initLoading ? 'Initializing...' : '⚡ Initialize default users'}
          </button>
        </div>
      </div>
    </div>
  );
}
