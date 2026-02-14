import { Platform } from 'react-native';
import { Stack } from 'expo-router';

export default function ProfileLayout() {
  const isWeb = Platform.OS === 'web';
  
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="edit" options={{ headerShown: false }} />
      <Stack.Screen
        name="dogs/create"
        options={{ 
          title: 'Add Dog', 
          headerBackTitle: 'Profile',
          headerShown: !isWeb,
        }}
      />
      <Stack.Screen
        name="dogs/[id]"
        options={{ 
          title: 'Edit Dog', 
          headerBackTitle: 'Profile',
          headerShown: !isWeb,
        }}
      />
      <Stack.Screen
        name="friends/index"
        options={{ 
          title: 'Friends', 
          headerBackTitle: 'Profile',
          headerShown: !isWeb,
        }}
      />
      <Stack.Screen
        name="friends/requests"
        options={{ 
          title: 'Friend Requests', 
          headerBackTitle: 'Friends',
          headerShown: !isWeb,
        }}
      />
    </Stack>
  );
}
