import { PROPERTY_TYPES, LISTING_TYPES } from '../utils/constants';
import { SlidersIcon } from './icons';

const EMPTY_FILTERS = {
  keyword: '',
  propertyType: '',
  listingType: '',
  minPrice: '',
  maxPrice: '',
  bedrooms: '',
  bathrooms: '',
};

function FilterPanel({ filters, onChange, onApply, onClear, activeCount }) {
  const set = (key) => (e) => onChange({ ...filters, [key]: e.target.value });

  return (
    <>
      <div className="filter-sidebar-head">
        <h3><SlidersIcon size={17} /> Filters</h3>
        {activeCount > 0 && (
          <button className="filter-clear" onClick={onClear}>Clear all</button>
        )}
      </div>

      <div className="filter-group">
        <label className="filter-group-title" htmlFor="fp-listing">Listing type</label>
        <div className="chip-row">
          <button
            type="button"
            className={`chip ${!filters.listingType ? 'chip--active' : ''}`}
            onClick={() => onChange({ ...filters, listingType: '' })}
          >
            All
          </button>
          {LISTING_TYPES.map(t => (
            <button
              key={t}
              type="button"
              className={`chip ${filters.listingType === t ? 'chip--active' : ''}`}
              onClick={() => onChange({ ...filters, listingType: t })}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-group">
        <label className="filter-group-title" htmlFor="fp-type">Property type</label>
        <select
          id="fp-type"
          className="field-input"
          value={filters.propertyType}
          onChange={set('propertyType')}
        >
          <option value="">Any type</option>
          {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className="filter-group">
        <span className="filter-group-title">Price range</span>
        <div className="range-inputs">
          <input
            className="field-input"
            type="number"
            min="0"
            placeholder="Min"
            value={filters.minPrice}
            onChange={set('minPrice')}
            aria-label="Minimum price"
          />
          <span className="range-sep">–</span>
          <input
            className="field-input"
            type="number"
            min="0"
            placeholder="Max"
            value={filters.maxPrice}
            onChange={set('maxPrice')}
            aria-label="Maximum price"
          />
        </div>
      </div>

      <div className="filter-group">
        <span className="filter-group-title">Bedrooms</span>
        <div className="chip-row">
          <button
            type="button"
            className={`chip ${!filters.bedrooms ? 'chip--active' : ''}`}
            onClick={() => onChange({ ...filters, bedrooms: '' })}
          >
            Any
          </button>
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              type="button"
              className={`chip ${String(filters.bedrooms) === String(n) ? 'chip--active' : ''}`}
              onClick={() => onChange({ ...filters, bedrooms: n })}
            >
              {n}+
            </button>
          ))}
        </div>
      </div>

      <div className="filter-group">
        <span className="filter-group-title">Bathrooms</span>
        <div className="chip-row">
          <button
            type="button"
            className={`chip ${!filters.bathrooms ? 'chip--active' : ''}`}
            onClick={() => onChange({ ...filters, bathrooms: '' })}
          >
            Any
          </button>
          {[1, 2, 3, 4].map(n => (
            <button
              key={n}
              type="button"
              className={`chip ${String(filters.bathrooms) === String(n) ? 'chip--active' : ''}`}
              onClick={() => onChange({ ...filters, bathrooms: n })}
            >
              {n}+
            </button>
          ))}
        </div>
      </div>

      <div className="filter-actions">
        <button className="btn btn--navy btn--block" onClick={onApply}>Show results</button>
        {activeCount > 0 && (
          <button className="btn btn--outline btn--block" onClick={onClear}>Clear filters</button>
        )}
      </div>
    </>
  );
}

export { FilterPanel, EMPTY_FILTERS };