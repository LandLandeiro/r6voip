import { useState, useEffect, useRef, useCallback } from 'react';
import Peer from 'peerjs';

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
];

/**
 * Custom hook for managing WebRTC mesh connections with PeerJS
 */
export function usePeerConnections(socket, localStream, roomId) {
  const [myPeerId, setMyPeerId] = useState(null);
  const [peers, setPeers] = useState(new Map()); // Map<socketId, {peerId, call, stream, name}>
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  const peerRef = useRef(null);
  const callsRef = useRef(new Map()); // Map<peerId, MediaConnection>
  const pendingCallsRef = useRef(new Set()); // Set of peerIds we're trying to call

  // IMPORTANT: Use a ref to always have access to the latest localStream
  // This fixes the issue where the stream was null when incoming calls arrived
  const localStreamRef = useRef(null);

  // Keep the ref updated whenever localStream changes
  useEffect(() => {
    localStreamRef.current = localStream;
    console.log('[Peer] LocalStream updated:', localStream ? 'available' : 'null');
  }, [localStream]);

  /**
   * Handle a media call (incoming or outgoing)
   */
  const handleCall = useCallback((call) => {
    const remotePeerId = call.peer;
    callsRef.current.set(remotePeerId, call);

    call.on('stream', (remoteStream) => {
      console.log('[Peer] Received stream from:', remotePeerId);

      // Create audio element for remote stream
      const audio = new Audio();
      audio.srcObject = remoteStream;
      audio.autoplay = true;
      audio.playsInline = true;

      // Handle autoplay restrictions - try to play and handle errors
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.warn('[Peer] Autoplay blocked, will retry on user interaction:', error);
          // Add a one-time click handler to start playback
          const startPlayback = () => {
            audio.play().catch(e => console.error('[Peer] Play failed:', e));
            document.removeEventListener('click', startPlayback);
            document.removeEventListener('keydown', startPlayback);
          };
          document.addEventListener('click', startPlayback, { once: true });
          document.addEventListener('keydown', startPlayback, { once: true });
        });
      }

      // Store the stream with socket mapping
      setPeers((prev) => {
        const updated = new Map(prev);
        // Find the socket ID for this peer
        for (const [socketId, peerData] of updated) {
          if (peerData.peerId === remotePeerId) {
            updated.set(socketId, {
              ...peerData,
              stream: remoteStream,
              audio,
              connected: true,
            });
            break;
          }
        }
        return updated;
      });
    });

    call.on('close', () => {
      console.log('[Peer] Call closed:', remotePeerId);
      callsRef.current.delete(remotePeerId);
      pendingCallsRef.current.delete(remotePeerId);

      setPeers((prev) => {
        const updated = new Map(prev);
        for (const [socketId, peerData] of updated) {
          if (peerData.peerId === remotePeerId) {
            if (peerData.audio) {
              peerData.audio.pause();
              peerData.audio.srcObject = null;
            }
            updated.set(socketId, {
              ...peerData,
              stream: null,
              audio: null,
              connected: false,
            });
            break;
          }
        }
        return updated;
      });
    });

    call.on('error', (err) => {
      console.error('[Peer] Call error:', remotePeerId, err);
    });
  }, []);

  /**
   * Initialize PeerJS instance
   */
  const initPeer = useCallback(() => {
    return new Promise((resolve, reject) => {
      const peer = new Peer({
        config: {
          iceServers: ICE_SERVERS,
        },
        debug: 1, // Minimal logging
      });

      peer.on('open', (id) => {
        console.log('[Peer] Connected with ID:', id);
        setMyPeerId(id);
        setConnectionStatus('connected');
        peerRef.current = peer;
        resolve(id);
      });

      peer.on('error', (err) => {
        console.error('[Peer] Error:', err);
        setConnectionStatus('error');

        if (err.type === 'unavailable-id') {
          // Try reconnecting with a new ID
          setTimeout(() => initPeer(), 1000);
        } else {
          reject(err);
        }
      });

      peer.on('disconnected', () => {
        console.log('[Peer] Disconnected');
        setConnectionStatus('disconnected');

        // Try to reconnect
        if (!peer.destroyed) {
          setTimeout(() => {
            peer.reconnect();
          }, 1000);
        }
      });

      // Handle incoming calls - USE REF to get latest stream!
      peer.on('call', (call) => {
        console.log('[Peer] Incoming call from:', call.peer);

        // Use the ref to get the current stream value
        const currentStream = localStreamRef.current;

        if (currentStream) {
          console.log('[Peer] Answering with local stream');
          call.answer(currentStream);
          handleCall(call);
        } else {
          console.warn('[Peer] No local stream yet, waiting...');
          // Wait for stream to become available, then answer
          const checkStream = setInterval(() => {
            const stream = localStreamRef.current;
            if (stream) {
              clearInterval(checkStream);
              console.log('[Peer] Stream now available, answering call');
              call.answer(stream);
              handleCall(call);
            }
          }, 100);

          // Timeout after 10 seconds
          setTimeout(() => {
            clearInterval(checkStream);
            if (!localStreamRef.current) {
              console.error('[Peer] Timeout waiting for local stream');
              call.close();
            }
          }, 10000);
        }
      });
    });
  }, [handleCall]);

  /**
   * Call a specific peer
   */
  const callPeer = useCallback((peerId) => {
    const currentStream = localStreamRef.current;

    if (!peerRef.current || !currentStream) {
      console.warn('[Peer] Cannot call - peer or stream not ready');
      return;
    }

    if (pendingCallsRef.current.has(peerId) || callsRef.current.has(peerId)) {
      console.log('[Peer] Already calling/connected to:', peerId);
      return;
    }

    console.log('[Peer] Calling peer:', peerId);
    pendingCallsRef.current.add(peerId);

    const call = peerRef.current.call(peerId, currentStream);
    if (call) {
      handleCall(call);
    }
  }, [handleCall]);

  /**
   * Disconnect from a specific peer
   */
  const disconnectPeer = useCallback((peerId) => {
    const call = callsRef.current.get(peerId);
    if (call) {
      call.close();
      callsRef.current.delete(peerId);
    }
    pendingCallsRef.current.delete(peerId);
  }, []);

  /**
   * Close all connections and cleanup
   */
  const cleanup = useCallback(() => {
    // Close all calls
    callsRef.current.forEach((call) => call.close());
    callsRef.current.clear();
    pendingCallsRef.current.clear();

    // Cleanup audio elements
    peers.forEach((peerData) => {
      if (peerData.audio) {
        peerData.audio.pause();
        peerData.audio.srcObject = null;
      }
    });

    // Destroy peer
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }

    setPeers(new Map());
    setMyPeerId(null);
    setConnectionStatus('disconnected');
  }, [peers]);

  /**
   * Add a peer to track (before we have their peerId)
   */
  const addPeer = useCallback((socketId, userData) => {
    setPeers((prev) => {
      const updated = new Map(prev);
      updated.set(socketId, {
        peerId: userData.peerId || null,
        name: userData.name,
        isMuted: userData.isMuted || false,
        isHost: userData.isHost || false,
        stream: null,
        audio: null,
        connected: false,
      });
      return updated;
    });
  }, []);

  /**
   * Update peer data
   */
  const updatePeer = useCallback((socketId, updates) => {
    setPeers((prev) => {
      const updated = new Map(prev);
      const existing = updated.get(socketId);
      if (existing) {
        updated.set(socketId, { ...existing, ...updates });
      }
      return updated;
    });
  }, []);

  /**
   * Remove a peer
   */
  const removePeer = useCallback((socketId) => {
    setPeers((prev) => {
      const updated = new Map(prev);
      const peerData = updated.get(socketId);

      if (peerData) {
        // Close call if exists
        if (peerData.peerId) {
          disconnectPeer(peerData.peerId);
        }

        // Cleanup audio
        if (peerData.audio) {
          peerData.audio.pause();
          peerData.audio.srcObject = null;
        }

        updated.delete(socketId);
      }

      return updated;
    });
  }, [disconnectPeer]);

  // Listen for socket events
  useEffect(() => {
    if (!socket) return;

    // When another peer registers their PeerJS ID
    const handlePeerRegistered = ({ socketId, peerId }) => {
      console.log('[Socket] Peer registered:', socketId, peerId);

      setPeers((prev) => {
        const updated = new Map(prev);
        const existing = updated.get(socketId);
        if (existing) {
          updated.set(socketId, { ...existing, peerId });
        }
        return updated;
      });

      // Call the new peer - use ref to check stream
      if (peerId && localStreamRef.current) {
        setTimeout(() => callPeer(peerId), 500);
      }
    };

    socket.on('peer-registered', handlePeerRegistered);

    return () => {
      socket.off('peer-registered', handlePeerRegistered);
    };
  }, [socket, callPeer]);

  return {
    myPeerId,
    peers,
    connectionStatus,
    initPeer,
    callPeer,
    disconnectPeer,
    addPeer,
    updatePeer,
    removePeer,
    cleanup,
  };
}
