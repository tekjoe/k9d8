import React from 'react';
import { View, Text, Pressable, ScrollView, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { blogPosts } from '@/content/blog';
import { blogContent } from '@/content/blog/content';

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

export default function BlogPostPage() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();

  const post = blogPosts.find((p) => p.slug === slug);
  const markdown = slug ? blogContent[slug] : undefined;

  if (!post || !markdown) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F4F1' }}>
        <Text style={{ fontSize: 18, color: '#6D6C6A' }}>Post not found</Text>
        <Pressable onPress={() => router.push('/blog' as any)} style={{ marginTop: 16 }}>
          <Text style={{ fontSize: 16, color: '#3D8A5A', fontWeight: '600' }}>Back to Blog</Text>
        </Pressable>
      </View>
    );
  }

  // Strip the H1 from markdown since we render the title separately
  const content = markdown.replace(/^#\s+.+\n+/, '');

  // Simple markdown-to-sections renderer for mobile
  const sections = content.split('\n').filter((line) => line.trim());

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

      {/* Back link */}
      <Container>
        <Pressable
          onPress={() => router.push('/blog' as any)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 8 }}
        >
          <Ionicons name="arrow-back" size={16} color="#3D8A5A" />
          <Text style={{ fontSize: 14, color: '#3D8A5A', fontWeight: '500' }}>Back to Blog</Text>
        </Pressable>
      </Container>

      {/* Article */}
      <View style={{ width: '100%', paddingVertical: 24 }}>
        <Container style={{ gap: 16, maxWidth: 720 }}>
          <Text style={{ fontSize: 12, color: '#878685', fontWeight: '500' }}>
            {new Date(post.date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
            {' · '}
            {post.author}
          </Text>
          <Text style={{ fontSize: 32, fontWeight: '700', color: '#1A1918', lineHeight: 38 }}>
            {post.title}
          </Text>
          <Text style={{ fontSize: 17, color: '#6D6C6A', lineHeight: 26 }}>
            {post.description}
          </Text>

          <View style={{ height: 1, backgroundColor: '#E5E4E1', marginVertical: 8 }} />

          {/* Render markdown lines as simple text */}
          {sections.map((line, i) => {
            const trimmed = line.trim();
            if (trimmed.startsWith('### ')) {
              return (
                <Text key={i} style={{ fontSize: 18, fontWeight: '600', color: '#1A1918', marginTop: 16 }}>
                  {trimmed.replace('### ', '')}
                </Text>
              );
            }
            if (trimmed.startsWith('## ')) {
              return (
                <Text key={i} style={{ fontSize: 22, fontWeight: '700', color: '#1A1918', marginTop: 20 }}>
                  {trimmed.replace('## ', '')}
                </Text>
              );
            }
            if (trimmed.startsWith('- ')) {
              const text = trimmed.replace('- ', '').replace(/\*\*/g, '');
              return (
                <Text key={i} style={{ fontSize: 16, color: '#3A3937', lineHeight: 24, paddingLeft: 16 }}>
                  {'•  '}{text}
                </Text>
              );
            }
            if (/^\d+\./.test(trimmed)) {
              const text = trimmed.replace(/\*\*/g, '');
              return (
                <Text key={i} style={{ fontSize: 16, color: '#3A3937', lineHeight: 24, paddingLeft: 16 }}>
                  {text}
                </Text>
              );
            }
            if (trimmed === '---') {
              return <View key={i} style={{ height: 1, backgroundColor: '#E5E4E1', marginVertical: 12 }} />;
            }
            if (trimmed.startsWith('*') && trimmed.endsWith('*')) {
              return (
                <Text key={i} style={{ fontSize: 15, color: '#6D6C6A', fontStyle: 'italic', lineHeight: 23 }}>
                  {trimmed.replace(/^\*/, '').replace(/\*$/, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')}
                </Text>
              );
            }
            return (
              <Text key={i} style={{ fontSize: 16, color: '#3A3937', lineHeight: 24 }}>
                {trimmed.replace(/\*\*/g, '')}
              </Text>
            );
          })}
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
