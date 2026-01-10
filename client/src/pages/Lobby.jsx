import { useState, useCallback } from 'react';
import { useLanguage, availableLanguages } from '../context/LanguageContext';

function Lobby({ socket, onJoinRoom, onError }) {
  const { t, language, changeLanguage } = useLanguage();
  const [operatorName, setOperatorName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const handleNameChange = (e) => {
    const value = e.target.value.slice(0, 16);
    setOperatorName(value);
  };

  const handleRoomCodeChange = (e) => {
    // Allow letters and digits, max 4 characters
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
    setRoomCode(value);
  };

  const handleCreateRoom = useCallback(async () => {
    if (!socket || !operatorName.trim()) {
      onError(t('enterOperatorName'));
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
  }, [socket, operatorName, onJoinRoom, onError, t]);

  const handleJoinRoom = useCallback(async () => {
    if (!socket || !operatorName.trim()) {
      onError(t('enterOperatorName'));
      return;
    }

    if (!roomCode.trim() || roomCode.length !== 4) {
      onError(t('enterValidCode'));
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
  }, [socket, operatorName, roomCode, onJoinRoom, onError, t]);

  const isNameValid = operatorName.trim().length > 0;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header - No logo, just title */}
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl font-bold tracking-wider text-accent-action text-glow-orange">
            R6voip
          </h1>
          <p className="text-text-secondary mt-2 font-display tracking-wide">
            {t('tacticalComms')}
          </p>
        </div>

        {/* Language Selector */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 bg-tactical-surface border border-tactical-border px-3 py-2">
            <span className="text-xs text-text-muted font-display uppercase tracking-wider">
              {t('language')}:
            </span>
            <select
              value={language}
              onChange={(e) => changeLanguage(e.target.value)}
              className="bg-transparent text-text-primary text-sm font-display focus:outline-none cursor-pointer"
            >
              {availableLanguages.map((lang) => (
                <option key={lang.code} value={lang.code} className="bg-tactical-base">
                  {lang.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Main Card */}
        <div className="card-tactical p-6 space-y-6">
          {/* Operator Name Input */}
          <div className="space-y-2">
            <label className="block text-sm font-display uppercase tracking-wider text-text-secondary">
              {t('operatorCallsign')}
            </label>
            <input
              type="text"
              value={operatorName}
              onChange={handleNameChange}
              placeholder={t('enterCallsign')}
              maxLength={16}
              className="input-tactical"
              autoComplete="off"
            />
            <p className="text-xs text-text-muted">
              {operatorName.length}/16 {t('characters')}
            </p>
          </div>

          {/* Join Room Section - NOW FIRST */}
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="block text-sm font-display uppercase tracking-wider text-text-secondary">
                {t('roomCode')}
              </label>
              <input
                type="text"
                value={roomCode}
                onChange={handleRoomCodeChange}
                placeholder={t('roomCodePlaceholder')}
                maxLength={4}
                className="input-tactical font-mono text-3xl text-center tracking-[0.5em] py-4 uppercase"
                autoComplete="off"
              />
            </div>

            <button
              onClick={handleJoinRoom}
              disabled={!isNameValid || roomCode.length !== 4 || isCreating || isJoining}
              className="btn-tactical w-full text-lg py-4"
            >
              {isJoining ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {t('connecting')}
                </span>
              ) : (
                t('joinFrequency')
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
                {t('or')}
              </span>
            </div>
          </div>

          {/* Create Room Section - NOW SECOND */}
          <div className="space-y-3">
            <button
              onClick={handleCreateRoom}
              disabled={!isNameValid || isCreating || isJoining}
              className="btn-tactical-secondary w-full"
            >
              {isCreating ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {t('deploying')}
                </span>
              ) : (
                t('startOperation')
              )}
            </button>
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="mt-6 p-4 bg-tactical-surface/50 border border-tactical-border/50 text-center">
          <p className="text-xs text-text-muted leading-relaxed">
            <span className="text-status-warning">{t('p2pConnection')}</span> {t('p2pNotice')}
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
            {socket?.connected ? t('connectedToServer') : t('connectingToServer')}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Lobby;
