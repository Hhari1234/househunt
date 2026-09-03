import { useState } from 'react';
import FavoriteButton from './FavoriteButton';
import { BedIcon, BathIcon, AreaIcon, MapPinIcon, ArrowRightIcon } from './icons';
import { formatPrice } from '../utils/format';
import { getPropertyCover, PLACEHOLDER_IMAGE } from '../utils/images';

function PropertyCard({ property, onFavorite, isFavorited, isFavBusy, onSelect }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const src = failed ? PLACEHOLDER_IMAGE : getPropertyCover(property);
  const isRent = property.listingType === 'Rent';
  const location = property.location
    ? `${property.location.city || ''}${property.location.city && property.location.state ? ', ' : ''}${property.location.state || ''}`.trim()
    : '';

  return (
    <article
      className="prop-card"
      onClick={() => onSelect?.(property._id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect?.(property._id);
        }
      }}
      role="link"
      tabIndex={0}
      aria-label={property.title}
    >
      <div className="prop-media">
        <img
          className={`img-fade ${loaded || failed ? 'is-loaded' : ''}`}
          src={src}
          alt={property.title}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
        <div className="prop-badges">
          <span className={`prop-badge ${isRent ? 'prop-badge--rent' : 'prop-badge--sale'}`}>
            {isRent ? 'For Rent' : 'For Sale'}
          </span>
          {property.propertyType && (
            <span className="prop-badge prop-badge--type">{property.propertyType}</span>
          )}
        </div>
        {onFavorite && (
          <FavoriteButton
            isFavorited={isFavorited}
            busy={isFavBusy}
            onToggle={() => onFavorite(property._id)}
          />
        )}
      </div>
      <div className="prop-body">
        <h3 className="prop-title">{property.title}</h3>
        <p className="prop-location">
          <MapPinIcon size={13} />
          <span>{location || property.description || 'Location unavailable'}</span>
        </p>
        <div className="prop-meta">
          <span className="prop-meta-item">
            <BedIcon size={15} /> {property.bedrooms ?? 0} {property.bedrooms === 1 ? 'bed' : 'beds'}
          </span>
          <span className="prop-meta-item">
            <BathIcon size={15} /> {property.bathrooms ?? 0} {property.bathrooms === 1 ? 'bath' : 'baths'}
          </span>
          <span className="prop-meta-item">
            <AreaIcon size={15} /> {property.area ? property.area.toLocaleString() : '—'} sq ft
          </span>
        </div>
        <div className="prop-foot">
          <span className="prop-price">
            {formatPrice(property.price, property.currency)}
            {isRent && <span className="prop-price-period">/ mo</span>}
          </span>
          <span className="prop-cta">View <ArrowRightIcon size={15} /></span>
        </div>
      </div>
    </article>
  );
}

export default PropertyCard;