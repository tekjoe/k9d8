import React, { useSyncExternalStore, useCallback } from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';

const STORAGE_KEY = 'sidebar-collapsed';

// Module-level shared store so all DesktopSidebar instances share one state
let collapsed =
  Platform.OS === 'web' && typeof localStorage !== 'undefined'
    ? localStorage.getItem(STORAGE_KEY) === 'true'
    : false;

const listeners = new Set<() => void>();

function getSnapshot() {
  return collapsed;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function setCollapsed(next: boolean) {
  collapsed = next;
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, String(next));
  }
  listeners.forEach((l) => l());
}

interface NavItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  active?: boolean;
  collapsed?: boolean;
  badge?: number;
  onPress: () => void;
}

function NavItem({ icon, label, active, collapsed, badge, onPress }: NavItemProps) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'flex-start',
        paddingHorizontal: collapsed ? 0 : 16,
        paddingVertical: 12,
        borderRadius: 8,
        marginBottom: 4,
        backgroundColor: active ? 'rgba(61, 138, 90, 0.1)' : 'transparent',
      }}
    >
      <View style={{ position: 'relative' }}>
        <Ionicons
          name={icon}
          size={20}
          color={active ? '#3D8A5A' : '#6D6C6A'}
        />
        {badge && badge > 0 && (
          <View
            style={{
              position: 'absolute',
              top: -6,
              right: -6,
              backgroundColor: '#B5725E',
              borderRadius: 8,
              minWidth: 16,
              height: 16,
              justifyContent: 'center',
              alignItems: 'center',
              paddingHorizontal: 4,
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '700' }}>
              {badge > 99 ? '99+' : badge}
            </Text>
          </View>
        )}
      </View>
      {!collapsed && (
        <Text
          style={{
            marginLeft: 12,
            fontSize: 15,
            color: active ? '#3D8A5A' : '#6D6C6A',
            fontWeight: active ? '600' : '400',
          }}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

export default function DesktopSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const isCollapsed = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  // Desktop sidebar is only relevant on web
  if (Platform.OS !== 'web') return null;

  const toggle = useCallback(() => {
    setCollapsed(!isCollapsed);
  }, [isCollapsed]);

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
    <View
      style={{
        width: isCollapsed ? 64 : 240,
        height: '100%',
        backgroundColor: '#FFFFFF',
        borderRightWidth: 1,
        borderRightColor: '#E5E4E1',
        flexDirection: 'column',
      }}
    >
      {/* Brand */}
      <Pressable
        onPress={() => router.push('/')}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'flex-start',
          gap: isCollapsed ? 0 : 10,
          paddingHorizontal: isCollapsed ? 12 : 24,
          paddingVertical: 20,
        }}
      >
        <Ionicons name="paw" size={22} color="#3D8A5A" />
        {!isCollapsed && (
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#1A1918', letterSpacing: 0.5 }}>k9d8</Text>
        )}
      </Pressable>

      {/* Navigation */}
      <View style={{ flex: 1, paddingHorizontal: isCollapsed ? 12 : 12, paddingVertical: 16 }}>
        <NavItem
          icon="home"
          label="Home"
          active={isActive('/')}
          collapsed={isCollapsed}
          onPress={() => handleNavigate('/')}
        />
        <NavItem
          icon="compass"
          label="Explore"
          active={isActive('/explore')}
          collapsed={isCollapsed}
          onPress={() => handleNavigate('/explore')}
        />
        <NavItem
          icon="people"
          label="Friends"
          active={isActive('/profile/friends')}
          collapsed={isCollapsed}
          onPress={() => handleNavigate('/(tabs)/profile/friends')}
        />
        <NavItem
          icon="chatbubble"
          label="Messages"
          active={isActive('/messages')}
          collapsed={isCollapsed}
          onPress={() => handleNavigate('/messages')}
        />
        <NavItem
          icon="person"
          label="Profile"
          active={isActive('/profile') && !pathname.startsWith('/profile/friends')}
          collapsed={isCollapsed}
          onPress={() => handleNavigate('/profile')}
        />
        <NavItem
          icon="notifications"
          label="Notifications"
          active={isActive('/notifications')}
          collapsed={isCollapsed}
          onPress={() => handleNavigate('/notifications')}
        />
      </View>

      {/* Toggle Button */}
      <View
        style={{
          paddingHorizontal: isCollapsed ? 12 : 12,
          paddingVertical: 16,
          borderTopWidth: 1,
          borderTopColor: '#EDECEA',
        }}
      >
        <Pressable
          onPress={toggle}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            paddingHorizontal: isCollapsed ? 0 : 16,
            paddingVertical: 12,
            borderRadius: 8,
          }}
        >
          <Ionicons
            name={isCollapsed ? 'chevron-forward' : 'chevron-back'}
            size={20}
            color="#6D6C6A"
          />
          {!isCollapsed && (
            <Text style={{ marginLeft: 12, fontSize: 14, color: '#6D6C6A' }}>
              Collapse
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}
