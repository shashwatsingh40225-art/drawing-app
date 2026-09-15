import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { 
  BookOpen, 
  UploadCloud, 
  Palette, 
  LogOut, 
  User as UserIcon, 
  Menu, 
  X, 
  Archive, 
  Home 
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

  // Strictly mutually exclusive menu toggles (Milestone M2 / Requirement R3)
  const toggleMenu = () => {
    setMenuOpen((prev) => {
      const next = !prev;
      if (next) {
        setAvatarMenuOpen(false);
      }
      return next;
    });
  };

  const toggleAvatarMenu = () => {
    setAvatarMenuOpen((prev) => {
      const next = !prev;
      if (next) {
        setMenuOpen(false);
      }
      return next;
    });
  };

  const currentPath = location.pathname;

  const handleTactileClick = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(8);
    }
  };

  // Active section detectors
  const isHomeActive = currentPath === '/';
  const isArtActive = 
    currentPath === '/my-art' || 
    currentPath.startsWith('/my-art/') || 
    currentPath === '/sketchbook' || 
    currentPath.startsWith('/sketchbook/') || 
    currentPath === '/archive' ||
    currentPath.startsWith('/archive/');
  const isReadingActive = 
    currentPath === '/library' || 
    currentPath.startsWith('/library/') || 
    currentPath === '/reader' ||
    currentPath.startsWith('/reader/');

  // Sub-nav tab detectors for Art
  const isMyArt = 
    currentPath === '/my-art' || 
    currentPath.startsWith('/my-art/') || 
    currentPath === '/sketchbook' || 
    currentPath.startsWith('/sketchbook/');
  const isKinArchive = 
    currentPath === '/archive' || 
    currentPath.startsWith('/archive/');

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

  // Close menus on route change (e.g. browser back/forward or drawer clicks)
  useEffect(() => {
    setMenuOpen(false);
    setAvatarMenuOpen(false);
  }, [location.pathname]);

  // Close menus on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        setAvatarMenuOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setAvatarMenuOpen(false);
    navigate('/login');
  };

  // Primary 3-item navigation model: Home, Art, Reading
  const primaryNavItems = [
    { name: 'Home', path: '/', icon: Home, isActive: isHomeActive },
    { name: 'Art', path: '/my-art', icon: Palette, isActive: isArtActive },
    { name: 'Reading', path: '/library', icon: BookOpen, isActive: isReadingActive },
  ];

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
          <img src="/brand/logo-mark-simple-48.png" alt="Kin logo mark" style={{ height: '32px', width: '32px', objectFit: 'contain' }} />
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

        {/* Desktop Navigation Links — 3 Regrouped Items: Home, Art, Reading */}
        <nav
          className="desktop-nav"
          aria-label="Primary Navigation"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          {primaryNavItems.map((item) => {
            const active = item.isActive;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`desktop-nav-item ${active ? 'active' : ''}`}
                aria-current={active ? 'page' : undefined}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '7px',
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.9rem',
                  fontWeight: active ? 600 : 500,
                  textDecoration: 'none',
                  color: active ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  backgroundColor: active ? 'rgba(58, 33, 64, 0.07)' : 'transparent',
                  borderBottom: active ? '2px solid var(--color-accent)' : '2px solid transparent',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <Icon size={16} color={active ? 'var(--color-accent)' : 'currentColor'} />
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
                onClick={toggleAvatarMenu}
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
                aria-expanded={avatarMenuOpen}
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
                    to="/archive"
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
                    <Archive size={15} color="var(--color-secondary)" />
                    <span>Kin Archive</span>
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
                    <BookOpen size={15} color="var(--color-secondary)" />
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
            onClick={toggleMenu}
            className="mobile-menu-btn"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-primary)',
              cursor: 'pointer',
              padding: '10px',
              minWidth: '44px',
              minHeight: '44px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

        {/* Tactile Sub-Navigation for Art Section (My Art <-> Kin Archive) */}
        {isArtActive && !menuOpen && (
          <div
            className="art-subnav-bar"
            style={{
              borderTop: '1px solid var(--color-border-subtle)',
              backgroundColor: 'var(--color-surface)',
              padding: '8px 24px',
            }}
          >
            <div
              style={{
                maxWidth: '1280px',
                margin: '0 auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                className="tactile-subnav-group"
                role="tablist"
                aria-label="Art Section Sub-Navigation"
              >
                <Link
                  to="/my-art"
                  role="tab"
                  aria-selected={isMyArt}
                  aria-current={isMyArt ? 'page' : undefined}
                  onClick={handleTactileClick}
                  className={`tactile-subnav-pill ${isMyArt ? 'active' : ''}`}
                >
                  <Palette size={14} color={isMyArt ? 'var(--color-accent)' : 'currentColor'} />
                  <span>My Art</span>
                </Link>

                <Link
                  to="/archive"
                  role="tab"
                  aria-selected={isKinArchive}
                  aria-current={isKinArchive ? 'page' : undefined}
                  onClick={handleTactileClick}
                  className={`tactile-subnav-pill ${isKinArchive ? 'active' : ''}`}
                >
                  <Archive size={14} color={isKinArchive ? 'var(--color-accent)' : 'currentColor'} />
                  <span>Kin Archive</span>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      padding: '1px 6px',
                      borderRadius: 'var(--radius-pill)',
                      backgroundColor: isKinArchive ? 'rgba(255, 45, 149, 0.12)' : 'rgba(0, 0, 0, 0.05)',
                      color: isKinArchive ? 'var(--color-accent)' : 'var(--color-text-muted)',
                      fontWeight: 600,
                    }}
                  >
                    20
                  </span>
                </Link>
              </div>
            </div>
          </div>
        )}

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
            {/* 1. Home */}
            <Link
              to="/"
              onClick={() => setMenuOpen(false)}
              aria-current={isHomeActive ? 'page' : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                textDecoration: 'none',
                color: isHomeActive ? 'var(--color-primary)' : 'var(--color-text-primary)',
                backgroundColor: isHomeActive ? 'rgba(58, 33, 64, 0.07)' : 'transparent',
                fontWeight: isHomeActive ? 700 : 500,
              }}
            >
              <Home size={18} color={isHomeActive ? 'var(--color-accent)' : 'currentColor'} />
              <span>Home</span>
            </Link>

            {/* 2. Art Section with Tactile Sub-Nav */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: isArtActive ? 'rgba(58, 33, 64, 0.04)' : 'transparent',
                borderRadius: 'var(--radius-md)',
                padding: '4px',
                border: isArtActive ? '1px solid var(--color-border)' : '1px solid transparent',
              }}
            >
              <Link
                to="/my-art"
                onClick={() => setMenuOpen(false)}
                aria-current={isArtActive ? 'page' : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  textDecoration: 'none',
                  color: isArtActive ? 'var(--color-primary)' : 'var(--color-text-primary)',
                  fontWeight: isArtActive ? 700 : 500,
                }}
              >
                <Palette size={18} color={isArtActive ? 'var(--color-accent)' : 'currentColor'} />
                <span>Art</span>
              </Link>

              {/* Tactile Sub-Nav Buttons in Drawer */}
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  padding: '4px 10px 8px 36px',
                }}
              >
                <Link
                  to="/my-art"
                  onClick={() => {
                    handleTactileClick();
                    setMenuOpen(false);
                  }}
                  aria-current={isMyArt ? 'page' : undefined}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '5px 12px',
                    borderRadius: 'var(--radius-pill)',
                    fontSize: '0.8rem',
                    textDecoration: 'none',
                    fontWeight: isMyArt ? 700 : 500,
                    color: isMyArt ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                    backgroundColor: isMyArt ? 'var(--color-surface)' : 'transparent',
                    border: isMyArt ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
                    boxShadow: isMyArt ? '1.5px 1.5px 0 0 var(--color-accent)' : 'none',
                  }}
                >
                  <span>My Art</span>
                </Link>
                <Link
                  to="/archive"
                  onClick={() => {
                    handleTactileClick();
                    setMenuOpen(false);
                  }}
                  aria-current={isKinArchive ? 'page' : undefined}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '5px 12px',
                    borderRadius: 'var(--radius-pill)',
                    fontSize: '0.8rem',
                    textDecoration: 'none',
                    fontWeight: isKinArchive ? 700 : 500,
                    color: isKinArchive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                    backgroundColor: isKinArchive ? 'var(--color-surface)' : 'transparent',
                    border: isKinArchive ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
                    boxShadow: isKinArchive ? '1.5px 1.5px 0 0 var(--color-accent)' : 'none',
                  }}
                >
                  <span>Kin Archive</span>
                  <span style={{ fontSize: '0.72rem', opacity: 0.75 }}>(20)</span>
                </Link>
              </div>
            </div>

            {/* 3. Reading Section */}
            <Link
              to="/library"
              onClick={() => setMenuOpen(false)}
              aria-current={isReadingActive ? 'page' : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                textDecoration: 'none',
                color: isReadingActive ? 'var(--color-primary)' : 'var(--color-text-primary)',
                backgroundColor: isReadingActive ? 'rgba(58, 33, 64, 0.07)' : 'transparent',
                fontWeight: isReadingActive ? 700 : 500,
              }}
            >
              <BookOpen size={18} color={isReadingActive ? 'var(--color-accent)' : 'currentColor'} />
              <span>Reading</span>
            </Link>

            {/* About Link */}
            <Link
              to="/about"
              onClick={() => setMenuOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                textDecoration: 'none',
                color: currentPath === '/about' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                fontSize: '0.88rem',
                fontWeight: 500,
              }}
            >
              <span>About Kin</span>
            </Link>

            <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '4px 0' }} />

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

      {/* Mobile Bottom Navigation — 3 Regrouped Items: Home, Art, Reading */}
      <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
        <Link
          to="/"
          className={`mobile-bottom-nav-item ${isHomeActive ? 'active' : ''}`}
          aria-current={isHomeActive ? 'page' : undefined}
          aria-label="Home"
        >
          <Home size={20} />
          <span>Home</span>
        </Link>
        <Link
          to="/my-art"
          className={`mobile-bottom-nav-item ${isArtActive ? 'active' : ''}`}
          aria-current={isArtActive ? 'page' : undefined}
          aria-label="Art"
        >
          <Palette size={20} />
          <span>Art</span>
        </Link>
        <Link
          to="/library"
          className={`mobile-bottom-nav-item ${isReadingActive ? 'active' : ''}`}
          aria-current={isReadingActive ? 'page' : undefined}
          aria-label="Reading"
        >
          <BookOpen size={20} />
          <span>Reading</span>
        </Link>
      </nav>
    </>
  );
};
