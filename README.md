# 🎬 CineCapsule

A sleek, modern streaming platform for Movies, TV Series, and Anime powered by TMDB metadata and high-performance streaming servers.

---

## 🌐 Live Production Links

- 🚀 **Live Frontend Application**: **[https://cinecapsule-stream.onrender.com](https://cinecapsule-stream.onrender.com)**
- ⚙️ **Live Backend API & Streaming Proxy**: **[https://cinecapsule-backend.onrender.com](https://cinecapsule-backend.onrender.com)**

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
├── api/                      # Vercel Serverless streaming function
├── vercel.json               # Vercel configuration
├── package.json              # Monorepo scripts
├── start-cinecapsule.bat     # Windows 1-click launcher script
└── README.md
```

---

## 🚀 Local Development

### 1. Run via Monorepo Scripts (Root)
```bash
# Start frontend (http://localhost:3000)
npm run dev:frontend

# Start backend (http://localhost:4000)
npm run dev:backend

# Build frontend
npm run build
```

### 2. Windows 1-Click Launch
Double-click `start-cinecapsule.bat` to launch both Frontend and Backend concurrently.
