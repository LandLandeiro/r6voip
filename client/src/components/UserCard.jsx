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

  // Format volume for display (use nullish coalescing to allow 0 volume)
  const volumePercent = Math.round((user.volume ?? 1) * 100);

  const isSpeakingActive = user.isSpeaking && !user.isMuted;

  return (
    <div
      className={`
        card-chrome relative overflow-hidden transition-all duration-500
        ${isSpeakingActive ? 'speaking border-accent-acid/60' : 'border-white/20'}
        ${user.isMuted ? 'opacity-60' : ''}
      `}
    >
      {/* Speaking glow overlay */}
      {isSpeakingActive && (
        <div
          className="absolute inset-0 pointer-events-none opacity-60"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(204, 255, 0, 0.15) 0%, transparent 70%)',
          }}
        />
      )}

      {/* Host badge - Chrome pill */}
      {user.isHost && (
        <div className="absolute top-3 right-3 z-10">
          <span className="badge-chrome">
            {t('host')}
          </span>
        </div>
      )}

      {/* You badge - Acid pill */}
      {user.isLocal && (
        <div className="absolute top-3 left-3 z-10">
          <span className="badge-acid">
            {t('you')}
          </span>
        </div>
      )}

      {/* Main content */}
      <div className="relative p-4 pt-5">
        {/* Mercury blob avatar */}
        <div className="relative mx-auto w-20 h-20 mb-4">
          {/* Main blob */}
          <div
            className={`
              mercury-blob transition-all duration-500
              ${isSpeakingActive ? 'scale-105' : ''}
            `}
            style={isSpeakingActive ? {
              boxShadow: `
                0 10px 40px rgba(0, 0, 0, 0.5),
                inset 0 -5px 20px rgba(0, 0, 0, 0.3),
                inset 0 5px 10px rgba(255, 255, 255, 0.5),
                0 0 30px rgba(204, 255, 0, 0.4)
              `,
            } : undefined}
          >
            {/* User initial */}
            <span className="relative z-10 text-2xl font-display font-bold text-mercury-800">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>

          {/* Speaking ripple rings */}
          {isSpeakingActive && (
            <>
              <div className="absolute inset-0 pulse-ring-acid opacity-60" style={{ animationDelay: '0s' }} />
              <div className="absolute inset-0 pulse-ring-acid opacity-40" style={{ animationDelay: '0.5s' }} />
            </>
          )}

          {/* Connection status dot */}
          <div
            className={`
              absolute -bottom-1 -right-1 w-4 h-4 rounded-full
              border-2 border-mercury-800 transition-all duration-300
              ${user.connected
                ? 'bg-status-online shadow-[0_0_10px_rgba(0,255,136,0.5)]'
                : 'bg-status-warning animate-pulse'
              }
            `}
            title={user.connected ? 'Connected' : 'Connecting...'}
          />
        </div>

        {/* Name - Chrome text */}
        <h3 className="text-center font-display font-semibold text-mercury-100 truncate tracking-wide">
          {user.name}
        </h3>

        {/* Status indicators */}
        <div className="flex items-center justify-center gap-2 mt-3 h-6">
          {user.isMuted ? (
            <div className="flex items-center gap-1.5 text-mercury-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
              <span className="text-xs font-display uppercase tracking-wider">{t('muted')}</span>
            </div>
          ) : user.isSpeaking ? (
            <div className="flex items-center gap-1.5 text-accent-acid text-glow-acid">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              <span className="text-xs font-display uppercase tracking-wider">{t('speaking')}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-mercury-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              <span className="text-xs font-display uppercase tracking-wider">{t('standby')}</span>
            </div>
          )}
        </div>

        {/* Volume control - only show for remote users */}
        {!user.isLocal && (
          <div className="mt-4">
            <button
              onClick={() => setShowVolumeSlider(!showVolumeSlider)}
              className={`
                w-full py-2 text-xs font-display uppercase tracking-wider rounded-xl
                transition-all duration-300 flex items-center justify-center gap-2
                border backdrop-blur-sm
                ${showVolumeSlider
                  ? 'bg-accent-acid/20 text-accent-acid border-accent-acid/30'
                  : 'bg-white/5 text-mercury-400 border-white/10 hover:bg-white/10 hover:text-mercury-200'
                }
              `}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
              {volumePercent}%
            </button>

            {showVolumeSlider && (
              <div className="mt-3 px-2">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={user.volume ?? 1}
                  onChange={handleVolumeChange}
                  className="slider-chrome"
                />
                <div className="flex justify-between text-xs text-mercury-500 mt-1.5 font-mono">
                  <span>0%</span>
                  <span>100%</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Kick button (only for host, not for self) */}
        {isLocalHost && !user.isLocal && (
          <div className="mt-3">
            <button
              onClick={handleKick}
              className={`
                w-full py-2 text-xs font-display uppercase tracking-wider rounded-xl
                transition-all duration-300 border backdrop-blur-sm
                ${showKickConfirm
                  ? 'bg-status-alert/30 text-white border-status-alert/50 shadow-[0_0_20px_rgba(255,51,102,0.3)]'
                  : 'bg-white/5 text-mercury-400 border-white/10 hover:bg-status-alert/10 hover:text-status-alert hover:border-status-alert/30'
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
