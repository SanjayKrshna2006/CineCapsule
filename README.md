# 🎬 CineCapsule

A sleek, modern streaming platform for Movies, TV Series, and Anime powered by TMDB metadata and high-performance streaming servers.

---

## 📁 Repository Structure

```
CineCapsule/
├── frontend/                 # React 18 + Vite frontend application
│   ├── src/                  # UI Components, services, and styling
│   ├── public/               # Static assets
│   ├── index.html            # HTML entry point
│   ├── vite.config.js        # Vite config + proxy middleware
│   └── package.json          # Frontend dependencies
│
├── backend/                  # Node.js + Express streaming proxy server
│   ├── api/                  # API route handlers (AnimeSalt resolver, etc.)
│   ├── server.js             # Standalone Express server (port 4000)
│   ├── render.yaml           # Deployment configuration
│   └── package.json          # Backend dependencies
│
├── package.json              # Monorepo scripts
├── start-cinecapsule.bat     # Windows launcher script
└── README.md
```

---

## 🚀 Getting Started

### 1. Run Frontend (Port 3000)
```bash
npm run dev:frontend
```

### 2. Run Backend (Port 4000)
```bash
npm run dev:backend
```

### 3. Build for Production
```bash
npm run build
```