import { XIcon } from './icons';

function ErrorState({ title = 'Something went wrong', message, onRetry }) {
  return (
    <div className="state">
      <div className="state-icon" style={{ background: 'var(--danger-100)', color: 'var(--danger-600)' }}>
        <XIcon size={38} />
      </div>
      <h3 className="state-title">{title}</h3>
      <p className="state-desc">{message || 'We couldn\'t load this content. Please try again.'}</p>
      {onRetry && (
        <button className="btn btn--navy" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export default ErrorState;