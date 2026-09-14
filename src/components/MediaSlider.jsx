import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import MediaCard from './MediaCard';

export default function MediaSlider({ title, items = [], onPlay, onOpenDetail, onToggleWatchlist, isInWatchlist }) {
  const trackRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  if (!items || items.length === 0) return null;

  const checkScrollBounds = () => {
    if (!trackRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = trackRef.current;
    setCanScrollLeft(scrollLeft > 20);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 20);
  };

  useEffect(() => {
    const el = trackRef.current;
    if (el) {
      checkScrollBounds();
      el.addEventListener('scroll', checkScrollBounds, { passive: true });
      return () => el.removeEventListener('scroll', checkScrollBounds);
    }
  }, [items]);

  const scroll = (direction) => {
    if (!trackRef.current) return;
    const offset = direction === 'left' ? -Math.max(400, trackRef.current.clientWidth * 0.75) : Math.max(400, trackRef.current.clientWidth * 0.75);
    trackRef.current.scrollBy({ left: offset, behavior: 'smooth' });
  };

  return (
    <div className="media-slider-wrap">
      <div className="slider-header">
        <div className="slider-title-wrap">
          <div className="slider-title-dot"></div>
          <h2 className="slider-title">{title}</h2>
        </div>
        <div className="slider-controls">
          <button
            className={`slider-arrow-btn ${!canScrollLeft ? 'disabled' : ''}`}
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            aria-label="Scroll left"
          >
            <ChevronLeft size={19} />
          </button>
          <button
            className={`slider-arrow-btn ${!canScrollRight ? 'disabled' : ''}`}
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            aria-label="Scroll right"
          >
            <ChevronRight size={19} />
          </button>
        </div>
      </div>

      <div className="slider-track" ref={trackRef}>
        {items.map(item => (
          <MediaCard
            key={item.id}
            item={item}
            onPlay={onPlay}
            onOpenDetail={onOpenDetail}
            onToggleWatchlist={onToggleWatchlist}
            isInWatchlist={isInWatchlist}
          />
        ))}
      </div>
    </div>
  );
}
