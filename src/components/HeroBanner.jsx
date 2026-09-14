import React, { useState, useEffect } from 'react';
import { Play, Info, Plus, Check, Star, Sparkles } from 'lucide-react';
import { getBackdropUrl } from '../services/tmdb';

export default function HeroBanner({ items = [], onPlay, onOpenDetail, onToggleWatchlist, isInWatchlist }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!items || items.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % items.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [items]);

  if (!items || items.length === 0) return null;

  const current = items[currentIndex] || items[0];
  const inList = isInWatchlist(current.id);
  const title = current.title || current.name || 'Featured Title';
  const releaseYear = (current.release_date || current.first_air_date || '').split('-')[0] || '2025';
  const rating = current.vote_average ? current.vote_average.toFixed(1) : '8.8';
  const typeLabel = current.media_type === 'tv' ? (current.isAnime ? 'Anime Series' : 'TV Series') : 'Movie';

  return (
    <section
      className="hero-section"
      style={{ backgroundImage: `url(${getBackdropUrl(current.backdrop_path)})` }}
    >
      <div className="hero-overlay"></div>
      <div className="hero-vignette"></div>
      <div className="hero-glass-reflection"></div>

      <div className="hero-content">
        <div className="hero-badges">
          <span className="hero-tag trending pulse-glow">
            <Sparkles size={13} />
            <span>Trending Now</span>
          </span>
          <span className="hero-tag type glass-pill">{typeLabel}</span>
          <span className="rating-badge glass-pill">
            <Star size={14} fill="currentColor" />
            <span>{rating}</span>
          </span>
          <span className="hero-year-tag">{releaseYear}</span>
        </div>

        <h1 className="hero-title">{title}</h1>
        <p className="hero-overview">
          {current.overview || 'Experience the cinematic journey with high-definition streaming, flawless subtitles, and uninterrupted entertainment.'}
        </p>

        <div className="hero-actions">
          <button className="btn-primary shimmer-btn" onClick={() => onPlay(current)}>
            <div className="btn-shimmer-effect"></div>
            <Play size={18} fill="#fff" />
            <span>Watch Now</span>
          </button>

          <button className="btn-secondary glass-btn" onClick={() => onOpenDetail(current)}>
            <Info size={18} />
            <span>More Info</span>
          </button>

          <button
            className={`btn-icon-round glass-icon-btn ${inList ? 'active' : ''}`}
            onClick={() => onToggleWatchlist(current)}
            title={inList ? 'Remove from Watchlist' : 'Add to Watchlist'}
            aria-label="Toggle Watchlist"
          >
            {inList ? <Check size={20} /> : <Plus size={20} />}
          </button>
        </div>
      </div>

      <div className="hero-dots">
        {items.map((item, idx) => (
          <button
            key={item.id || idx}
            type="button"
            className={`hero-dot ${idx === currentIndex ? 'active' : ''}`}
            onClick={() => setCurrentIndex(idx)}
            aria-label={`Slide ${idx + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
