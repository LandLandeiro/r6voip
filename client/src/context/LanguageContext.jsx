import { createContext, useContext, useState, useCallback } from 'react';

const translations = {
  en: {
    operatorCallsign: 'Operator Callsign',
    enterCallsign: 'Enter your callsign...',
    characters: 'characters',
    startOperation: 'START OPERATION',
    deploying: 'DEPLOYING...',
    joinFrequency: 'JOIN FREQUENCY',
    connecting: 'CONNECTING...',
    roomCode: 'Room Code',
    roomCodePlaceholder: 'ABC1',
    or: 'OR',
    p2pConnection: 'P2P Connection:',
    p2pNotice: 'Audio flows directly between users. Your IP address may be visible to other participants. No accounts required. Rooms expire after 24 hours.',
    connectedToServer: 'Connected to server',
    connectingToServer: 'Connecting...',
    enterOperatorName: 'Please enter your operator name',
    enterValidCode: 'Please enter a valid room code (4 characters)',
    tacticalComms: 'TACTICAL VOICE COMMUNICATIONS',
    language: 'Language',
    // Audio settings
    audioSettings: 'Audio Settings',
    voiceDetection: 'Voice Detection Sensitivity',
    moreSensitive: 'More Sensitive',
    lessSensitive: 'Less Sensitive',
    adjustThreshold: 'Adjust the threshold to control when your voice is detected. Lower values mean more sensitivity (may pick up background noise).',
    pushToTalk: 'Push to Talk',
    pttEnabled: 'Push to Talk enabled',
    pttDisabled: 'Voice activation enabled',
    pttKey: 'PTT Key',
    pressKey: 'Press a key...',
    holdToTalk: 'Hold this key to talk',
    level: 'Level',
    p2pActive: 'P2P Active',
    connectionError: 'Connection Error',
    leave: 'LEAVE',
    micVolume: 'Microphone Volume',
    playerVolume: 'Player Volume',
    // Room
    tacticalChannel: 'Tactical Channel',
    room: 'Room',
    awaitingOperator: 'Awaiting Operator',
    establishingChannel: 'ESTABLISHING SECURE CHANNEL...',
    allowMicrophone: 'Please allow microphone access when prompted',
    microphoneDenied: 'Microphone access denied. Please enable microphone permissions in your browser settings.',
    muted: 'Muted',
    speaking: 'Speaking',
    standby: 'Standby',
    kick: 'Kick',
    confirmKick: 'Confirm Kick?',
    you: 'YOU',
    host: 'HOST',
  },
  pt: {
    operatorCallsign: 'Nome de Operador',
    enterCallsign: 'Digite seu nome...',
    characters: 'caracteres',
    startOperation: 'INICIAR OPERAÇÃO',
    deploying: 'INICIANDO...',
    joinFrequency: 'ENTRAR NA FREQUÊNCIA',
    connecting: 'CONECTANDO...',
    roomCode: 'Código da Sala',
    roomCodePlaceholder: 'ABC1',
    or: 'OU',
    p2pConnection: 'Conexão P2P:',
    p2pNotice: 'O áudio flui diretamente entre os usuários. Seu endereço IP pode ser visível para outros participantes. Nenhuma conta necessária. Salas expiram após 24 horas.',
    connectedToServer: 'Conectado ao servidor',
    connectingToServer: 'Conectando...',
    enterOperatorName: 'Por favor, digite seu nome de operador',
    enterValidCode: 'Por favor, digite um código de sala válido (4 caracteres)',
    tacticalComms: 'COMUNICAÇÕES TÁTICAS DE VOZ',
    language: 'Idioma',
    // Audio settings
    audioSettings: 'Configurações de Áudio',
    voiceDetection: 'Sensibilidade da Detecção de Voz',
    moreSensitive: 'Mais Sensível',
    lessSensitive: 'Menos Sensível',
    adjustThreshold: 'Ajuste o limite para controlar quando sua voz é detectada. Valores mais baixos significam mais sensibilidade (pode captar ruído de fundo).',
    pushToTalk: 'Apertar para Falar',
    pttEnabled: 'Apertar para falar ativado',
    pttDisabled: 'Ativação por voz ativada',
    pttKey: 'Tecla PTT',
    pressKey: 'Pressione uma tecla...',
    holdToTalk: 'Segure esta tecla para falar',
    level: 'Nível',
    p2pActive: 'P2P Ativo',
    connectionError: 'Erro de Conexão',
    leave: 'SAIR',
    micVolume: 'Volume do Microfone',
    playerVolume: 'Volume do Jogador',
    // Room
    tacticalChannel: 'Canal Tático',
    room: 'Sala',
    awaitingOperator: 'Aguardando Operador',
    establishingChannel: 'ESTABELECENDO CANAL SEGURO...',
    allowMicrophone: 'Por favor, permita o acesso ao microfone quando solicitado',
    microphoneDenied: 'Acesso ao microfone negado. Por favor, habilite as permissões do microfone nas configurações do navegador.',
    muted: 'Mutado',
    speaking: 'Falando',
    standby: 'Aguardando',
    kick: 'Expulsar',
    confirmKick: 'Confirmar?',
    you: 'VOCÊ',
    host: 'ANFITRIÃO',
  },
  es: {
    operatorCallsign: 'Nombre de Operador',
    enterCallsign: 'Ingresa tu nombre...',
    characters: 'caracteres',
    startOperation: 'INICIAR OPERACIÓN',
    deploying: 'INICIANDO...',
    joinFrequency: 'UNIRSE A FRECUENCIA',
    connecting: 'CONECTANDO...',
    roomCode: 'Código de Sala',
    roomCodePlaceholder: 'ABC1',
    or: 'O',
    p2pConnection: 'Conexión P2P:',
    p2pNotice: 'El audio fluye directamente entre usuarios. Tu dirección IP puede ser visible para otros participantes. No se requiere cuenta. Las salas expiran después de 24 horas.',
    connectedToServer: 'Conectado al servidor',
    connectingToServer: 'Conectando...',
    enterOperatorName: 'Por favor, ingresa tu nombre de operador',
    enterValidCode: 'Por favor, ingresa un código de sala válido (4 caracteres)',
    tacticalComms: 'COMUNICACIONES TÁCTICAS DE VOZ',
    language: 'Idioma',
    // Audio settings
    audioSettings: 'Configuración de Audio',
    voiceDetection: 'Sensibilidad de Detección de Voz',
    moreSensitive: 'Más Sensible',
    lessSensitive: 'Menos Sensible',
    adjustThreshold: 'Ajusta el umbral para controlar cuándo se detecta tu voz. Valores más bajos significan más sensibilidad (puede captar ruido de fondo).',
    pushToTalk: 'Pulsar para Hablar',
    pttEnabled: 'Pulsar para hablar activado',
    pttDisabled: 'Activación por voz activada',
    pttKey: 'Tecla PTT',
    pressKey: 'Presiona una tecla...',
    holdToTalk: 'Mantén esta tecla para hablar',
    level: 'Nivel',
    p2pActive: 'P2P Activo',
    connectionError: 'Error de Conexión',
    leave: 'SALIR',
    micVolume: 'Volumen del Micrófono',
    playerVolume: 'Volumen del Jugador',
    // Room
    tacticalChannel: 'Canal Táctico',
    room: 'Sala',
    awaitingOperator: 'Esperando Operador',
    establishingChannel: 'ESTABLECIENDO CANAL SEGURO...',
    allowMicrophone: 'Por favor, permite el acceso al micrófono cuando se solicite',
    microphoneDenied: 'Acceso al micrófono denegado. Por favor, habilita los permisos del micrófono en la configuración del navegador.',
    muted: 'Silenciado',
    speaking: 'Hablando',
    standby: 'En Espera',
    kick: 'Expulsar',
    confirmKick: '¿Confirmar?',
    you: 'TÚ',
    host: 'ANFITRIÓN',
  },
};

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('r6voip-language');
    return saved || 'en';
  });

  const changeLanguage = useCallback((lang) => {
    setLanguage(lang);
    localStorage.setItem('r6voip-language', lang);
  }, []);

  const t = useCallback((key) => {
    return translations[language]?.[key] || translations.en[key] || key;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export const availableLanguages = [
  { code: 'en', name: 'English' },
  { code: 'pt', name: 'Português' },
  { code: 'es', name: 'Español' },
];
