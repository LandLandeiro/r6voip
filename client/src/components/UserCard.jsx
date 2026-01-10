import { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

function UserCard({ user, isLocalHost, onKick, onVolumeChange }) {
  const { t } = useLanguage();
  const [showKickConfirm, setShowKickConfirm] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  const handleKick = () => {
    if (showKickConfirm) {
      onKick(user.socketId);
      setShowKickConfirm(false);
    } else {
      setShowKickConfirm(true);
      // Auto-cancel after 3 seconds
      setTimeout(() => setShowKickConfirm(false), 3000);
    }
  };

  const handleVolumeChange = (e) => {
    const value = parseFloat(e.target.value);
    onVolumeChange(value);
  };

  // Format volume for display
  const volumePercent = Math.round((user.volume || 1) * 100);

  return (
    <div
      className={`
        card-tactical relative overflow-hidden transition-all duration-300
        ${user.isSpeaking && !user.isMuted ? 'speaking border-status-online' : 'border-tactical-border'}
        ${user.isMuted ? 'opacity-60' : ''}
      `}
    >
      {/* Host badge */}
      {user.isHost && (
        <div className="absolute top-2 right-2 z-10">
          <span className="px-2 py-0.5 bg-accent-action text-tactical-base text-xs font-display font-bold uppercase tracking-wider">
            {t('host')}
          </span>
        </div>
      )}

      {/* You badge */}
      {user.isLocal && (
        <div className="absolute top-2 left-2 z-10">
          <span className="px-2 py-0.5 bg-accent-highlight text-tactical-base text-xs font-display font-bold uppercase tracking-wider">
            {t('you')}
          </span>
        </div>
      )}

      {/* Main content */}
      <div className="p-4">
        {/* Avatar/Icon */}
        <div className="relative mx-auto w-20 h-20 mb-3">
          <div
            className={`
              w-full h-full rounded-full flex items-center justify-center
              bg-tactical-elevated border-2 transition-all duration-300
              ${user.isSpeaking && !user.isMuted
                ? 'border-status-online shadow-lg shadow-status-online/30'
                : 'border-tactical-border'
              }
            `}
          >
            {/* User initial or icon */}
            <span className="text-2xl font-display font-bold text-text-primary">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>

          {/* Speaking indicator ring */}
          {user.isSpeaking && !user.isMuted && (
            <div className="absolute inset-0 rounded-full border-2 border-status-online animate-ping opacity-50" />
          )}

          {/* Connection status dot */}
          <div
            className={`
              absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-tactical-surface
              ${user.connected ? 'bg-status-online' : 'bg-status-warning animate-pulse'}
            `}
            title={user.connected ? 'Connected' : 'Connecting...'}
          />
        </div>

        {/* Name */}
        <h3 className="text-center font-display font-semibold text-text-primary truncate">
          {user.name}
        </h3>

        {/* Status indicators */}
        <div className="flex items-center justify-center gap-2 mt-2 h-6">
          {user.isMuted ? (
            <div className="flex items-center gap-1 text-status-muted">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
              <span className="text-xs uppercase tracking-wider">{t('muted')}</span>
            </div>
          ) : user.isSpeaking ? (
            <div className="flex items-center gap-1 text-status-online">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              <span className="text-xs uppercase tracking-wider">{t('speaking')}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-text-muted">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              <span className="text-xs uppercase tracking-wider">{t('standby')}</span>
            </div>
          )}
        </div>

        {/* Volume control */}
        <div className="mt-3">
          <button
            onClick={() => setShowVolumeSlider(!showVolumeSlider)}
            className={`
              w-full py-1.5 text-xs font-display uppercase tracking-wider transition-all flex items-center justify-center gap-2
              ${showVolumeSlider
                ? 'bg-accent-action/20 text-accent-action'
                : 'bg-tactical-elevated text-text-muted hover:bg-tactical-surface hover:text-text-secondary'
              }
            `}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
            {volumePercent}%
          </button>

          {showVolumeSlider && (
            <div className="mt-2 px-2">
              <input
                type="range"
                min={user.isLocal ? "0" : "0"}
                max={user.isLocal ? "2" : "1"}
                step="0.05"
                value={user.volume || 1}
                onChange={handleVolumeChange}
                className="w-full h-2 bg-tactical-elevated rounded-lg appearance-none cursor-pointer accent-accent-action"
              />
              <div className="flex justify-between text-xs text-text-muted mt-1">
                <span>0%</span>
                <span>{user.isLocal ? '200%' : '100%'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Kick button (only for host, not for self) */}
        {isLocalHost && !user.isLocal && (
          <div className="mt-2">
            <button
              onClick={handleKick}
              className={`
                w-full py-1.5 text-xs font-display uppercase tracking-wider transition-all
                ${showKickConfirm
                  ? 'bg-status-alert text-white'
                  : 'bg-tactical-elevated text-text-muted hover:bg-status-alert/20 hover:text-status-alert'
                }
              `}
            >
              {showKickConfirm ? t('confirmKick') : t('kick')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default UserCard;
