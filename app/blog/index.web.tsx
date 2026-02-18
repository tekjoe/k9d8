import React from 'react';
import { View, Text, Pressable, ScrollView, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { SEOHead } from '@/src/components/seo';
import { blogPosts } from '@/content/blog';
import NavBar from '@/src/components/web/NavBar';
import Footer from '@/src/components/web/Footer';

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
    <>
      <SEOHead
        title="Blog - Dog Park Tips, Playdate Guides & More"
        description="Tips for dog owners: park etiquette, playdate planning, socialization guides, and more from the k9d8 team."
        url="/blog"
      />
      <ScrollView style={{ flex: 1, backgroundColor: '#F5F4F1' }} contentContainerStyle={{ minHeight: '100%' }}>
        <NavBar />

        <View role="main">
          <View style={{ width: '100%', paddingVertical: isMobile ? 40 : 60 }}>
            <Container style={{ gap: 40 }}>
              <View style={{ gap: 12 }}>
                <Text
                  role="heading"
                  aria-level={1}
                  style={{
                    fontSize: isMobile ? 36 : 48,
                    fontWeight: '700',
                    color: '#1A1918',
                    lineHeight: isMobile ? 42 : 56,
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
                      shadowColor: '#1A1918',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.03,
                      shadowRadius: 12,
                    }}
                  >
                    <Text style={{ fontSize: 12, color: '#878685', fontWeight: '500' }}>
                      {new Date(post.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </Text>
                    <Text
                      role="heading"
                      aria-level={2}
                      style={{ fontSize: 20, fontWeight: '600', color: '#1A1918' }}
                    >
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
        </View>

        <View style={{ flex: 1 }} />
        <Footer />
      </ScrollView>
    </>
  );
}
