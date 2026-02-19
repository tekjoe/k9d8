import { Platform } from 'react-native';
import { File } from 'expo-file-system';

export async function readFileForUpload(uri: string): Promise<ArrayBuffer | Blob> {
  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    return response.blob();
  }
  const file = new File(uri);
  return file.arrayBuffer();
}
