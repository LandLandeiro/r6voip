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
        {/* Header - Chrome title */}
        <div className="text-center mb-10">
          <h1 className="text-chrome-title text-5xl mb-3">
            R6voip
          </h1>
          <p className="text-mercury-400 font-body tracking-wide">
            {t('tacticalComms')}
          </p>
        </div>

        {/* Language Selector - Glass pill */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-white/20 backdrop-blur-md bg-white/5">
            <span className="text-xs text-mercury-400 font-display uppercase tracking-wider">
              {t('language')}:
            </span>
            <select
              value={language}
              onChange={(e) => changeLanguage(e.target.value)}
              className="bg-transparent text-mercury-100 text-sm font-body focus:outline-none cursor-pointer"
            >
              {availableLanguages.map((lang) => (
                <option key={lang.code} value={lang.code} className="bg-mercury-900">
                  {lang.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Main Card - Glass/Chrome hybrid */}
        <div className="card-chrome p-8 space-y-6">
          {/* Operator Name Input */}
          <div className="space-y-3">
            <label className="block text-sm font-display uppercase tracking-widest text-mercury-300">
              {t('operatorCallsign')}
            </label>
            <input
              type="text"
              value={operatorName}
              onChange={handleNameChange}
              placeholder={t('enterCallsign')}
              maxLength={16}
              className="input-chrome"
              autoComplete="off"
            />
            <p className="text-xs text-mercury-500 font-mono">
              {operatorName.length}/16 {t('characters')}
            </p>
          </div>

          {/* Join Room Section */}
          <div className="space-y-4">
            <div className="space-y-3">
              <label className="block text-sm font-display uppercase tracking-widest text-mercury-300">
                {t('roomCode')}
              </label>
              <input
                type="text"
                value={roomCode}
                onChange={handleRoomCodeChange}
                placeholder={t('roomCodePlaceholder')}
                maxLength={4}
                className="input-chrome font-mono text-3xl text-center tracking-[0.5em] py-5 uppercase"
                autoComplete="off"
              />
            </div>

            <button
              onClick={handleJoinRoom}
              disabled={!isNameValid || roomCode.length !== 4 || isCreating || isJoining}
              className="btn-mercury w-full text-base py-4"
            >
              {isJoining ? (
                <span className="flex items-center justify-center gap-3">
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

          {/* Divider - Chrome line */}
          <div className="divider-chrome">
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="px-4 text-sm text-mercury-500 font-display tracking-wider bg-transparent">
                {t('or')}
              </span>
            </div>
          </div>

          {/* Create Room Section */}
          <div className="space-y-3">
            <button
              onClick={handleCreateRoom}
              disabled={!isNameValid || isCreating || isJoining}
              className="btn-glass w-full"
            >
              {isCreating ? (
                <span className="flex items-center justify-center gap-3">
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

        {/* Privacy Notice - Glass card */}
        <div className="mt-6 p-4 rounded-2xl border border-white/10 backdrop-blur-md bg-white/5 text-center">
          <p className="text-xs text-mercury-400 leading-relaxed font-body">
            <span className="text-accent-acid font-medium">{t('p2pConnection')}</span> {t('p2pNotice')}
          </p>
        </div>

        {/* Connection Status */}
        <div className="mt-5 text-center">
          <div className="inline-flex items-center gap-2 text-xs text-mercury-500 font-body">
            <span
              className={`
                w-2 h-2 rounded-full transition-all duration-300
                ${socket?.connected
                  ? 'bg-status-online shadow-[0_0_8px_rgba(0,255,136,0.6)]'
                  : 'bg-status-alert shadow-[0_0_8px_rgba(255,51,102,0.6)] animate-pulse'
                }
              `}
            />
            {socket?.connected ? t('connectedToServer') : t('connectingToServer')}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Lobby;
