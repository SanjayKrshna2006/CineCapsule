import React from 'react';
import { Play, Star, Plus, Check } from 'lucide-react';
import { getImageUrl } from '../services/tmdb';

export default function MediaCard({ item, onPlay, onOpenDetail, onToggleWatchlist, isInWatchlist }) {
  if (!item) return null;

  const title = item.title || item.name || 'Untitled';
  const releaseYear = (item.release_date || item.first_air_date || '').split('-')[0] || '';
  const rating = item.vote_average ? item.vote_average.toFixed(1) : null;
  const inList = isInWatchlist ? isInWatchlist(item.id) : false;

  const isAnime = item.isAnime || (item.original_language === 'ja' && item.genre_ids?.includes(16));
  const isTv = item.media_type === 'tv';

  let badgeText = 'Movie';
  let badgeClass = 'badge-movie';
  if (isAnime) {
    badgeText = 'Anime';
    badgeClass = 'badge-anime';
  } else if (isTv) {
    badgeText = 'Series';
    badgeClass = 'badge-tv';
  }

  const handleCardClick = (e) => {
    e.stopPropagation();
    onOpenDetail(item);
  };

  const handlePlayClick = (e) => {
    e.stopPropagation();
    onPlay(item);
  };

  const handleWatchlistClick = (e) => {
    e.stopPropagation();
    if (onToggleWatchlist) onToggleWatchlist(item);
  };

  return (
    <div className="media-card" onClick={handleCardClick}>
      <div className="card-poster-wrap">
        <img
          src={getImageUrl(item.poster_path, 'w500')}
          alt={title}
          className="card-poster"
          loading="lazy"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=600&auto=format&fit=crop';
          }}
        />

        <div className={`card-badge ${badgeClass}`}>{badgeText}</div>

        {rating && (
          <div className="card-rating">
            <Star size={11} fill="currentColor" />
            <span>{rating}</span>
          </div>
        )}

        <div className="card-quick-overlay">
          <button className="quick-play-btn" onClick={handlePlayClick} title="Play Now">
            <Play size={20} fill="#fff" />
          </button>
          {onToggleWatchlist && (
            <button
              className={`btn-icon-round ${inList ? 'active' : ''}`}
              onClick={handleWatchlistClick}
              title={inList ? 'Remove from Watchlist' : 'Add to Watchlist'}
            >
              {inList ? <Check size={16} /> : <Plus size={16} />}
            </button>
          )}
        </div>
      </div>

      <div className="card-info">
        <h3 className="card-title" title={title}>{title}</h3>
        <div className="card-meta">
          <span>{releaseYear || 'HD'}</span>
          <span>{badgeText}</span>
        </div>
      </div>
    </div>
  );
}
