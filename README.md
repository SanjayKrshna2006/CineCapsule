# CineCapsule 🎬 — Movie, Series & Anime Streaming App

Welcome to **CineCapsule**, a premier streaming platform built for seamless playback of Movies, TV Series, and Anime.

---

## 🌟 Key Features

- **🎬 Movies Hub**: Trending films, box-office hits, top-rated classics, and 15+ genres (Action, Sci-Fi, Horror, Thriller, Comedy, Romance, etc.).
- **📺 TV Series Hub**: Complete seasons and episodes for trending shows and network releases (Netflix, HBO, Disney+, etc.).
- **⛩️ Dedicated Anime Universe**: Shonen, Seinen, Isekai, Romance, Fantasy, and Feature Anime films with full episode guides.
- **⚡ Multi-Server Failover**: 5 high-speed streaming servers (VidLink HD, VidSrc VIP, SmashyStream, 2Embed, VidSrc In) with instant 1-click switching.
- **🕒 Continue Watching**: Automatically remembers media and exact episode progress so you can resume right where you left off.
- **🔖 My List / Watchlist**: Save your favorite titles locally with one click.
- **🔍 Instant Universal Search**: Live search across Movies, Series, and Anime with instant results.
- **🖥️ Premium Cinema Aesthetics**: OLED dark theme, glassmorphic navigation, high-res backdrops, responsive layouts, and keyboard shortcuts.

---

## 🚀 Quick Start (Windows)

### Option 1: Double-Click Launcher (Easiest)
Simply double-click the [start-cinecapsule.bat](file:///s:/projects/SK/start-cinecapsule.bat) file in `S:\projects\SK`. It will start the server and automatically open the application in your browser.

### Option 2: Command Line
From this directory (`S:\projects\SK`), run:
```bash
npm install
npm run dev
```
Then visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🎮 Keyboard Shortcuts

- **F**: Toggle Fullscreen Mode in Player
- **Esc**: Exit Player / Close Modals
- **Ctrl + K**: Open Universal Search
- **N / P**: Next / Previous Episode (when watching Series/Anime)

---

## 🛠️ Architecture

- **Frontend**: React 18 + Vite
- **Icons**: Lucide React
- **Styling**: Vanilla CSS Cinema Design System with Glassmorphism & Micro-animations
- **Data Providers**: TMDB API (Movies & TV Series) + Animation & Japanese Language Filtering (Anime)
- **Streaming Servers**: Multi-provider embed failover (VidLink, VidSrc, 2Embed, SmashyStream)
