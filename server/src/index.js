import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { generateRoomId, isValidRoomId, normalizeRoomId } from './roomUtils.js';

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

// In-memory room storage
// Map<roomId, { createdAt: Date, hostId: string, users: Map<socketId, {peerId, name, isMuted}> }>
const rooms = new Map();

// Rate limiting for room creation/joining
const rateLimits = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_ATTEMPTS = 10;

function checkRateLimit(ip) {
  const now = Date.now();
  const userLimit = rateLimits.get(ip);

  if (!userLimit) {
    rateLimits.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (now > userLimit.resetAt) {
    rateLimits.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (userLimit.count >= MAX_ATTEMPTS) {
    return false;
  }

  userLimit.count++;
  return true;
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', rooms: rooms.size });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  const clientIp = socket.handshake.address;
  console.log(`[${new Date().toISOString()}] User connected: ${socket.id}`);

  // Create a new room
  socket.on('create-room', (data, callback) => {
    if (!checkRateLimit(clientIp)) {
      return callback({ error: 'Rate limit exceeded. Please wait before trying again.' });
    }

    const { name } = data;

    if (!name || name.length > 16) {
      return callback({ error: 'Invalid operator name (max 16 characters)' });
    }

    // Generate unique room ID
    let roomId;
    let attempts = 0;
    do {
      roomId = generateRoomId();
      attempts++;
    } while (rooms.has(roomId) && attempts < 100);

    if (attempts >= 100) {
      return callback({ error: 'Could not generate unique room ID. Please try again.' });
    }

    // Create room
    const room = {
      createdAt: new Date(),
      hostId: socket.id,
      users: new Map([[socket.id, { peerId: null, name, isMuted: false }]]),
    };

    rooms.set(roomId, room);
    socket.join(roomId);
    socket.roomId = roomId;
    socket.userName = name;

    console.log(`[${new Date().toISOString()}] Room created: ${roomId} by ${name}`);

    callback({
      success: true,
      roomId,
      isHost: true,
      users: [{ socketId: socket.id, name, isMuted: false, isHost: true }],
    });
  });

  // Join existing room
  socket.on('join-room', (data, callback) => {
    if (!checkRateLimit(clientIp)) {
      return callback({ error: 'Rate limit exceeded. Please wait before trying again.' });
    }

    const { roomId: rawRoomId, name } = data;

    if (!name || name.length > 16) {
      return callback({ error: 'Invalid operator name (max 16 characters)' });
    }

    // Normalize the room ID
    const roomId = normalizeRoomId(rawRoomId);

    if (!roomId) {
      return callback({ error: 'Invalid room code format (use 4 digits)' });
    }

    const room = rooms.get(roomId);

    if (!room) {
      return callback({ error: 'Room not found. Check the code and try again.' });
    }

    if (room.users.size >= 5) {
      return callback({ error: 'Room is full (5/5 operators)' });
    }

    // Add user to room
    room.users.set(socket.id, { peerId: null, name, isMuted: false });
    socket.join(roomId);
    socket.roomId = roomId;
    socket.userName = name;

    // Get list of existing users for the new joiner
    const existingUsers = [];
    room.users.forEach((user, socketId) => {
      existingUsers.push({
        socketId,
        peerId: user.peerId,
        name: user.name,
        isMuted: user.isMuted,
        isHost: socketId === room.hostId,
      });
    });

    console.log(`[${new Date().toISOString()}] User ${name} joined room ${roomId}`);

    // Notify existing users about new user
    socket.to(roomId).emit('user-joined', {
      socketId: socket.id,
      name,
      isMuted: false,
      isHost: false,
    });

    callback({
      success: true,
      roomId,
      isHost: false,
      hostId: room.hostId,
      users: existingUsers,
    });
  });

  // Register PeerJS ID
  socket.on('register-peer', (data) => {
    const { peerId } = data;
    const roomId = socket.roomId;

    if (!roomId) return;

    const room = rooms.get(roomId);
    if (!room) return;

    const user = room.users.get(socket.id);
    if (user) {
      user.peerId = peerId;

      // Broadcast peer ID to other users in room
      socket.to(roomId).emit('peer-registered', {
        socketId: socket.id,
        peerId,
      });

      console.log(`[${new Date().toISOString()}] Peer registered: ${peerId} for ${socket.userName}`);
    }
  });

  // Toggle mute state
  socket.on('toggle-mute', (data) => {
    const { isMuted } = data;
    const roomId = socket.roomId;

    if (!roomId) return;

    const room = rooms.get(roomId);
    if (!room) return;

    const user = room.users.get(socket.id);
    if (user) {
      user.isMuted = isMuted;

      // Broadcast mute state to all users in room
      io.to(roomId).emit('user-mute-changed', {
        socketId: socket.id,
        isMuted,
      });
    }
  });

  // Speaking state changed (for visual indicator)
  socket.on('speaking-state', (data) => {
    const { isSpeaking } = data;
    const roomId = socket.roomId;

    if (!roomId) return;

    // Broadcast speaking state to other users in room (not to self)
    socket.to(roomId).emit('user-speaking-changed', {
      socketId: socket.id,
      isSpeaking,
    });
  });

  // Kick user (host only)
  socket.on('kick-user', (data, callback) => {
    const { targetSocketId } = data;
    const roomId = socket.roomId;

    if (!roomId) {
      return callback?.({ error: 'Not in a room' });
    }

    const room = rooms.get(roomId);
    if (!room) {
      return callback?.({ error: 'Room not found' });
    }

    // Verify requester is host
    if (room.hostId !== socket.id) {
      return callback?.({ error: 'Only the host can kick users' });
    }

    // Cannot kick yourself
    if (targetSocketId === socket.id) {
      return callback?.({ error: 'Cannot kick yourself' });
    }

    const targetUser = room.users.get(targetSocketId);
    if (!targetUser) {
      return callback?.({ error: 'User not found in room' });
    }

    // Get target socket
    const targetSocket = io.sockets.sockets.get(targetSocketId);

    // Notify all users about the kick
    io.to(roomId).emit('user-kicked', {
      socketId: targetSocketId,
      name: targetUser.name,
    });

    // Remove user from room
    room.users.delete(targetSocketId);

    // Disconnect target from room
    if (targetSocket) {
      targetSocket.leave(roomId);
      targetSocket.roomId = null;
      targetSocket.emit('you-were-kicked', { roomId });
    }

    console.log(`[${new Date().toISOString()}] User ${targetUser.name} kicked from ${roomId}`);

    callback?.({ success: true });
  });

  // Leave room voluntarily
  socket.on('leave-room', () => {
    handleUserLeave(socket);
  });

  // Handle disconnect
  socket.on('disconnecting', () => {
    handleUserLeave(socket);
  });

  socket.on('disconnect', () => {
    console.log(`[${new Date().toISOString()}] User disconnected: ${socket.id}`);
  });
});

function handleUserLeave(socket) {
  const roomId = socket.roomId;
  if (!roomId) return;

  const room = rooms.get(roomId);
  if (!room) return;

  const user = room.users.get(socket.id);
  const wasHost = room.hostId === socket.id;

  // Remove user from room
  room.users.delete(socket.id);
  socket.leave(roomId);

  console.log(`[${new Date().toISOString()}] User ${socket.userName || socket.id} left room ${roomId}`);

  // If room is empty, delete it
  if (room.users.size === 0) {
    rooms.delete(roomId);
    console.log(`[${new Date().toISOString()}] Room ${roomId} deleted (empty)`);
    return;
  }

  // If host left, transfer to next user
  let newHostId = null;
  if (wasHost) {
    newHostId = room.users.keys().next().value;
    room.hostId = newHostId;
    console.log(`[${new Date().toISOString()}] Host transferred to ${newHostId} in room ${roomId}`);
  }

  // Notify remaining users
  socket.to(roomId).emit('user-left', {
    socketId: socket.id,
    name: user?.name || 'Unknown',
    wasHost,
    newHostId,
  });

  socket.roomId = null;
}

// Garbage collection for stale rooms (24h max)
const ROOM_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours

setInterval(() => {
  const now = Date.now();
  let cleaned = 0;

  rooms.forEach((room, roomId) => {
    if (now - room.createdAt.getTime() > ROOM_MAX_AGE) {
      // Notify users before cleanup
      io.to(roomId).emit('room-expired', { roomId });

      // Disconnect all sockets in room
      const sockets = io.sockets.adapter.rooms.get(roomId);
      if (sockets) {
        sockets.forEach((socketId) => {
          const socket = io.sockets.sockets.get(socketId);
          if (socket) {
            socket.leave(roomId);
            socket.roomId = null;
          }
        });
      }

      rooms.delete(roomId);
      cleaned++;
    }
  });

  if (cleaned > 0) {
    console.log(`[${new Date().toISOString()}] Garbage collection: cleaned ${cleaned} stale rooms`);
  }
}, 60 * 60 * 1000); // Run every hour

// Clean up rate limits periodically
setInterval(() => {
  const now = Date.now();
  rateLimits.forEach((limit, ip) => {
    if (now > limit.resetAt) {
      rateLimits.delete(ip);
    }
  });
}, 5 * 60 * 1000); // Every 5 minutes

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`[${new Date().toISOString()}] r6voip signaling server running on port ${PORT}`);
});
