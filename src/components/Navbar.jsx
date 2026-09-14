import React, { useState, useEffect } from 'react';
import { Play, Film, Tv, Sparkles, Bookmark, Search, Menu, X, Flame } from 'lucide-react';

export default function Navbar({ activeTab, onSelectTab, onOpenSearch, watchlistCount }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 25);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { id: 'home', label: 'Home', icon: <Sparkles size={16} /> },
    { id: 'movies', label: 'Movies', icon: <Film size={16} /> },
    { id: 'tv', label: 'TV Series', icon: <Tv size={16} /> },
    { id: 'anime', label: 'Anime', icon: <Flame size={16} /> },
    { id: 'watchlist', label: `My List ${watchlistCount ? `(${watchlistCount})` : ''}`, icon: <Bookmark size={16} /> }
  ];

  const handleTabClick = (id) => {
    onSelectTab(id);
    setMobileOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="nav-glass-shine"></div>
      <div className="nav-left">
        <div className="brand-logo" onClick={() => handleTabClick('home')}>
          <div className="brand-icon-wrap">
            <Play size={18} fill="#fff" />
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
                    className={`nav-link ${isActive ? 'active' : ''}`}
                    onClick={() => handleTabClick(item.id)}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                    {isActive && <div className="nav-active-pill-glow" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      <div className="nav-right">
        <button className="search-trigger-btn glass-search" onClick={onOpenSearch} title="Search Movies, Series & Anime (Ctrl+K)">
          <Search size={16} className="search-icon-anim" />
          <span>Search cinema...</span>
          <kbd className="search-kbd">⌘K</kbd>
        </button>

        <button
          className="btn-icon-round mobile-toggle-btn"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle mobile menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileOpen && (
        <div className="mobile-nav-drawer">
          <ul className="mobile-nav-links">
            {navItems.map(item => (
              <li key={item.id}>
                <button
                  className={`mobile-nav-link ${activeTab === item.id ? 'active' : ''}`}
                  onClick={() => handleTabClick(item.id)}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}
