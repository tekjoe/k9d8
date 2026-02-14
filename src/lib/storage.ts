import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import aesjs from 'aes-js';
import { Platform } from 'react-native';

// On web, SecureStore isn't available so we fall back to localStorage.
// On native, we encrypt the value with AES-256-CTR using a key stored in SecureStore.

const ENCRYPTION_KEY_NAME = 'k9d8_session_encryption_key';

function generateKey(): number[] {
  const key: number[] = [];
  for (let i = 0; i < 32; i++) {
    key.push(Math.floor(Math.random() * 256));
  }
  return key;
}

async function getOrCreateKey(): Promise<number[]> {
  const existing = await SecureStore.getItemAsync(ENCRYPTION_KEY_NAME);
  if (existing) {
    return JSON.parse(existing);
  }
  const key = generateKey();
  await SecureStore.setItemAsync(ENCRYPTION_KEY_NAME, JSON.stringify(key));
  return key;
}

function encrypt(text: string, key: number[]): string {
  const textBytes = aesjs.utils.utf8.toBytes(text);
  const aesCtr = new aesjs.ModeOfOperation.ctr(key);
  const encryptedBytes = aesCtr.encrypt(textBytes);
  return aesjs.utils.hex.fromBytes(encryptedBytes);
}

function decrypt(hex: string, key: number[]): string {
  const encryptedBytes = aesjs.utils.hex.toBytes(hex);
  const aesCtr = new aesjs.ModeOfOperation.ctr(key);
  const decryptedBytes = aesCtr.decrypt(encryptedBytes);
  return aesjs.utils.utf8.fromBytes(decryptedBytes);
}

// Web storage using localStorage (avoids AsyncStorage window issue)
const webStorage = {
  getItem(key: string): string | null {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(key);
  },
  setItem(key: string, value: string): void {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(key, value);
  },
  removeItem(key: string): void {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(key);
  },
};

export const LargeSecureStore = {
  async getItem(storageKey: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return webStorage.getItem(storageKey);
    }
    const encrypted = await AsyncStorage.getItem(storageKey);
    if (!encrypted) return null;
    const key = await getOrCreateKey();
    return decrypt(encrypted, key);
  },

  async setItem(storageKey: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      webStorage.setItem(storageKey, value);
      return;
    }
    const key = await getOrCreateKey();
    const encrypted = encrypt(value, key);
    await AsyncStorage.setItem(storageKey, encrypted);
  },

  async removeItem(storageKey: string): Promise<void> {
    if (Platform.OS === 'web') {
      webStorage.removeItem(storageKey);
      return;
    }
    await AsyncStorage.removeItem(storageKey);
  },
};
