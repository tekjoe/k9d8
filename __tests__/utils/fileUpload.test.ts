jest.mock('expo-file-system', () => ({
  File: jest.fn().mockImplementation((uri: string) => ({
    arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(8)),
  })),
}));

import { readFileForUpload } from '../../src/utils/fileUpload';
import { Platform } from 'react-native';

describe('readFileForUpload', () => {
  it('uses expo-file-system File on native', async () => {
    const result = await readFileForUpload('file:///photo.jpg');
    expect(result).toBeInstanceOf(ArrayBuffer);
  });
});
