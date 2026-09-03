import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../hooks/useAuth';
import { useBookings } from '../hooks/useBookings';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import Modal from '../components/Modal';
import { BookingItemSkeleton } from '../components/Skeletons';
import { CalendarDaysIcon, CalendarIcon, MapPinIcon } from '../components/icons';
import { formatPrice, formatDateRange, capitalize } from '../utils/format';
import { getPropertyCover } from '../utils/images';

const TABS = ['all', 'pending', 'confirmed', 'cancelled', 'completed'];

function BookingsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { bookings, loading, error, fetchBookings, cancelBooking } = useBookings();
  const [filter, setFilter] = useState('all');
  const [toCancel, setToCancel] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (user?._id) {
      fetchBookings({ userId: user._id });
    }
  }, [user, fetchBookings]);

  const filtered = useMemo(() => {
    if (filter === 'all') return bookings;
    return bookings.filter(b => b.status === filter);
  }, [bookings, filter]);

  const counts = useMemo(() => {
    const map = { all: bookings.length };
    bookings.forEach(b => { map[b.status] = (map[b.status] || 0) + 1; });
    return map;
  }, [bookings]);

  const confirmCancel = async () => {
    if (!toCancel) return;
    try {
      setCancelling(true);
      await cancelBooking(toCancel._id);
      toast.success('Booking cancelled');
      setToCancel(null);
      fetchBookings({ userId: user._id });
    } catch (err) {
      toast.error(err.message || 'Could not cancel booking');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="page page-fade">
      <Navbar />

      <header className="page-head">
        <div className="container">
          <h1 className="page-title">Your bookings</h1>
          <p className="page-sub">
            {bookings.length > 0 ? `${bookings.length} ${bookings.length === 1 ? 'reservation' : 'reservations'} on your account` : 'Every reservation you make will live here.'}
          </p>
        </div>
      </header>

      <div className="page-body">
        <div className="container">
          {loading ? (
            <BookingItemSkeleton />
          ) : error ? (
            <ErrorState message={error} onRetry={() => fetchBookings({ userId: user?._id })} />
          ) : bookings.length === 0 ? (
            <EmptyState
              icon={<CalendarDaysIcon size={38} />}
              title="No bookings yet"
              description="When you request a booking on a property, it will appear here with its status."
              action={{ label: 'Explore properties', onClick: () => navigate('/properties') }}
            />
          ) : (
            <>
              <div className="chip-row" style={{ marginBottom: 'var(--sp-8)' }}>
                {TABS.map(tab => (
                  <button
                    key={tab}
                    className={`chip ${filter === tab ? 'chip--active' : ''}`}
                    onClick={() => setFilter(tab)}
                    aria-pressed={filter === tab}
                  >
                    {capitalize(tab)} <span style={{ opacity: 0.6 }}>({counts[tab] || 0})</span>
                  </button>
                ))}
              </div>

              {filtered.length > 0 ? (
                <div className="bookings-list">
                  {filtered.map(booking => {
                    const property = booking.listingId || {};
                    const image = getPropertyCover(property);
                    const cancellable = booking.status === 'pending' || booking.status === 'confirmed';
                    return (
                      <article key={booking._id} className="booking-item">
                        <div
                          className="booking-item-media"
                          onClick={() => property._id && navigate(`/properties/${property._id}`)}
                          role="link"
                          tabIndex={0}
                          aria-label={property.title || 'View property'}
                          onKeyDown={(e) => e.key === 'Enter' && property._id && navigate(`/properties/${property._id}`)}
                        >
                          <img src={image} alt={property.title || 'Property'} loading="lazy" />
                        </div>
                        <div className="booking-item-body">
                          <div className="booking-item-top">
                            <div>
                              <h3
                                className="booking-item-title"
                                onClick={() => property._id && navigate(`/properties/${property._id}`)}
                              >
                                {property.title || 'Property listing'}
                              </h3>
                              <p className="booking-item-sub">
                                {property.propertyType ? `${property.propertyType} · ` : ''}Ref #{booking._id?.slice(-6) || '—'}
                              </p>
                            </div>
                            <span className={`status-pill status-pill--${booking.status}`}>
                              {capitalize(booking.status)}
                            </span>
                          </div>

                          <div className="booking-item-dates">
                            <CalendarIcon size={15} />
                            {formatDateRange(booking.startDate, booking.endDate)}
                          </div>
                          {property.title && (
                            <p className="booking-item-sub">
                              <MapPinIcon size={12} style={{ display: 'inline', verticalAlign: '-2px' }} /> {property.description || ''}
                            </p>
                          )}

                          <div className="booking-item-foot">
                            <span className="booking-item-price">
                              {formatPrice(booking.totalPrice)}
                              {property.listingType === 'Rent' && monthCount(booking) > 1 && ` · ${monthCount(booking)} months`}
                            </span>
                            {cancellable && (
                              <button className="btn btn--outline btn--sm" onClick={() => setToCancel(booking)}>
                                Cancel booking
                              </button>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <EmptyState
                  title={`No ${filter === 'all' ? '' : filter + ' '}bookings`}
                  description="Nothing in this category yet."
                />
              )}
            </>
          )}
        </div>
      </div>

      <Modal
        open={!!toCancel}
        onClose={() => setToCancel(null)}
        title="Cancel this booking?"
        description={toCancel ? `Your booking for “${toCancel.listingId?.title || 'this property'}” will be cancelled. This can't be undone.` : ''}
        confirmLabel="Cancel booking"
        onConfirm={confirmCancel}
        busy={cancelling}
      />

      <Footer />
    </div>
  );
}

function monthCount(booking) {
  const start = new Date(booking.startDate);
  const end = new Date(booking.endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 1;
  const days = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
  return Math.ceil(days / 30);
}

export default BookingsPage;