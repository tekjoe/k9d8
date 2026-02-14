import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';

interface NavItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  active?: boolean;
  onPress: () => void;
}

function NavItem({ icon, label, active, onPress }: NavItemProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center px-4 py-3 rounded-lg mb-1 transition-colors ${
        active ? 'bg-primary/10' : 'hover:bg-gray-100'
      }`}
    >
      <Ionicons 
        name={icon} 
        size={20} 
        color={active ? '#4A90D9' : '#6B7280'} 
      />
      <Text 
        className={`ml-3 text-base ${
          active ? 'text-primary font-semibold' : 'text-text-secondary'
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function DesktopSidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const handleNavigate = (route: string) => {
    if (route === '/') {
      router.push('/');
    } else {
      router.push(route as any);
    }
  };

  const isActive = (route: string) => {
    if (route === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(route);
  };

  return (
    <View className="w-60 h-full bg-white border-r border-gray-200 flex-col">
      {/* Logo */}
      <View className="px-6 py-6 border-b border-gray-100">
        <Text className="text-xl font-bold text-primary">k9d8</Text>
      </View>

      {/* Navigation */}
      <View className="flex-1 px-3 py-4">
        <NavItem
          icon="home"
          label="Home"
          active={isActive('/')}
          onPress={() => handleNavigate('/')}
        />
        <NavItem
          icon="compass"
          label="Explore"
          active={isActive('/explore')}
          onPress={() => handleNavigate('/explore')}
        />
        <NavItem
          icon="chatbubble"
          label="Messages"
          active={isActive('/messages')}
          onPress={() => handleNavigate('/messages')}
        />
        <NavItem
          icon="person"
          label="Profile"
          active={isActive('/profile')}
          onPress={() => handleNavigate('/profile')}
        />
      </View>
    </View>
  );
}
