import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function Footer() {
  const router = useRouter();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 32,
        paddingHorizontal: 48,
        borderTopWidth: 1,
        borderTopColor: '#E5E4E1',
        width: '100%',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Ionicons name="paw" size={18} color="#9C9B99" />
        <Text style={{ fontSize: 14, fontWeight: '600', color: '#9C9B99' }}>k9d8</Text>
        <Text style={{ fontSize: 14, color: '#9C9B99' }}>·</Text>
        <Text style={{ fontSize: 12, color: '#9C9B99' }}>© 2026 All rights reserved.</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 24 }}>
        <Pressable onPress={() => router.push('/privacy' as any)}>
          <Text style={{ fontSize: 12, fontWeight: '500', color: '#9C9B99' }}>Privacy</Text>
        </Pressable>
        <Text style={{ fontSize: 12, fontWeight: '500', color: '#9C9B99' }}>Terms</Text>
        <Text style={{ fontSize: 12, fontWeight: '500', color: '#9C9B99' }}>Contact</Text>
      </View>
    </View>
  );
}
