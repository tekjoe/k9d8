import React from 'react';
import { View, Text, Pressable, ScrollView, Image, useWindowDimensions } from 'react-native';
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
        { width: '100%', maxWidth: MAX_WIDTH, marginHorizontal: 'auto', paddingHorizontal: isMobile ? 20 : 48 },
        style,
      ]}
    >
      {children}
    </View>
  );
}

function FeaturedCard({ post, onPress }: { post: typeof blogPosts[0]; onPress: () => void }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isStacked = isMobile || isTablet;

  return (
    <Pressable onPress={onPress} style={{ width: '100%' }}>
      <View
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          overflow: 'hidden',
          shadowColor: '#1A1918',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 16,
          flexDirection: isStacked ? 'column' : 'row',
        }}
      >
        <View style={{ width: isStacked ? '100%' : 560, height: isMobile ? 200 : isTablet ? 280 : 360 }}>
          <Image
            source={{ uri: post.image_url || 'https://images.unsplash.com/photo-1728881830211-84d2f5a05038?w=1080' }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
        </View>
        <View style={{ flex: 1, padding: isMobile ? 20 : 32, justifyContent: 'center', gap: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View
              style={{
                backgroundColor: '#C8F0D8',
                paddingHorizontal: 12,
                paddingVertical: 4,
                borderRadius: 100,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#3D8A5A' }}>Featured</Text>
            </View>
            <Text style={{ fontSize: 13, color: '#9C9B99' }}>
              {new Date(post.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </View>
          <Text
            style={{
              fontSize: isMobile ? 20 : 24,
              fontWeight: '700',
              color: '#1A1918',
              lineHeight: isMobile ? 26 : 31,
            }}
          >
            {post.title}
          </Text>
          <Text style={{ fontSize: 15, color: '#6D6C6A', lineHeight: 24 }}>{post.description}</Text>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#3D8A5A' }}>Read more →</Text>
        </View>
      </View>
    </Pressable>
  );
}

function PostCard({ post, onPress }: { post: typeof blogPosts[0]; onPress: () => void }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#1A1918',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
      }}
    >
      <View style={{ width: '100%', height: 200 }}>
        <Image
          source={{ uri: post.image_url || 'https://images.unsplash.com/photo-1687959258015-794fd07b0100?w=1080' }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
      </View>
      <View style={{ padding: 20, gap: 12 }}>
        <Text style={{ fontSize: 12, color: '#9C9B99' }}>
          {new Date(post.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
        <Text style={{ fontSize: 17, fontWeight: '600', color: '#1A1918', lineHeight: 22 }}>
          {post.title}
        </Text>
        <Text style={{ fontSize: 13, color: '#6D6C6A', lineHeight: 20 }} numberOfLines={2}>
          {post.description}
        </Text>
        <Text style={{ fontSize: 13, fontWeight: '600', color: '#3D8A5A' }}>Read more →</Text>
      </View>
    </Pressable>
  );
}

export default function BlogIndexPage() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const columns = isMobile ? 1 : isTablet ? 2 : 3;

  const featuredPost = blogPosts[0];
  const otherPosts = blogPosts.slice(1);

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
          {/* Hero Header */}
          <View style={{ backgroundColor: '#FAFAF8', paddingVertical: isMobile ? 48 : 56, width: '100%' }}>
            <Container style={{ gap: 12 }}>
              <Text
                role="heading"
                aria-level={1}
                style={{
                  fontSize: isMobile ? 32 : 40,
                  fontWeight: '700',
                  color: '#1A1918',
                  letterSpacing: -0.5,
                }}
              >
                Blog
              </Text>
              <Text style={{ fontSize: 17, color: '#6D6C6A' }}>
                Tips, guides, and stories for dog park lovers.
              </Text>
            </Container>
          </View>

          {/* Content Area */}
          <Container style={{ gap: 48, paddingVertical: isMobile ? 32 : 48 }}>
            {/* Featured */}
            {featuredPost && (
              <View style={{ gap: 12 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#3D8A5A', letterSpacing: 1 }}>
                  FEATURED
                </Text>
                <FeaturedCard
                  post={featuredPost}
                  onPress={() => router.push(`/blog/${featuredPost.slug}` as any)}
                />
              </View>
            )}

            {/* Latest Posts */}
            {otherPosts.length > 0 && (
              <View style={{ gap: 12 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#3D8A5A', letterSpacing: 1 }}>
                  LATEST POSTS
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    gap: 24,
                    width: '100%',
                  }}
                >
                  {otherPosts.map((post) => (
                    <View
                      key={post.slug}
                      style={{
                        flexBasis: isMobile ? '100%' : isTablet ? '47%' : '31%',
                        flexGrow: 0,
                        flexShrink: 0,
                      }}
                    >
                      <PostCard
                        post={post}
                        onPress={() => router.push(`/blog/${post.slug}` as any)}
                      />
                    </View>
                  ))}
                </View>
              </View>
            )}
          </Container>
        </View>

        <View style={{ flex: 1 }} />
        <Footer />
      </ScrollView>
    </>
  );
}
