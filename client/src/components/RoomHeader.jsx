import { useState, useCallback } from 'react';

function RoomHeader({ roomId, userCount, maxUsers }) {
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
    <header className="sticky top-0 z-40 bg-tactical-base/95 backdrop-blur border-b border-tactical-border">
      <div className="max-w-5xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <h1 className="font-display text-xl font-bold tracking-wider text-accent-action">
              r6voip
            </h1>
            <span className="text-text-muted">|</span>
            <span className="text-sm text-text-secondary font-display uppercase tracking-wider">
              Tactical Channel
            </span>
          </div>

          {/* Room code */}
          <div className="flex items-center gap-4">
            {/* User count */}
            <div className="hidden sm:flex items-center gap-2 text-text-secondary">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="text-sm font-display">
                {userCount}/{maxUsers}
              </span>
            </div>

            {/* Room code button */}
            <button
              onClick={handleCopyCode}
              className={`
                flex items-center gap-3 px-5 py-2
                bg-tactical-surface border transition-all
                ${copied
                  ? 'border-status-online text-status-online'
                  : 'border-tactical-border hover:border-accent-action'
                }
              `}
              title="Click to copy room code"
            >
              <span className="text-xs text-text-muted uppercase tracking-wider">Room</span>
              <span className="font-mono text-2xl tracking-[0.3em] text-accent-highlight" style={{ textShadow: '0 0 10px rgba(255, 238, 0, 0.5)' }}>
                {roomId || '----'}
              </span>
              {copied ? (
                <svg className="w-4 h-4 text-status-online" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
