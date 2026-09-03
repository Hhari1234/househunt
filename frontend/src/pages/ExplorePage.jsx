import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
import ErrorState from '../components/ErrorState';
import { FilterPanel, EMPTY_FILTERS } from '../components/FilterPanel';
import { SearchIcon, SlidersIcon, XIcon, ChevronLeftIcon, ChevronRightIcon } from '../components/icons';

function ExplorePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const { properties, loading, error, fetchProperties, pagination } = useProperties();
  const { isPropertyFavorited, toggleFavorite, isFavoritePending } = useFavorites();

  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);

  // Initialize filters from URL params
  useEffect(() => {
    const fromUrl = {};
    ['keyword', 'propertyType', 'listingType', 'minPrice', 'maxPrice', 'bedrooms', 'bathrooms'].forEach(key => {
      const value = searchParams.get(key);
      if (value) fromUrl[key] = value;
    });
    setFilters(prev => ({ ...EMPTY_FILTERS, ...fromUrl }));
    setPage(1);
  }, [searchParams]);

  const load = useCallback(async (nextFilters, nextPage) => {
    try {
      await fetchProperties(nextFilters, nextPage);
    } catch {
      // error surfaced via `error` state
    }
  }, [fetchProperties]);

  useEffect(() => {
    load(filters, page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.keyword, filters.propertyType, filters.listingType, filters.minPrice, filters.maxPrice, filters.bedrooms, filters.bathrooms, page]);

  const activeCount = useMemo(() => {
    return Object.entries(filters).filter(([key, value]) => key !== 'keyword' && value !== '' && value !== null).length;
  }, [filters]);

  const applyFilters = () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== '' && value !== null) params.set(key, value);
    });
    const qs = params.toString();
    navigate(`/properties${qs ? `?${qs}` : ''}`, { replace: false });
    setPage(1);
    setFiltersOpen(false);
  };

  const clearFilters = () => {
    setFilters(EMPTY_FILTERS);
    navigate('/properties');
    setPage(1);
    setFiltersOpen(false);
  };

  // Close the mobile filter sheet with Escape
  useEffect(() => {
    if (!filtersOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setFiltersOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [filtersOpen]);

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

  const totalPages = Math.max(1, pagination.pages || 1);
  const pageNumbers = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, start + 4);
  for (let i = start; i <= end; i++) pageNumbers.push(i);

  return (
    <div className="explore page-fade">
      <Navbar />

      <header className="explore-head">
        <div className="container">
          <h1 className="explore-title">Explore properties</h1>
          <p className="explore-count">
            {!loading && !error && (
              <><strong>{pagination.total || 0}</strong> {pagination.total === 1 ? 'home' : 'homes'} available</>
            )}
          </p>
          <form
            className="search-box"
            onSubmit={(e) => { e.preventDefault(); applyFilters(); }}
            role="search"
            aria-label="Search properties"
          >
            <div className="search-box-inner">
              <SearchIcon size={20} />
              <input
                type="text"
                placeholder="Search by home type, title, or description…"
                value={filters.keyword}
                onChange={(e) => setFilters(prev => ({ ...prev, keyword: e.target.value }))}
                aria-label="Search keyword"
              />
              <button type="submit" className="btn btn--gold">Search</button>
            </div>
          </form>
        </div>
      </header>

      <div className="container">
        <div className="explore-toolbar">
          <button
            className={`filter-trigger ${activeCount > 0 ? 'filter-trigger--active' : ''}`}
            onClick={() => setFiltersOpen(true)}
          >
            <SlidersIcon size={17} /> Filters {activeCount > 0 && `(${activeCount})`}
          </button>
          <span className="results-meta">
            {!loading && !error && `Showing ${properties.length} of ${pagination.total || 0}`}
          </span>
        </div>

        <div className="explore-layout">
          {/* Desktop sidebar */}
          <aside className="filter-sidebar" aria-label="Filters">
            <FilterPanel
              filters={filters}
              onChange={setFilters}
              onApply={applyFilters}
              onClear={clearFilters}
              activeCount={activeCount}
            />
          </aside>

          {/* Results */}
          <div>
            {loading ? (
              <PropertyGridSkeleton count={6} />
            ) : error ? (
              <ErrorState
                message={error}
                onRetry={() => load(filters, page)}
              />
            ) : properties.length === 0 ? (
              <EmptyState
                icon={<SlidersIcon size={38} />}
                title="No homes match your search"
                description="Try adjusting your filters or clearing them to see every listing."
                action={{ label: 'Clear filters', onClick: clearFilters }}
              />
            ) : (
              <div className="results-grid">
                {properties.map((property, i) => (
                  <Reveal key={property._id} delay={Math.min(i, 5) * 60}>
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
            )}

            {!loading && !error && totalPages > 1 && (
              <nav className="pagination" aria-label="Pagination">
                <button
                  className="page-btn"
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  aria-label="Previous page"
                >
                  <ChevronLeftIcon size={16} />
                </button>
                {pageNumbers.map(num => (
                  <button
                    key={num}
                    className={`page-btn ${num === page ? 'page-btn--active' : ''}`}
                    onClick={() => setPage(num)}
                    aria-label={`Page ${num}`}
                    aria-current={num === page ? 'page' : undefined}
                  >
                    {num}
                  </button>
                ))}
                <button
                  className="page-btn"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  aria-label="Next page"
                >
                  <ChevronRightIcon size={16} />
                </button>
              </nav>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter sheet — mounted only while open so it never
          contributes scrollable overflow when closed */}
      {filtersOpen && (
        <>
          <div className="sheet-backdrop" onClick={() => setFiltersOpen(false)} aria-hidden="true" />
          <div className="sheet" role="dialog" aria-modal="true" aria-label="Filters">
            <div className="sheet-grip" />
            <div className="sheet-head">
              <h3>Filters</h3>
              <button className="icon-btn" onClick={() => setFiltersOpen(false)} aria-label="Close filters">
                <XIcon size={18} />
              </button>
            </div>
            <FilterPanel
              filters={filters}
              onChange={setFilters}
              onApply={applyFilters}
              onClear={clearFilters}
              activeCount={activeCount}
            />
          </div>
        </>
      )}

      <Footer />
    </div>
  );
}

export default ExplorePage;