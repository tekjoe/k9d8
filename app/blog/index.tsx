import React from 'react';
import { View, Text, Pressable, ScrollView, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { blogPosts } from '@/content/blog';

const MAX_WIDTH = 1200;

function Container({ children, style }: { children: React.ReactNode; style?: any }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  return (
    <View
      style={[
        { width: '100%', maxWidth: MAX_WIDTH, marginHorizontal: 'auto', paddingHorizontal: isMobile ? 24 : 48 },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export default function BlogIndexPage() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#F5F4F1' }} contentContainerStyle={{ minHeight: '100%' }}>
      {/* Header */}
      <View style={{ width: '100%', paddingVertical: 24 }}>
        <Container>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Pressable onPress={() => router.push('/landing')}>
              <Text style={{ fontSize: 24, fontWeight: '700', color: '#1A1918' }}>k9d8</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push('/(auth)/sign-up')}
              style={{ backgroundColor: '#3D8A5A', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 9999 }}
            >
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>Sign Up Free</Text>
            </Pressable>
          </View>
        </Container>
      </View>

      <View style={{ width: '100%', paddingVertical: isMobile ? 40 : 60 }}>
        <Container style={{ gap: 40 }}>
          <View style={{ gap: 12 }}>
            <Text
              style={{
                fontSize: isMobile ? 36 : 48,
                fontWeight: '700',
                color: '#1A1918',
              }}
            >
              Blog
            </Text>
            <Text style={{ fontSize: 18, color: '#6D6C6A', maxWidth: 500 }}>
              Tips, guides, and stories for dog park lovers.
            </Text>
          </View>

          <View style={{ gap: 20 }}>
            {blogPosts.map((post) => (
              <Pressable
                key={post.slug}
                onPress={() => router.push(`/blog/${post.slug}` as any)}
                style={{
                  backgroundColor: '#fff',
                  borderRadius: 16,
                  padding: 24,
                  gap: 10,
                }}
              >
                <Text style={{ fontSize: 12, color: '#878685', fontWeight: '500' }}>
                  {new Date(post.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
                <Text style={{ fontSize: 20, fontWeight: '600', color: '#1A1918' }}>
                  {post.title}
                </Text>
                <Text style={{ fontSize: 15, color: '#6D6C6A', lineHeight: 23 }}>{post.description}</Text>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#3D8A5A', marginTop: 4 }}>
                  Read more →
                </Text>
              </Pressable>
            ))}
          </View>
        </Container>
      </View>

      {/* Footer */}
      <View style={{ flex: 1 }} />
      <View style={{ borderTopWidth: 1, borderTopColor: '#E5E4E1', backgroundColor: '#fff' }}>
        <Container>
          <View style={{ paddingVertical: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 14, color: '#878685' }}>© 2026 k9d8. All rights reserved.</Text>
            <View style={{ flexDirection: 'row', gap: 24 }}>
              <Pressable onPress={() => router.push('/landing')}>
                <Text style={{ fontSize: 14, color: '#878685' }}>Home</Text>
              </Pressable>
              <Pressable onPress={() => router.push('/download' as any)}>
                <Text style={{ fontSize: 14, color: '#878685' }}>Download</Text>
              </Pressable>
            </View>
          </View>
        </Container>
      </View>
    </ScrollView>
  );
}
