import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import '@/global.css';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider } from '@/src/providers/AuthProvider';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false, title: 'k9d8' }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false, title: 'k9d8' }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="dogs/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="playdates/create" options={{ headerShown: false }} />
          <Stack.Screen name="playdates/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="messages/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="users/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="features" options={{ headerShown: false }} />
          <Stack.Screen name="download" options={{ headerShown: false }} />
          <Stack.Screen name="dog-parks/index" options={{ headerShown: false }} />
          <Stack.Screen name="dog-parks/[slug]" options={{ headerShown: false }} />
          <Stack.Screen name="blog/index" options={{ headerShown: false }} />
          <Stack.Screen name="blog/[slug]" options={{ headerShown: false }} />
          <Stack.Screen name="notifications" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
  );
}
