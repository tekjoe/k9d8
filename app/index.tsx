import { Redirect } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';

import { useAuth } from '@/src/hooks/useAuth';
import { Colors } from '@/src/constants/colors';

export default function AppIndex() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: Colors.light.surface,
        }}
      >
        <Text
          style={{
            fontSize: 28,
            fontWeight: '700',
            color: Colors.light.text,
            marginBottom: 8,
          }}
        >
          k9d8
        </Text>
        <Text
          style={{
            fontSize: 15,
            color: Colors.light.textSecondary,
            marginBottom: 32,
          }}
        >
          Finding dog parks near you…
        </Text>
        <ActivityIndicator size="large" color={Colors.light.secondary} />
      </View>
    );
  }

  // Authenticated users: check if they need onboarding
  if (session) {
    const meta = session.user?.user_metadata;
    const isSocialAuth = session.user?.app_metadata?.provider !== 'email';
    const needsOnboarding = isSocialAuth && !meta?.onboarded;

    if (needsOnboarding) {
      return <Redirect href="/(auth)/onboard" />;
    }

    return <Redirect href="/(tabs)" />;
  }

  // Unauthenticated users go to sign in
  return <Redirect href="/(auth)/sign-in" />;
}
