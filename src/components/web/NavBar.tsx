import React, { useState } from 'react';
import { View, Text, Pressable, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const NAV_LINKS = [
  { label: 'Dog Parks', href: '/dog-parks' },
  { label: 'Features', href: '/features' },
  { label: 'Blog', href: '/blog' },
  { label: 'Download', href: '/download' },
];

export default function NavBar() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <View style={{ width: '100%', position: 'relative', zIndex: 100 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 64,
          paddingHorizontal: isMobile ? 24 : 48,
          backgroundColor: '#FFFFFF',
          borderBottomWidth: 1,
          borderBottomColor: '#E5E4E1',
          width: '100%',
        }}
      >
        {/* Left - Brand */}
        <Pressable onPress={() => router.push('/')} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Ionicons name="paw" size={24} color="#3D8A5A" />
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#1A1918', letterSpacing: 0.5 }}>k9d8</Text>
        </Pressable>

        {/* Desktop: Center Nav + Right Auth */}
        {!isMobile && (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 32 }}>
              {NAV_LINKS.map((link) => (
                <Pressable key={link.href} onPress={() => router.push(link.href as any)}>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: '#6D6C6A' }}>{link.label}</Text>
                </Pressable>
              ))}
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Pressable onPress={() => router.push('/(auth)/sign-in' as any)}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#1A1918' }}>Log In</Text>
              </Pressable>
              <Pressable
                onPress={() => router.push('/(auth)/sign-up')}
                style={{ backgroundColor: '#3D8A5A', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 9999 }}
              >
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>Sign Up Free</Text>
              </Pressable>
            </View>
          </>
        )}

        {/* Mobile: Hamburger */}
        {isMobile && (
          <Pressable onPress={() => setMenuOpen(!menuOpen)}>
            <Ionicons name={menuOpen ? 'close' : 'menu'} size={28} color="#1A1918" />
          </Pressable>
        )}
      </View>

      {/* Mobile Menu Dropdown */}
      {isMobile && menuOpen && (
        <View
          style={{
            position: 'absolute',
            top: 64,
            left: 0,
            right: 0,
            backgroundColor: '#FFFFFF',
            paddingHorizontal: 24,
            paddingVertical: 24,
            borderBottomWidth: 1,
            borderBottomColor: '#E5E4E1',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            gap: 20,
            zIndex: 101,
          }}
        >
          {NAV_LINKS.map((link) => (
            <Pressable key={link.href} onPress={() => { setMenuOpen(false); router.push(link.href as any); }}>
              <Text style={{ fontSize: 16, fontWeight: '500', color: '#6D6C6A' }}>{link.label}</Text>
            </Pressable>
          ))}
          <View style={{ height: 1, backgroundColor: '#E5E4E1', marginVertical: 4 }} />
          <Pressable onPress={() => { setMenuOpen(false); router.push('/(auth)/sign-in' as any); }}>
            <Text style={{ fontSize: 16, fontWeight: '500', color: '#1A1918' }}>Log In</Text>
          </Pressable>
          <Pressable
            onPress={() => { setMenuOpen(false); router.push('/(auth)/sign-up'); }}
            style={{ backgroundColor: '#3D8A5A', paddingVertical: 14, borderRadius: 12, alignItems: 'center' }}
          >
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>Sign Up Free</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
