import React, { useState, useEffect } from 'react';
import { Play, Film, Tv, Sparkles, Bookmark, Search, Flame } from 'lucide-react';

export default function Navbar({ activeTab, onSelectTab, onOpenSearch, watchlistCount }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { id: 'home', label: 'Home', icon: <Sparkles size={20} /> },
    { id: 'movies', label: 'Movies', icon: <Film size={20} /> },
    { id: 'tv', label: 'Series', icon: <Tv size={20} /> },
    { id: 'anime', label: 'Anime', icon: <Flame size={20} /> },
    { id: 'watchlist', label: 'My List', icon: <Bookmark size={20} />, badge: watchlistCount }
  ];

  const handleTabClick = (id) => {
    onSelectTab(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* Top Navbar */}
      <header className={'navbar ' + (scrolled ? 'scrolled' : '')}>
        <div className="nav-glass-shine"></div>
        <div className="nav-left">
          <div className="brand-logo" onClick={() => handleTabClick('home')}>
            <div className="brand-icon-wrap">
              <Play size={17} fill="#fff" />
            </div>
            <span className="brand-text">
              CINE<span className="brand-highlight">CAPSULE</span>
            </span>
          </div>

          <nav className="desktop-nav">
            <ul className="nav-links">
              {navItems.map(item => {
                const isActive = activeTab === item.id;
                return (
                  <li key={item.id}>
                    <button
                      className={'nav-link ' + (isActive ? 'active' : '')}
                      onClick={() => handleTabClick(item.id)}
                    >
                      {item.icon}
                      <span>{item.id === 'watchlist' && item.badge ? item.label + ' (' + item.badge + ')' : item.label}</span>
                      {isActive && <div className="nav-active-pill-glow" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        <div className="nav-right">
          {/* Desktop Search Trigger */}
          <button className="search-trigger-btn glass-search desktop-only-search" onClick={onOpenSearch} title="Search Movies, Series and Anime (Ctrl+K)">
            <Search size={16} className="search-icon-anim" />
            <span>Search cinema...</span>
            <kbd className="search-kbd">⌘K</kbd>
          </button>

          {/* Mobile Search Icon Button */}
          <button
            className="mobile-search-btn btn-icon-round"
            onClick={onOpenSearch}
            aria-label="Search titles"
            title="Search titles"
          >
            <Search size={20} />
          </button>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (Fixed for thumb-friendly mobile app experience) */}
      <nav className="mobile-bottom-nav">
        <div className="mobile-bottom-nav-inner">
          {navItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                className={'mobile-bottom-tab ' + (isActive ? 'active' : '')}
                onClick={() => handleTabClick(item.id)}
                aria-label={item.label}
              >
                <div className="mobile-tab-icon-wrap">
                  {item.icon}
                  {item.badge > 0 && (
                    <span className="mobile-tab-badge">{item.badge > 99 ? '99+' : item.badge}</span>
                  )}
                </div>
                <span className="mobile-tab-label">{item.label}</span>
                {isActive && <div className="mobile-tab-active-dot" />}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
