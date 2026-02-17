import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator, Platform, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/src/hooks/useAuth';
import { useConversations } from '@/src/hooks/useConversations';
import { Colors } from '@/src/constants/colors';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { session, isLoading } = useAuth();
  const { unreadCount } = useConversations();
  
  // Show bottom tab bar on mobile (native + web when width < 768)
  const isMobileWeb = Platform.OS === 'web' && width < 768;
  const showTabBar = Platform.OS !== 'web' || isMobileWeb;

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: Colors.light.surface,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
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

  if (!session) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.light.secondary,
        tabBarInactiveTintColor: '#878685',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          display: showTabBar ? 'flex' : 'none',
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#E5E4E1',
          elevation: 0,
          shadowOpacity: 0,
          height: Platform.OS === 'web' ? 64 : 80,
          paddingBottom: Platform.OS === 'web' ? 8 : 20,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 4,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol size={24} name={focused ? 'house.fill' : 'house'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore/index"
        options={{
          title: 'Explore',
          tabBarLabel: 'Explore',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} name="mappin.and.ellipse" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages/index"
        options={{
          title: 'Messages',
          tabBarLabel: 'Messages',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol size={24} name={focused ? 'bubble.left.fill' : 'bubble.left'} color={color} />
          ),
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarBadgeStyle: { backgroundColor: Colors.light.error },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol size={24} name={focused ? 'person.fill' : 'person'} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
