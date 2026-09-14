import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { EyeMark } from './EyeMark';
import { useAuthStore } from '../stores/authStore';
import { 
  BookOpen, 
  Library,
  UploadCloud, 
  Palette, 
  LogOut, 
  User as UserIcon, 
  Menu, 
  X,
  Archive,
  LayoutDashboard,
  Home,
  LayoutGrid,
} from 'lucide-react';

export type ScreenType = string;

interface NavigationProps {
  currentScreen?: ScreenType;
  onNavigate?: (screen: ScreenType) => void;
  savedCount?: number;
  hasActiveSearch?: boolean;
}

export const Navigation: React.FC<NavigationProps> = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuthStore();

  const [menuOpen, setMenuOpen] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);

  const currentPath = location.pathname;

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setAvatarMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setAvatarMenuOpen(false);
    navigate('/login');
  };

  const navLinks = [
    { name: 'My Art', path: '/my-art', icon: Palette },
    { name: 'My Library', path: '/library', icon: Library },
    { name: 'Kin Archive', path: '/archive', icon: Archive },
    { name: 'My Art Room', path: '/art-room', icon: LayoutDashboard },
    { name: 'About', path: '/about', icon: BookOpen },
  ];

  const isActive = (path: string) => {
    if (path === '/') return currentPath === '/';
    return currentPath.startsWith(path);
  };

  return (
    <>
      <header
        style={{
          backgroundColor: 'var(--color-surface)',
          borderBottom: '1px solid var(--color-border)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          boxShadow: '0 1px 6px rgba(36, 19, 41, 0.04)',
        }}
      >
      <div
        className="nav-header-inner"
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Brand Logo */}
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            textDecoration: 'none',
          }}
          aria-label="Kin Home"
        >
          <EyeMark size={32} />
          <div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.45rem',
                fontWeight: 700,
                color: 'var(--color-primary)',
                letterSpacing: '-0.02em',
                lineHeight: 1,
              }}
            >
              Kin
            </div>
            <div
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.7rem',
                fontWeight: 600,
                color: 'var(--color-secondary)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginTop: '2px',
              }}
            >
              Art Companion
            </div>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav
          className="desktop-nav"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          {navLinks.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.88rem',
                  fontWeight: 500,
                  textDecoration: 'none',
                  color: active ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  backgroundColor: active ? 'rgba(58, 33, 64, 0.07)' : 'transparent',
                  borderBottom: active ? '2px solid var(--color-accent)' : '2px solid transparent',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <Icon size={15} color={active ? 'var(--color-accent)' : 'currentColor'} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Section: Upload CTA + User Profile / Login */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Link
            to="/upload"
            className="btn-primary double-outline-btn nav-upload-btn"
            style={{
              padding: '8px 16px',
              fontSize: '0.88rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              textDecoration: 'none',
            }}
          >
            <UploadCloud size={15} />
            <span className="nav-btn-text">Upload</span>
          </Link>

          {user ? (
            <div ref={avatarRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setAvatarMenuOpen(!avatarMenuOpen)}
                className="double-outline-btn nav-user-btn"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '5px 10px',
                  borderRadius: 'var(--radius-pill)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-background)',
                  cursor: 'pointer',
                }}
                aria-label="User profile menu"
              >
                <div
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-accent)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                  }}
                >
                  {(user.email?.[0] ?? 'A').toUpperCase()}
                </div>
                <span
                  className="nav-user-email"
                  style={{
                    fontSize: '0.82rem',
                    maxWidth: '100px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    color: 'var(--color-text-primary)',
                    fontWeight: 500,
                  }}
                >
                  {user.email?.split('@')[0] ?? 'Artist'}
                </span>
              </button>

              {/* Avatar Dropdown */}
              {avatarMenuOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: '200px',
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-medium)',
                    padding: '8px 0',
                    zIndex: 100,
                  }}
                >
                  <div
                    style={{
                      padding: '8px 16px',
                      borderBottom: '1px solid var(--color-border)',
                      fontSize: '0.8rem',
                      color: 'var(--color-text-secondary)',
                      wordBreak: 'break-all',
                    }}
                  >
                    <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>Studio Account</div>
                    <div>{user.email}</div>
                  </div>

                  <Link
                    to="/my-art"
                    onClick={() => setAvatarMenuOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 16px',
                      color: 'var(--color-text-primary)',
                      textDecoration: 'none',
                      fontSize: '0.88rem',
                    }}
                  >
                    <Palette size={15} color="var(--color-secondary)" />
                    <span>My Art</span>
                  </Link>

                  <Link
                    to="/library"
                    onClick={() => setAvatarMenuOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 16px',
                      color: 'var(--color-text-primary)',
                      textDecoration: 'none',
                      fontSize: '0.88rem',
                    }}
                  >
                    <Library size={15} color="var(--color-secondary)" />
                    <span>My Library</span>
                  </Link>

                  <button
                    onClick={handleSignOut}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 16px',
                      border: 'none',
                      background: 'none',
                      color: 'var(--color-error)',
                      fontSize: '0.88rem',
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    <LogOut size={15} />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.88rem',
                fontWeight: 600,
                color: 'var(--color-primary)',
                textDecoration: 'none',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-background)',
              }}
            >
              <UserIcon size={14} />
              <span>Log In</span>
            </Link>
          )}

          {/* Mobile Menu Hamburger Toggle */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="mobile-menu-btn"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-primary)',
              cursor: 'pointer',
              padding: '6px',
            }}
            aria-label="Toggle navigation menu"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {menuOpen && (
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            borderTop: '1px solid var(--color-border)',
            padding: '16px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMenuOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px',
                  borderRadius: 'var(--radius-sm)',
                  textDecoration: 'none',
                  color: 'var(--color-text-primary)',
                  fontWeight: 500,
                }}
              >
                <Icon size={18} color="var(--color-accent)" />
                <span>{item.name}</span>
              </Link>
            );
          })}
          {user ? (
            <button
              onClick={() => {
                setMenuOpen(false);
                handleSignOut();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px',
                border: 'none',
                background: 'none',
                color: 'var(--color-error)',
                fontWeight: 500,
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
              <LogOut size={18} />
              <span>Log Out ({user.email})</span>
            </button>
          ) : (
            <Link
              to="/login"
              onClick={() => setMenuOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px',
                textDecoration: 'none',
                color: 'var(--color-primary)',
                fontWeight: 600,
              }}
            >
              <UserIcon size={18} />
              <span>Log In / Sign Up</span>
            </Link>
          )}
        </div>
      )}
    </header>

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
        <NavLink
          to="/"
          end
          className={({ isActive }) => `mobile-bottom-nav-item ${isActive ? 'active' : ''}`}
        >
          <Home size={20} />
          <span>Home</span>
        </NavLink>
        <NavLink
          to="/my-art"
          className={({ isActive }) => `mobile-bottom-nav-item ${isActive ? 'active' : ''}`}
        >
          <Palette size={20} />
          <span>My Art</span>
        </NavLink>
        <NavLink
          to="/library"
          className={({ isActive }) => `mobile-bottom-nav-item ${isActive ? 'active' : ''}`}
        >
          <BookOpen size={20} />
          <span>Library</span>
        </NavLink>
        <NavLink
          to="/archive"
          className={({ isActive }) => `mobile-bottom-nav-item ${isActive ? 'active' : ''}`}
        >
          <Archive size={20} />
          <span>Archive</span>
        </NavLink>
        <NavLink
          to="/art-room"
          className={({ isActive }) => `mobile-bottom-nav-item ${isActive ? 'active' : ''}`}
        >
          <LayoutGrid size={20} />
          <span>Art Room</span>
        </NavLink>
      </nav>
    </>
  );
};
