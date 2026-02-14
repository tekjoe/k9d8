import React, { useState } from 'react';
import { View, Text, Pressable, Image, ScrollView, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const MAX_WIDTH = 1200;

// Container Component - constrains content width
interface ContainerProps {
  children: React.ReactNode;
  style?: any;
}

function Container({ children, style }: ContainerProps) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  
  return (
    <View 
      style={[
        { 
          width: '100%',
          maxWidth: MAX_WIDTH,
          marginHorizontal: 'auto',
          paddingHorizontal: isMobile ? 24 : 48,
        },
        style
      ]}
    >
      {children}
    </View>
  );
}

// Header Component
function Header() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <View style={{ width: '100%', paddingVertical: 24, position: 'relative', zIndex: 100 }}>
      <Container>
        <View 
          style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            justifyContent: 'space-between',
          }}
        >
          <Text style={{ fontSize: 24, fontWeight: '700', color: '#1A1A2E' }}>k9d8</Text>
          
          {!isMobile && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 40 }}>
              <Pressable>
                <Text style={{ fontSize: 15, fontWeight: '500', color: '#6B7280' }}>Features</Text>
              </Pressable>
              <Pressable>
                <Text style={{ fontSize: 15, fontWeight: '500', color: '#6B7280' }}>How it Works</Text>
              </Pressable>
              <Pressable>
                <Text style={{ fontSize: 15, fontWeight: '500', color: '#6B7280' }}>About</Text>
              </Pressable>
              <Pressable onPress={() => router.push('/(auth)/sign-in')}>
                <Text style={{ fontSize: 15, fontWeight: '500', color: '#6B7280' }}>Log In</Text>
              </Pressable>
              <Pressable 
                onPress={() => router.push('/(auth)/sign-up')}
                style={{ 
                  backgroundColor: '#6FCF97', 
                  paddingHorizontal: 24, 
                  paddingVertical: 12, 
                  borderRadius: 9999 
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>Sign Up Free</Text>
              </Pressable>
            </View>
          )}

          {isMobile && (
            <Pressable onPress={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <Ionicons name={mobileMenuOpen ? 'close' : 'menu'} size={28} color="#1A1A2E" />
            </Pressable>
          )}
        </View>

        {/* Mobile Menu Dropdown */}
        {isMobile && mobileMenuOpen && (
          <View 
            style={{ 
              position: 'absolute',
              top: 50.5,
              left: 0,
              right: 0,
              backgroundColor: '#fff',
              paddingHorizontal: 24,
              paddingVertical: 24,
              borderBottomWidth: 1,
              borderBottomColor: '#E5E7EB',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              gap: 20,
            }}
          >
            <Pressable onPress={() => setMobileMenuOpen(false)}>
              <Text style={{ fontSize: 16, fontWeight: '500', color: '#6B7280' }}>Features</Text>
            </Pressable>
            <Pressable onPress={() => setMobileMenuOpen(false)}>
              <Text style={{ fontSize: 16, fontWeight: '500', color: '#6B7280' }}>How it Works</Text>
            </Pressable>
            <Pressable onPress={() => setMobileMenuOpen(false)}>
              <Text style={{ fontSize: 16, fontWeight: '500', color: '#6B7280' }}>About</Text>
            </Pressable>
            <View style={{ height: 1, backgroundColor: '#E5E7EB', marginVertical: 4 }} />
            <Pressable 
              onPress={() => {
                setMobileMenuOpen(false);
                router.push('/(auth)/sign-in');
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: '500', color: '#1A1A2E' }}>Log In</Text>
            </Pressable>
            <Pressable 
              onPress={() => {
                setMobileMenuOpen(false);
                router.push('/(auth)/sign-up');
              }}
              style={{ 
                backgroundColor: '#6FCF97', 
                paddingVertical: 14, 
                borderRadius: 12,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>Sign Up Free</Text>
            </Pressable>
          </View>
        )}
      </Container>
    </View>
  );
}

// Hero Section
function HeroSection() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;

  return (
    <View style={{ width: '100%', paddingVertical: isMobile ? 40 : 80 }}>
      <Container>
        <View 
          style={{ 
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: isMobile ? 40 : 64,
          }}
        >
          <View style={{ flex: isMobile ? undefined : 1, gap: 32, maxWidth: 540 }}>
            <Text 
              style={{ 
                fontSize: isMobile ? 40 : 56, 
                fontWeight: '700', 
                color: '#1A1A2E',
                lineHeight: isMobile ? 48 : 64,
              }}
            >
              Find the perfect park for your pup
            </Text>
            <Text 
              style={{ 
                fontSize: isMobile ? 16 : 20, 
                color: '#6B7280',
                lineHeight: isMobile ? 24 : 32,
              }}
            >
              Connect with local dog owners, discover dog-friendly parks, and make every walk an adventure.
            </Text>
            <View style={{ flexDirection: isMobile ? 'column' : 'row', gap: 16 }}>
              <Pressable 
                onPress={() => router.push('/(auth)/sign-in')}
                style={{ 
                  backgroundColor: '#6FCF97', 
                  paddingHorizontal: 32, 
                  paddingVertical: 16, 
                  borderRadius: 9999,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 17 }}>Get Started Free</Text>
              </Pressable>
              <Pressable 
                style={{ 
                  borderWidth: 2, 
                  borderColor: '#E5E7EB', 
                  paddingHorizontal: 32, 
                  paddingVertical: 16, 
                  borderRadius: 9999,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#1A1A2E', fontWeight: '600', fontSize: 17 }}>See How It Works</Text>
              </Pressable>
            </View>
            <Text style={{ fontSize: 14, fontWeight: '500', color: '#9CA3AF' }}>
              Join 10,000+ dog owners already using k9d8
            </Text>
          </View>
          
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1720217260818-698d951a438d?w=1080&fit=crop' }}
            style={{ 
              width: isMobile ? '100%' : isTablet ? 350 : 500, 
              height: isMobile ? 280 : isTablet ? 320 : 420, 
              borderRadius: 24,
            }}
            resizeMode="cover"
          />
        </View>
      </Container>
    </View>
  );
}

// Feature Row Component
interface FeatureRowProps {
  title: string;
  description: string;
  placeholder: string;
  imageOnLeft?: boolean;
}

function FeatureRow({ title, description, placeholder, imageOnLeft = true }: FeatureRowProps) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;

  const imageElement = (
    <View 
      style={{ 
        width: isMobile ? '100%' : isTablet ? 300 : 480, 
        height: isMobile ? 220 : isTablet ? 280 : 360, 
        backgroundColor: '#F7F8FA', 
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        flexShrink: 0,
      }}
    >
      <Text style={{ fontSize: 20, fontWeight: '600', color: '#9CA3AF' }}>{placeholder}</Text>
    </View>
  );

  const textElement = (
    <View style={{ flex: 1, gap: 20, maxWidth: 440 }}>
      <Text style={{ fontSize: isMobile ? 28 : 32, fontWeight: '700', color: '#1A1A2E' }}>
        {title}
      </Text>
      <Text 
        style={{ 
          fontSize: 18, 
          color: '#6B7280', 
          lineHeight: 28,
        }}
      >
        {description}
      </Text>
    </View>
  );

  if (isMobile) {
    return (
      <View style={{ gap: 24, width: '100%' }}>
        {imageElement}
        {textElement}
      </View>
    );
  }

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 64, width: '100%' }}>
      {imageOnLeft ? (
        <>
          {imageElement}
          {textElement}
        </>
      ) : (
        <>
          {textElement}
          {imageElement}
        </>
      )}
    </View>
  );
}

