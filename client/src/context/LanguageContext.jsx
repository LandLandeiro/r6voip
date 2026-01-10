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
    // Room
    tacticalChannel: 'Tactical Channel',
    room: 'Room',
    awaitingOperator: 'Awaiting Operator',
    establishingChannel: 'ESTABLISHING SECURE CHANNEL...',
    allowMicrophone: 'Please allow microphone access when prompted',
    microphoneDenied: 'Microphone access denied. Please enable microphone permissions in your browser settings.',
  },
  pt: {
    operatorCallsign: 'Nome de Operador',
    enterCallsign: 'Digite seu nome...',
    characters: 'caracteres',
    startOperation: 'INICIAR OPERACAO',
    deploying: 'INICIANDO...',
    joinFrequency: 'ENTRAR NA FREQUENCIA',
    connecting: 'CONECTANDO...',
    roomCode: 'Codigo da Sala',
    roomCodePlaceholder: 'ABC1',
    or: 'OU',
    p2pConnection: 'Conexao P2P:',
    p2pNotice: 'O audio flui diretamente entre os usuarios. Seu endereco IP pode ser visivel para outros participantes. Nenhuma conta necessaria. Salas expiram apos 24 horas.',
    connectedToServer: 'Conectado ao servidor',
    connectingToServer: 'Conectando...',
    enterOperatorName: 'Por favor, digite seu nome de operador',
    enterValidCode: 'Por favor, digite um codigo de sala valido (4 caracteres)',
    tacticalComms: 'COMUNICACOES TATICAS DE VOZ',
    language: 'Idioma',
    // Audio settings
    audioSettings: 'Configuracoes de Audio',
    voiceDetection: 'Sensibilidade da Deteccao de Voz',
    moreSensitive: 'Mais Sensivel',
    lessSensitive: 'Menos Sensivel',
    adjustThreshold: 'Ajuste o limite para controlar quando sua voz e detectada. Valores mais baixos significam mais sensibilidade (pode captar ruido de fundo).',
    pushToTalk: 'Apertar para Falar',
    pttEnabled: 'Apertar para falar ativado',
    pttDisabled: 'Ativacao por voz ativada',
    pttKey: 'Tecla PTT',
    pressKey: 'Pressione uma tecla...',
    holdToTalk: 'Segure esta tecla para falar',
    level: 'Nivel',
    p2pActive: 'P2P Ativo',
    connectionError: 'Erro de Conexao',
    leave: 'SAIR',
    // Room
    tacticalChannel: 'Canal Tatico',
    room: 'Sala',
    awaitingOperator: 'Aguardando Operador',
    establishingChannel: 'ESTABELECENDO CANAL SEGURO...',
    allowMicrophone: 'Por favor, permita o acesso ao microfone quando solicitado',
    microphoneDenied: 'Acesso ao microfone negado. Por favor, habilite as permissoes do microfone nas configuracoes do navegador.',
  },
  es: {
    operatorCallsign: 'Nombre de Operador',
    enterCallsign: 'Ingresa tu nombre...',
    characters: 'caracteres',
    startOperation: 'INICIAR OPERACION',
    deploying: 'INICIANDO...',
    joinFrequency: 'UNIRSE A FRECUENCIA',
    connecting: 'CONECTANDO...',
    roomCode: 'Codigo de Sala',
    roomCodePlaceholder: 'ABC1',
    or: 'O',
    p2pConnection: 'Conexion P2P:',
    p2pNotice: 'El audio fluye directamente entre usuarios. Tu direccion IP puede ser visible para otros participantes. No se requiere cuenta. Las salas expiran despues de 24 horas.',
    connectedToServer: 'Conectado al servidor',
    connectingToServer: 'Conectando...',
    enterOperatorName: 'Por favor, ingresa tu nombre de operador',
    enterValidCode: 'Por favor, ingresa un codigo de sala valido (4 caracteres)',
    tacticalComms: 'COMUNICACIONES TACTICAS DE VOZ',
    language: 'Idioma',
    // Audio settings
    audioSettings: 'Configuracion de Audio',
    voiceDetection: 'Sensibilidad de Deteccion de Voz',
    moreSensitive: 'Mas Sensible',
    lessSensitive: 'Menos Sensible',
    adjustThreshold: 'Ajusta el umbral para controlar cuando se detecta tu voz. Valores mas bajos significan mas sensibilidad (puede captar ruido de fondo).',
    pushToTalk: 'Pulsar para Hablar',
    pttEnabled: 'Pulsar para hablar activado',
    pttDisabled: 'Activacion por voz activada',
    pttKey: 'Tecla PTT',
    pressKey: 'Presiona una tecla...',
    holdToTalk: 'Manten esta tecla para hablar',
    level: 'Nivel',
    p2pActive: 'P2P Activo',
    connectionError: 'Error de Conexion',
    leave: 'SALIR',
    // Room
    tacticalChannel: 'Canal Tactico',
    room: 'Sala',
    awaitingOperator: 'Esperando Operador',
    establishingChannel: 'ESTABLECIENDO CANAL SEGURO...',
    allowMicrophone: 'Por favor, permite el acceso al microfono cuando se solicite',
    microphoneDenied: 'Acceso al microfono denegado. Por favor, habilita los permisos del microfono en la configuracion del navegador.',
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
  { code: 'pt', name: 'Portugues' },
  { code: 'es', name: 'Espanol' },
];
