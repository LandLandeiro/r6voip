/**
 * Generates a simple 4-digit room code
 * Example: 1234, 5678, 9012
 */
export function generateRoomId() {
  // Generate 4 random digits (1000-9999 to avoid leading zeros)
  const code = Math.floor(1000 + Math.random() * 9000);
  return code.toString();
}

/**
 * Validates room ID format (4 digits)
 */
export function isValidRoomId(roomId) {
  if (!roomId || typeof roomId !== 'string') {
    return false;
  }

  // Must be exactly 4 digits
  return /^\d{4}$/.test(roomId.trim());
}

/**
 * Normalizes room ID (trim whitespace)
 */
export function normalizeRoomId(roomId) {
  if (!roomId || typeof roomId !== 'string') {
    return null;
  }

  const normalized = roomId.trim();

  if (!isValidRoomId(normalized)) {
    return null;
  }

  return normalized;
}
