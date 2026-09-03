import { useEffect, useRef } from 'react';
import { XIcon, CheckIcon, TrashIcon } from './icons';

function Modal({ open, onClose, title, description, icon = 'danger', confirmLabel = 'Confirm', cancelLabel = 'Cancel', onConfirm, busy = false, children }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={`modal-backdrop ${open ? 'open' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="modal" ref={dialogRef}>
        {icon && (
          <div className={`modal-icon modal-icon--${icon}`}>
            {icon === 'danger' ? <TrashIcon size={26} /> : <CheckIcon size={26} />}
          </div>
        )}
        <h3 className="modal-title">{title}</h3>
        {description && <p className="modal-desc">{description}</p>}
        {children}
        <div className="modal-actions">
          <button type="button" className="btn btn--outline btn--sm" onClick={onClose} disabled={busy}>
            {cancelLabel}
          </button>
          {onConfirm && (
            <button type="button" className={`btn btn--sm ${icon === 'danger' ? 'btn--danger' : 'btn--gold'}`} onClick={onConfirm} disabled={busy}>
              {busy ? 'Working…' : confirmLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default Modal;