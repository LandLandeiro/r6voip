import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';

function AudioControls({
  isMuted,
  isSpeaking,
  audioLevel,
  threshold,
  micVolume,
  voiceActivation,
  onMicVolumeChange,
  onToggleMute,
  onThresholdChange,
  onVoiceActivationChange,
  onLeave,
  connectionStatus,
  pushToTalk,
  onPushToTalkChange,
  pttKey,
  onPttKeyChange,
  isPttActive,
}) {
  const { t } = useLanguage();
  const [showSettings, setShowSettings] = useState(false);
  const [isCapturingKey, setIsCapturingKey] = useState(false);

  // Calculate level bar width (map from dB to percentage)
  const levelPercent = Math.max(0, Math.min(100, ((audioLevel + 60) / 60) * 100));

  // Handle key capture for PTT
  const handleKeyCapture = useCallback((e) => {
    if (!isCapturingKey) return;

    e.preventDefault();
    e.stopPropagation();

    const keyName = e.key === ' ' ? 'Space' : e.key;
    onPttKeyChange(keyName);
    setIsCapturingKey(false);
  }, [isCapturingKey, onPttKeyChange]);

  useEffect(() => {
    if (isCapturingKey) {
      window.addEventListener('keydown', handleKeyCapture);
      return () => window.removeEventListener('keydown', handleKeyCapture);
    }
  }, [isCapturingKey, handleKeyCapture]);

  const micVolumePercent = Math.round((micVolume ?? 1) * 100);

  return (
    <div className="flex flex-col gap-4">
      {/* Audio level meter - Chrome style */}
      <div className="flex items-center gap-4">
        <span className="text-xs text-mercury-500 font-display uppercase tracking-wider w-16">
          {t('level')}
        </span>
        <div className="flex-1 h-2 rounded-full overflow-hidden"
          style={{
            background: 'linear-gradient(90deg, rgba(39, 39, 42, 0.8) 0%, rgba(63, 63, 70, 0.8) 50%, rgba(39, 39, 42, 0.8) 100%)',
            boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.5)',
          }}
        >
          <div
            className="h-full transition-all duration-75 rounded-full"
            style={{
              width: `${isMuted ? 0 : levelPercent}%`,
              background: (isSpeaking || isPttActive) && !isMuted
                ? 'linear-gradient(90deg, #CCFF00 0%, #B8FF00 50%, #CCFF00 100%)'
                : 'linear-gradient(90deg, #71717A 0%, #A1A1AA 50%, #71717A 100%)',
              boxShadow: (isSpeaking || isPttActive) && !isMuted
                ? '0 0 10px rgba(204, 255, 0, 0.5)'
                : 'none',
            }}
          />
        </div>
        <span className="text-xs text-mercury-500 font-mono w-16 text-right">
          {isMuted ? '--' : `${audioLevel.toFixed(0)} dB`}
        </span>
      </div>

      {/* PTT indicator */}
      {pushToTalk && (
        <div className={`text-center text-xs font-display uppercase tracking-wider transition-all duration-200 ${
          isPttActive ? 'text-accent-acid text-glow-acid' : 'text-mercury-500'
        }`}>
          {isPttActive ? `[${pttKey}] ${t('pttEnabled')}` : `${t('holdToTalk')} [${pttKey}]`}
        </div>
      )}

      {/* Main controls */}
      <div className="flex items-center justify-between gap-4">
        {/* Left side - connection status */}
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              connectionStatus === 'connected'
                ? 'bg-status-online shadow-[0_0_8px_rgba(0,255,136,0.6)]'
                : connectionStatus === 'error'
                ? 'bg-status-alert shadow-[0_0_8px_rgba(255,51,102,0.6)]'
                : 'bg-status-warning shadow-[0_0_8px_rgba(255,170,0,0.6)] animate-pulse'
            }`}
          />
          <span className="text-xs text-mercury-500 font-display uppercase tracking-wider">
            {connectionStatus === 'connected'
              ? t('p2pActive')
              : connectionStatus === 'error'
              ? t('connectionError')
              : t('connecting')}
          </span>
        </div>

        {/* Center - main buttons */}
        <div className="flex items-center gap-3">
          {/* Settings button - Glass style */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`
              p-3 rounded-xl transition-all duration-300 border backdrop-blur-sm
              ${showSettings
                ? 'bg-white/20 border-white/40 text-mercury-100 shadow-chrome'
                : 'bg-white/5 border-white/10 text-mercury-400 hover:bg-white/10 hover:border-white/20'
              }
            `}
            title="Audio Settings"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>

          {/* Mute button - Mercury blob style */}
          <button
            onClick={onToggleMute}
            className={`
              relative p-4 rounded-full transition-all duration-300
              ${isMuted
                ? 'bg-gradient-to-br from-status-alert to-red-700 text-white shadow-[0_0_20px_rgba(255,51,102,0.4)]'
                : (isSpeaking || isPttActive)
                ? 'text-mercury-900 shadow-[0_0_30px_rgba(204,255,0,0.5)]'
                : 'bg-white/10 border border-white/20 text-mercury-100 hover:bg-white/20'
              }
            `}
            style={(isSpeaking || isPttActive) && !isMuted ? {
              background: 'linear-gradient(135deg, #CCFF00 0%, #B8FF00 50%, #99CC00 100%)',
            } : isMuted ? {} : undefined}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {/* Pulse ring when speaking */}
            {(isSpeaking || isPttActive) && !isMuted && (
              <span className="absolute inset-0 rounded-full animate-ping opacity-30 bg-accent-acid" />
            )}
            {isMuted ? (
              <svg className="relative w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            ) : (
              <svg className="relative w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            )}
          </button>

          {/* Leave button */}
          <button
            onClick={onLeave}
            className="btn-danger px-6 py-3"
            title="Leave Room"
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline font-display uppercase tracking-wider">{t('leave')}</span>
            </span>
          </button>
        </div>

        {/* Right side - spacer for balance */}
        <div className="w-24" />
      </div>

      {/* Settings panel - Glass card */}
      {showSettings && (
        <div className="card-chrome p-5 mt-2 animate-fade-in">
          <h4 className="text-sm font-display uppercase tracking-widest text-mercury-300 mb-5">
            {t('audioSettings')}
          </h4>

          {/* Microphone Volume */}
          <div className="mb-5 pb-5 border-b border-white/10">
            <div className="flex justify-between text-xs text-mercury-400 mb-3">
              <span className="font-display uppercase tracking-wider">{t('micVolume')}</span>
              <span className="font-mono">{micVolumePercent}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="2"
              step="0.05"
              value={micVolume ?? 1}
              onChange={(e) => onMicVolumeChange(parseFloat(e.target.value))}
              className="slider-chrome"
            />
            <div className="flex justify-between text-xs text-mercury-500 mt-2">
              <span>0%</span>
              <span>200%</span>
            </div>
          </div>

          {/* Push to Talk toggle */}
          <div className="mb-5 pb-5 border-b border-white/10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-mercury-400 font-display uppercase tracking-wider">{t('pushToTalk')}</span>
              <button
                onClick={() => onPushToTalkChange(!pushToTalk)}
                className={`
                  relative w-12 h-6 rounded-full transition-all duration-300
                  ${pushToTalk
                    ? 'bg-accent-acid shadow-[0_0_10px_rgba(204,255,0,0.4)]'
                    : 'bg-mercury-700'
                  }
                `}
              >
                <span
                  className={`
                    absolute top-1 w-4 h-4 rounded-full transition-all duration-300
                    ${pushToTalk
                      ? 'left-7 bg-mercury-900'
                      : 'left-1 bg-mercury-400'
                    }
                  `}
                  style={{
                    background: pushToTalk
                      ? 'linear-gradient(135deg, #27272A 0%, #18181B 100%)'
                      : 'linear-gradient(135deg, #A1A1AA 0%, #71717A 100%)',
                  }}
                />
              </button>
            </div>
            <p className="text-xs text-mercury-500 font-body">
              {pushToTalk ? t('pttEnabled') : t('pttDisabled')}
            </p>

            {/* PTT Key selector */}
            {pushToTalk && (
              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-mercury-400 font-display uppercase tracking-wider">{t('pttKey')}:</span>
                  <button
                    onClick={() => setIsCapturingKey(true)}
                    className={`
                      px-4 py-1.5 text-sm font-mono rounded-lg border transition-all duration-300
                      ${isCapturingKey
                        ? 'border-accent-acid bg-accent-acid/20 text-accent-acid animate-pulse shadow-[0_0_15px_rgba(204,255,0,0.3)]'
                        : 'border-white/20 bg-white/5 text-mercury-200 hover:border-white/40'
                      }
                    `}
                  >
                    {isCapturingKey ? t('pressKey') : pttKey}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Voice Activation toggle - only show when NOT using PTT */}
          {!pushToTalk && (
            <div className="mb-5 pb-5 border-b border-white/10">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-mercury-400 font-display uppercase tracking-wider">{t('voiceActivation') || 'Voice Activation'}</span>
                <button
                  onClick={() => onVoiceActivationChange(!voiceActivation)}
                  className={`
                    relative w-12 h-6 rounded-full transition-all duration-300
                    ${voiceActivation
                      ? 'bg-accent-acid shadow-[0_0_10px_rgba(204,255,0,0.4)]'
                      : 'bg-mercury-700'
                    }
                  `}
                >
                  <span
                    className={`
                      absolute top-1 w-4 h-4 rounded-full transition-all duration-300
                      ${voiceActivation
                        ? 'left-7 bg-mercury-900'
                        : 'left-1 bg-mercury-400'
                      }
                    `}
                    style={{
                      background: voiceActivation
                        ? 'linear-gradient(135deg, #27272A 0%, #18181B 100%)'
                        : 'linear-gradient(135deg, #A1A1AA 0%, #71717A 100%)',
                    }}
                  />
                </button>
              </div>
              <p className="text-xs text-mercury-500 font-body">
                {voiceActivation
                  ? (t('voiceActivationOn') || 'Audio only transmits when speaking')
                  : (t('voiceActivationOff') || 'Audio always transmits when unmuted')}
              </p>
            </div>
          )}

          {/* Threshold slider - only show when voice activation is ON and NOT using PTT */}
          {!pushToTalk && voiceActivation && (
            <div className="space-y-3">
              <div className="flex justify-between text-xs text-mercury-400">
                <span className="font-display uppercase tracking-wider">{t('voiceDetection')}</span>
                <span className="font-mono">{threshold} dB</span>
              </div>
              <input
                type="range"
                min="-60"
                max="-20"
                value={threshold}
                onChange={(e) => onThresholdChange(Number(e.target.value))}
                className="slider-chrome"
              />
              <div className="flex justify-between text-xs text-mercury-500">
                <span>{t('moreSensitive')}</span>
                <span>{t('lessSensitive')}</span>
              </div>
              <p className="mt-2 text-xs text-mercury-500 font-body">
                {t('adjustThreshold') || 'Adjust to filter background noise'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AudioControls;
