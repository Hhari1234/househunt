import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../hooks/useAuth';
import { useProperties } from '../hooks/useProperties';
import { useFavorites } from '../hooks/useFavorites';
import { useBookings } from '../hooks/useBookings';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PropertyGallery from '../components/PropertyGallery';
import ErrorState from '../components/ErrorState';
import { PropertyGridSkeleton } from '../components/Skeletons';
import {
  BedIcon, BathIcon, AreaIcon, MapPinIcon, HeartIcon, ShieldIcon, CheckIcon, CalendarIcon,
} from '../components/icons';
import { formatPrice, formatNumber, initials } from '../utils/format';
import { getPropertyImages } from '../utils/images';

const DAY_MS = 1000 * 60 * 60 * 24;

// Rental price is per month — round the spanned days up to whole months for a clear quote.
function monthsBetween(startStr, endStr) {
  const start = new Date(startStr);
  const end = new Date(endStr);
  const days = Math.round((end - start) / DAY_MS);
  return Math.max(1, Math.ceil(days / 30));
}

function ListingDetails() {
  const { listingId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { getPropertyById, loading } = useProperties();
  const { isPropertyFavorited, toggleFavorite, isFavoritePending } = useFavorites();
  const { createBooking, loading: bookingBusy } = useBookings();

  const [listing, setListing] = useState(null);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    try {
      setError(null);
      const property = await getPropertyById(listingId);
      setListing(property);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    if (listingId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingId]);

  const images = useMemo(() => (listing ? getPropertyImages(listing) : []), [listing]);

  const months = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end <= start) return 0;
    return monthsBetween(startDate, endDate);
  }, [startDate, endDate]);

  const totalPrice = months > 0 && listing ? months * listing.price : null;

  const isFav = listing ? isPropertyFavorited(listing._id) : false;

  const handleFavorite = async () => {
    if (!isAuthenticated) {
      toast.info('Please sign in to save homes');
      navigate('/login');
      return;
    }
    try {
      await toggleFavorite(listing._id);
    } catch (err) {
      toast.error(err.message || 'Could not update favorites');
    }
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.info('Please sign in to book this home');
      navigate('/login');
      return;
    }
    if (!startDate || !endDate) {
      toast.error('Please choose your move-in and move-out dates');
      return;
    }
    if (months <= 0) {
      toast.error('Move-out date must be after move-in date');
      return;
    }
    const ownerId = listing.owner && typeof listing.owner === 'object' ? listing.owner._id : listing.owner;
    try {
      setSubmitting(true);
      await createBooking({
        customerId: user._id,
        hostId: ownerId,
        listingId: listing._id,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        totalPrice: Math.round(totalPrice),
      });
      toast.success('Booking request submitted');
      navigate('/bookings');
    } catch (err) {
      toast.error(err.message || 'Failed to create booking');
    } finally {
      setSubmitting(false);
    }
  };

  const ownerName = listing?.owner && typeof listing.owner === 'object'
    ? `${listing.owner.firstName || ''} ${listing.owner.lastName || ''}`.trim()
    : null;
  const isRent = listing?.listingType === 'Rent';
  const today = new Date().toISOString().split('T')[0];

  if (error && !listing) {
    return (
      <div className="page">
        <Navbar />
        <div className="container">
          <ErrorState
            title="We couldn't load this property"
            message={error}
            onRetry={load}
          />
        </div>
        <Footer />
      </div>
    );
  }

  if (!listing || loading) {
    return (
      <div className="page">
        <Navbar />
        <div className="container" style={{ paddingTop: 'var(--sp-8)' }}>
          <PropertyGridSkeleton count={1} />
          <div className="sk-line sk-shimmer" />
          <div className="sk-line sk-line--w70 sk-shimmer" />
          <div className="sk-line sk-line--w50 sk-shimmer" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="detail page-fade">
      <Navbar />

      <PropertyGallery images={images} title={listing.title} />

      <div className="detail-layout">
        {/* Main column */}
        <div className="detail-main">
          <div className="detail-badges">
            <span className={`prop-badge ${isRent ? 'prop-badge--rent' : 'prop-badge--sale'}`}>
              {isRent ? 'For Rent' : 'For Sale'}
            </span>
            {listing.propertyType && (
              <span className="prop-badge prop-badge--type">{listing.propertyType}</span>
            )}
          </div>

          <h1 className="detail-title">{listing.title}</h1>
          <p className="detail-loc">
            <MapPinIcon size={17} />
            {listing.description || 'Location on request'}
          </p>

          <div className="detail-price-row">
            <span className="detail-price">{formatPrice(listing.price, listing.currency)}</span>
            {isRent && <span className="detail-price-period">/ month</span>}
          </div>

          <div className="detail-meta">
            <div className="detail-meta-chip">
              <BedIcon size={22} />
              <div>
                <strong>{listing.bedrooms ?? 0}</strong>
                <span>{listing.bedrooms === 1 ? 'Bedroom' : 'Bedrooms'}</span>
              </div>
            </div>
            <div className="detail-meta-chip">
              <BathIcon size={22} />
              <div>
                <strong>{listing.bathrooms ?? 0}</strong>
                <span>{listing.bathrooms === 1 ? 'Bathroom' : 'Bathrooms'}</span>
              </div>
            </div>
            <div className="detail-meta-chip">
              <AreaIcon size={22} />
              <div>
                <strong>{formatNumber(listing.area)}</strong>
                <span>Sq ft</span>
              </div>
            </div>
            <div className="detail-meta-chip">
              <CalendarIcon size={22} />
              <div>
                <strong>{isRent ? 'Monthly' : 'One-time'}</strong>
                <span>Listing</span>
              </div>
            </div>
          </div>

          <div className="detail-section">
            <h3 className="detail-h3">About this home</h3>
            <p className="detail-text">{listing.description}</p>
          </div>

          {listing.amenities && listing.amenities.length > 0 && (
            <div className="detail-section">
              <h3 className="detail-h3">Amenities</h3>
              <div className="amenities">
                {listing.amenities.map((amenity, i) => (
                  <span key={i} className="amenity">
                    <CheckIcon size={13} /> {amenity}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="detail-section">
            <h3 className="detail-h3">Listed by</h3>
            <div className="owner">
              <span className="owner-avatar">
                {initials(ownerName ? ownerName.split(' ')[0] : '', ownerName ? ownerName.split(' ')[1] : '')}
              </span>
              <div>
                <div className="owner-name">{ownerName || 'Property owner'}</div>
                <div className="owner-meta">
                  {listing.owner && typeof listing.owner === 'object' && listing.owner.email
                    ? listing.owner.email
                    : 'Verified HouseHunt member'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky booking panel */}
        <aside className="booking" aria-label="Book this property">
          <div className="booking-head">
            <div>
              <span className="booking-price">{formatPrice(listing.price, listing.currency)}</span>
              {isRent && <span className="booking-price-period"> / month</span>}
            </div>
            <span className="booking-trust"><ShieldIcon size={14} /> Secure</span>
          </div>

          <form onSubmit={handleBooking}>
            <div className="date-fields">
              <div className="date-field">
                <label className="date-label" htmlFor="checkin">Move-in</label>
                <input
                  id="checkin"
                  type="date"
                  value={startDate}
                  min={today}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="date-field">
                <label className="date-label" htmlFor="checkout">Move-out</label>
                <input
                  id="checkout"
                  type="date"
                  value={endDate}
                  min={startDate || today}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            {months > 0 && (
              <div className="booking-total">
                <div className="booking-total-row">
                  <span>{formatPrice(listing.price, listing.currency)} × {months} {months === 1 ? 'month' : 'months'}</span>
                  <span>{formatPrice(months * listing.price, listing.currency)}</span>
                </div>
                <div className="booking-total-row booking-total-row--sum">
                  <span>Total</span>
                  <span>{formatPrice(totalPrice, listing.currency)}</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="btn btn--gold btn--lg"
              disabled={submitting || bookingBusy}
            >
              {submitting ? 'Requesting…' : 'Request to book'}
            </button>
          </form>

          <button
            className={`booking-fav-btn ${isFav ? 'booking-fav-btn--active' : ''}`}
            onClick={handleFavorite}
            disabled={isFavoritePending(listing._id)}
          >
            <HeartIcon size={17} filled={isFav} />
            {isFav ? 'Saved to favorites' : 'Save to favorites'}
          </button>

          <p className="booking-secure">
            <ShieldIcon size={13} /> Your booking request goes directly to the owner
          </p>
        </aside>
      </div>

      <Footer />
    </div>
  );
}

export default ListingDetails;