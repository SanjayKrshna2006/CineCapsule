// LocalStorage persistence helpers for Watchlist, Continue Watching, and Preferences

const WATCHLIST_KEY = 'cinecapsule_watchlist';
const HISTORY_KEY = 'cinecapsule_history';
const PREFS_KEY = 'cinecapsule_prefs';

export const storage = {
  // Watchlist
  getWatchlist() {
    try {
      const data = localStorage.getItem(WATCHLIST_KEY) || localStorage.getItem('cinepulse_watchlist');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  isInWatchlist(id) {
    const list = this.getWatchlist();
    return list.some(item => String(item.id) === String(id));
  },

  addToWatchlist(item) {
    const list = this.getWatchlist();
    if (!list.some(i => String(i.id) === String(item.id))) {
      const updated = [item, ...list];
      localStorage.setItem(WATCHLIST_KEY, JSON.stringify(updated));
      return updated;
    }
    return list;
  },

  removeFromWatchlist(id) {
    const list = this.getWatchlist();
    const updated = list.filter(item => String(item.id) !== String(id));
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(updated));
    return updated;
  },

  // Continue Watching History
  getHistory() {
    try {
      const data = localStorage.getItem(HISTORY_KEY) || localStorage.getItem('cinepulse_history');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveHistory(item) {
    const history = this.getHistory();
    const filtered = history.filter(h => String(h.id) !== String(item.id));
    const updated = [
      {
        ...item,
        lastWatched: Date.now()
      },
      ...filtered
    ].slice(0, 20); // keep last 20

    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    return updated;
  },

  removeFromHistory(id) {
    const history = this.getHistory();
    const updated = history.filter(h => String(h.id) !== String(id));
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    return updated;
  },

  // Preferences
  getPreferences() {
    try {
      const data = localStorage.getItem(PREFS_KEY);
      return data ? JSON.parse(data) : { server: 'vidlink', adShield: true };
    } catch {
      return { server: 'vidlink', adShield: true };
    }
  },

  savePreferences(prefs) {
    const current = this.getPreferences();
    const updated = { ...current, ...prefs };
    localStorage.setItem(PREFS_KEY, JSON.stringify(updated));
    return updated;
  }
};
