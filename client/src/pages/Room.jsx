import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocketEvent } from '../hooks/useSocket';
import { useAudio } from '../hooks/useAudio';
import { usePeerConnections } from '../hooks/usePeerConnections';
import { useLanguage } from '../context/LanguageContext';
import UserCard from '../components/UserCard';
import AudioControls from '../components/AudioControls';
import RoomHeader from '../components/RoomHeader';

function Room({ socket, roomData, onLeave, onKicked, onError }) {
  const { t } = useLanguage();
  const [isHost, setIsHost] = useState(roomData?.isHost || false);
  const [users, setUsers] = useState(new Map());
  const [isInitializing, setIsInitializing] = useState(true);
  const hasInitialized = useRef(false);
  const pttInitialized = useRef(false);

  // Push-to-Talk state
  const [pushToTalk, setPushToTalk] = useState(() => {
    const saved = localStorage.getItem('r6voip-ptt');
    return saved === 'true';
  });
  const [pttKey, setPttKey] = useState(() => {
    return localStorage.getItem('r6voip-ptt-key') || 'Space';
  });
  const [isPttActive, setIsPttActive] = useState(false);

  // Audio management
  const {
    isInitialized: audioInitialized,
    isMuted,
    isSpeaking,
    audioLevel,
    error: audioError,
    micPermission,
    threshold,
    micVolume,
    initAudio,
    toggleMute,
    updateParams,
    updateMicVolume,
    getProcessedStream,
    getRawStream,
    cleanup: cleanupAudio,
    setMuted,
  } = useAudio();

  // Get the stream to use for WebRTC transmission
  // IMPORTANT: Use raw stream for transmission (with browser's built-in noise suppression)
  // The processed stream goes through noise gate which silences audio when not speaking
  // This was causing users to not hear each other
  const localStream = getRawStream();

  // Peer connections
  const {
    myPeerId,
    peers,
    connectionStatus,
    initPeer,
    callPeer,
    addPeer,
    updatePeer,
    updatePeerVolume,
    removePeer,
    cleanup: cleanupPeers,
  } = usePeerConnections(socket, localStream, roomData?.roomId);

  // Handle Push-to-Talk
  const handlePushToTalkChange = useCallback((enabled) => {
    setPushToTalk(enabled);
    localStorage.setItem('r6voip-ptt', enabled.toString());

    // When enabling PTT, start muted
    if (enabled && setMuted) {
      setMuted(true);
      setIsPttActive(false);
    }
  }, [setMuted]);

  const handlePttKeyChange = useCallback((key) => {
    setPttKey(key);
    localStorage.setItem('r6voip-ptt-key', key);
  }, []);

  // PTT key listeners - fixed to not re-run setMuted on every state change
  useEffect(() => {
    if (!pushToTalk || !audioInitialized) return;

    // Only set initial mute state once when PTT mode is first enabled
    if (!pttInitialized.current) {
      pttInitialized.current = true;
      if (setMuted) setMuted(true);
    }

    const handleKeyDown = (e) => {
      const keyName = e.key === ' ' ? 'Space' : e.key;
      if (keyName === pttKey) {
        e.preventDefault();
        setIsPttActive(true);
        if (setMuted) setMuted(false);
      }
    };

    const handleKeyUp = (e) => {
      const keyName = e.key === ' ' ? 'Space' : e.key;
      if (keyName === pttKey) {
        e.preventDefault();
        setIsPttActive(false);
        if (setMuted) setMuted(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [pushToTalk, pttKey, audioInitialized, setMuted]);

  // Reset PTT initialized flag when PTT is disabled
  useEffect(() => {
    if (!pushToTalk) {
      pttInitialized.current = false;
    }
  }, [pushToTalk]);

  /**
   * Initialize audio and peer connection
   */
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const initialize = async () => {
      try {
        // Initialize audio first
        await initAudio();

        // Then initialize PeerJS
        const peerId = await initPeer();

        // Register our peer ID with the server
        if (socket && peerId) {
          socket.emit('register-peer', { peerId });
        }

        // Add existing users from room data
        if (roomData?.users) {
          roomData.users.forEach((user) => {
            if (user.socketId !== socket?.id) {
              addPeer(user.socketId, {
                peerId: user.peerId,
                name: user.name,
                isMuted: user.isMuted,
                isHost: user.isHost,
              });

              // Call existing peers who already have a peerId
              if (user.peerId) {
                setTimeout(() => callPeer(user.peerId), 1000);
              }
            }
          });
        }

        setIsInitializing(false);
      } catch (err) {
        console.error('[Room] Initialization error:', err);
        onError('Failed to initialize audio/video. Please check your microphone permissions.');
        setIsInitializing(false);
      }
    };

    initialize();
  }, []);

  // Handle audio errors
  useEffect(() => {
    if (audioError) {
      onError(audioError);
    }
  }, [audioError, onError]);

  /**
   * Socket event handlers
   */

  // New user joined
  useSocketEvent(socket, 'user-joined', useCallback((data) => {
    console.log('[Room] User joined:', data);
    addPeer(data.socketId, {
      peerId: data.peerId,
      name: data.name,
      isMuted: data.isMuted,
      isHost: data.isHost,
    });
  }, [addPeer]));

  // User left
  useSocketEvent(socket, 'user-left', useCallback((data) => {
    console.log('[Room] User left:', data);
    removePeer(data.socketId);

    // Check if we became the host
    if (data.newHostId === socket?.id) {
      setIsHost(true);
    }
  }, [removePeer, socket]));

  // User was kicked
  useSocketEvent(socket, 'user-kicked', useCallback((data) => {
    console.log('[Room] User kicked:', data);
    removePeer(data.socketId);
  }, [removePeer]));

  // We were kicked
  useSocketEvent(socket, 'you-were-kicked', useCallback(() => {
    console.log('[Room] We were kicked');
    cleanupAudio();
    cleanupPeers();
    onKicked();
  }, [cleanupAudio, cleanupPeers, onKicked]));

  // User mute changed
  useSocketEvent(socket, 'user-mute-changed', useCallback((data) => {
    if (data.socketId !== socket?.id) {
      updatePeer(data.socketId, { isMuted: data.isMuted });
    }
  }, [socket, updatePeer]));

  // User speaking state changed
  useSocketEvent(socket, 'user-speaking-changed', useCallback((data) => {
    if (data.socketId !== socket?.id) {
      updatePeer(data.socketId, { isSpeaking: data.isSpeaking });
    }
  }, [socket, updatePeer]));

  // Room expired
  useSocketEvent(socket, 'room-expired', useCallback(() => {
    onError('Room has expired (24h limit reached)');
    cleanupAudio();
    cleanupPeers();
    onLeave();
  }, [cleanupAudio, cleanupPeers, onLeave, onError]));

  // Broadcast speaking state to other users
  const lastSpeakingState = useRef(false);
  useEffect(() => {
    const currentSpeaking = pushToTalk ? isPttActive : (!isMuted && isSpeaking);

    // Only emit when state changes to avoid flooding
    if (currentSpeaking !== lastSpeakingState.current) {
      lastSpeakingState.current = currentSpeaking;
      if (socket) {
        socket.emit('speaking-state', { isSpeaking: currentSpeaking });
      }
    }
  }, [socket, isSpeaking, isMuted, pushToTalk, isPttActive]);

  /**
   * Handle mute toggle
   */
  const handleToggleMute = useCallback(() => {
    const newMuted = toggleMute();
    if (socket) {
      socket.emit('toggle-mute', { isMuted: newMuted });
    }
  }, [socket, toggleMute]);

  /**
   * Handle kick user
   */
  const handleKickUser = useCallback((targetSocketId) => {
    if (!isHost) return;

    socket.emit('kick-user', { targetSocketId }, (response) => {
      if (response?.error) {
        onError(response.error);
      }
    });
  }, [socket, isHost, onError]);

  /**
   * Handle leave room
   */
  const handleLeave = useCallback(() => {
    cleanupAudio();
    cleanupPeers();
    onLeave();
  }, [cleanupAudio, cleanupPeers, onLeave]);

  // Build user list for display
  const userList = [];

  // Add self first
  userList.push({
    socketId: socket?.id,
    name: roomData?.myName || 'You',
    isMuted: pushToTalk ? !isPttActive : isMuted,
    isSpeaking: pushToTalk ? isPttActive : (!isMuted && isSpeaking),
    isHost,
    isLocal: true,
    connected: audioInitialized,
    volume: micVolume,
  });

  // Add remote peers
  peers.forEach((peerData, socketId) => {
    userList.push({
      socketId,
      name: peerData.name,
      isMuted: peerData.isMuted,
      isSpeaking: peerData.isSpeaking || false,
      isHost: peerData.isHost,
      isLocal: false,
      connected: peerData.connected,
      volume: peerData.volume !== undefined ? peerData.volume : 1.0,
    });
  });

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header with room code */}
      <RoomHeader
        roomId={roomData?.roomId}
        userCount={userList.length}
        maxUsers={5}
      />

      {/* Main content */}
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          {/* Initialization overlay */}
          {isInitializing && (
            <div className="fixed inset-0 bg-tactical-base/90 z-50 flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 border-4 border-accent-action border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-text-primary font-display text-lg tracking-wider">
                  {t('establishingChannel')}
                </p>
                {micPermission === 'prompt' && (
                  <p className="text-text-secondary text-sm">
                    {t('allowMicrophone')}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Microphone permission denied */}
          {micPermission === 'denied' && (
            <div className="mb-6 p-4 bg-status-alert/20 border border-status-alert text-center">
              <p className="text-status-alert font-medium">
                {t('microphoneDenied')}
              </p>
            </div>
          )}

          {/* User cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {userList.map((user) => (
              <UserCard
                key={user.socketId}
                user={user}
                isLocalHost={isHost}
                onKick={handleKickUser}
                onVolumeChange={user.isLocal ? updateMicVolume : (vol) => updatePeerVolume(user.socketId, vol)}
              />
            ))}

            {/* Empty slots */}
            {Array.from({ length: 5 - userList.length }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="card-tactical p-4 opacity-30 border-dashed"
              >
                <div className="aspect-square flex items-center justify-center">
                  <div className="text-center text-text-muted">
                    <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    <span className="text-xs uppercase tracking-wider">{t('awaitingOperator')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Bottom controls */}
      <footer className="sticky bottom-0 bg-tactical-base/95 backdrop-blur border-t border-tactical-border p-4">
        <div className="max-w-5xl mx-auto">
          <AudioControls
            isMuted={pushToTalk ? !isPttActive : isMuted}
            isSpeaking={isSpeaking}
            audioLevel={audioLevel}
            threshold={threshold}
            micVolume={micVolume}
            onMicVolumeChange={updateMicVolume}
            onToggleMute={handleToggleMute}
            onThresholdChange={(value) => updateParams({ threshold: value })}
            onLeave={handleLeave}
            connectionStatus={connectionStatus}
            pushToTalk={pushToTalk}
            onPushToTalkChange={handlePushToTalkChange}
            pttKey={pttKey}
            onPttKeyChange={handlePttKeyChange}
            isPttActive={isPttActive}
          />
        </div>
      </footer>
    </div>
  );
}

export default Room;
