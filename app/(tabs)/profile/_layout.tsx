import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="edit" options={{ headerShown: false }} />
      <Stack.Screen
        name="dogs/create"
        options={{ title: 'Add Dog', headerBackTitle: 'Profile' }}
      />
      <Stack.Screen
        name="dogs/[id]"
        options={{ title: 'Edit Dog', headerBackTitle: 'Profile' }}
      />
      <Stack.Screen
        name="friends/index"
        options={{ title: 'Friends', headerBackTitle: 'Profile' }}
      />
      <Stack.Screen
        name="friends/requests"
        options={{ title: 'Friend Requests', headerBackTitle: 'Friends' }}
      />
    </Stack>
  );
}
