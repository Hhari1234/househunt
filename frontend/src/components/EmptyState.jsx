import { CompassIcon } from './icons';

function EmptyState({ icon, title, description, action }) {
  return (
    <div className="state">
      <div className="state-icon">
        {icon || <CompassIcon size={38} />}
      </div>
      <h3 className="state-title">{title}</h3>
      <p className="state-desc">{description}</p>
      {action && (
        <button className="btn btn--gold" onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </div>
  );
}

export default EmptyState;