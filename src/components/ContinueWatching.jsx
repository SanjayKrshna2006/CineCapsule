import React from 'react';
import { Play, Clock, Trash2 } from 'lucide-react';
import { getImageUrl, getBackdropUrl } from '../services/tmdb';

export default function ContinueWatching({ items = [], onResume, onRemove }) {
  if (!items || items.length === 0) return null;

  return (
    <div className="media-slider-wrap">
      <div className="slider-header">
        <h2 className="slider-title">
          <Clock size={20} color="var(--accent-cyan)" />
          <span>Continue Watching</span>
        </h2>
      </div>

      <div className="slider-track">
        {items.map(item => {
          const title = item.title || item.name || 'Untitled';
          const isTv = item.media_type === 'tv' || item.isAnime;

          return (
            <div
              key={item.id}
              className="media-card"
              style={{ flex: '0 0 240px', width: '240px' }}
              onClick={() => onResume(item, item.season, item.episode)}
            >
              <div className="card-poster-wrap" style={{ aspectRatio: '16 / 10' }}>
                <img
                  src={getBackdropUrl(item.backdrop_path || item.poster_path, 'w500')}
                  alt={title}
                  className="card-poster"
                  loading="lazy"
                  onError={e => {
                    e.target.src = 'https://images.unsplash.com/photo-1574267432553-4b4628081c31?q=80&w=500&auto=format&fit=crop';
                  }}
                />

                <div className="card-quick-overlay" style={{ opacity: 1, background: 'rgba(0, 0, 0, 0.4)' }}>
                  <div className="quick-play-btn" style={{ transform: 'scale(1)' }}>
                    <Play size={20} fill="#fff" />
                  </div>
                </div>

                {onRemove && (
                  <button
                    className="modal-close-btn"
                    style={{ top: '8px', right: '8px', width: '28px', height: '28px', background: 'rgba(0,0,0,0.8)' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(item.id);
                    }}
                    title="Remove from history"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>

              <div className="card-info">
                <h4 className="card-title">{title}</h4>
                <div className="card-meta">
                  <span>
                    {isTv ? `S${item.season || 1} • E${item.episode || 1}` : 'Resume Movie'}
                  </span>
                  <span style={{ color: 'var(--accent-cyan)', fontWeight: '600' }}>Resume</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
