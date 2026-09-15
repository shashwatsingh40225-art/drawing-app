import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { EyeMark } from '../components/EyeMark';
import { useAuthStore } from '../stores/authStore';
import { isSupabaseDemoMode } from '../lib/supabase';
import { ArrowRight, Sparkles } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const { signIn, loading, error, clearError } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const returnUrl = (location.state as { from?: string } | null)?.from || '/my-art';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setValidationError(null);

    if (!email || !email.includes('@')) {
      setValidationError('Please enter a valid email address');
      return;
    }
    if (!password) {
      setValidationError('Please enter your password');
      return;
    }

    const res = await signIn(email, password);
    if (!res.error) {
      navigate(returnUrl, { replace: true });
    }
  };

  const handleDemoLogin = async () => {
    clearError();
    setValidationError(null);
    const res = await signIn('artist@kin-studio.local', 'demo123456');
    if (!res.error) {
      navigate(returnUrl, { replace: true });
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--color-background)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '24px',
      }}
    >
      {/* Brand Header */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{ display: 'inline-block', marginBottom: '12px' }}>
          <EyeMark size={48} />
        </div>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '2.5rem',
            fontWeight: 700,
            color: 'var(--color-primary)',
            margin: 0,
            letterSpacing: '-0.02em',
          }}
        >
          Kin
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.9rem',
            color: 'var(--color-text-secondary)',
            margin: '6px 0 0 0',
          }}
        >
          Your Personal Art Companion & Sketchbook
        </p>
      </div>

      {/* Auth Card */}
      <div
        className="card-surface"
        style={{
          width: '100%',
          maxWidth: '400px',
          padding: '32px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-surface)',
          boxShadow: 'var(--shadow-subtle)',
        }}
      >
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.4rem',
            fontWeight: 600,
            color: 'var(--color-primary)',
            marginTop: 0,
            marginBottom: '20px',
          }}
        >
          Welcome Back
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label
              htmlFor="login-email"
              style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--color-text-primary)',
                marginBottom: '6px',
              }}
            >
              Email Address
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="artist@studio.com"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-background)',
                fontSize: '0.95rem',
                color: 'var(--color-text-primary)',
                fontFamily: 'var(--font-body)',
                boxSizing: 'border-box',
              }}
              required
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label
                htmlFor="login-password"
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: 'var(--color-text-primary)',
                }}
              >
                Password
              </label>
            </div>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-background)',
                fontSize: '0.95rem',
                color: 'var(--color-text-primary)',
                fontFamily: 'var(--font-body)',
                boxSizing: 'border-box',
              }}
              required
            />
          </div>

          {(validationError || error) && (
            <div
              style={{
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(178, 58, 46, 0.08)',
                borderLeft: '3px solid var(--color-error)',
                color: 'var(--color-error)',
                fontSize: '0.85rem',
                fontWeight: 500,
              }}
            >
              {validationError || error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary double-outline-btn"
            style={{
              marginTop: '8px',
              padding: '12px',
              fontSize: '0.95rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <span>{loading ? 'Entering Studio...' : 'Log In'}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Demo Fast-Track Option */}
        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px dashed var(--color-border)' }}>
          <button
            type="button"
            onClick={handleDemoLogin}
            className="double-outline-btn"
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'rgba(180, 83, 31, 0.08)',
              color: 'var(--color-secondary)',
              fontSize: '0.85rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <Sparkles size={14} />
            <span>Explore Demo Studio (Instant Access)</span>
          </button>
          {isSupabaseDemoMode && (
            <p style={{ margin: '8px 0 0 0', fontSize: '0.75rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
              Connected to local demo studio storage
            </p>
          )}
        </div>

        {/* Switch to Sign Up */}
        <div
          style={{
            marginTop: '20px',
            textAlign: 'center',
            fontSize: '0.85rem',
            color: 'var(--color-text-secondary)',
          }}
        >
          Don't have an account?{' '}
          <Link
            to="/signup"
            state={location.state}
            style={{
              color: 'var(--color-accent)',
              fontWeight: 600,
              textDecoration: 'underline',
            }}
          >
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
};

