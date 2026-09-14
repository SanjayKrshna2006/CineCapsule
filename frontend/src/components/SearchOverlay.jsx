import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Film, Tv, Sparkles } from 'lucide-react';
import { tmdb } from '../services/tmdb';
import MediaCard from './MediaCard';

export default function SearchOverlay({ isOpen, onClose, onPlay, onOpenDetail, onToggleWatchlist, isInWatchlist }) {
  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setQuery('');
      setResults([]);
    }

    const handleKey = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(() => {
      tmdb.searchMulti(query).then(data => {
        setResults(data);
        setLoading(false);
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const filteredResults = results.filter(item => {
    if (filterType === 'movie') return item.media_type === 'movie' && !item.isAnime;
    if (filterType === 'tv') return item.media_type === 'tv' && !item.isAnime;
    if (filterType === 'anime') return item.isAnime;
    return true;
  });

  const popularSearches = ['Deadpool', 'Demon Slayer', 'Stranger Things', 'Attack on Titan', 'Interstellar', 'Dune'];

  return (
    <div className="search-modal" onClick={onClose}>
      <div style={{ maxWidth: '1200px', width: '100%', margin: '0 auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
          <button className="modal-close-btn" style={{ position: 'static' }} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="search-input-wrap">
          <Search size={24} color="var(--primary)" />
          <input
            ref={inputRef}
            type="text"
            className="search-input"
            placeholder="Search thousands of Movies, Series & Anime..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{ color: 'var(--text-muted)' }}>
              <X size={20} />
            </button>
          )}
        </div>

        {/* Quick Type Filter */}
        <div className="filter-bar" style={{ marginBottom: '2rem' }}>
          <button
            className={`filter-pill ${filterType === 'all' ? 'active' : ''}`}
            onClick={() => setFilterType('all')}
          >
            All Results
          </button>
          <button
            className={`filter-pill ${filterType === 'movie' ? 'active' : ''}`}
            onClick={() => setFilterType('movie')}
          >
            🎬 Movies
          </button>
          <button
            className={`filter-pill ${filterType === 'tv' ? 'active' : ''}`}
            onClick={() => setFilterType('tv')}
          >
            📺 TV Series
          </button>
          <button
            className={`filter-pill ${filterType === 'anime' ? 'active' : ''}`}
            onClick={() => setFilterType('anime')}
          >
            ⛩️ Anime
          </button>
        </div>

        {/* Suggested Searches when query is empty */}
        {!query.trim() && (
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-muted)', marginBottom: '1.2rem' }}>
              Popular Searches
            </h3>
            <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              {popularSearches.map(term => (
                <button
                  key={term}
                  className="filter-pill"
                  onClick={() => setQuery(term)}
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading Indicator */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            Searching streaming library...
          </div>
        )}

        {/* Results Grid */}
        {!loading && query.trim() && (
          <div className="search-results-section">
            <div className="search-results-header">
              <h3>
                Found {filteredResults.length} {filteredResults.length === 1 ? 'title' : 'titles'}
              </h3>
            </div>

            {filteredResults.length > 0 ? (
              <div className="media-grid">
                {filteredResults.map(item => (
                  <MediaCard
                    key={item.id}
                    item={item}
                    onPlay={(media) => {
                      onPlay(media);
                      onClose();
                    }}
                    onOpenDetail={(media) => {
                      onOpenDetail(media);
                      onClose();
                    }}
                    onToggleWatchlist={onToggleWatchlist}
                    isInWatchlist={isInWatchlist}
                  />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p className="empty-desc">No titles found matching "{query}". Try a different keyword or check spelling.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
