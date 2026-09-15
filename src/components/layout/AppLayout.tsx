import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { Navigation } from '../Navigation';
import { ConcentricPortal } from '../ConcentricPortal';

export function AppLayout() {
  const { user, loading, initialize } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    initialize();
    try {
      localStorage.removeItem('kin_art_room_board_cache');
      localStorage.removeItem('kin_art_room_items_cache');
    } catch {
      // ignore storage access errors in restricted environments
    }
  }, [initialize]);

  // Auth guard: Protect personal art, library, reader, and upload routes
  const isProtectedRoute = 
    location.pathname.startsWith('/my-art') ||
    location.pathname.startsWith('/sketchbook') || // legacy redirect still protected
    location.pathname.startsWith('/library') ||
    location.pathname.startsWith('/reader') ||
    location.pathname.startsWith('/upload');

  useEffect(() => {
    if (!loading && !user && isProtectedRoute) {
      navigate('/login', { state: { from: location.pathname + location.search + location.hash } });
    }
  }, [user, loading, isProtectedRoute, navigate, location.pathname, location.search, location.hash]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: 'var(--color-background)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
        }}
      >
        <ConcentricPortal size={80} />
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.2rem',
            color: 'var(--color-primary)',
          }}
        >
          Opening Kin Studio...
        </div>
      </div>
    );
  }

  // If visiting a protected route while unauthenticated, don't flash content before redirect
  if (!user && isProtectedRoute) {
    return null;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navigation />
      <main className="screen-with-bottom-nav" style={{ flex: 1 }}>
        <Outlet />
      </main>

      {/* Global Studio Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-surface)',
          padding: '24px',
          textAlign: 'center',
          fontSize: '0.82rem',
          color: 'var(--color-text-secondary)',
          marginTop: 'auto',
        }}
      >
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--color-primary)' }}>
              Kin
            </span>
            <span>· Personal Art Collection &amp; PDF Reader</span>
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <Link to="/about" style={{ color: 'inherit', textDecoration: 'underline' }}>
              About
            </Link>
            <Link to="/my-art" style={{ color: 'inherit', textDecoration: 'underline' }}>
              My Art
            </Link>
            <Link to="/archive" style={{ color: 'inherit', textDecoration: 'underline' }}>
              Kin Archive
            </Link>
            <Link to="/library" style={{ color: 'inherit', textDecoration: 'underline' }}>
              My Library
            </Link>
            <Link to="/upload" style={{ color: 'inherit', textDecoration: 'underline' }}>
              Upload Drawing
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
