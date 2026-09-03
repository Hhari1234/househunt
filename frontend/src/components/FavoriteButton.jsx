import { HeartIcon } from './icons';

function FavoriteButton({ isFavorited, busy, onToggle, label }) {
  return (
    <button
      type="button"
      className={`prop-fav ${isFavorited ? 'prop-fav--active' : ''} ${busy ? 'prop-fav--busy' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        onToggle?.();
      }}
      aria-label={label || (isFavorited ? 'Remove from favorites' : 'Add to favorites')}
      aria-pressed={isFavorited}
      disabled={busy}
    >
      <HeartIcon size={19} filled={isFavorited} />
    </button>
  );
}

export default FavoriteButton;