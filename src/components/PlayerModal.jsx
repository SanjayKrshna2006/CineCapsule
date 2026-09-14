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
  Check,
  Loader2
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

  // For Anime: Anime Server default + Server 2 & 3 fallbacks. For others: Server 1, 2, 3.
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isIframeLoading, setIsIframeLoading] = useState(true);

  const containerRef = useRef(null);
  const serverMenuRef = useRef(null);

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

    // Fetch TV / Anime Seasons & Episodes (with AnimeSalt Native Integration)
  useEffect(() => {
    if (!isTv) return;

    let isMounted = true;
    const fetchEpisodes = async () => {
      setLoadingEpisodes(true);
      try {
        if (isAnime) {
          // Fetch exact episodes from AnimeSalt
          const saltRes = await fetch(`/api/animesalt-episodes?title=${encodeURIComponent(title)}`);
          const saltEps = saltRes.ok ? await saltRes.json() : [];

          // Also attempt TMDB season details for rich metadata
          let tmdbDetails = null;
          if (tmdbId) {
            try { tmdbDetails = await tmdb.getTvDetails(tmdbId); } catch (e) {}
          }

          if (!isMounted) return;

          if (saltEps && saltEps.length > 0) {
            // Group AnimeSalt episodes by season
            const seasonsMap = new Map();
            saltEps.forEach(ep => {
              const sNum = ep.season_number || 1;
              if (!seasonsMap.has(sNum)) {
                seasonsMap.set(sNum, []);
              }
              seasonsMap.get(sNum).push(ep);
            });

            const seasonsArr = Array.from(seasonsMap.keys()).sort((a, b) => a - b).map(sNum => ({
              id: sNum,
              season_number: sNum,
              name: `Season ${sNum}`
            }));

            setSeasons(seasonsArr.length > 0 ? seasonsArr : [{ id: 1, season_number: 1, name: 'Season 1' }]);

            // Current season episodes
            const activeSeasonEps = seasonsMap.get(currentSeason) || saltEps;
            
            // If TMDB metadata exists for this season, merge it
            let mergedEps = activeSeasonEps;
            if (tmdbId) {
              try {
                const tmdbSeasonData = await tmdb.getTvSeason(tmdbId, currentSeason);
                if (tmdbSeasonData?.episodes?.length) {
                  mergedEps = activeSeasonEps.map(ep => {
                    const tmdbEp = tmdbSeasonData.episodes.find(t => t.episode_number === ep.episode_number);
                    return {
                      ...ep,
                      name: tmdbEp?.name || ep.name || `Episode ${ep.episode_number}`,
                      overview: tmdbEp?.overview || '',
                      still_path: tmdbEp?.still_path || null
                    };
                  });
                }
              } catch (e) {}
            }

            if (isMounted) setEpisodes(mergedEps);
            return;
          }
        }

        // Standard TMDB Series Fetch for non-anime or fallback
        if (tmdbId) {
          const details = await tmdb.getTvDetails(tmdbId);
          if (!isMounted) return;

          const validSeasons = (details.seasons || []).filter(s => s.season_number > 0);
          setSeasons(validSeasons);

          const currentSeasonObj = validSeasons.find(s => s.season_number === currentSeason) || validSeasons[0];
          if (currentSeasonObj) {
            fetchEpisodesForSeason(currentSeasonObj.season_number);
          }
        }
      } catch (err) {
        console.error('Failed to fetch anime/TV episodes:', err);
      } finally {
        if (isMounted) setLoadingEpisodes(false);
      }
    };

    fetchEpisodes();
    return () => { isMounted = false; };
  }, [isTv, tmdbId, isAnime, title]);

  const fetchEpisodesForSeason = async (seasonNum) => {
    setLoadingEpisodes(true);
    try {
      if (isAnime) {
        const saltRes = await fetch(`/api/animesalt-episodes?title=${encodeURIComponent(title)}`);
        const saltEps = saltRes.ok ? await saltRes.json() : [];
        const seasonEps = saltEps.filter(e => (e.season_number || 1) === seasonNum);
        if (seasonEps.length > 0) {
          if (tmdbId) {
            try {
              const tmdbSeasonData = await tmdb.getTvSeason(tmdbId, seasonNum);
              if (tmdbSeasonData?.episodes?.length) {
                const merged = seasonEps.map(ep => {
                  const tmdbEp = tmdbSeasonData.episodes.find(t => t.episode_number === ep.episode_number);
                  return {
                    ...ep,
                    name: tmdbEp?.name || ep.name || `Episode ${ep.episode_number}`,
                    overview: tmdbEp?.overview || '',
                    still_path: tmdbEp?.still_path || null
                  };
                });
                setEpisodes(merged);
                return;
              }
            } catch (e) {}
          }
          setEpisodes(seasonEps);
          return;
        }
      }

      const data = await tmdb.getTvSeason(tmdbId, seasonNum);
      setEpisodes(data.episodes || []);
    } catch (err) {
      console.error(`Failed to fetch season ${seasonNum} episodes:`, err);
      setEpisodes([]);
    } finally {
      setLoadingEpisodes(false);
    }
  };

  const handleSeasonSelect = (seasonNum) => {
    setCurrentSeason(seasonNum);
    setCurrentEpisode(1);
    fetchEpisodesForSeason(seasonNum);
    setIsIframeLoading(true);
    setIframeKey(k => k + 1);
  };

  const handleEpisodeSelect = (epNum) => {
    setCurrentEpisode(epNum);
    setIsIframeLoading(true);
    setIframeKey(k => k + 1);
    setShowDrawer(false);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (showServerMenu) {
          setShowServerMenu(false);
        } else if (showDrawer) {
          setShowDrawer(false);
        } else {
          onClose();
        }
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, toggleFullscreen, showServerMenu, showDrawer]);

  // Click outside to close server menu
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (serverMenuRef.current && !serverMenuRef.current.contains(e.target)) {
        setShowServerMenu(false);
      }
    };
    if (showServerMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showServerMenu]);

  // Track watch history
  useEffect(() => {
    if (!media) return;
    storage.addHistory({
      ...media,
      lastSeason: isTv ? currentSeason : undefined,
      lastEpisode: isTv ? currentEpisode : undefined,
      playedAt: new Date().toISOString()
    });

    if (onProgressUpdate) {
      onProgressUpdate({
        id: media.id,
        season: currentSeason,
        episode: currentEpisode
      });
    }
  }, [media, currentSeason, currentEpisode, isTv]);

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
    setIsIframeLoading(true);
    setIframeKey(k => k + 1);
  };

  const handleNextEpisode = () => {
    const currentIndex = episodes.findIndex(e => e.episode_number === currentEpisode);
    if (currentIndex >= 0 && currentIndex < episodes.length - 1) {
      setCurrentEpisode(episodes[currentIndex + 1].episode_number);
      setIsIframeLoading(true);
      setIframeKey(k => k + 1);
    } else {
      const currentSeasonIndex = seasons.findIndex(s => s.season_number === currentSeason);
      if (currentSeasonIndex >= 0 && currentSeasonIndex < seasons.length - 1) {
        const nextSeason = seasons[currentSeasonIndex + 1].season_number;
        setCurrentSeason(nextSeason);
        setCurrentEpisode(1);
        setIsIframeLoading(true);
        setIframeKey(k => k + 1);
      }
    }
  };

  const handlePrevEpisode = () => {
    const currentIndex = episodes.findIndex(e => e.episode_number === currentEpisode);
    if (currentIndex > 0) {
      setCurrentEpisode(episodes[currentIndex - 1].episode_number);
      setIsIframeLoading(true);
      setIframeKey(k => k + 1);
    }
  };

  return (
    <div className="player-modal" ref={containerRef}>
      {/* Permanent Glass Header Bar with Title, Controls & Server Switcher */}
      <header className="player-header">
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
          <div className="player-title-text-wrap">
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
              onClick={() => setShowDrawer(!showDrawer)}
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
          {/* Fast Stream Loading Spinner */}
          {isIframeLoading && (
            <div className="player-loader-overlay">
              <div className="loader-box">
                <Loader2 className="spinner-rotate" size={36} color="var(--primary)" />
                <span>Loading stream...</span>
              </div>
            </div>
          )}

          <iframe
            key={`${currentStreamUrl}-${iframeKey}`}
            src={currentStreamUrl}
            title={`${title} - Player`}
            className="player-iframe"
            allowFullScreen
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture; cross-origin-isolated; clipboard-write; web-share"
            onLoad={() => setIsIframeLoading(false)}
          />
        </div>

        {/* TV Series / Anime Episode Drawer */}
        {isTv && showDrawer && (
          <aside className="episode-drawer">
            <div className="episode-drawer-header">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-main)' }}>
                  Seasons & Episodes
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {episodes.length} Episodes
                </span>
              </div>

              {/* Season Selector Tabs */}
              {seasons.length > 1 && (
                <div className="season-tabs-scroll">
                  {seasons.map(s => (
                    <button
                      key={s.id}
                      className={`season-tab-chip ${currentSeason === s.season_number ? 'active' : ''}`}
                      onClick={() => handleSeasonSelect(s.season_number)}
                    >
                      Season {s.season_number}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="episode-list-container">
              {loadingEpisodes ? (
                <div className="episode-loading">
                  <div className="spinner" />
                  <span>Loading episodes...</span>
                </div>
              ) : (
                episodes.map(ep => {
                  const isCurrent = ep.episode_number === currentEpisode;
                  return (
                    <div
                      key={ep.id}
                      className={`episode-card ${isCurrent ? 'active' : ''}`}
                      onClick={() => handleEpisodeSelect(ep.episode_number)}
                    >
                      <div className="episode-card-thumb">
                        <img
                          src={getImageUrl(ep.still_path, 'w500') || getImageUrl(media.backdrop_path, 'w500')}
                          alt={ep.name}
                          loading="lazy"
                        />
                        <span className="ep-num-badge">EP {ep.episode_number}</span>
                      </div>
                      <div className="episode-card-info">
                        <div className="ep-title">{ep.name || `Episode ${ep.episode_number}`}</div>
                        <p className="ep-overview">{ep.overview || 'No description available for this episode.'}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </aside>
        )}
      </div>

      {/* Permanent Bottom Bar Controls (TV series navigation only) */}
      {isTv && (
        <div className="player-bottom-bar">
          <div className="episode-nav-controls">
            <button
              className="ep-nav-btn"
              onClick={handlePrevEpisode}
              disabled={currentEpisode <= 1}
            >
              <ChevronLeft size={16} /> Prev Episode
            </button>
            <span className="current-ep-indicator">
              Season {currentSeason} : Episode {currentEpisode}
            </span>
            <button
              className="ep-nav-btn"
              onClick={handleNextEpisode}
              disabled={episodes.length > 0 && currentEpisode >= episodes.length}
            >
              Next Episode <ChevronRight size={16} />
            </button>
          </div>

          <button
            className="ep-nav-btn drawer-toggle-btn"
            onClick={() => setShowDrawer(!showDrawer)}
          >
            <ListVideo size={16} /> Episodes List
          </button>
        </div>
      )}
    </div>
  );
}
