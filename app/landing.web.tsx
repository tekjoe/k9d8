import React from 'react';
import { View, Text, Pressable, Image, ScrollView, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SEOHead, StructuredData, mobileAppSchema, organizationSchema } from '@/src/components/seo';
import NavBar from '@/src/components/web/NavBar';
import Footer from '@/src/components/web/Footer';

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
              role="heading"
              aria-level={1}
              style={{
                fontSize: isMobile ? 40 : 56,
                fontWeight: '700',
                color: '#1A1918',
                lineHeight: isMobile ? 48 : 64,
              }}
            >
              Find Dog Parks & Schedule Playdates
            </Text>
            <Text 
              style={{ 
                fontSize: isMobile ? 16 : 20, 
                color: '#6D6C6A',
                lineHeight: isMobile ? 24 : 32,
              }}
            >
              Connect with dog owners near you, discover dog-friendly parks, and schedule playdates for your pup.
            </Text>
            <View style={{ flexDirection: isMobile ? 'column' : 'row', gap: 16 }}>
              <Pressable 
                onPress={() => router.push('/(auth)/sign-in')}
                style={{ 
                  backgroundColor: '#3D8A5A', 
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
                  borderColor: '#E5E4E1', 
                  paddingHorizontal: 32, 
                  paddingVertical: 16, 
                  borderRadius: 9999,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#1A1918', fontWeight: '600', fontSize: 17 }}>See How It Works</Text>
              </Pressable>
            </View>
            <Text style={{ fontSize: 14, fontWeight: '500', color: '#878685' }}>
              Join 10,000+ dog owners using the #1 dog playdate app
            </Text>
          </View>
          
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1720217260818-698d951a438d?w=1080&fit=crop' }}
            accessibilityLabel="Dogs playing together at a park"
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
        backgroundColor: '#F5F4F1', 
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        flexShrink: 0,
      }}
    >
      <Text style={{ fontSize: 20, fontWeight: '600', color: '#878685' }}>{placeholder}</Text>
    </View>
  );

  const textElement = (
    <View style={{ flex: 1, gap: 20, maxWidth: 440 }}>
      <Text style={{ fontSize: isMobile ? 28 : 32, fontWeight: '700', color: '#1A1918' }}>
        {title}
      </Text>
      <Text 
        style={{ 
          fontSize: 18, 
          color: '#6D6C6A', 
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
            role="heading"
            aria-level={2}
            style={{
              fontSize: isMobile ? 28 : 40,
              fontWeight: '700',
              color: '#1A1918',
              textAlign: 'center'
            }}
          >
            Everything You Need for Dog Park Adventures
          </Text>
          <Text 
            style={{ 
              fontSize: 18, 
              color: '#6D6C6A', 
              textAlign: 'center',
              maxWidth: 560,
            }}
          >
            Discover dog parks, connect with nearby owners, and schedule playdates
          </Text>
        </View>
        
        <View style={{ gap: 64 }}>
          <FeatureRow
            title="Find dog parks near you"
            description="Browse hundreds of dog-friendly parks in your area. See real-time updates on how many dogs are there, amenities available, and reviews from other dog owners."
            placeholder="Map Screenshot"
            imageOnLeft={true}
          />
          <FeatureRow
            title="Connect with dog owners nearby"
            description="See who's at the park right now. Schedule dog playdates, join group walks, and build a community of dog lovers in your neighborhood."
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
      <Ionicons name={icon} size={36} color="#3D8A5A" />
      <Text style={{ fontSize: 20, fontWeight: '700', color: '#1A1918' }}>{title}</Text>
      <Text style={{ fontSize: 16, color: '#6D6C6A', lineHeight: 24 }}>{description}</Text>
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
          role="heading"
          aria-level={2}
          style={{
            fontSize: isMobile ? 28 : 40,
            fontWeight: '700',
            color: '#1A1918',
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
      <Text style={{ fontSize: isMobile ? 32 : 44, fontWeight: '700', color: '#3D8A5A' }}>{number}</Text>
      <Text style={{ fontSize: 16, fontWeight: '500', color: '#6D6C6A' }}>{label}</Text>
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
        backgroundColor: '#F5F4F1', 
        borderRadius: 24, 
        padding: 32, 
        gap: 20,
        width: isMobile ? '100%' : undefined,
      }}
    >
      <Text style={{ fontSize: 17, color: '#1A1918', lineHeight: 26 }}>"{quote}"</Text>
      <Text style={{ fontSize: 14, fontWeight: '600', color: '#6D6C6A' }}>— {author}</Text>
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
          role="heading"
          aria-level={2}
          style={{
            fontSize: isMobile ? 28 : 40,
            fontWeight: '700',
            color: '#1A1918',
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
            backgroundColor: '#3D8A5A', 
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
              <Text style={{ color: '#3D8A5A', fontWeight: '600', fontSize: 17 }}>Get Started Free</Text>
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


// Main Landing Page
export default function LandingPage() {
  return (
    <>
      <SEOHead
        title="Dog Playdate App | Find Dog Parks & Connect with Owners"
        description="Connect with dog owners and schedule playdates with k9d8. Find nearby dog parks, see active dogs in your area, and message other owners. Free for iOS & Android."
        url="/landing"
        rawTitle
      />
      <StructuredData data={mobileAppSchema()} />
      <StructuredData data={organizationSchema()} />
      <ScrollView
        style={{ flex: 1, backgroundColor: '#F5F4F1' }}
        contentContainerStyle={{ minHeight: '100%' }}
      >
        <NavBar />
        <View role="main">
          <HeroSection />
          <FeaturesSection />
          <BenefitsSection />
          <SocialProofSection />
          <FinalCTASection />
        </View>
        <Footer />
      </ScrollView>
    </>
  );
}
