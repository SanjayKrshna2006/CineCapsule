import React, { useState, useEffect } from 'react';
import { X, Play, Plus, Check, Star, Clock, Film, Tv } from 'lucide-react';
import { tmdb, getBackdropUrl, getImageUrl } from '../services/tmdb';

export default function DetailModal({ item, onClose, onPlay, onToggleWatchlist, isInWatchlist }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTrailer, setShowTrailer] = useState(false);

  useEffect(() => {
    if (!item) return;

    let isMounted = true;
    setLoading(true);

    const mediaType = item.media_type || (item.first_air_date ? 'tv' : 'movie');
    tmdb.getDetails(item.id, mediaType).then(data => {
      if (isMounted) {
        setDetails(data);
        setLoading(false);
      }
    });

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      isMounted = false;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [item, onClose]);

  if (!item) return null;

  const current = details || item;
  const inList = isInWatchlist(item.id);
  const title = current.title || current.name || 'Untitled';
  const releaseYear = (current.release_date || current.first_air_date || '').split('-')[0] || '';
  const rating = current.vote_average ? current.vote_average.toFixed(1) : 'N/A';
  const runtime = current.runtime ? `${current.runtime} min` : (current.number_of_seasons ? `${current.number_of_seasons} Seasons` : '');
  const trailer = current.videos?.results?.find(v => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser'));

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="detail-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
          <X size={20} />
        </button>

        {showTrailer && trailer ? (
          <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: '#000' }}>
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${trailer.key}?autoplay=1&rel=0`}
              title="Official Trailer"
              style={{ width: '100%', height: '100%', border: 'none' }}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
            <button
              onClick={() => setShowTrailer(false)}
              className="btn-secondary"
              style={{ position: 'absolute', bottom: '15px', right: '15px', zIndex: 10 }}
            >
              Back to Overview
            </button>
          </div>
        ) : (
          <div
            className="detail-hero"
            style={{ backgroundImage: `url(${getBackdropUrl(current.backdrop_path)})` }}
          >
            <div className="detail-hero-overlay"></div>
            <div className="detail-hero-content">
              <img
                src={getImageUrl(current.poster_path, 'w500')}
                alt={title}
                className="detail-poster"
              />
              <div className="detail-info">
                <h2 className="detail-title">{title}</h2>
                <div className="detail-metadata-row">
                  <span className="rating-badge">
                    <Star size={16} fill="currentColor" />
                    {rating}
                  </span>
                  {releaseYear && <span>{releaseYear}</span>}
                  {runtime && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Clock size={14} />
                      {runtime}
                    </span>
                  )}
                  {current.status && <span>{current.status}</span>}
                </div>

                <div className="detail-genres">
                  {current.genres?.map(g => (
                    <span key={g.id} className="genre-tag">{g.name}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="detail-body">
          <div className="detail-actions">
            <button className="btn-primary" onClick={() => { onPlay(current); onClose(); }}>
              <Play size={18} fill="#fff" />
              <span>Stream Now</span>
            </button>

            {trailer && !showTrailer && (
              <button className="btn-secondary" onClick={() => setShowTrailer(true)}>
                <Film size={18} />
                <span>Watch Trailer</span>
              </button>
            )}

            <button
              className={`btn-secondary ${inList ? 'active' : ''}`}
              onClick={() => onToggleWatchlist(item)}
            >
              {inList ? <Check size={18} /> : <Plus size={18} />}
              <span>{inList ? 'In Watchlist' : 'Add to List'}</span>
            </button>
          </div>

          <div className="detail-synopsis">
            <h4>Synopsis</h4>
            <p>{current.overview || 'No synopsis provided for this title.'}</p>
          </div>

          {current.credits?.cast && current.credits.cast.length > 0 && (
            <div>
              <h4 style={{ fontSize: '1.1rem', marginBottom: '0.8rem', color: 'var(--text-muted)' }}>Top Cast</h4>
              <div className="cast-row">
                {current.credits.cast.slice(0, 10).map(actor => (
                  <div key={actor.id} className="cast-chip">
                    <img
                      src={getImageUrl(actor.profile_path, 'w185')}
                      alt={actor.name}
                      className="cast-avatar"
                      onError={e => { e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop'; }}
                    />
                    <span className="cast-name">{actor.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
