// NATO phonetic alphabet + R6S operator names for room prefixes
const PREFIXES = [
  // NATO Phonetic
  'Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel',
  'India', 'Juliet', 'Kilo', 'Lima', 'Mike', 'November', 'Oscar', 'Papa',
  'Quebec', 'Romeo', 'Sierra', 'Tango', 'Uniform', 'Victor', 'Whiskey',
  'Xray', 'Yankee', 'Zulu',
  // R6S Operators - Attackers
  'Ash', 'Blitz', 'Buck', 'Capitao', 'Dokkaebi', 'Finka', 'Fuze', 'Glaz',
  'Gridlock', 'Hibana', 'IQ', 'Jackal', 'Kali', 'Lion', 'Maverick',
  'Montagne', 'Nomad', 'Nøkk', 'Sledge', 'Thatcher', 'Thermite', 'Twitch',
  'Ying', 'Zofia', 'Ace', 'Amaru', 'Iana', 'Zero', 'Flores', 'Osa',
  'Sens', 'Grim', 'Brava', 'Ram',
  // R6S Operators - Defenders
  'Alibi', 'Bandit', 'Castle', 'Caveira', 'Clash', 'Doc', 'Echo', 'Ela',
  'Frost', 'Goyo', 'Jager', 'Kaid', 'Kapkan', 'Lesion', 'Maestro', 'Mira',
  'Mozzie', 'Mute', 'Oryx', 'Pulse', 'Rook', 'Smoke', 'Tachanka',
  'Valkyrie', 'Vigil', 'Wamai', 'Warden', 'Melusi', 'Aruni', 'Thunderbird',
  'Thorn', 'Azami', 'Solis', 'Fenrir', 'Tubarao',
  // Tactical callsigns
  'Ghost', 'Hawk', 'Viper', 'Raven', 'Phoenix', 'Shadow', 'Storm',
  'Thunder', 'Cobra', 'Falcon', 'Wolf', 'Eagle', 'Reaper', 'Spectre'
];

// Hex characters excluding ambiguous ones (0, O, 1, I, l)
const HEX_CHARS = '23456789ABCDEF';

/**
 * Generates a random room ID in format: Prefix-XXXX
 * Example: Bravo-7A4F, Ghost-F3C1
 */
export function generateRoomId() {
  const prefix = PREFIXES[Math.floor(Math.random() * PREFIXES.length)];

  let suffix = '';
  for (let i = 0; i < 4; i++) {
    suffix += HEX_CHARS[Math.floor(Math.random() * HEX_CHARS.length)];
  }

  return `${prefix}-${suffix}`;
}

/**
 * Validates room ID format
 */
export function isValidRoomId(roomId) {
  if (!roomId || typeof roomId !== 'string') {
    return false;
  }

  const parts = roomId.split('-');
  if (parts.length !== 2) {
    return false;
  }

  const [prefix, suffix] = parts;

  // Check prefix is valid (case-insensitive)
  const normalizedPrefix = prefix.charAt(0).toUpperCase() + prefix.slice(1).toLowerCase();
  if (!PREFIXES.some(p => p.toLowerCase() === prefix.toLowerCase())) {
    return false;
  }

  // Check suffix is 4 valid hex chars
  if (suffix.length !== 4) {
    return false;
  }

  const validChars = new Set(HEX_CHARS);
  for (const char of suffix.toUpperCase()) {
    if (!validChars.has(char)) {
      return false;
    }
  }

  return true;
}

/**
 * Normalizes room ID to consistent format (proper case prefix, uppercase suffix)
 */
export function normalizeRoomId(roomId) {
  if (!isValidRoomId(roomId)) {
    return null;
  }

  const [prefix, suffix] = roomId.split('-');

  // Find the correct casing for the prefix
  const correctPrefix = PREFIXES.find(p => p.toLowerCase() === prefix.toLowerCase());

  return `${correctPrefix}-${suffix.toUpperCase()}`;
}
