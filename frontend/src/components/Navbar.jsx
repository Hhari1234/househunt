import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  HomeIcon,
  HeartIcon,
  CalendarDaysIcon,
  UserIcon,
  GridIcon,
  LogOutIcon,
  ChevronRightIcon,
  XIcon,
} from './icons';
import { initials } from '../utils/format';

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isAuthorized, logout } = useAuth();
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const mobileCloseRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  // Move focus into the drawer and close it with Escape
  useEffect(() => {
    if (mobileOpen) mobileCloseRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setMobileOpen(false);
        setMenuOpen(false);
      }
    };
    if (mobileOpen) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileOpen]);

  const handleLogout = async () => {
    setMenuOpen(false);
    setMobileOpen(false);
    await logout();
  };

  const go = (path) => {
    setMenuOpen(false);
    setMobileOpen(false);
    navigate(path);
  };

  const onHome = (e) => {
    e.preventDefault();
    setMenuOpen(false);
    setMobileOpen(false);
    if (window.location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate('/');
    }
  };

  return (
    <>
      <header className={`nav ${scrolled ? 'nav--scrolled' : ''}`}>
        <div className="nav-inner">
          <a href="/" className="nav-logo" onClick={onHome}>
            <span className="nav-logo-mark">
              <HomeIcon size={18} />
            </span>
            <span>HouseHunt</span>
          </a>

          <nav className="nav-links" aria-label="Primary">
            <Link className="nav-link" to="/properties">Explore</Link>
            <Link className="nav-link" to="/properties?listingType=Sale">Buy</Link>
            <Link className="nav-link" to="/properties?listingType=Rent">Rent</Link>
            {user && <Link className="nav-link" to="/create-listing">Sell</Link>}
          </nav>

          <div className="nav-actions">
            {user ? (
              <div className="nav-user" ref={menuRef}>
                <button
                  className="avatar-btn"
                  onClick={() => setMenuOpen(o => !o)}
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                >
                  <span className="avatar">{initials(user.firstName, user.lastName)}</span>
                  <span className="avatar-name">{user.firstName}</span>
                </button>
                <div className="nav-dropdown" role="menu">
                  <div className="nav-dropdown-head">
                    <span className="avatar">{initials(user.firstName, user.lastName)}</span>
                    <div>
                      <div className="nav-dropdown-name">{user.firstName} {user.lastName}</div>
                      <div className="nav-dropdown-email">{user.email}</div>
                    </div>
                  </div>
                  <button className="nav-dropdown-item" role="menuitem" onClick={() => go('/account')}>
                    <UserIcon size={17} /> Account
                  </button>
                  <button className="nav-dropdown-item" role="menuitem" onClick={() => go('/favorites')}>
                    <HeartIcon size={17} /> Saved homes
                  </button>
                  <button className="nav-dropdown-item" role="menuitem" onClick={() => go('/bookings')}>
                    <CalendarDaysIcon size={17} /> Bookings
                  </button>
                  <button className="nav-dropdown-item" role="menuitem" onClick={() => go('/create-listing')}>
                    <HomeIcon size={17} /> List a property
                  </button>
                  {isAuthorized('admin') && (
                    <button className="nav-dropdown-item" role="menuitem" onClick={() => go('/admin')}>
                      <GridIcon size={17} /> Admin dashboard
                    </button>
                  )}
                  <button className="nav-dropdown-item nav-dropdown-item--danger" role="menuitem" onClick={handleLogout}>
                    <LogOutIcon size={17} /> Sign out
                  </button>
                </div>
              </div>
            ) : (
              <div className="nav-auth">
                <Link to="/favorites" className="nav-fav-link" aria-label="Saved homes">
                  <HeartIcon size={19} />
                </Link>
                <Link className="nav-signin" to="/login">Sign in</Link>
                <Link className="btn btn--gold btn--sm" to="/register">Get started</Link>
              </div>
            )}

            <button
              className={`nav-burger ${mobileOpen ? 'open' : ''}`}
              onClick={() => setMobileOpen(o => !o)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
            >
              <span /><span /><span />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer — mounted only while open so the off-canvas
          panel never contributes scrollable overflow when closed */}
      {mobileOpen && (
        <>
          <div className="nav-mobile-backdrop" onClick={() => setMobileOpen(false)} aria-hidden="true" />
          <div className="nav-mobile" role="dialog" aria-modal="true" aria-label="Menu">
            <div className="nav-mobile-head">
              <a href="/" className="nav-logo" onClick={(e) => { e.preventDefault(); setMobileOpen(false); navigate('/'); }}>
                <span className="nav-logo-mark"><HomeIcon size={18} /></span>
                <span>HouseHunt</span>
              </a>
              <button ref={mobileCloseRef} className="nav-mobile-close" onClick={() => setMobileOpen(false)} aria-label="Close menu">
                <XIcon size={18} />
              </button>
            </div>

            <nav className="nav-mobile-links" aria-label="Mobile">
              <button className="nav-mobile-link" onClick={() => go('/properties')}>Explore <ChevronRightIcon size={16} /></button>
              <button className="nav-mobile-link" onClick={() => go('/properties?listingType=Sale')}>Buy <ChevronRightIcon size={16} /></button>
              <button className="nav-mobile-link" onClick={() => go('/properties?listingType=Rent')}>Rent <ChevronRightIcon size={16} /></button>
              {user && <button className="nav-mobile-link" onClick={() => go('/create-listing')}>Sell <ChevronRightIcon size={16} /></button>}
              <button className="nav-mobile-link" onClick={() => go('/favorites')}>Saved homes <ChevronRightIcon size={16} /></button>
              {user && <button className="nav-mobile-link" onClick={() => go('/bookings')}>Bookings <ChevronRightIcon size={16} /></button>}
              {isAuthorized('admin') && <button className="nav-mobile-link" onClick={() => go('/admin')}>Admin dashboard <ChevronRightIcon size={16} /></button>}
            </nav>

            <div className="nav-mobile-foot">
              {user ? (
                <>
                  <div className="nav-mobile-user">
                    <span className="avatar">{initials(user.firstName, user.lastName)}</span>
                    <div>
                      <div className="nav-dropdown-name">{user.firstName} {user.lastName}</div>
                      <div className="nav-dropdown-email">{user.email}</div>
                    </div>
                  </div>
                  <button className="btn btn--outline" onClick={() => go('/account')}>My account</button>
                  <button className="btn btn--danger" onClick={handleLogout}>Sign out</button>
                </>
              ) : (
                <>
                  <button className="btn btn--gold btn--lg" onClick={() => go('/register')}>Get started</button>
                  <button className="btn btn--outline btn--lg" onClick={() => go('/login')}>Sign in</button>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default Navbar;