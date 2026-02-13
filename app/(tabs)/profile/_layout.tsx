import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="dogs/create"
        options={{ title: 'Add Dog', headerBackTitle: 'Profile' }}
      />
      <Stack.Screen
        name="dogs/[id]"
        options={{ title: 'Edit Dog', headerBackTitle: 'Profile' }}
      />
    </Stack>
  );
}
