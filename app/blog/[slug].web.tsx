import React from 'react';
import { View, Text, Pressable, ScrollView, Image, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
        { width: '100%', maxWidth: MAX_WIDTH, marginHorizontal: 'auto', paddingHorizontal: isMobile ? 20 : 48 },
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

  const content = markdown.replace(/^#\s+.+\n+/, '');
  const relatedPosts = blogPosts.filter((p) => p.slug !== slug).slice(0, 3);

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
          {/* Breadcrumbs */}
          <View style={{ backgroundColor: '#FAFAF8', width: '100%' }}>
            <Container style={{ paddingVertical: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Pressable onPress={() => router.push('/blog' as any)}>
                  <Text style={{ fontSize: 13, fontWeight: '500', color: '#3D8A5A' }}>Blog</Text>
                </Pressable>
                <Text style={{ fontSize: 13, color: '#9C9B99' }}>›</Text>
                <Text style={{ fontSize: 13, fontWeight: '500', color: '#1A1918' }} numberOfLines={1}>
                  {post.title}
                </Text>
              </View>
            </Container>
          </View>

          {/* Article Header */}
          <View style={{ backgroundColor: '#FAFAF8', width: '100%', paddingBottom: isMobile ? 32 : 40 }}>
            <Container style={{ alignItems: 'center', gap: 20 }}>
              <View style={{ alignItems: 'center', gap: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Text style={{ fontSize: 13, color: '#9C9B99' }}>
                    {new Date(post.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Text>
                  <Text style={{ fontSize: 13, color: '#9C9B99' }}>·</Text>
                  <Text style={{ fontSize: 13, color: '#9C9B99' }}>{post.author}</Text>
                </View>
                <Text
                  role="heading"
                  aria-level={1}
                  style={{
                    fontSize: isMobile ? 28 : 40,
                    fontWeight: '700',
                    color: '#1A1918',
                    lineHeight: isMobile ? 32 : 46,
                    textAlign: 'center',
                  }}
                >
                  {post.title}
                </Text>
                <Text
                  style={{
                    fontSize: 17,
                    color: '#6D6C6A',
                    lineHeight: 27,
                    textAlign: 'center',
                    maxWidth: 680,
                  }}
                >
                  {post.description}
                </Text>
              </View>
            </Container>
          </View>

          {/* Hero Image */}
          <Container style={{ paddingTop: isMobile ? 24 : 0, paddingBottom: isMobile ? 24 : 48 }}>
            <View
              style={{
                width: '100%',
                height: 420,
                borderRadius: 20,
                overflow: 'hidden',
              }}
            >
              <Image
                source={{ uri: post.image_url || 'https://images.unsplash.com/photo-1606477787610-a3400b291eca?w=1080' }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            </View>
          </Container>

          {/* Content Area */}
          <Container style={{ paddingBottom: 60 }}>
            <View style={{ flexDirection: isMobile ? 'column' : 'row', gap: 48 }}>
              {/* Article Column */}
              <View style={{ flex: 1, gap: 32 }}>
                <View
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 20,
                    padding: isMobile ? 24 : 40,
                    shadowColor: '#1A1918',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.06,
                    shadowRadius: 12,
                  }}
                >
                  <div className="blog-content">
                    <Markdown>{content}</Markdown>
                  </div>
                </View>
              </View>

              {/* Sidebar */}
              {!isMobile && (
                <View style={{ width: 340, gap: 24 }}>
                  {/* CTA Card */}
                  <View
                    style={{
                      backgroundColor: '#3D8A5A',
                      borderRadius: 16,
                      padding: 24,
                      gap: 16,
                    }}
                  >
                    <View style={{ alignItems: 'center', gap: 16 }}>
                      <Text style={{ fontSize: 28, color: '#FFFFFF' }}>🐕</Text>
                      <Text style={{ fontSize: 18, fontWeight: '600', color: '#FFFFFF', textAlign: 'center' }}>
                        Find Dog Parks Near You
                      </Text>
                      <Text
                        style={{
                          fontSize: 13,
                          color: 'rgba(255,255,255,0.8)',
                          textAlign: 'center',
                          lineHeight: 20,
                        }}
                      >
                        Discover off-leash parks, check in, and meet other dog owners in your area.
                      </Text>
                      <Pressable
                        style={{
                          backgroundColor: '#FFFFFF',
                          paddingVertical: 12,
                          paddingHorizontal: 24,
                          borderRadius: 100,
                          width: '100%',
                        }}
                      >
                        <Text style={{ fontSize: 14, fontWeight: '600', color: '#3D8A5A', textAlign: 'center' }}>
                          Get Started Free
                        </Text>
                      </Pressable>
                    </View>
                  </View>

                  {/* Related Posts */}
                  {relatedPosts.length > 0 && (
                    <View
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
                      <View
                        style={{
                          paddingVertical: 18,
                          paddingHorizontal: 24,
                          borderBottomWidth: 1,
                          borderBottomColor: '#E5E4E1',
                        }}
                      >
                        <Text style={{ fontSize: 15, fontWeight: '600', color: '#1A1918' }}>Related Posts</Text>
                      </View>
                      {relatedPosts.map((relatedPost, index) => (
                        <Pressable
                          key={relatedPost.slug}
                          onPress={() => router.push(`/blog/${relatedPost.slug}` as any)}
                          style={{
                            paddingVertical: 16,
                            paddingHorizontal: 24,
                            borderBottomWidth: index < relatedPosts.length - 1 ? 1 : 0,
                            borderBottomColor: '#E5E4E1',
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 14,
                              fontWeight: '500',
                              color: '#1A1918',
                              lineHeight: 20,
                            }}
                            numberOfLines={2}
                          >
                            {relatedPost.title}
                          </Text>
                          <Text style={{ fontSize: 12, color: '#9C9B99', marginTop: 4 }}>
                            {new Date(relatedPost.date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </View>
          </Container>
        </View>

        <View style={{ flex: 1 }} />
        <Footer />
      </ScrollView>
    </>
  );
}
