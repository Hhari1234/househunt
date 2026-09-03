import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Modal from '../components/Modal';
import {
  HeartIcon, CalendarDaysIcon, GridIcon, HomeIcon, ChevronRightIcon, LogOutIcon,
} from '../components/icons';
import { initials } from '../utils/format';

function AccountPage() {
  const navigate = useNavigate();
  const { user, logout, updateProfile, deleteAccount } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
      });
    }
  }, [user]);

  if (!user) {
    return (
      <div className="page">
        <Navbar />
        <div className="container">
          <div className="state">
            <h3 className="state-title">Please sign in</h3>
            <p className="state-desc">You need an account to view this page.</p>
            <button className="btn btn--gold" onClick={() => navigate('/login')}>Sign in</button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const handleSave = async () => {
    if (!formData.firstName || !formData.lastName || !formData.email) {
      toast.error('All fields are required');
      return;
    }
    try {
      setIsSaving(true);
      await updateProfile(formData);
      setIsEditing(false);
    } catch (err) {
      toast.error(err.message || 'Could not save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await deleteAccount();
    } catch (err) {
      toast.error(err.message || 'Could not delete account');
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const links = [
    { label: 'Saved homes', icon: <HeartIcon size={18} />, to: '/favorites' },
    { label: 'Bookings', icon: <CalendarDaysIcon size={18} />, to: '/bookings' },
    { label: 'List a property', icon: <HomeIcon size={18} />, to: '/create-listing' },
    ...(user.role === 'admin' ? [{ label: 'Admin dashboard', icon: <GridIcon size={18} />, to: '/admin' }] : []),
  ];

  return (
    <div className="page page-fade">
      <Navbar />

      <header className="page-head">
        <div className="container">
          <h1 className="page-title">Your account</h1>
          <p className="page-sub">Manage your profile, saved homes, and reservations.</p>
        </div>
      </header>

      <div className="page-body">
        <div className="container">
          <div className="account-grid">
            {/* Sidebar card */}
            <aside>
              <div className="account-card account-hero">
                <div className="account-avatar-lg">{initials(user.firstName, user.lastName)}</div>
                <div className="account-hero-name">{user.firstName} {user.lastName}</div>
                <div className="account-hero-email">{user.email}</div>
                <span className={`role-pill role-pill--${user.role}`}>{user.role}</span>
                <div className="account-links">
                  {links.map(link => (
                    <button key={link.to} className="account-link" onClick={() => navigate(link.to)}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
                        {link.icon} {link.label}
                      </span>
                      <ChevronRightIcon size={16} />
                    </button>
                  ))}
                  <button className="account-link" onClick={logout}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
                      <LogOutIcon size={18} /> Sign out
                    </span>
                    <ChevronRightIcon size={16} />
                  </button>
                </div>
              </div>
            </aside>

            {/* Main column */}
            <div>
              <div className="account-card">
                <div className="account-card-head">
                  <h2>Profile information</h2>
                  {!isEditing && (
                    <button className="btn btn--outline btn--sm" onClick={() => setIsEditing(true)}>
                      Edit profile
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <>
                    <div className="form-row">
                      <div className="field">
                        <label className="field-label" htmlFor="acct-first">First name</label>
                        <input
                          id="acct-first"
                          className="field-input"
                          value={formData.firstName}
                          onChange={(e) => setFormData(p => ({ ...p, firstName: e.target.value }))}
                        />
                      </div>
                      <div className="field">
                        <label className="field-label" htmlFor="acct-last">Last name</label>
                        <input
                          id="acct-last"
                          className="field-input"
                          value={formData.lastName}
                          onChange={(e) => setFormData(p => ({ ...p, lastName: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="field">
                      <label className="field-label" htmlFor="acct-email">Email</label>
                      <input
                        id="acct-email"
                        className="field-input"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                      />
                    </div>
                    <div className="account-actions">
                      <button className="btn btn--gold" onClick={handleSave} disabled={isSaving}>
                        {isSaving ? 'Saving…' : 'Save changes'}
                      </button>
                      <button className="btn btn--outline" onClick={() => setIsEditing(false)}>Cancel</button>
                    </div>
                  </>
                ) : (
                  <div className="info-list">
                    <div className="info-row">
                      <span className="info-label">Name</span>
                      <span className="info-value">{user.firstName} {user.lastName}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Email</span>
                      <span className="info-value">{user.email}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Role</span>
                      <span className="info-value">{user.role}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Member since</span>
                      <span className="info-value">{user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="account-card" style={{ borderColor: 'var(--danger-100)' }}>
                <div className="account-card-head">
                  <h2 style={{ color: 'var(--danger-600)' }}>Danger zone</h2>
                </div>
                <p style={{ color: 'var(--muted)', fontSize: '0.92rem', marginBottom: 'var(--sp-5)' }}>
                  Deleting your account removes access permanently. This cannot be undone.
                </p>
                <button className="btn btn--danger" onClick={() => setConfirmDelete(true)}>
                  Delete account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete your account?"
        description="Your account and saved data will be permanently deactivated. This cannot be undone."
        confirmLabel="Delete account"
        onConfirm={handleDelete}
        busy={deleting}
      />

      <Footer />
    </div>
  );
}

export default AccountPage;