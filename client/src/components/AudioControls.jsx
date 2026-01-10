import { useState } from 'react';

function AudioControls({
  isMuted,
  isSpeaking,
  audioLevel,
  threshold,
  onToggleMute,
  onThresholdChange,
  onLeave,
  connectionStatus,
}) {
  const [showSettings, setShowSettings] = useState(false);

  // Calculate level bar width (map from dB to percentage)
  const levelPercent = Math.max(0, Math.min(100, ((audioLevel + 60) / 60) * 100));

  return (
    <div className="flex flex-col gap-4">
      {/* Audio level meter */}
      <div className="flex items-center gap-4">
        <span className="text-xs text-text-muted font-display uppercase tracking-wider w-16">
          Level
        </span>
        <div className="flex-1 h-2 bg-tactical-elevated rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-75 ${
              isSpeaking && !isMuted ? 'bg-status-online' : 'bg-text-muted'
            }`}
            style={{ width: `${isMuted ? 0 : levelPercent}%` }}
          />
        </div>
        <span className="text-xs text-text-muted font-mono w-16 text-right">
          {isMuted ? '--' : `${audioLevel.toFixed(0)} dB`}
        </span>
      </div>

      {/* Main controls */}
      <div className="flex items-center justify-between gap-4">
        {/* Left side - connection status */}
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected'
                ? 'bg-status-online'
                : connectionStatus === 'error'
                ? 'bg-status-alert'
                : 'bg-status-warning animate-pulse'
            }`}
          />
          <span className="text-xs text-text-muted font-display uppercase tracking-wider">
            {connectionStatus === 'connected'
              ? 'P2P Active'
              : connectionStatus === 'error'
              ? 'Connection Error'
              : 'Connecting...'}
          </span>
        </div>

        {/* Center - main buttons */}
        <div className="flex items-center gap-3">
          {/* Settings button */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-3 rounded-lg transition-all ${
              showSettings
                ? 'bg-accent-action text-tactical-base'
                : 'bg-tactical-surface hover:bg-tactical-elevated text-text-primary'
            }`}
            title="Audio Settings"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>

          {/* Mute button */}
          <button
            onClick={onToggleMute}
            className={`p-4 rounded-xl transition-all ${
              isMuted
                ? 'bg-status-alert text-white'
                : isSpeaking
                ? 'bg-status-online text-tactical-base animate-pulse'
                : 'bg-tactical-surface hover:bg-tactical-elevated text-text-primary'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            )}
          </button>

          {/* Leave button */}
          <button
            onClick={onLeave}
            className="btn-danger px-6"
            title="Leave Room"
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">LEAVE</span>
            </span>
          </button>
        </div>

        {/* Right side - spacer for balance */}
        <div className="w-24" />
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="card-tactical p-4 mt-2 animate-fade-in">
          <h4 className="text-sm font-display uppercase tracking-wider text-text-secondary mb-4">
            Audio Settings
          </h4>

          {/* Threshold slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-text-muted">
              <span>Voice Detection Sensitivity</span>
              <span className="font-mono">{threshold} dB</span>
            </div>
            <input
              type="range"
              min="-60"
              max="-20"
              value={threshold}
              onChange={(e) => onThresholdChange(Number(e.target.value))}
              className="w-full h-2 bg-tactical-elevated rounded-lg appearance-none cursor-pointer accent-accent-action"
            />
            <div className="flex justify-between text-xs text-text-muted">
              <span>More Sensitive</span>
              <span>Less Sensitive</span>
            </div>
          </div>

          <p className="mt-4 text-xs text-text-muted">
            Adjust the threshold to control when your voice is detected.
            Lower values mean more sensitivity (may pick up background noise).
          </p>
        </div>
      )}
    </div>
  );
}

export default AudioControls;