// Features Section
function FeaturesSection() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  return (
    <View style={{ width: '100%', backgroundColor: '#fff', paddingVertical: isMobile ? 60 : 100 }}>
      <Container style={{ gap: 64 }}>
        <View style={{ alignItems: 'center', gap: 16 }}>
          <Text 
            style={{ 
              fontSize: isMobile ? 28 : 40, 
              fontWeight: '700', 
              color: '#1A1A2E', 
              textAlign: 'center' 
            }}
          >
            Everything you need for happy adventures
          </Text>
          <Text 
            style={{ 
              fontSize: 18, 
              color: '#6B7280', 
              textAlign: 'center',
              maxWidth: 560,
            }}
          >
            Discover parks, connect with the community, and keep your pup safe and happy
          </Text>
        </View>
        
        <View style={{ gap: 64 }}>
          <FeatureRow
            title="Find nearby dog parks"
            description="Browse hundreds of dog-friendly parks in your area. See real-time updates on how many dogs are there, amenities available, and reviews from other owners."
            placeholder="Map Screenshot"
            imageOnLeft={true}
          />
          <FeatureRow
            title="Connect with other dog owners"
            description="See who's at the park right now. Create playdates, join group walks, and build a community of dog lovers in your neighborhood."
            placeholder="Community Screenshot"
            imageOnLeft={false}
          />
          <FeatureRow
            title="Track your dog's activity"
            description="Keep tabs on park visits, favorite spots, and playtime history. Get insights on your pup's social life and favorite activities."
            placeholder="Activity Screenshot"
            imageOnLeft={true}
          />
        </View>
      </Container>
    </View>
  );
}

