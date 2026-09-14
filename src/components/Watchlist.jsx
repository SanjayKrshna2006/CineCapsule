import React from 'react';
import { Bookmark, Trash2 } from 'lucide-react';
import MediaCard from './MediaCard';

export default function Watchlist({ items = [], onPlay, onOpenDetail, onToggleWatchlist, isInWatchlist, onClearAll }) {
  if (!items || items.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">
          <Bookmark size={36} />
        </div>
        <h2 className="empty-title">Your Watchlist is Empty</h2>
        <p className="empty-desc">
          Add your favorite movies, TV shows, and anime series by clicking the + button on any title to easily access them here.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '2rem', fontWeight: '800' }}>My Watchlist</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            {items.length} saved {items.length === 1 ? 'title' : 'titles'} ready to stream
          </p>
        </div>

        {items.length > 0 && onClearAll && (
          <button
            className="btn-secondary"
            onClick={onClearAll}
            style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
          >
            <Trash2 size={16} />
            <span>Clear All</span>
          </button>
        )}
      </div>

      <div className="media-grid">
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
