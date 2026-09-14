import React, { useState, useEffect } from 'react';
import { tmdb, TMDB_GENRES } from '../services/tmdb';
import MediaCard from './MediaCard';

export default function CategoryView({ type = 'movies', onPlay, onOpenDetail, onToggleWatchlist, isInWatchlist }) {
  const [activeCategory, setActiveCategory] = useState('popular');
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);

  // Determine categories/genres list based on current type
  const genreList = type === 'anime'
    ? TMDB_GENRES.anime
    : (type === 'tv' ? TMDB_GENRES.tv : TMDB_GENRES.movie);

  const title = type === 'anime' ? '⛩️ Anime Universe' : (type === 'tv' ? '📺 TV Series Hub' : '🎬 Movies Collection');

  const loadData = async (targetCategory, targetGenre, targetPage, isAppend = false) => {
    setLoading(true);
    try {
      let results = [];
      if (type === 'movies') {
        results = await tmdb.getMovies(targetCategory, targetGenre, targetPage);
      } else if (type === 'tv') {
        results = await tmdb.getTvSeries(targetCategory, targetGenre, targetPage);
      } else if (type === 'anime') {
        results = await tmdb.getAnime(targetCategory, targetGenre, targetPage);
      }

      if (isAppend) {
        setItems(prev => [...prev, ...results]);
      } else {
        setItems(results);
      }

      setHasMore(results.length >= 10);
    } catch (err) {
      console.error('Failed to load category data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    if (type === 'anime') {
      setActiveCategory('trending');
      setSelectedGenre(null);
      loadData('trending', null, 1, false);
    } else {
      setActiveCategory('popular');
      setSelectedGenre(null);
      loadData('popular', null, 1, false);
    }
  }, [type]);

  const handleFilterSelect = (filter) => {
    if (type === 'anime') {
      setActiveCategory(filter.id);
      setSelectedGenre(filter.genreId || null);
      setPage(1);
      loadData(filter.id, filter.genreId || null, 1, false);
    } else {
      setActiveCategory(filter.name);
      setSelectedGenre(filter.id);
      setPage(1);
      loadData('discover', filter.id, 1, false);
    }
  };

  const handleStandardCategory = (catKey) => {
    setActiveCategory(catKey);
    setSelectedGenre(null);
    setPage(1);
    loadData(catKey, null, 1, false);
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadData(activeCategory, selectedGenre, nextPage, true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h2 style={{ fontSize: '2.4rem', fontWeight: '800' }}>{title}</h2>

        {/* Filters bar */}
        <div className="filter-bar">
          {type !== 'anime' && (
            <>
              <button
                className={`filter-pill ${activeCategory === 'popular' && !selectedGenre ? 'active' : ''}`}
                onClick={() => handleStandardCategory('popular')}
              >
                🔥 Most Popular
              </button>
              <button
                className={`filter-pill ${activeCategory === 'top_rated' && !selectedGenre ? 'active' : ''}`}
                onClick={() => handleStandardCategory('top_rated')}
              >
                ⭐ Top Rated
              </button>
            </>
          )}

          {genreList.map(g => (
            <button
              key={g.id}
              className={`filter-pill ${
                (type === 'anime' ? activeCategory === g.id : selectedGenre === g.id) ? 'active' : ''
              }`}
              onClick={() => handleFilterSelect(g)}
            >
              {g.name}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
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

      {loading && (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
          Loading titles...
        </div>
      )}

      {!loading && hasMore && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
          <button className="btn-secondary" onClick={handleLoadMore} style={{ minWidth: '200px' }}>
            Load More Titles
          </button>
        </div>
      )}
    </div>
  );
}