// Benefit Card Component
interface BenefitCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}

function BenefitCard({ icon, title, description }: BenefitCardProps) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  
  return (
    <View 
      style={{ 
        flex: isMobile ? undefined : 1, 
        backgroundColor: '#fff', 
        borderRadius: 24, 
        padding: 32, 
        gap: 16,
        width: isMobile ? '100%' : undefined,
      }}
    >
      <Ionicons name={icon} size={36} color="#6FCF97" />
      <Text style={{ fontSize: 20, fontWeight: '700', color: '#1A1A2E' }}>{title}</Text>
      <Text style={{ fontSize: 16, color: '#6B7280', lineHeight: 24 }}>{description}</Text>
    </View>
  );
}

// Benefits Section
function BenefitsSection() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  return (
    <View style={{ width: '100%', paddingVertical: isMobile ? 60 : 100 }}>
      <Container style={{ gap: 48 }}>
        <Text 
          style={{ 
            fontSize: isMobile ? 28 : 40, 
            fontWeight: '700', 
            color: '#1A1A2E', 
            textAlign: 'center' 
          }}
        >
          Built for dog owners, by dog owners
        </Text>
        <View 
          style={{ 
            flexDirection: isMobile ? 'column' : 'row', 
            gap: 24,
          }}
        >
          <BenefitCard
            icon="location"
            title="Real-time Updates"
            description="See how many dogs are at each park right now"
          />
          <BenefitCard
            icon="people"
            title="Community Driven"
            description="Reviews and photos from real dog owners"
          />
          <BenefitCard
            icon="shield-checkmark"
            title="Safety First"
            description="Verified park info and safety ratings"
          />
        </View>
      </Container>
    </View>
  );
}

// Stat Component
interface StatProps {
  number: string;
  label: string;
}

function Stat({ number, label }: StatProps) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  return (
    <View style={{ alignItems: 'center', gap: 8 }}>
      <Text style={{ fontSize: isMobile ? 32 : 44, fontWeight: '700', color: '#6FCF97' }}>{number}</Text>
      <Text style={{ fontSize: 16, fontWeight: '500', color: '#6B7280' }}>{label}</Text>
    </View>
  );
}

// Testimonial Component
interface TestimonialProps {
  quote: string;
  author: string;
}

function Testimonial({ quote, author }: TestimonialProps) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  
  return (
    <View 
      style={{ 
        flex: isMobile ? undefined : 1, 
        backgroundColor: '#F7F8FA', 
        borderRadius: 24, 
        padding: 32, 
        gap: 20,
        width: isMobile ? '100%' : undefined,
      }}
    >
      <Text style={{ fontSize: 17, color: '#1A1A2E', lineHeight: 26 }}>"{quote}"</Text>
      <Text style={{ fontSize: 14, fontWeight: '600', color: '#6B7280' }}>— {author}</Text>
    </View>
  );
}

// Social Proof Section
function SocialProofSection() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  return (
    <View style={{ width: '100%', backgroundColor: '#fff', paddingVertical: isMobile ? 60 : 100 }}>
      <Container style={{ gap: 48 }}>
        <Text 
          style={{ 
            fontSize: isMobile ? 28 : 40, 
            fontWeight: '700', 
            color: '#1A1A2E', 
            textAlign: 'center' 
          }}
        >
          Loved by dog owners everywhere
        </Text>
        
        <View 
          style={{ 
            flexDirection: 'row', 
            justifyContent: 'center', 
            gap: isMobile ? 32 : 64,
            flexWrap: 'wrap',
          }}
        >
          <Stat number="10,000+" label="Active Users" />
          <Stat number="500+" label="Dog Parks" />
          <Stat number="25,000+" label="Playdates Created" />
        </View>
        
        <View 
          style={{ 
            flexDirection: isMobile ? 'column' : 'row', 
            gap: 24,
          }}
        >
          <Testimonial
            quote="k9d8 has completely changed how we find parks. We've met so many amazing dogs and owners!"
            author="Sarah & Max"
          />
          <Testimonial
            quote="The real-time updates are a game changer. I can see when the park is busy and plan accordingly."
            author="Mike & Luna"
          />
          <Testimonial
            quote="We found our dog's best friends through k9d8. It's been amazing for his socialization!"
            author="Jessica & Charlie"
          />
        </View>
      </Container>
    </View>
  );
}

