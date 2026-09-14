import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  Tv,
  Film,
  ListVideo,
  Radio,
  Check
} from 'lucide-react';
import { STREAM_SERVERS, ANIME_SERVER, getStreamUrl } from '../services/servers';
import { tmdb, getImageUrl } from '../services/tmdb';
import { storage } from '../services/storage';

export default function PlayerModal({
  media,
  initialSeason = 1,
  initialEpisode = 1,
  onClose,
  onProgressUpdate
}) {
  const isAnime = Boolean(media?.isAnime || (media?.original_language === 'ja' && (media?.genre_ids?.includes(16) || media?.genres?.some(g => g.id === 16))));
  const isTv = media?.media_type === 'tv' || media?.first_air_date || (isAnime && media?.media_type !== 'movie');
  const tmdbId = media?.id;
  const title = media?.title || media?.name || 'Now Playing';

  const availableServers = isAnime ? [ANIME_SERVER] : STREAM_SERVERS;

  const [selectedServer, setSelectedServer] = useState(() => {
    if (isAnime) return ANIME_SERVER.id;
    const saved = storage.getPreferences().server;
    return saved && STREAM_SERVERS.some(s => s.id === saved) ? saved : STREAM_SERVERS[0].id;
  });
  const [currentSeason, setCurrentSeason] = useState(initialSeason);
  const [currentEpisode, setCurrentEpisode] = useState(initialEpisode);
  const [seasons, setSeasons] = useState([]);
  const [episodes, setEpisodes] = useState([]);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [showServerMenu, setShowServerMenu] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = useRef(null);
  const serverMenuRef = useRef(null);
  const hideTimerRef = useRef(null);

  // Auto-hide player header and title when watching
  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }
    // Only auto-hide if server dropdown is closed
    hideTimerRef.current = setTimeout(() => {
      setShowControls(false);
    }, 2800);
  }, []);

  useEffect(() => {
    resetHideTimer();
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [resetHideTimer]);

  // Track fullscreen state changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFull = Boolean(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
      setIsFullscreen(isFull);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = useCallback(() => {
    const elem = containerRef.current || document.documentElement;
    const isFull = Boolean(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    );

    if (!isFull) {
      if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(() => {});
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
      } else if (elem.mozRequestFullScreen) {
        elem.mozRequestFullScreen();
      } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (serverMenuRef.current && !serverMenuRef.current.contains(e.target)) {
        setShowServerMenu(false);
      }
    };
    if (showServerMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showServerMenu]);

  // Load TV show seasons and episodes if it is a TV series or Anime
  useEffect(() => {
    if (!media || !isTv) return;

    let isMounted = true;
    tmdb.getDetails(tmdbId, 'tv').then(details => {
      if (!isMounted || !details) return;

      const validSeasons = (details.seasons || []).filter(s => s.season_number > 0);
      setSeasons(validSeasons);

      if (validSeasons.length > 0 && !validSeasons.some(s => s.season_number === currentSeason)) {
        setCurrentSeason(validSeasons[0].season_number);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [media, isTv, tmdbId]);

  // Load episode list for the selected season
  useEffect(() => {
    if (!media || !isTv) return;

    let isMounted = true;
    setLoadingEpisodes(true);

    tmdb.getSeasonDetails(tmdbId, currentSeason).then(eps => {
      if (!isMounted) return;
      setEpisodes(eps);
      setLoadingEpisodes(false);
    });

    return () => {
      isMounted = false;
    };
  }, [media, isTv, tmdbId, currentSeason]);

  // Save to Continue Watching history whenever media or episode changes
  useEffect(() => {
    if (!media) return;

    const historyItem = {
      id: media.id,
      title,
      poster_path: media.poster_path,
      backdrop_path: media.backdrop_path,
      media_type: isTv ? 'tv' : 'movie',
      isAnime: media.isAnime || isAnime || false,
      vote_average: media.vote_average,
      season: isTv ? currentSeason : undefined,
      episode: isTv ? currentEpisode : undefined
    };

    storage.saveHistory(historyItem);
    if (onProgressUpdate) onProgressUpdate(historyItem);
  }, [media, isTv, isAnime, currentSeason, currentEpisode, title, onProgressUpdate]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        if (isFullscreen) {
          toggleFullscreen();
        } else {
          onClose();
        }
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, isFullscreen, toggleFullscreen]);

  if (!media) return null;

  const currentStreamUrl = getStreamUrl(
    selectedServer,
    isAnime ? 'anime' : (isTv ? 'tv' : 'movie'),
    tmdbId,
    currentSeason,
    currentEpisode,
    isAnime,
    title
  );

  const handleServerChange = (e) => {
    const newServer = e.target.value;
    setSelectedServer(newServer);
    storage.savePreferences({ server: newServer });
    setIframeKey(k => k + 1);
  };

  const handleNextEpisode = () => {
    const currentIndex = episodes.findIndex(e => e.episode_number === currentEpisode);
    if (currentIndex >= 0 && currentIndex < episodes.length - 1) {
      setCurrentEpisode(episodes[currentIndex + 1].episode_number);
      setIframeKey(k => k + 1);
    } else {
      const currentSeasonIndex = seasons.findIndex(s => s.season_number === currentSeason);
      if (currentSeasonIndex >= 0 && currentSeasonIndex < seasons.length - 1) {
        const nextSeason = seasons[currentSeasonIndex + 1].season_number;
        setCurrentSeason(nextSeason);
        setCurrentEpisode(1);
        setIframeKey(k => k + 1);
      }
    }
  };

  const handlePrevEpisode = () => {
    const currentIndex = episodes.findIndex(e => e.episode_number === currentEpisode);
    if (currentIndex > 0) {
      setCurrentEpisode(episodes[currentIndex - 1].episode_number);
      setIframeKey(k => k + 1);
    }
  };

  const isHeaderActive = showControls || showServerMenu;

  return (
    <div
      className={`player-modal ${!isHeaderActive ? 'hide-cursor' : ''}`}
      ref={containerRef}
      onMouseMove={resetHideTimer}
      onTouchStart={resetHideTimer}
      onClick={resetHideTimer}
    >
      {/* Top Hover Zone to reveal header on mouse reach */}
      <div className="player-top-hover-trigger" onMouseEnter={resetHideTimer} />

      {/* Auto-Hiding Glass Header Bar with Title and Controls */}
      <header
        className={`player-header ${!isHeaderActive ? 'hidden' : ''}`}
        onMouseEnter={() => setShowControls(true)}
      >
        <div className="player-title-info">
          <button
            className="modal-close-btn"
            style={{ position: 'static', width: '38px', height: '38px' }}
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            title="Back to Browsing (Esc)"
            aria-label="Close Player"
          >
            <X size={18} />
          </button>
          <div>
            <h2 className="player-title">{title}</h2>
            {isTv && (
              <span className="player-subinfo">
                Season {currentSeason} • Episode {currentEpisode}
              </span>
            )}
          </div>
        </div>

        <div className="player-header-actions" onClick={e => e.stopPropagation()}>
          {/* Server Switcher Dropdown */}
          <div className="round-dropdown-wrap" ref={serverMenuRef}>
            <button
              type="button"
              className={`round-server-btn ${showServerMenu ? 'active' : ''}`}
              onClick={() => setShowServerMenu(prev => !prev)}
              title={`Switch Server (Current: ${availableServers.find(s => s.id === selectedServer)?.name || (isAnime ? ANIME_SERVER.name : STREAM_SERVERS[0].name)})`}
              aria-label="Switch Streaming Server"
            >
              <Radio size={16} />
              <span className="server-dot-indicator" />
            </button>

            {showServerMenu && (
              <div className="round-server-dropdown">
                <div className="server-dropdown-header">
                  <span>Select Server</span>
                </div>
                <div className="server-dropdown-items">
                  {availableServers.map(srv => {
                    const isSelected = selectedServer === srv.id;
                    return (
                      <button
                        key={srv.id}
                        type="button"
                        className={`server-menu-item ${isSelected ? 'selected' : ''}`}
                        onClick={() => {
                          handleServerChange({ target: { value: srv.id } });
                          setShowServerMenu(false);
                          resetHideTimer();
                        }}
                      >
                        <div className="server-item-left">
                          <span className="server-item-icon">
                            {srv.id === 'animesalt' ? (
                              <Radio size={16} color="var(--primary)" />
                            ) : (
                              <Film size={16} color="var(--accent-cyan)" />
                            )}
                          </span>
                          <div className="server-item-details">
                            <div className="server-item-title">{srv.name}</div>
                          </div>
                        </div>
                        {isSelected && <Check size={16} className="server-selected-check" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Episode Drawer Toggle */}
          {isTv && (
            <button
              className="btn-icon-round"
              style={{ width: '38px', height: '38px' }}
              onClick={() => {
                setShowDrawer(!showDrawer);
                resetHideTimer();
              }}
              title="Toggle Episode Drawer"
              aria-label="Toggle Episode Drawer"
            >
              <ListVideo size={18} />
            </button>
          )}

          {/* Working Fullscreen Toggle Button */}
          <button
            type="button"
            className="btn-icon-round fullscreen-btn"
            style={{ width: '38px', height: '38px' }}
            onClick={(e) => {
              e.stopPropagation();
              toggleFullscreen();
              resetHideTimer();
            }}
            title={isFullscreen ? "Exit Fullscreen (F)" : "Fullscreen Mode (F)"}
            aria-label="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
          </button>
        </div>
      </header>

      {/* Main Video Stage */}
      <div className="player-content-area">
        <div className="player-iframe-container">
          <iframe
            key={`${currentStreamUrl}-${iframeKey}`}
            src={currentStreamUrl}
            title={`Streaming: ${title}`}
            className="streaming-iframe"
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        </div>

        {/* TV Series / Anime Episode Drawer */}
        {isTv && showDrawer && (
          <aside className="episode-drawer" onMouseEnter={() => setShowControls(true)}>
            <div className="episode-drawer-header">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-main)' }}>
                  Seasons & Episodes
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {episodes.length} Episodes
                </span>
              </div>

              {seasons.length > 1 && (
                <select
                  className="season-select"
                  value={currentSeason}
                  onChange={(e) => {
                    setCurrentSeason(Number(e.target.value));
                    setCurrentEpisode(1);
                    setIframeKey(k => k + 1);
                    resetHideTimer();
                  }}
                >
                  {seasons.map(s => (
                    <option key={s.id} value={s.season_number}>
                      {s.name || `Season ${s.season_number}`} ({s.episode_count} eps)
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="episode-list">
              {loadingEpisodes ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Loading episodes...
                </div>
              ) : (
                episodes.map(ep => {
                  const isActive = ep.episode_number === currentEpisode;
                  return (
                    <div
                      key={ep.id}
                      className={`episode-card ${isActive ? 'active' : ''}`}
                      onClick={() => {
                        setCurrentEpisode(ep.episode_number);
                        setIframeKey(k => k + 1);
                        resetHideTimer();
                      }}
                    >
                      <div className="episode-still-wrap">
                        <img
                          src={getImageUrl(ep.still_path || media.backdrop_path, 'w300')}
                          alt={ep.name}
                          className="episode-still"
                          loading="lazy"
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1574267432553-4b4628081c31?q=80&w=300&auto=format&fit=crop';
                          }}
                        />
                      </div>
                      <div className="episode-info">
                        <span className="episode-num">Episode {ep.episode_number}</span>
                        <h4 className="episode-title">{ep.name || `Episode ${ep.episode_number}`}</h4>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </aside>
        )}
      </div>

      {/* Bottom Bar Controls (TV series navigation only) */}
      {isTv && (
        <div className={`player-bottom-bar ${!isHeaderActive ? 'hidden' : ''}`}>
          <div className="episode-nav-controls">
            <button
              className="ep-nav-btn"
              onClick={handlePrevEpisode}
              disabled={currentEpisode <= 1}
            >
              <ChevronLeft size={16} />
              <span>Previous Episode</span>
            </button>

            <button
              className="ep-nav-btn"
              onClick={handleNextEpisode}
            >
              <span>Next Episode</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
