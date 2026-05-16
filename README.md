# 🔬 VIRTUAL-LAB

A collaborative 2D physics sandbox for education. Create, simulate, and share physics experiments in real-time.

![VIRTUAL-LAB Screenshot](docs/screenshot.png)

## ✨ Features

- **Physics Engine** — Matter.js-powered 2D simulation with gravity, friction, restitution, and collisions
- **Body Creation** — Click to place circles, rectangles, and polygons with customizable materials
- **Constraint System** — Connect bodies with ropes, springs, pivots, and motors
- **Material Presets** — Metal, wood, rubber, ice, stone, glass, foam with accurate physics properties
- **Property Inspector** — Real-time sliders that directly modify physics body properties
- **Live Analytics** — Velocity, kinetic energy, and force charts updating in real-time via Recharts
- **Collision Log** — Track every collision with timestamps and impact speeds
- **Experiment Library** — 8 pre-built lab templates (Pendulum, Newton's Cradle, Inclined Plane, etc.)
- **Real-Time Collaboration** — Socket.io rooms with live cursor sync and physics state broadcasting
- **CSV Export** — Download analytics data for external analysis
- **Keyboard Shortcuts** — Full shortcut support for fast workflow

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 8, Tailwind CSS v4 |
| Physics | Matter.js |
| State | Zustand |
| Charts | Recharts |
| Real-time | Socket.io |
| Backend | Express 5, Node.js 24 |
| Database | MongoDB (Mongoose 9) |
| Auth | JWT + bcrypt |
| Deploy | Docker + nginx |

## 🚀 Quick Start

### Prerequisites
- Node.js 24+ (LTS)
- MongoDB (optional — works without it for local dev)

### Install & Run

```bash
# Clone
git clone https://github.com/your-username/virtual-lab.git
cd virtual-lab

# Install dependencies
cd client && npm install && cd ..
cd server && npm install && cd ..

# Start backend (Terminal 1)
cd server
npm run dev          # → http://localhost:5000

# Start frontend (Terminal 2)
cd client
npm run dev          # → http://localhost:5173
```

### Docker (Production)

```bash
docker compose up --build
# Frontend → http://localhost
# Backend  → http://localhost:5000
# MongoDB  → localhost:27017
```

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `V` | Select tool |
| `R` | Rectangle tool |
| `C` | Circle tool |
| `P` | Polygon tool |
| `E` | Eraser tool |
| `G` | Toggle grid |
| `Space` | Play / Pause simulation |
| `Escape` | Deselect + Select tool |
| `Delete` | Delete selected body |
| `Ctrl+0` | Reset zoom |
| `Scroll` | Zoom in/out |

## 📁 Project Structure

```
virtual-lab/
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/        # UI components
│   │   │   ├── Canvas/        # Matter.js physics canvas
│   │   │   ├── Dashboard/     # Analytics charts
│   │   │   ├── Experiments/   # Experiment gallery
│   │   │   ├── Inspector/     # Property panel
│   │   │   ├── Layout/        # Top bar
│   │   │   ├── Room/          # Collaboration UI
│   │   │   └── Toolbar/       # Tool palette
│   │   ├── contexts/          # React contexts
│   │   ├── data/              # Experiment templates
│   │   ├── hooks/             # Custom hooks
│   │   ├── stores/            # Zustand state
│   │   └── utils/             # Physics utils
│   ├── Dockerfile
│   └── nginx.conf
│
├── server/                    # Express backend
│   ├── src/
│   │   ├── config/            # DB connection
│   │   ├── middleware/        # Auth, error handling
│   │   ├── models/            # User, Room, Experiment
│   │   ├── routes/            # REST API
│   │   └── socket/            # Socket.io handler
│   └── Dockerfile
│
└── docker-compose.yml
```

## 🧪 Pre-Built Experiments

| # | Experiment | Difficulty | Concepts |
|---|-----------|------------|----------|
| 1 | Simple Pendulum | Beginner | Oscillation, gravity, energy |
| 2 | Newton's Cradle | Intermediate | Momentum, collision, energy transfer |
| 3 | Inclined Plane | Beginner | Friction, gravity, forces |
| 4 | Spring-Mass System | Beginner | Oscillation, spring, harmonic motion |
| 5 | Projectile Motion | Beginner | Trajectory, velocity, gravity |
| 6 | Domino Chain | Intermediate | Chain reaction, momentum |
| 7 | Bridge Stress Test | Advanced | Structure, forces, engineering |
| 8 | Pulley System | Intermediate | Pulley, tension, forces |

## 🔌 API Endpoints

### Auth
- `POST /api/auth/register` — Create account
- `POST /api/auth/login` — Login, receive JWT
- `GET /api/auth/me` — Get current user

### Rooms
- `POST /api/rooms` — Create room
- `GET /api/rooms` — List public rooms
- `GET /api/rooms/:code` — Get room by join code
- `POST /api/rooms/:code/join` — Join room

### Experiments
- `POST /api/experiments` — Save experiment
- `GET /api/experiments` — List (search, filter, paginate)
- `GET /api/experiments/:id` — Get with full snapshot
- `PUT /api/experiments/:id` — Update
- `DELETE /api/experiments/:id` — Delete

### Socket.io Events
- `room:join` / `room:leave` — Room management
- `physics:delta` — Sync body changes
- `cursor:move` / `cursor:update` — Live cursors
- `chat:message` — In-room chat

## 📄 License

MIT
