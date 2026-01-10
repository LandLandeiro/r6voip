import { useState, useEffect, useRef, useCallback } from 'react';
import Peer from 'peerjs';

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
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

      // Handle incoming calls
      peer.on('call', (call) => {
        console.log('[Peer] Incoming call from:', call.peer);

        // Answer with our local stream
        if (localStream) {
          call.answer(localStream);
          handleCall(call);
        } else {
          console.warn('[Peer] No local stream to answer with');
          call.close();
        }
      });
    });
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
   * Call a specific peer
   */
  const callPeer = useCallback((peerId) => {
    if (!peerRef.current || !localStream) {
      console.warn('[Peer] Cannot call - peer or stream not ready');
      return;
    }

    if (pendingCallsRef.current.has(peerId) || callsRef.current.has(peerId)) {
      console.log('[Peer] Already calling/connected to:', peerId);
      return;
    }

    console.log('[Peer] Calling peer:', peerId);
    pendingCallsRef.current.add(peerId);

    const call = peerRef.current.call(peerId, localStream);
    if (call) {
      handleCall(call);
    }
  }, [localStream, handleCall]);

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

      // Call the new peer
      if (peerId && localStream) {
        setTimeout(() => callPeer(peerId), 500);
      }
    };

    socket.on('peer-registered', handlePeerRegistered);

    return () => {
      socket.off('peer-registered', handlePeerRegistered);
    };
  }, [socket, localStream, callPeer]);

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
