import { useCallback, useEffect, useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, XIcon, ZoomInIcon } from './icons';
import { PLACEHOLDER_IMAGE } from '../utils/images';

function PropertyGallery({ images, title }) {
  const list = images.length > 0 ? images : [PLACEHOLDER_IMAGE];
  const [active, setActive] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [fsIndex, setFsIndex] = useState(0);
  const [touchX, setTouchX] = useState(null);

  const openFs = (index) => {
    setFsIndex(index);
    setFullscreen(true);
  };

  const step = useCallback((dir) => {
    setFsIndex(prev => (prev + dir + list.length) % list.length);
  }, [list.length]);

  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setFullscreen(false);
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [fullscreen, step]);

  const main = list[active];

  return (
    <>
      <div className="detail-gallery">
        <div className="gallery-main" onClick={() => openFs(active)} role="button" tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && openFs(active)}
          aria-label="Open photo gallery">
          <img src={main} alt={`${title} — main photo`} />
          <button className="gallery-zoom" onClick={(e) => { e.stopPropagation(); openFs(active); }} aria-label="View fullscreen">
            <ZoomInIcon size={20} />
          </button>
        </div>

        {list.length > 1 && (
          <>
            <div className="gallery-side" onClick={() => { setActive(1); openFs(1); }}>
              <img src={list[1]} alt={`${title} — photo 2`} />
            </div>
            {list.length > 2 && (
              <div className="gallery-side gallery-side--2" onClick={() => { setActive(2); openFs(2); }}>
                <img src={list[2]} alt={`${title} — photo 3`} />
                {list.length > 3 && (
                  <span className="gallery-more">+{list.length - 3} photos</span>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Fullscreen viewer — mounted only while open so hidden controls never
          reach the accessibility tree */}
      {fullscreen && (
      <div className="fs-modal open" role="dialog" aria-modal="true" aria-label="Photo gallery">
        <div className="fs-head">
          <span className="fs-counter">{fsIndex + 1} / {list.length}</span>
          <button className="fs-close" onClick={() => setFullscreen(false)} aria-label="Close gallery">
            <XIcon size={20} />
          </button>
        </div>
        <div className="fs-stage"
          onTouchStart={(e) => setTouchX(e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchX === null) return;
            const delta = e.changedTouches[0].clientX - touchX;
            if (Math.abs(delta) > 48) step(delta < 0 ? 1 : -1);
            setTouchX(null);
          }}>
          {list.length > 1 && (
            <>
              <button className="fs-nav-btn fs-prev" onClick={() => step(-1)} aria-label="Previous photo">
                <ChevronLeftIcon size={24} />
              </button>
              <button className="fs-nav-btn fs-next" onClick={() => step(1)} aria-label="Next photo">
                <ChevronRightIcon size={24} />
              </button>
            </>
          )}
          <img key={fsIndex} src={list[fsIndex]} alt={`${title} — photo ${fsIndex + 1}`} />
        </div>
        {list.length > 1 && (
          <div className="fs-thumbs">
            {list.map((img, i) => (
              <button
                key={i}
                className={`fs-thumb ${i === fsIndex ? 'fs-thumb--active' : ''}`}
                onClick={() => setFsIndex(i)}
                aria-label={`View photo ${i + 1}`}
              >
                <img src={img} alt="" />
              </button>
            ))}
          </div>
        )}
      </div>
      )}
    </>
  );
}

export default PropertyGallery;