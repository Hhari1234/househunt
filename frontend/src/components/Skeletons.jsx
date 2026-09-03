export function PropertyCardSkeleton() {
  return (
    <div className="sk-card" aria-hidden="true">
      <div className="sk-media sk-shimmer" />
      <div className="sk-line sk-line--w70 sk-shimmer" />
      <div className="sk-line sk-line--w50 sk-shimmer" />
      <div className="sk-line sk-line--w40 sk-shimmer" />
    </div>
  );
}

export function PropertyGridSkeleton({ count = 6 }) {
  return (
    <div className="results-grid" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <PropertyCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function BookingItemSkeleton({ count = 3 }) {
  return (
    <div className="bookings-list" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="booking-item">
          <div className="booking-item-media sk-shimmer" />
          <div className="booking-item-body">
            <div className="sk-line sk-line--w70 sk-shimmer" style={{ margin: 0 }} />
            <div className="sk-line sk-line--w40 sk-shimmer" style={{ margin: 0 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function RowSkeleton({ rows = 5 }) {
  return (
    <div aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="sk-line sk-shimmer" style={{ margin: '0.9rem 0' }} />
      ))}
    </div>
  );
}