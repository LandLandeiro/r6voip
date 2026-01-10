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
    <div className="min-h-screen bg-tactical-base relative overflow-hidden">
      {/* Background grid pattern */}
      <div className="fixed inset-0 opacity-5 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255, 140, 0, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 140, 0, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      {/* Corner decorations */}
      <div className="fixed top-0 left-0 w-20 h-20 border-l-2 border-t-2 border-accent-action/30" />
      <div className="fixed top-0 right-0 w-20 h-20 border-r-2 border-t-2 border-accent-action/30" />
      <div className="fixed bottom-0 left-0 w-20 h-20 border-l-2 border-b-2 border-accent-action/30" />
      <div className="fixed bottom-0 right-0 w-20 h-20 border-r-2 border-b-2 border-accent-action/30" />

      {/* Error toast */}
      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
          <div className="bg-status-alert/90 text-white px-6 py-3 rounded-sm border border-status-alert shadow-lg">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="font-medium">{error}</span>
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
