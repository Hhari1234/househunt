import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFavorites } from '../hooks/useFavorites';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PropertyCard from '../components/PropertyCard';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import { PropertyGridSkeleton } from '../components/Skeletons';
import { HeartIcon, SearchIcon } from '../components/icons';

function FavoritesPage() {
  const navigate = useNavigate();
  const { favorites, loading, error, fetchFavorites, toggleFavorite, isFavoritePending } = useFavorites();
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const visible = favorites.filter(p => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (p.title || '').toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q) ||
      (p.propertyType || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="page page-fade">
      <Navbar />

      <header className="page-head">
        <div className="container">
          <h1 className="page-title">Your saved homes</h1>
          <p className="page-sub">
            {favorites.length > 0 ? `${favorites.length} ${favorites.length === 1 ? 'home' : 'homes'} saved for later` : 'Everything you love, in one place.'}
          </p>
        </div>
      </header>

      <div className="page-body">
        <div className="container">
          {loading ? (
            <PropertyGridSkeleton count={3} />
          ) : error ? (
            <ErrorState message={error} onRetry={fetchFavorites} />
          ) : favorites.length === 0 ? (
            <EmptyState
              icon={<HeartIcon size={38} />}
              title="No saved homes yet"
              description="Tap the heart on any property to save it here. Your shortlist will follow you around."
              action={{ label: 'Explore properties', onClick: () => navigate('/properties') }}
            />
          ) : (
            <>
              <form
                className="search-box"
                style={{ marginTop: 0, marginBottom: 'var(--sp-8)' }}
                onSubmit={(e) => e.preventDefault()}
                role="search"
                aria-label="Search saved homes"
              >
                <div className="search-box-inner">
                  <SearchIcon size={20} />
                  <input
                    type="text"
                    placeholder="Search your saved homes…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    aria-label="Search saved homes"
                  />
                </div>
              </form>

              {visible.length > 0 ? (
                <div className="saved-grid">
                  {visible.map(property => (
                    <PropertyCard
                      key={property._id}
                      property={property}
                      isFavorited
                      isFavBusy={isFavoritePending(property._id)}
                      onFavorite={toggleFavorite}
                      onSelect={(id) => navigate(`/properties/${id}`)}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="Nothing matches that search"
                  description="Try a different keyword, or clear the search to see everything."
                />
              )}
            </>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default FavoritesPage;