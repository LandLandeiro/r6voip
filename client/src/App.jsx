import { useState, useCallback } from 'react';
import Lobby from './pages/Lobby';
import Room from './pages/Room';
import { useSocket } from './hooks/useSocket';
import { LanguageProvider } from './context/LanguageContext';

function AppContent() {
  const [currentView, setCurrentView] = useState('lobby'); // 'lobby' | 'room'
  const [roomData, setRoomData] = useState(null);
  const [error, setError] = useState(null);

  const socket = useSocket();

  const handleJoinRoom = useCallback((data) => {
    setRoomData(data);
    setCurrentView('room');
    setError(null);
  }, []);

  const handleLeaveRoom = useCallback(() => {
    if (socket) {
      socket.emit('leave-room');
    }
    setRoomData(null);
    setCurrentView('lobby');
  }, [socket]);

  const handleError = useCallback((errorMessage) => {
    setError(errorMessage);
    // Clear error after 5 seconds
    setTimeout(() => setError(null), 5000);
  }, []);

  const handleKicked = useCallback(() => {
    setRoomData(null);
    setCurrentView('lobby');
    setError('You have been removed from the room by the host.');
  }, []);

  return (
    <div className="min-h-screen bg-mercury-deep relative overflow-hidden">
      {/* Ambient metallic glow - top left */}
      <div
        className="fixed top-0 left-0 w-[600px] h-[600px] pointer-events-none opacity-30"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(212, 212, 216, 0.15) 0%, transparent 70%)',
        }}
      />

      {/* Ambient metallic glow - bottom right */}
      <div
        className="fixed bottom-0 right-0 w-[800px] h-[800px] pointer-events-none opacity-20"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(161, 161, 170, 0.1) 0%, transparent 70%)',
        }}
      />

      {/* Subtle noise texture overlay */}
      <div
        className="fixed inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Chrome corner accents */}
      <div className="fixed top-0 left-0 w-24 h-24 pointer-events-none">
        <div className="absolute top-4 left-4 w-12 h-px bg-gradient-to-r from-mercury-400 to-transparent" />
        <div className="absolute top-4 left-4 w-px h-12 bg-gradient-to-b from-mercury-400 to-transparent" />
      </div>
      <div className="fixed top-0 right-0 w-24 h-24 pointer-events-none">
        <div className="absolute top-4 right-4 w-12 h-px bg-gradient-to-l from-mercury-400 to-transparent" />
        <div className="absolute top-4 right-4 w-px h-12 bg-gradient-to-b from-mercury-400 to-transparent" />
      </div>
      <div className="fixed bottom-0 left-0 w-24 h-24 pointer-events-none">
        <div className="absolute bottom-4 left-4 w-12 h-px bg-gradient-to-r from-mercury-400 to-transparent" />
        <div className="absolute bottom-4 left-4 w-px h-12 bg-gradient-to-t from-mercury-400 to-transparent" />
      </div>
      <div className="fixed bottom-0 right-0 w-24 h-24 pointer-events-none">
        <div className="absolute bottom-4 right-4 w-12 h-px bg-gradient-to-l from-mercury-400 to-transparent" />
        <div className="absolute bottom-4 right-4 w-px h-12 bg-gradient-to-t from-mercury-400 to-transparent" />
      </div>

      {/* Error toast - Glass style */}
      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
          <div className="relative px-6 py-4 rounded-2xl border border-status-alert/50 backdrop-blur-xl overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 51, 102, 0.2) 0%, rgba(255, 51, 102, 0.1) 100%)',
              boxShadow: '0 8px 32px rgba(255, 51, 102, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            }}
          >
            {/* Glow effect */}
            <div className="absolute inset-0 opacity-50 pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse at center, rgba(255, 51, 102, 0.2) 0%, transparent 70%)',
              }}
            />
            <div className="relative flex items-center gap-3">
              <svg className="w-5 h-5 text-status-alert" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="font-body font-medium text-mercury-100">{error}</span>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="relative z-10">
        {currentView === 'lobby' ? (
          <Lobby
            socket={socket}
            onJoinRoom={handleJoinRoom}
            onError={handleError}
          />
        ) : (
          <Room
            socket={socket}
            roomData={roomData}
            onLeave={handleLeaveRoom}
            onKicked={handleKicked}
            onError={handleError}
          />
        )}
      </main>
    </div>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

export default App;
