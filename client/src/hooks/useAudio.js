import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for managing local audio with noise gate and VAD processing
 */
export function useAudio() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioLevel, setAudioLevel] = useState(-100);
  const [error, setError] = useState(null);
  const [micPermission, setMicPermission] = useState('prompt'); // 'prompt' | 'granted' | 'denied'
  const [micVolume, setMicVolume] = useState(() => {
    const saved = localStorage.getItem('r6voip-mic-volume');
    return saved ? parseFloat(saved) : 1.0;
  });

  const audioContextRef = useRef(null);
  const streamRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const gainNodeRef = useRef(null);
  const noiseGateRef = useRef(null);
  const vadRef = useRef(null);
  const outputNodeRef = useRef(null);
  const processedStreamRef = useRef(null);

  // Audio parameters
  const [threshold, setThreshold] = useState(-40);
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

      // Create Noise Gate processor
      const noiseGate = new AudioWorkletNode(audioContext, 'noise-gate-processor');
      noiseGateRef.current = noiseGate;

      // Create VAD processor
      const vad = new AudioWorkletNode(audioContext, 'vad-processor');
      vadRef.current = vad;

      // Create output destination for processed stream
      const destination = audioContext.createMediaStreamDestination();
      outputNodeRef.current = destination;
      processedStreamRef.current = destination.stream;

      // Connect the audio graph: source -> gain -> noiseGate -> vad -> destination
      sourceNode.connect(gainNode);
      gainNode.connect(noiseGate);
      noiseGate.connect(vad);
      vad.connect(destination);

      // Listen for VAD messages
      vad.port.onmessage = (event) => {
        const { type, data } = event.data;
        if (type === 'vadState') {
          setIsSpeaking(data.isSpeaking);
          setAudioLevel(data.level);
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
    if (params.threshold !== undefined) setThreshold(params.threshold);
    if (params.attackTime !== undefined) setAttackTime(params.attackTime);
    if (params.releaseTime !== undefined) setReleaseTime(params.releaseTime);

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
    if (processedStreamRef.current) {
      const newMuted = !isMuted;
      processedStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !newMuted;
      });
      setIsMuted(newMuted);
      if (newMuted) {
        setIsSpeaking(false);
      }
      return newMuted;
    }
    return isMuted;
  }, [isMuted]);

  /**
   * Set mute state directly (for PTT)
   */
  const setMuted = useCallback((muted) => {
    if (processedStreamRef.current) {
      processedStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !muted;
      });
      setIsMuted(muted);
      if (muted) {
        setIsSpeaking(false);
      }
    }
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
    // Parameters
    threshold,
    attackTime,
    releaseTime,
    // Actions
    initAudio,
    toggleMute,
    setMuted,
    updateParams,
    updateMicVolume,
    getProcessedStream,
    getRawStream,
    cleanup,
  };
}
