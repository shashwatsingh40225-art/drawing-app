import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { EyeMark } from '../components/EyeMark';
import { useAuthStore } from '../stores/authStore';
import { ArrowRight } from 'lucide-react';

export const SignUpScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const { signUp, loading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setValidationError(null);

    if (!email || !email.includes('@')) {
      setValidationError('Please enter a valid email address');
      return;
    }
    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }

    const res = await signUp(email, password);
    if (!res.error) {
      navigate('/sketchbook');
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
          Create Your Artist Studio & Sketchbook
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
          Create Studio Account
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label
              htmlFor="signup-email"
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
              id="signup-email"
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
            <label
              htmlFor="signup-password"
              style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--color-text-primary)',
                marginBottom: '6px',
              }}
            >
              Password (min 6 characters)
            </label>
            <input
              id="signup-password"
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

          <div>
            <label
              htmlFor="signup-confirm-password"
              style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--color-text-primary)',
                marginBottom: '6px',
              }}
            >
              Confirm Password
            </label>
            <input
              id="signup-confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
            <span>{loading ? 'Creating Studio...' : 'Create Account'}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Switch to Log In */}
        <div
          style={{
            marginTop: '20px',
            textAlign: 'center',
            fontSize: '0.85rem',
            color: 'var(--color-text-secondary)',
          }}
        >
          Already have an account?{' '}
          <Link
            to="/login"
            style={{
              color: 'var(--color-accent)',
              fontWeight: 600,
              textDecoration: 'underline',
            }}
          >
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
};