// Final CTA Section
function FinalCTASection() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  return (
    <View style={{ width: '100%', paddingVertical: isMobile ? 40 : 80 }}>
      <Container>
        <View 
          style={{ 
            backgroundColor: '#6FCF97', 
            borderRadius: 24, 
            padding: isMobile ? 40 : 64, 
            alignItems: 'center', 
            gap: 28,
          }}
        >
          <Text 
            style={{ 
              fontSize: isMobile ? 32 : 48, 
              fontWeight: '700', 
              color: '#fff', 
              textAlign: 'center' 
            }}
          >
            Ready to find your pack?
          </Text>
          <Text 
            style={{ 
              fontSize: 18, 
              color: 'rgba(255,255,255,0.8)', 
              textAlign: 'center' 
            }}
          >
            Join thousands of happy dog owners. Start exploring today.
          </Text>
          <View style={{ flexDirection: isMobile ? 'column' : 'row', gap: 16 }}>
            <Pressable 
              onPress={() => router.push('/(auth)/sign-in')}
              style={{ 
                backgroundColor: '#fff', 
                paddingHorizontal: 32, 
                paddingVertical: 16, 
                borderRadius: 9999,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#6FCF97', fontWeight: '600', fontSize: 17 }}>Get Started Free</Text>
            </Pressable>
            <Pressable 
              style={{ 
                borderWidth: 2, 
                borderColor: '#fff', 
                paddingHorizontal: 32, 
                paddingVertical: 16, 
                borderRadius: 9999,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 17 }}>Learn More</Text>
            </Pressable>
          </View>
          <Text style={{ fontSize: 14, fontWeight: '500', color: 'rgba(255,255,255,0.7)' }}>
            Free forever. No credit card required.
          </Text>
        </View>
      </Container>
    </View>
  );
}

// Footer Component
function Footer() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  return (
    <View style={{ width: '100%', backgroundColor: '#fff' }}>
      <Container style={{ paddingVertical: 64 }}>
        <View 
          style={{ 
            flexDirection: isMobile ? 'column' : 'row', 
            justifyContent: 'space-between',
            gap: isMobile ? 40 : 64,
          }}
        >
          <View style={{ gap: 16, maxWidth: 280 }}>
            <Text style={{ fontSize: 24, fontWeight: '700', color: '#1A1A2E' }}>k9d8</Text>
            <Text style={{ fontSize: 15, color: '#6B7280', lineHeight: 24 }}>
              Connecting dogs and their humans to the best parks and communities.
            </Text>
          </View>
          
          <View style={{ flexDirection: 'row', gap: isMobile ? 40 : 64, flexWrap: 'wrap' }}>
            <View style={{ gap: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#1A1A2E' }}>Product</Text>
              <Text style={{ fontSize: 14, color: '#6B7280' }}>Features</Text>
              <Text style={{ fontSize: 14, color: '#6B7280' }}>Pricing</Text>
              <Text style={{ fontSize: 14, color: '#6B7280' }}>Updates</Text>
            </View>
            <View style={{ gap: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#1A1A2E' }}>Company</Text>
              <Text style={{ fontSize: 14, color: '#6B7280' }}>About</Text>
              <Text style={{ fontSize: 14, color: '#6B7280' }}>Blog</Text>
              <Text style={{ fontSize: 14, color: '#6B7280' }}>Careers</Text>
            </View>
            <View style={{ gap: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#1A1A2E' }}>Resources</Text>
              <Text style={{ fontSize: 14, color: '#6B7280' }}>Help Center</Text>
              <Text style={{ fontSize: 14, color: '#6B7280' }}>Community</Text>
            </View>
          </View>
        </View>
      </Container>
      
      <View style={{ borderTopWidth: 1, borderTopColor: '#E5E7EB' }}>
        <Container>
          <View 
            style={{ 
              flexDirection: isMobile ? 'column' : 'row', 
              justifyContent: 'space-between', 
              alignItems: isMobile ? 'flex-start' : 'center',
              paddingVertical: 24,
              gap: isMobile ? 16 : 0,
            }}
          >
            <Text style={{ fontSize: 14, color: '#9CA3AF' }}>© 2026 k9d8. All rights reserved.</Text>
            <View style={{ flexDirection: 'row', gap: 32 }}>
              <Text style={{ fontSize: 14, color: '#9CA3AF' }}>Privacy Policy</Text>
              <Text style={{ fontSize: 14, color: '#9CA3AF' }}>Terms of Service</Text>
            </View>
          </View>
        </Container>
      </View>
    </View>
  );
}

// Main Landing Page
export default function LandingPage() {
  return (
    <ScrollView 
      style={{ flex: 1, backgroundColor: '#F7F8FA' }}
      contentContainerStyle={{ minHeight: '100%' }}
    >
      <Header />
      <HeroSection />
      <FeaturesSection />
      <BenefitsSection />
      <SocialProofSection />
      <FinalCTASection />
      <Footer />
    </ScrollView>
  );
}
