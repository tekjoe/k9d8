import React from 'react';
import { View, Text, Pressable, ScrollView, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Markdown from 'react-markdown';
import { SEOHead, StructuredData, blogPostingSchema, breadcrumbSchema } from '@/src/components/seo';
import { blogPosts } from '@/content/blog';
import { blogContent } from '@/content/blog/content';
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

export default function BlogPostPage() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

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

  return (
    <>
      <SEOHead
        title={post.title}
        description={post.description}
        url={`/blog/${post.slug}`}
        type="article"
      />
      <StructuredData data={blogPostingSchema(post)} />
      <StructuredData
        data={breadcrumbSchema([
          { name: 'Blog', url: '/blog' },
          { name: post.title, url: `/blog/${post.slug}` },
        ])}
      />
      <ScrollView style={{ flex: 1, backgroundColor: '#F5F4F1' }} contentContainerStyle={{ minHeight: '100%' }}>
        <NavBar />

        <View role="main">
          {/* Breadcrumb */}
          <Container>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8 }}>
              <Pressable onPress={() => router.push('/blog' as any)}>
                <Text style={{ fontSize: 14, color: '#3D8A5A', fontWeight: '500' }}>Blog</Text>
              </Pressable>
              <Ionicons name="chevron-forward" size={12} color="#878685" />
              <Text style={{ fontSize: 14, color: '#6D6C6A' }} numberOfLines={1}>
                {post.title}
              </Text>
            </View>
          </Container>

          {/* Article Header */}
          <View style={{ width: '100%', paddingVertical: isMobile ? 24 : 40 }}>
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
              <Text
                role="heading"
                aria-level={1}
                style={{
                  fontSize: isMobile ? 32 : 42,
                  fontWeight: '700',
                  color: '#1A1918',
                  lineHeight: isMobile ? 38 : 50,
                }}
              >
                {post.title}
              </Text>
              <Text style={{ fontSize: 18, color: '#6D6C6A', lineHeight: 28 }}>
                {post.description}
              </Text>
            </Container>
          </View>

          {/* Article Body */}
          <View style={{ width: '100%', paddingBottom: 60 }}>
            <Container style={{ maxWidth: 720 }}>
              <View
                style={{
                  backgroundColor: '#fff',
                  borderRadius: 16,
                  padding: isMobile ? 24 : 40,
                  shadowColor: '#1A1918',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.03,
                  shadowRadius: 12,
                }}
              >
                <div className="blog-content">
                  <Markdown>{content}</Markdown>
                </div>
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
