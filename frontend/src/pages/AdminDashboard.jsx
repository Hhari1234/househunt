import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../hooks/useAuth';
import { useAdmin } from '../hooks/useAdmin';
import Navbar from '../components/Navbar';
import ErrorState from '../components/ErrorState';
import { RowSkeleton } from '../components/Skeletons';
import {
  GridIcon, UsersIcon, BuildingIcon, CalendarDaysIcon, HomeIcon, ArrowRightIcon,
} from '../components/icons';
import { formatPrice, formatDateRange, capitalize } from '../utils/format';

const TABS = [
  { id: 'overview', label: 'Overview', icon: <GridIcon size={18} /> },
  { id: 'users', label: 'Users', icon: <UsersIcon size={18} /> },
  { id: 'properties', label: 'Properties', icon: <BuildingIcon size={18} /> },
  { id: 'bookings', label: 'Bookings', icon: <CalendarDaysIcon size={18} /> },
];

function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    dashboard, users, properties, bookings, loading, error,
    fetchDashboard, fetchUsers, fetchProperties, fetchBookings,
    updatePropertyStatus, updateUserStatus,
  } = useAdmin();

  const [activeTab, setActiveTab] = useState('overview');
  const [busyKey, setBusyKey] = useState('');

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchDashboard();
    fetchUsers();
    fetchProperties();
    fetchBookings();
  }, [user, navigate, fetchDashboard, fetchUsers, fetchProperties, fetchBookings]);

  if (user?.role !== 'admin') return null;

  const retryAll = () => {
    fetchDashboard();
    fetchUsers();
    fetchProperties();
    fetchBookings();
  };

  const handlePropertyStatus = async (property, nextStatus) => {
    try {
      setBusyKey(`p-${property._id}`);
      await updatePropertyStatus(property._id, nextStatus);
    } catch (err) {
      toast.error(err.message || 'Could not update property');
    } finally {
      setBusyKey('');
    }
  };

  const handleUserStatus = async (target, next) => {
    try {
      setBusyKey(`u-${target._id}`);
      await updateUserStatus(target._id, next);
    } catch (err) {
      toast.error(err.message || 'Could not update user');
    } finally {
      setBusyKey('');
    }
  };

  // apiClient returns the response body, so `dashboard` already holds the
  // summary object ({ totalUsers, activeUsers, ... }) returned by the API.
  const stats = dashboard ? [
    { label: 'Total users', value: dashboard.totalUsers ?? 0 },
    { label: 'Active users', value: dashboard.activeUsers ?? 0 },
    { label: 'Total properties', value: dashboard.totalProperties ?? 0 },
    { label: 'Published', value: dashboard.publishedProperties ?? 0 },
    { label: 'Total bookings', value: dashboard.totalBookings ?? 0 },
    { label: 'Completed', value: dashboard.completedBookings ?? 0 },
  ] : [];

  return (
    <div className="admin page-fade">
      <Navbar />

      <div className="admin-shell">
        <aside className="admin-side" aria-label="Admin navigation">
          <div className="admin-side-brand">
            <span className="nav-logo-mark"><HomeIcon size={17} /></span>
            HouseHunt Admin
          </div>
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`admin-side-item ${activeTab === tab.id ? 'admin-side-item--active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              aria-current={activeTab === tab.id ? 'page' : undefined}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
          <button className="admin-side-item" onClick={() => navigate('/properties')}>
            <ArrowRightIcon size={18} /> View site
          </button>
        </aside>

        <main className="admin-content">
          <div className="admin-head">
            <div>
              <h1 className="admin-title">
                {TABS.find(t => t.id === activeTab)?.label}
              </h1>
              <p className="admin-sub">Signed in as {user.firstName} {user.lastName} · {user.email}</p>
            </div>
            {error && (
              <button className="btn btn--outline btn--sm" onClick={retryAll}>Retry</button>
            )}
          </div>

          {loading && !dashboard && !users.length && !properties.length && !bookings.length ? (
            <RowSkeleton rows={6} />
          ) : error && !dashboard ? (
            <ErrorState message={error} onRetry={retryAll} />
          ) : (
            <>
              {activeTab === 'overview' && (
                <div className="stat-grid">
                  {stats.map(s => (
                    <div key={s.label} className="stat">
                      <span className="stat-value">{s.value}</span>
                      <span className="stat-label">{s.label}</span>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'users' && (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u._id}>
                          <td className="cell-strong">{u.firstName} {u.lastName}</td>
                          <td className="cell-muted">{u.email}</td>
                          <td><span className={`role-pill role-pill--${u.role}`}>{u.role}</span></td>
                          <td>
                            <span className={`status-pill ${u.isActive === false ? 'status-pill--rejected' : 'status-pill--active'}`}>
                              {u.isActive === false ? 'Inactive' : 'Active'}
                            </span>
                          </td>
                          <td>
                            <div className="cell-actions">
                              {u._id !== user._id && (
                                <button
                                  className="btn btn--outline btn--sm"
                                  disabled={busyKey === `u-${u._id}`}
                                  onClick={() => handleUserStatus(u, u.isActive === false ? 'active' : 'inactive')}
                                >
                                  {u.isActive === false ? 'Activate' : 'Deactivate'}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {users.length === 0 && <div className="table-empty">No users found.</div>}
                </div>
              )}

              {activeTab === 'properties' && (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Property</th>
                        <th>Type</th>
                        <th>Price</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {properties.map(p => (
                        <tr key={p._id}>
                          <td className="cell-strong">{p.title}</td>
                          <td className="cell-muted">{p.propertyType} · {p.listingType}</td>
                          <td>{formatPrice(p.price, p.currency)}</td>
                          <td><span className={`status-pill status-pill--${p.status}`}>{capitalize(p.status)}</span></td>
                          <td>
                            <div className="cell-actions">
                              <button
                                className="btn btn--outline btn--sm"
                                disabled={busyKey === `p-${p._id}`}
                                onClick={() => handlePropertyStatus(p, p.status === 'published' ? 'draft' : 'published')}
                              >
                                {p.status === 'published' ? 'Unpublish' : 'Publish'}
                              </button>
                              <button className="btn btn--outline btn--sm" onClick={() => navigate(`/properties/${p._id}`)}>
                                View
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {properties.length === 0 && <div className="table-empty">No properties found.</div>}
                </div>
              )}

              {activeTab === 'bookings' && (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Property</th>
                        <th>Customer</th>
                        <th>Dates</th>
                        <th>Total</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map(b => (
                        <tr key={b._id}>
                          <td className="cell-strong">{b.listingId?.title || '—'}</td>
                          <td className="cell-muted">
                            {b.customerId ? `${b.customerId.firstName || ''} ${b.customerId.lastName || ''}`.trim() || '—' : '—'}
                          </td>
                          <td className="cell-muted">{formatDateRange(b.startDate, b.endDate)}</td>
                          <td>{formatPrice(b.totalPrice)}</td>
                          <td><span className={`status-pill status-pill--${b.status}`}>{capitalize(b.status)}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {bookings.length === 0 && <div className="table-empty">No bookings found.</div>}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default AdminDashboard;