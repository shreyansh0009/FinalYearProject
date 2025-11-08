import { useState } from 'react';

/**
 * A custom hook to manage file hashing logic.
 */
export function useFileHash() {
  const [isHashing, setIsHashing] = useState(false);

  /**
   * Helper function to convert an ArrayBuffer (from hash) to a hex string
   */
  const bufferToHex = (buffer) => {
    return Array.from(new Uint8Array(buffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  };

  /**
   * Calculates the SHA-256 hash of a file using the native SubtleCrypto API.
   */
  const calculateHash = async (file) => {
    if (!file) return null;
    
    setIsHashing(true);
    try {
      const buffer = await file.arrayBuffer();
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', buffer);
      const hashHex = bufferToHex(hashBuffer);
      return hashHex;
    } catch (error) {
      console.error('Error calculating hash:', error);
      return null;
    } finally {
      setIsHashing(false);
    }
  };

  return { calculateHash, isHashing };
}