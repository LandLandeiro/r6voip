# r6voip

Browser-based voice communication platform for Rainbow Six Siege players. Create disposable voice chat rooms in seconds - no accounts, no downloads.

## Features

- **Instant Rooms**: Create disposable voice chat rooms with memorable tactical codes (e.g., `Bravo-7A4F`)
- **Zero Setup**: No accounts, no downloads - just share the room code
- **P2P Audio**: Direct WebRTC mesh connections for low-latency voice
- **Smart Audio**: Built-in noise gate and voice activity detection (VAD)
- **Tactical UI**: R6S-inspired dark interface with visual speaking indicators
- **Squad Ready**: Supports up to 5 operators per room

## Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Node.js + Express + Socket.io
- **Voice**: WebRTC via PeerJS + Web Audio API with AudioWorklets
- **Architecture**: P2P mesh topology with signaling server

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development servers (client + server)
npm run dev
```

This starts:
- **Client**: http://localhost:5173
- **Server**: http://localhost:3001

### Testing

1. Open two browser tabs at http://localhost:5173
2. In the first tab, enter a callsign and click "START OPERATION"
3. Copy the room code (e.g., `Delta-9E2B`)
4. In the second tab, enter a callsign, paste the code, and click "JOIN FREQUENCY"
5. Allow microphone access when prompted
6. Talk! You should see the speaking indicators activate

## Project Structure

```
r6voip/
├── client/                 # React frontend
│   ├── public/
│   │   └── audio-worklets/ # AudioWorklet processors
│   │       ├── noise-gate-processor.js
│   │       └── vad-processor.js
│   └── src/
│       ├── components/     # React components
│       ├── hooks/          # Custom React hooks
│       ├── pages/          # Page components
│       └── styles/         # CSS/Tailwind
├── server/                 # Node.js backend
│   └── src/
│       ├── index.js        # Socket.io server
│       └── roomUtils.js    # Room ID generation
└── package.json            # Monorepo root
```

## Room Code Format

Room codes follow a tactical naming convention:

- **Prefix**: NATO phonetic alphabet + R6S operator names
- **Suffix**: 4 hex characters (excluding ambiguous 0, O, 1, I, l)
- **Examples**: `Alpha-7A4F`, `Ash-F3C2`, `Ghost-9E2B`

## Audio Pipeline

```
Microphone → NoiseGate (AudioWorklet) → VAD (AudioWorklet) → WebRTC
```

- **Noise Gate**: Suppresses audio below threshold with smooth attack/release
- **VAD**: Detects voice activity for UI indicators with hysteresis

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Server
PORT=3001
CLIENT_URL=http://localhost:5173

# Client
VITE_SOCKET_URL=http://localhost:3001
```

## Deployment

### Client (Vercel)

```bash
cd client
npm run build
# Deploy dist/ to Vercel
```

### Server (Railway/Render)

```bash
cd server
npm start
```

Set environment variables:
- `PORT`: Server port (usually provided by platform)
- `CLIENT_URL`: Your deployed client URL

## Limitations

- **NAT Traversal**: Uses STUN only (no TURN). ~15% of users behind restrictive NATs may fail to connect.
- **Push-to-Talk**: Not possible in browsers due to security restrictions. VAD is the primary activation method.
- **Room Lifetime**: Rooms automatically expire after 24 hours.
- **IP Exposure**: P2P connections may expose participant IP addresses.

## License

MIT
