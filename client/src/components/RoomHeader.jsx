import { useState, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';

function RoomHeader({ roomId, userCount, maxUsers }) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  const handleCopyCode = useCallback(async () => {
    if (!roomId) return;

    try {
      await navigator.clipboard.writeText(roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for browsers without clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = roomId;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (e) {
        console.error('Failed to copy:', e);
      }
      document.body.removeChild(textArea);
    }
  }, [roomId]);

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl border-b border-white/10"
      style={{
        background: 'linear-gradient(180deg, rgba(24, 24, 27, 0.95) 0%, rgba(24, 24, 27, 0.9) 100%)',
      }}
    >
      <div className="max-w-5xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo - Chrome text */}
          <div className="flex items-center gap-3">
            <h1 className="text-chrome-title text-xl">
              R6voip
            </h1>
            <span className="text-mercury-600">|</span>
            <span className="text-sm text-mercury-400 font-display uppercase tracking-wider">
              {t('tacticalChannel')}
            </span>
          </div>

          {/* Room code */}
          <div className="flex items-center gap-4">
            {/* User count */}
            <div className="hidden sm:flex items-center gap-2 text-mercury-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="text-sm font-display">
                {userCount}/{maxUsers}
              </span>
            </div>

            {/* Room code button - Glass style */}
            <button
              onClick={handleCopyCode}
              className={`
                flex items-center gap-3 px-5 py-2 rounded-full
                border backdrop-blur-sm transition-all duration-300
                ${copied
                  ? 'border-status-online/50 bg-status-online/10 shadow-[0_0_20px_rgba(0,255,136,0.2)]'
                  : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10'
                }
              `}
              title="Click to copy room code"
            >
              <span className="text-xs text-mercury-400 font-display uppercase tracking-wider">{t('room')}</span>
              <span className="room-code">
                {roomId || '----'}
              </span>
              {copied ? (
                <svg className="w-4 h-4 text-status-online" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-mercury-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default RoomHeader;
