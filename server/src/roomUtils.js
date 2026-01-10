/**
 * Characters allowed in room codes (uppercase letters and digits, excluding confusing ones)
 */
const ROOM_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluded: I, O, 0, 1 (confusing)

/**
 * Generates a 4-character alphanumeric room code
 * Example: A3B7, XY2Z, K9M4
 */
export function generateRoomId() {
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += ROOM_CHARS.charAt(Math.floor(Math.random() * ROOM_CHARS.length));
  }
  return code;
}

/**
 * Validates room ID format (4 alphanumeric characters)
 */
export function isValidRoomId(roomId) {
  if (!roomId || typeof roomId !== 'string') {
    return false;
  }

  // Must be exactly 4 alphanumeric characters (letters and digits)
  return /^[A-Z0-9]{4}$/i.test(roomId.trim());
}

/**
 * Normalizes room ID (trim whitespace, uppercase)
 */
export function normalizeRoomId(roomId) {
  if (!roomId || typeof roomId !== 'string') {
    return null;
  }

  const normalized = roomId.trim().toUpperCase();

  if (!isValidRoomId(normalized)) {
    return null;
  }

  return normalized;
}
