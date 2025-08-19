export function generateAgentId() {
  const adjectives = ['Silent', 'Shadow', 'Ghost', 'Phantom', 'Stealth', 'Covert', 'Hidden', 'Secret'];
  const numbers = Math.floor(Math.random() * 999) + 1;
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  return `${adjective}-${numbers.toString().padStart(3, '0')}`;
}

export function generateRoomToken() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 9; i++) {
    if (i === 3 || i === 6) {
      result += '-';
    } else {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }
  return result;
}

export async function generateRoomKeyFromToken(roomToken) {
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    console.warn('Web Crypto API not available, using fallback');
    return null;
  }

  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(roomToken + 'ghostchat-salt-2024');

    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);

    const key = await window.crypto.subtle.importKey(
      'raw',
      hashBuffer,
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt']
    );
    
    return key;
  } catch (error) {
    console.error('Failed to generate room key from token:', error);
    return null;
  }
}

export async function generateRoomKey() {
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    console.warn('Web Crypto API not available, using fallback');
    return null;
  }

  try {
    const key = await window.crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256,
      },
      true,
      ['encrypt', 'decrypt']
    );
    return key;
  } catch (error) {
    console.error('Failed to generate room key:', error);
    return null;
  }
}

export async function encryptMessage(message, key) {
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle || !key) {
    console.warn('Cannot encrypt: Web Crypto API not available or invalid key');
    return message; 
  }

  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    
    const encrypted = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      data
    );
    
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);
    
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('Encryption failed:', error);
    return message; 
  }
}

export async function decryptMessage(encryptedMessage, key) {
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle || !key) {
    console.warn('Cannot decrypt: Web Crypto API not available or invalid key');
    return encryptedMessage;
  }

  try {
    if (!/^[A-Za-z0-9+/=]+$/.test(encryptedMessage)) {
      return encryptedMessage;
    }

    const combined = new Uint8Array(
      atob(encryptedMessage).split('').map(char => char.charCodeAt(0))
    );
    
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);
    
    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      encrypted
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('Decryption failed:', error);
    return '[Encrypted message - failed to decrypt]';
  }
}

export async function generateKeyPair() {
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    console.warn('Web Crypto API not available for key pair generation');
    return null;
  }

  try {
    return await window.crypto.subtle.generateKey(
      {
        name: 'ECDH',
        namedCurve: 'P-256',
      },
      true,
      ['deriveKey']
    );
  } catch (error) {
    console.error('Key pair generation failed:', error);
    return null;
  }
}

export function isEncryptionAvailable() {
  return typeof window !== 'undefined' && 
         window.crypto && 
         window.crypto.subtle && 
         typeof window.crypto.subtle.generateKey === 'function';
}