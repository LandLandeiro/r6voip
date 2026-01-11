import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for managing local audio with noise gate and VAD processing
 */
export function useAudio() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isMuted, setIsMutedState] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioLevel, setAudioLevel] = useState(-100);
  const [error, setError] = useState(null);
  const [micPermission, setMicPermission] = useState('prompt'); // 'prompt' | 'granted' | 'denied'
  const [micVolume, setMicVolume] = useState(() => {
    const saved = localStorage.getItem('r6voip-mic-volume');
    return saved ? parseFloat(saved) : 1.0;
  });

  // Voice Activation Detection mode - when true, audio is gated by VAD
  const [voiceActivation, setVoiceActivation] = useState(() => {
    const saved = localStorage.getItem('r6voip-voice-activation');
    return saved !== 'false'; // Default to true
  });

  const audioContextRef = useRef(null);
  const streamRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const gainNodeRef = useRef(null);
  const noiseGateRef = useRef(null);
  const vadRef = useRef(null);
  const outputNodeRef = useRef(null);
  const processedStreamRef = useRef(null);

  // Refs for voice activation gating (will be synced with state on init)
  const isMutedRef = useRef(false);
  const voiceActivationRef = useRef(voiceActivation);
  const vadSpeakingRef = useRef(false);
  const pttModeRef = useRef(false); // When true, VAD gating is bypassed

  // Sync voiceActivation state with ref when it changes
  useEffect(() => {
    voiceActivationRef.current = voiceActivation;
  }, [voiceActivation]);

  // Audio parameters
  const [threshold, setThreshold] = useState(() => {
    const saved = localStorage.getItem('r6voip-threshold');
    return saved ? parseFloat(saved) : -40;
  });
  const [attackTime, setAttackTime] = useState(0.01);
  const [releaseTime, setReleaseTime] = useState(0.2);

  /**
   * Initialize audio context and worklets
   */
  const initAudio = useCallback(async () => {
    try {
      setError(null);

      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      setMicPermission('granted');
      streamRef.current = stream;

      // Create audio context
      const audioContext = new AudioContext({ sampleRate: 48000 });
      audioContextRef.current = audioContext;

      // Load AudioWorklet modules
      await Promise.all([
        audioContext.audioWorklet.addModule('/audio-worklets/noise-gate-processor.js'),
        audioContext.audioWorklet.addModule('/audio-worklets/vad-processor.js'),
      ]);

      // Create source from microphone
      const sourceNode = audioContext.createMediaStreamSource(stream);
      sourceNodeRef.current = sourceNode;

      // Create Gain node for volume control
      const gainNode = audioContext.createGain();
      gainNode.gain.value = micVolume;
      gainNodeRef.current = gainNode;

      // Create Noise Gate processor (for processed stream output)
      const noiseGate = new AudioWorkletNode(audioContext, 'noise-gate-processor');
      noiseGateRef.current = noiseGate;

      // Create VAD processor
      const vad = new AudioWorkletNode(audioContext, 'vad-processor');
      vadRef.current = vad;

      // Create output destination for processed stream
      const destination = audioContext.createMediaStreamDestination();
      outputNodeRef.current = destination;
      processedStreamRef.current = destination.stream;

      // Connect the audio graph:
      // source -> gain -> vad (for speech detection) -> destination
      // VAD must receive audio BEFORE noise gate to properly detect speech
      // We removed noise gate from the chain because:
      // 1. Raw stream is now used for WebRTC (with browser's built-in noise suppression)
      // 2. Noise gate was blocking audio, preventing speech detection
      sourceNode.connect(gainNode);
      gainNode.connect(vad);
      vad.connect(destination);

      // Noise gate is still created but not connected - can be used in future if needed

      // Listen for VAD messages and gate audio based on voice detection
      vad.port.onmessage = (event) => {
        const { type, data } = event.data;
        if (type === 'vadState') {
          setIsSpeaking(data.isSpeaking);
          setAudioLevel(data.level);
          vadSpeakingRef.current = data.isSpeaking;

          // Gate audio transmission based on VAD when voice activation is enabled
          // Only gate if not manually muted AND not in PTT mode
          if (voiceActivationRef.current && !isMutedRef.current && !pttModeRef.current) {
            // Enable tracks only when speaking
            if (streamRef.current) {
              streamRef.current.getAudioTracks().forEach((track) => {
                track.enabled = data.isSpeaking;
              });
            }
            if (processedStreamRef.current) {
              processedStreamRef.current.getAudioTracks().forEach((track) => {
                track.enabled = data.isSpeaking;
              });
            }
          }
        }
      };

      // Set initial parameters
      noiseGate.port.postMessage({
        type: 'setParams',
        data: { threshold, attackTime, releaseTime },
      });

      vad.port.postMessage({
        type: 'setParams',
        data: { threshold: threshold + 5 }, // VAD slightly more sensitive
      });

      setIsInitialized(true);
      console.log('[Audio] Initialized successfully');

    } catch (err) {
      console.error('[Audio] Initialization error:', err);

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setMicPermission('denied');
        setError('Microphone permission denied. Please allow microphone access.');
      } else if (err.name === 'NotFoundError') {
        setError('No microphone found. Please connect a microphone.');
      } else {
        setError(`Failed to initialize audio: ${err.message}`);
      }
    }
  }, [threshold, attackTime, releaseTime, micVolume]);

  /**
   * Update audio parameters
   */
  const updateParams = useCallback((params) => {
    if (params.threshold !== undefined) {
      setThreshold(params.threshold);
      localStorage.setItem('r6voip-threshold', params.threshold.toString());
    }
    if (params.attackTime !== undefined) setAttackTime(params.attackTime);
    if (params.releaseTime !== undefined) setReleaseTime(params.releaseTime);
    if (params.voiceActivation !== undefined) {
      setVoiceActivation(params.voiceActivation);
      voiceActivationRef.current = params.voiceActivation;
      localStorage.setItem('r6voip-voice-activation', params.voiceActivation.toString());

      // When disabling voice activation, enable tracks if not muted
      if (!params.voiceActivation && !isMutedRef.current) {
        if (streamRef.current) {
          streamRef.current.getAudioTracks().forEach((track) => {
            track.enabled = true;
          });
        }
        if (processedStreamRef.current) {
          processedStreamRef.current.getAudioTracks().forEach((track) => {
            track.enabled = true;
          });
        }
      }
    }

    if (noiseGateRef.current) {
      noiseGateRef.current.port.postMessage({
        type: 'setParams',
        data: params,
      });
    }

    if (vadRef.current && params.threshold !== undefined) {
      vadRef.current.port.postMessage({
        type: 'setParams',
        data: { threshold: params.threshold + 5 },
      });
    }
  }, []);

  /**
   * Update microphone volume
   */
  const updateMicVolume = useCallback((volume) => {
    const clampedVolume = Math.max(0, Math.min(2, volume)); // 0% to 200%
    setMicVolume(clampedVolume);
    localStorage.setItem('r6voip-mic-volume', clampedVolume.toString());

    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = clampedVolume;
    }
  }, []);

  /**
   * Toggle mute state
   */
  const toggleMute = useCallback(() => {
    const newMuted = !isMuted;
    isMutedRef.current = newMuted;

    // When muting, disable tracks; when unmuting, let VAD control if voice activation is on
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach((track) => {
        if (newMuted) {
          track.enabled = false;
        } else if (!voiceActivationRef.current) {
          // Only enable immediately if voice activation is off
          track.enabled = true;
        }
        // If voice activation is on and unmuting, VAD will control the track
      });
    }
    if (processedStreamRef.current) {
      processedStreamRef.current.getAudioTracks().forEach((track) => {
        if (newMuted) {
          track.enabled = false;
        } else if (!voiceActivationRef.current) {
          track.enabled = true;
        }
      });
    }

    setIsMutedState(newMuted);
    if (newMuted) {
      setIsSpeaking(false);
    }
    return newMuted;
  }, [isMuted]);

  /**
   * Set mute state directly (for PTT)
   */
  const setMuted = useCallback((muted) => {
    isMutedRef.current = muted;

    // When muting, disable tracks; when unmuting in PTT mode, enable immediately
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !muted;
      });
    }
    if (processedStreamRef.current) {
      processedStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !muted;
      });
    }

    setIsMutedState(muted);
    if (muted) {
      setIsSpeaking(false);
    }
  }, []);

  /**
   * Set PTT mode - bypasses VAD gating when enabled
   */
  const setPttMode = useCallback((enabled) => {
    pttModeRef.current = enabled;
  }, []);

  /**
   * Get processed audio stream for WebRTC
   */
  const getProcessedStream = useCallback(() => {
    return processedStreamRef.current;
  }, []);

  /**
   * Get raw stream (for cases where processed isn't available)
   */
  const getRawStream = useCallback(() => {
    return streamRef.current;
  }, []);

  /**
   * Cleanup audio resources
   */
  const cleanup = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    setIsInitialized(false);
    setIsSpeaking(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    // State
    isInitialized,
    isMuted,
    isSpeaking,
    audioLevel,
    error,
    micPermission,
    micVolume,
    voiceActivation,
    // Parameters
    threshold,
    attackTime,
    releaseTime,
    // Actions
    initAudio,
    toggleMute,
    setMuted,
    setPttMode,
    updateParams,
    updateMicVolume,
    getProcessedStream,
    getRawStream,
    cleanup,
  };
}
