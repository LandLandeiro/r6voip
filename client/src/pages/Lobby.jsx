import { useState, useCallback } from 'react';

function Lobby({ socket, onJoinRoom, onError }) {
  const [operatorName, setOperatorName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const handleNameChange = (e) => {
    const value = e.target.value.slice(0, 16);
    setOperatorName(value);
  };

  const handleRoomCodeChange = (e) => {
    // Auto-format: uppercase, allow letters, numbers, and dash
    const value = e.target.value
      .toUpperCase()
      .replace(/[^A-Z0-9-]/g, '')
      .slice(0, 15);
    setRoomCode(value);
  };

  const handleCreateRoom = useCallback(async () => {
    if (!socket || !operatorName.trim()) {
      onError('Please enter your operator name');
      return;
    }

    setIsCreating(true);

    socket.emit('create-room', { name: operatorName.trim() }, (response) => {
      setIsCreating(false);

      if (response.error) {
        onError(response.error);
        return;
      }

      onJoinRoom({
        roomId: response.roomId,
        isHost: response.isHost,
        users: response.users,
        myName: operatorName.trim(),
      });
    });
  }, [socket, operatorName, onJoinRoom, onError]);

  const handleJoinRoom = useCallback(async () => {
    if (!socket || !operatorName.trim()) {
      onError('Please enter your operator name');
      return;
    }

    if (!roomCode.trim()) {
      onError('Please enter a room code');
      return;
    }

    setIsJoining(true);

    socket.emit('join-room', { roomId: roomCode.trim(), name: operatorName.trim() }, (response) => {
      setIsJoining(false);

      if (response.error) {
        onError(response.error);
        return;
      }

      onJoinRoom({
        roomId: response.roomId,
        isHost: response.isHost,
        hostId: response.hostId,
        users: response.users,
        myName: operatorName.trim(),
      });
    });
  }, [socket, operatorName, roomCode, onJoinRoom, onError]);

  const isNameValid = operatorName.trim().length > 0;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Title */}
        <div className="text-center mb-10">
          <h1 className="font-display text-5xl font-bold tracking-wider text-accent-action text-glow-orange">
            r6voip
          </h1>
          <p className="text-text-secondary mt-2 font-display tracking-wide">
            TACTICAL VOICE COMMUNICATIONS
          </p>
        </div>

        {/* Main Card */}
        <div className="card-tactical p-6 space-y-6">
          {/* Operator Name Input */}
          <div className="space-y-2">
            <label className="block text-sm font-display uppercase tracking-wider text-text-secondary">
              Operator Callsign
            </label>
            <input
              type="text"
              value={operatorName}
              onChange={handleNameChange}
              placeholder="Enter your callsign..."
              maxLength={16}
              className="input-tactical"
              autoComplete="off"
            />
            <p className="text-xs text-text-muted">
              {operatorName.length}/16 characters
            </p>
          </div>

          {/* Create Room Section */}
          <div className="space-y-3">
            <button
              onClick={handleCreateRoom}
              disabled={!isNameValid || isCreating || isJoining}
              className="btn-tactical w-full text-lg py-4"
            >
              {isCreating ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  DEPLOYING...
                </span>
              ) : (
                'START OPERATION'
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-tactical-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-tactical-surface px-4 text-sm text-text-muted font-display tracking-wider">
                OR
              </span>
            </div>
          </div>

          {/* Join Room Section */}
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="block text-sm font-display uppercase tracking-wider text-text-secondary">
                Room Code
              </label>
              <input
                type="text"
                value={roomCode}
                onChange={handleRoomCodeChange}
                placeholder="BRAVO-7A4F"
                className="input-tactical-mono text-center"
                autoComplete="off"
              />
            </div>

            <button
              onClick={handleJoinRoom}
              disabled={!isNameValid || !roomCode.trim() || isCreating || isJoining}
              className="btn-tactical-secondary w-full"
            >
              {isJoining ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  CONNECTING...
                </span>
              ) : (
                'JOIN FREQUENCY'
              )}
            </button>
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="mt-6 p-4 bg-tactical-surface/50 border border-tactical-border/50 text-center">
          <p className="text-xs text-text-muted leading-relaxed">
            <span className="text-status-warning">P2P Connection:</span> Audio flows directly between users.
            Your IP address may be visible to other participants.
            No accounts required. Rooms expire after 24 hours.
          </p>
        </div>

        {/* Connection Status */}
        <div className="mt-4 text-center">
          <div className="inline-flex items-center gap-2 text-xs text-text-muted">
            <span
              className={`w-2 h-2 rounded-full ${
                socket?.connected ? 'bg-status-online animate-pulse' : 'bg-status-alert'
              }`}
            />
            {socket?.connected ? 'Connected to server' : 'Connecting...'}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Lobby;
