import { Platform } from 'react-native';
import { Stack } from 'expo-router';

const isWeb = Platform.OS === 'web';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: !isWeb,
      }}
    >
      <Stack.Screen name="sign-in" options={{ title: 'Sign In' }} />
      <Stack.Screen name="sign-up" options={{ title: 'Sign Up' }} />
    </Stack>
  );
}
