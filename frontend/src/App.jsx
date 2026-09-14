import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HeroBanner from './components/HeroBanner';
import MediaSlider from './components/MediaSlider';
import ContinueWatching from './components/ContinueWatching';
import DetailModal from './components/DetailModal';
import PlayerModal from './components/PlayerModal';
import SearchOverlay from './components/SearchOverlay';
import CategoryView from './components/CategoryView';
import Watchlist from './components/Watchlist';
import ScrollToTop from './components/ScrollToTop';
import { tmdb } from './services/tmdb';
import { storage } from './services/storage';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [heroItems, setHeroItems] = useState([]);
  const [homeRows, setHomeRows] = useState([]);
  const [loadingHome, setLoadingHome] = useState(true);

  const [activeMediaForDetail, setActiveMediaForDetail] = useState(null);
  const [activeMediaForPlayer, setActiveMediaForPlayer] = useState(null);
  const [playerSeason, setPlayerSeason] = useState(1);
  const [playerEpisode, setPlayerEpisode] = useState(1);

  const [searchOpen, setSearchOpen] = useState(false);
  const [watchlist, setWatchlist] = useState(() => storage.getWatchlist());
  const [history, setHistory] = useState(() => storage.getHistory());

  // Load initial home data
  useEffect(() => {
    let isMounted = true;
    Promise.all([
      tmdb.getHeroFeatured(),
      tmdb.getHomeRows()
    ]).then(([heroes, rows]) => {
      if (isMounted) {
        setHeroItems(heroes);
        setHomeRows(rows);
        setLoadingHome(false);
      }
    }).catch(err => {
      console.error('Home load error', err);
      if (isMounted) setLoadingHome(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // Keyboard shortcut Ctrl+K to open search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Watchlist handlers
  const handleToggleWatchlist = (item) => {
    const inList = storage.isInWatchlist(item.id);
    let updated;
    if (inList) {
      updated = storage.removeFromWatchlist(item.id);
    } else {
      updated = storage.addToWatchlist(item);
    }
    setWatchlist(updated);
  };

  const isInWatchlist = (id) => {
    return storage.isInWatchlist(id);
  };

  const handleClearWatchlist = () => {
    localStorage.removeItem('cinecapsule_watchlist');
    localStorage.removeItem('cinepulse_watchlist');
    setWatchlist([]);
  };

  // Player handlers
  const handlePlayMedia = (media, season = 1, episode = 1) => {
    setActiveMediaForPlayer(media);
    setPlayerSeason(season || 1);
    setPlayerEpisode(episode || 1);
  };

  const handleResumeHistory = (item, season, episode) => {
    handlePlayMedia(item, season, episode);
  };

  const handleRemoveHistory = (id) => {
    const updated = storage.removeFromHistory(id);
    setHistory(updated);
  };

  const handleHistoryUpdate = (item) => {
    setHistory(storage.getHistory());
  };

  return (
    <div className="app-container">
      {/* Dynamic Ambient Aurora Background Mesh */}
      <div className="ambient-background-mesh" aria-hidden="true">
        <div className="aurora-orb orb-1"></div>
        <div className="aurora-orb orb-2"></div>
        <div className="aurora-orb orb-3"></div>
      </div>

      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenSearch={() => setSearchOpen(true)}
        watchlistCount={watchlist.length}
      />

      {/* View Content */}
      {activeTab === 'home' && (
        <>
          {/* Featured Hero Banner */}
          <HeroBanner
            items={heroItems}
            onPlay={handlePlayMedia}
            onOpenDetail={setActiveMediaForDetail}
            onToggleWatchlist={handleToggleWatchlist}
            isInWatchlist={isInWatchlist}
          />

          {/* Main Rows & Continue Watching */}
          <main className="main-content">
            {/* Continue Watching Row */}
            <ContinueWatching
              items={history}
              onResume={handleResumeHistory}
              onRemove={handleRemoveHistory}
            />

            {/* Curated TMDB Rows */}
            {homeRows.map((row, idx) => (
              <MediaSlider
                key={idx}
                title={row.title}
                items={row.items}
                onPlay={handlePlayMedia}
                onOpenDetail={setActiveMediaForDetail}
                onToggleWatchlist={handleToggleWatchlist}
                isInWatchlist={isInWatchlist}
              />
            ))}

            {loadingHome && (
              <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                Loading entertainment catalog...
              </div>
            )}
          </main>
        </>
      )}

      {/* Movies Tab */}
      {activeTab === 'movies' && (
        <main className="main-content" style={{ marginTop: '90px' }}>
          <CategoryView
            type="movies"
            onPlay={handlePlayMedia}
            onOpenDetail={setActiveMediaForDetail}
            onToggleWatchlist={handleToggleWatchlist}
            isInWatchlist={isInWatchlist}
          />
        </main>
      )}

      {/* TV Series Tab */}
      {activeTab === 'tv' && (
        <main className="main-content" style={{ marginTop: '90px' }}>
          <CategoryView
            type="tv"
            onPlay={handlePlayMedia}
            onOpenDetail={setActiveMediaForDetail}
            onToggleWatchlist={handleToggleWatchlist}
            isInWatchlist={isInWatchlist}
          />
        </main>
      )}

      {/* Anime Tab */}
      {activeTab === 'anime' && (
        <main className="main-content" style={{ marginTop: '90px' }}>
          <CategoryView
            type="anime"
            onPlay={handlePlayMedia}
            onOpenDetail={setActiveMediaForDetail}
            onToggleWatchlist={handleToggleWatchlist}
            isInWatchlist={isInWatchlist}
          />
        </main>
      )}

      {/* My Watchlist Tab */}
      {activeTab === 'watchlist' && (
        <main className="main-content" style={{ marginTop: '90px' }}>
          <Watchlist
            items={watchlist}
            onPlay={handlePlayMedia}
            onOpenDetail={setActiveMediaForDetail}
            onToggleWatchlist={handleToggleWatchlist}
            isInWatchlist={isInWatchlist}
            onClearAll={handleClearWatchlist}
          />
        </main>
      )}

      {/* Search Overlay */}
      <SearchOverlay
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onPlay={handlePlayMedia}
        onOpenDetail={setActiveMediaForDetail}
        onToggleWatchlist={handleToggleWatchlist}
        isInWatchlist={isInWatchlist}
      />

      {/* Detail Modal */}
      {activeMediaForDetail && (
        <DetailModal
          item={activeMediaForDetail}
          onClose={() => setActiveMediaForDetail(null)}
          onPlay={handlePlayMedia}
          onToggleWatchlist={handleToggleWatchlist}
          isInWatchlist={isInWatchlist}
        />
      )}

      {/* Cinema Player Modal with Ad-Shield */}
      {activeMediaForPlayer && (
        <PlayerModal
          media={activeMediaForPlayer}
          initialSeason={playerSeason}
          initialEpisode={playerEpisode}
          onClose={() => setActiveMediaForPlayer(null)}
          onProgressUpdate={handleHistoryUpdate}
        />
      )}

      {/* Floating Animated Glass Scroll To Top */}
      <ScrollToTop />
    </div>
  );
}
