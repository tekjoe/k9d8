jest.mock('expo-secure-store');
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LargeSecureStore } from '../../src/lib/storage';

const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;
const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

beforeEach(() => jest.clearAllMocks());

describe('LargeSecureStore', () => {
  describe('setItem + getItem roundtrip', () => {
    it('encrypts on set and decrypts on get', async () => {
      // No existing key in SecureStore
      mockSecureStore.getItemAsync.mockResolvedValue(null);
      mockSecureStore.setItemAsync.mockResolvedValue();

      let storedEncrypted: string | null = null;
      let storedKey: string | null = null;

      mockAsyncStorage.setItem.mockImplementation(async (_key, value) => {
        storedEncrypted = value;
      });
      mockAsyncStorage.getItem.mockImplementation(async () => storedEncrypted);

      // Capture the key that was generated
      mockSecureStore.setItemAsync.mockImplementation(async (_name, value) => {
        storedKey = value;
      });
      mockSecureStore.getItemAsync.mockImplementation(async () => storedKey);

      await LargeSecureStore.setItem('session', 'my-secret-token');
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('session', expect.any(String));

      // The stored value should be encrypted (hex string, not the plaintext)
      expect(storedEncrypted).not.toBe('my-secret-token');
      expect(storedEncrypted).toMatch(/^[0-9a-f]+$/);

      // Now read it back
      const result = await LargeSecureStore.getItem('session');
      expect(result).toBe('my-secret-token');
    });
  });

  describe('getItem', () => {
    it('returns null when no value stored', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);
      const result = await LargeSecureStore.getItem('missing-key');
      expect(result).toBeNull();
    });
  });

  describe('removeItem', () => {
    it('removes from AsyncStorage', async () => {
      mockAsyncStorage.removeItem.mockResolvedValue();
      await LargeSecureStore.removeItem('session');
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('session');
    });
  });

  describe('key reuse', () => {
    it('reuses existing encryption key', async () => {
      const existingKey = JSON.stringify(Array.from({ length: 32 }, (_, i) => i));
      mockSecureStore.getItemAsync.mockResolvedValue(existingKey);
      mockAsyncStorage.setItem.mockResolvedValue();

      await LargeSecureStore.setItem('test', 'value');
      // Should not create a new key
      expect(mockSecureStore.setItemAsync).not.toHaveBeenCalled();
    });
  });
});
