import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../hooks/useAuth';
import { useProperties } from '../hooks/useProperties';
import { useFavorites } from '../hooks/useFavorites';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PropertyCard from '../components/PropertyCard';
import Reveal from '../components/Reveal';
import { PropertyGridSkeleton } from '../components/Skeletons';
import EmptyState from '../components/EmptyState';
import { SearchIcon, CompassIcon, KeyIcon, CalendarIcon, ArrowRightIcon, ShieldIcon, SparkleIcon } from '../components/icons';

const TYPE_TILES = [
  { type: 'House', img: 'assets/beach_cat.jpg' },
  { type: 'Villa', img: 'assets/pool_cat.jpg' },
  { type: 'Apartment', img: 'assets/modern_cat.webp' },
  { type: 'Condo', img: 'assets/castle_cat.webp' },
  { type: 'Studio', img: 'assets/island_cat.webp' },
  { type: 'Office', img: 'assets/countryside_cat.webp' },
];

function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { properties, loading, error, fetchProperties } = useProperties();
  const { isPropertyFavorited, toggleFavorite, isFavoritePending } = useFavorites();

  const [keyword, setKeyword] = useState('');
  const [listingType, setListingType] = useState('');
  const [featured, setFeatured] = useState([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const response = await fetchProperties({ limit: 6 });
        if (mounted) setFeatured(response?.data || []);
      } catch {
        if (mounted) setFeatured([]);
      } finally {
        if (mounted) setFeaturedLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [fetchProperties]);

  const handleFavorite = async (propertyId) => {
    if (!isAuthenticated) {
      toast.info('Please sign in to save homes');
      navigate('/login');
      return;
    }
    try {
      await toggleFavorite(propertyId);
    } catch (err) {
      toast.error(err.message || 'Could not update favorites');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (keyword.trim()) params.set('keyword', keyword.trim());
    if (listingType) params.set('listingType', listingType);
    navigate(`/properties${params.toString() ? `?${params.toString()}` : ''}`);
  };

  return (
    <div className="home-page page-fade">
      <Navbar />

      {/* ============ HERO ============ */}
      <section className="hero">
        <div className="hero-media">
          <img className="hero-img" src="assets/Listing1/1.jpg" alt="An elegant home bathed in warm light" />
        </div>
        <div className="hero-scrim" />
        <div className="hero-grain" />

        <div className="hero-inner">
          <span className="hero-eyebrow">Premium real estate marketplace</span>
          <h1 className="hero-title">
            Find a place you&rsquo;ll <em>love</em> to call home.
          </h1>
          <p className="hero-sub">
            Exceptional homes for rent and sale — curated, verified, and ready for the next chapter of your life.
          </p>

          <div className="hero-search-wrap">
            <form className="hero-search" onSubmit={handleSearch} role="search" aria-label="Search properties">
              <div className="search-field">
                <SearchIcon size={19} />
                <input
                  type="text"
                  placeholder="Search by city, home type, or keyword…"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  aria-label="Search keyword"
                />
              </div>
              <div className="search-field">
                <select
                  value={listingType}
                  onChange={(e) => setListingType(e.target.value)}
                  aria-label="Listing type"
                >
                  <option value="">Rent or buy</option>
                  <option value="Rent">For rent</option>
                  <option value="Sale">For sale</option>
                </select>
              </div>
              <button type="submit" className="btn btn--gold btn--lg">Search</button>
            </form>
            <p className="hero-hint">
              <ShieldIcon size={14} /> Real listings, real bookings — powered by the HouseHunt platform
            </p>
          </div>
        </div>

        <div className="hero-cue" aria-hidden="true" />
      </section>

      {/* ============ FEATURED ============ */}
      <section className="section">
        <div className="container">
          <Reveal>
            <div className="section-head">
              <span className="eyebrow">Curated for you</span>
              <h2 className="section-title">Featured properties</h2>
              <p className="section-sub">A hand-picked selection from the latest listings on HouseHunt.</p>
            </div>
          </Reveal>

          {featuredLoading ? (
            <PropertyGridSkeleton count={6} />
          ) : error ? (
            <EmptyState
              title="We couldn't load properties"
              description="There was a problem reaching the HouseHunt service. Please try again."
              action={{ label: 'Retry', onClick: () => { setFeaturedLoading(true); fetchProperties({ limit: 6 }).then(r => setFeatured(r?.data || [])).finally(() => setFeaturedLoading(false)); } }}
            />
          ) : featured.length > 0 ? (
            <div className="prop-grid prop-grid--featured">
              {featured.map((property, i) => (
                <Reveal key={property._id} delay={i * 70}>
                  <PropertyCard
                    property={property}
                    isFavorited={isPropertyFavorited(property._id)}
                    isFavBusy={isFavoritePending(property._id)}
                    onFavorite={handleFavorite}
                    onSelect={(id) => navigate(`/properties/${id}`)}
                  />
                </Reveal>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<CompassIcon size={38} />}
              title="No properties listed yet"
              description="Be the first to list a property on HouseHunt — or check back soon as new homes are added."
              action={{ label: 'Explore the marketplace', onClick: () => navigate('/properties') }}
            />
          )}
        </div>
      </section>

      {/* ============ EXPLORE BY TYPE ============ */}
      <section className="section section--soft">
        <div className="container">
          <Reveal>
            <div className="section-head section-head--center">
              <span className="eyebrow">Browse</span>
              <h2 className="section-title">Explore by property type</h2>
              <p className="section-sub">From city apartments to countryside villas — find the shape your life takes.</p>
            </div>
          </Reveal>
          <div className="type-grid">
            {TYPE_TILES.map((tile, i) => (
              <Reveal key={tile.type} delay={i * 60}>
                <button
                  className="type-tile"
                  onClick={() => navigate(`/properties?propertyType=${encodeURIComponent(tile.type)}`)}
                  aria-label={`Browse ${tile.type} properties`}
                >
                  <img src={tile.img} alt={tile.type} loading="lazy" />
                  <span className="type-tile-label">{tile.type}</span>
                </button>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section className="section">
        <div className="container">
          <Reveal>
            <div className="section-head section-head--center">
              <span className="eyebrow">Simple by design</span>
              <h2 className="section-title">How HouseHunt works</h2>
              <p className="section-sub">Three elegant steps between you and your next home.</p>
            </div>
          </Reveal>
          <div className="steps-grid">
            {[
              { icon: <CompassIcon size={22} />, title: 'Discover', desc: 'Search and filter the marketplace to find homes that match your style, budget, and timeline.' },
              { icon: <KeyIcon size={22} />, title: 'Explore', desc: 'Immerse yourself in rich galleries, amenities, and owner details before you decide.' },
              { icon: <CalendarIcon size={22} />, title: 'Book', desc: 'Request a booking in seconds. Track every reservation from your personal dashboard.' },
            ].map((step, i) => (
              <Reveal key={step.title} delay={i * 90}>
                <div className="step-card">
                  <span className="step-num">{step.icon}</span>
                  <h3>{step.title}</h3>
                  <p>{step.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="section section--soft">
        <div className="container">
          <Reveal>
            <div className="cta-band">
              <h2>Ready to begin the search?</h2>
              <p>Your next chapter deserves a beautiful setting. Start exploring homes today.</p>
              <button className="btn btn--gold btn--lg" onClick={() => navigate('/properties')}>
                Explore properties <ArrowRightIcon size={18} />
              </button>
            </div>
          </Reveal>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default HomePage;