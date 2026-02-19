import { SEOHead, StructuredData, mobileAppSchema, organizationSchema } from '@/src/components/seo';
import Footer from '@/src/components/web/Footer';
import NavBar from '@/src/components/web/NavBar';
import { supabase } from '@/src/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';

const MAX_WIDTH = 1200;

function formatCount(n: number): string {
  return n.toLocaleString() + '+';
}

interface LandingStats {
  users: number | null;
  parks: number | null;
  playdates: number | null;
}

function useLandingStats(): LandingStats {
  const [stats, setStats] = useState<LandingStats>({ users: null, parks: null, playdates: null });

  useEffect(() => {
    async function fetch() {
      const [usersRes, parksRes, playdatesRes] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('parks').select('*', { count: 'exact', head: true }),
        supabase.from('play_dates').select('*', { count: 'exact', head: true }),
      ]);
      setStats({
        users: usersRes.count ?? null,
        parks: parksRes.count ?? null,
        playdates: playdatesRes.count ?? null,
      });
    }
    fetch();
  }, []);

  return stats;
}

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

// Hero Phone Mockup
function HeroPhone({ screenshot, size, rotation = 0 }: { screenshot: any; size: 'small' | 'large'; rotation?: number }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;

  const phoneWidth = size === 'large'
    ? (isMobile ? 220 : isTablet ? 260 : 300)
    : (isMobile ? 190 : isTablet ? 230 : 280);
  const phoneHeight = size === 'large'
    ? (isMobile ? 454 : isTablet ? 538 : 620)
    : (isMobile ? 396 : isTablet ? 476 : 580);

  return (
    <View
      style={{
        width: phoneWidth,
        height: phoneHeight,
        backgroundColor: '#1A1918',
        borderRadius: size === 'large' ? 38 : 36,
        padding: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: size === 'large' ? 20 : 16 },
        shadowOpacity: size === 'large' ? 0.33 : 0.27,
        shadowRadius: size === 'large' ? 60 : 48,
        transform: [{ rotate: `${rotation}deg` }],
      }}
    >
      <Image
        source={screenshot}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: size === 'large' ? 30 : 28,
        }}
        resizeMode="cover"
      />
    </View>
  );
}

// Mobile Hero Carousel
const HERO_SCREENS = [
  { screenshot: require('../assets/screenshots/map-explore.png'), label: 'Explore Parks' },
  { screenshot: require('../assets/screenshots/schedule-playdate.png'), label: 'Schedule Playdates' },
  { screenshot: require('../assets/screenshots/park-detail.png'), label: 'Park Details' },
];

function HeroCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartX = React.useRef(0);

  const handleTouchStart = (e: any) => {
    touchStartX.current = e.nativeEvent.pageX ?? e.nativeEvent.touches?.[0]?.pageX ?? 0;
  };

  const handleTouchEnd = (e: any) => {
    const endX = e.nativeEvent.pageX ?? e.nativeEvent.changedTouches?.[0]?.pageX ?? 0;
    const diff = touchStartX.current - endX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        setActiveIndex((prev) => (prev + 1) % HERO_SCREENS.length);
      } else {
        setActiveIndex((prev) => (prev - 1 + HERO_SCREENS.length) % HERO_SCREENS.length);
      }
    }
  };

  const getRotation = (index: number) => {
    if (index === activeIndex) return 0;
    const diff = index - activeIndex;
    // Handle wrap-around
    if (diff === 1 || diff === -(HERO_SCREENS.length - 1)) return 6;
    return -6;
  };

  const getScale = (index: number) => (index === activeIndex ? 1 : 0.88);
  const getOpacity = (index: number) => (index === activeIndex ? 1 : 0.6);
  const getZIndex = (index: number) => (index === activeIndex ? 3 : index < activeIndex ? 1 : 2);
  const getTranslateX = (index: number) => {
    if (index === activeIndex) return 0;
    const diff = index - activeIndex;
    if (diff === 1 || diff === -(HERO_SCREENS.length - 1)) return 60;
    return -60;
  };

  return (
    <View style={{ alignItems: 'center', gap: 20 }}>
      <View
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          height: 470,
          width: 320,
        }}
      >
        {HERO_SCREENS.map((screen, index) => (
          <Pressable
            key={index}
            onPress={() => setActiveIndex(index)}
            style={{
              position: 'absolute',
              zIndex: getZIndex(index),
              opacity: getOpacity(index),
              transform: [
                { translateX: getTranslateX(index) },
                { scale: getScale(index) },
                { rotate: `${getRotation(index)}deg` },
              ],
            }}
          >
            <HeroPhone screenshot={screen.screenshot} size="large" />
          </Pressable>
        ))}
      </View>

      {/* Dots */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {HERO_SCREENS.map((_, index) => (
          <Pressable
            key={index}
            onPress={() => setActiveIndex(index)}
            style={{
              width: index === activeIndex ? 24 : 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: index === activeIndex ? '#fff' : 'rgba(255,255,255,0.35)',
            }}
          />
        ))}
      </View>
    </View>
  );
}

// Hero Section
function HeroSection({ stats }: { stats: LandingStats }) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;

  return (
    <LinearGradient
      colors={['#1E5535', '#3D8A5A', '#2D6B44']}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={{
        width: '100%',
        alignItems: 'center',
        overflow: 'hidden',
      }}
    >
      <View style={{ height: isMobile ? 40 : 80 }} />

      {/* Badge — hidden for now, will be re-enabled later */}
      {false && (
        <View
          style={{
            borderRadius: 100,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.19)',
            backgroundColor: 'rgba(255,255,255,0.09)',
            paddingHorizontal: 20,
            paddingVertical: 8,
            marginBottom: 16,
          }}
        >
          <Text style={{ color: '#C8F0D8', fontSize: 13, fontWeight: '600', letterSpacing: 0.5 }}>
            Now available on iOS & Android
          </Text>
        </View>
      )}

      {/* Headline */}
      <Text
        role="heading"
        aria-level={1}
        style={{
          fontSize: isMobile ? 36 : isTablet ? 44 : 56,
          fontWeight: '700',
          color: '#FFFFFF',
          textAlign: 'center',
          letterSpacing: -1.5,
          paddingHorizontal: 24,
        }}
      >
        Find Dog Parks & Schedule Playdates Near You
      </Text>

      {/* Subtitle */}
      <Text
        style={{
          fontSize: isMobile ? 15 : 18,
          color: 'rgba(255,255,255,0.8)',
          textAlign: 'center',
          lineHeight: isMobile ? 22 : 27,
          maxWidth: 560,
          paddingHorizontal: 24,
          marginTop: 16,
        }}
      >
        Find dog-friendly parks, schedule meetups, and build your pup's social circle — all in one app.
      </Text>

      {/* CTA Buttons */}
      <View style={{ flexDirection: isMobile ? 'column' : 'row', gap: 12, marginTop: 32, paddingHorizontal: 24 }}>
        <Pressable
          onPress={() => router.push('/(auth)/sign-in')}
          style={{
            backgroundColor: '#fff',
            paddingHorizontal: 32,
            paddingVertical: 14,
            borderRadius: 9999,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#3D8A5A', fontWeight: '600', fontSize: 16 }}>Get Started Free</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push('/features' as any)}
          style={{
            borderWidth: 2,
            borderColor: 'rgba(255,255,255,0.4)',
            paddingHorizontal: 32,
            paddingVertical: 14,
            borderRadius: 9999,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>See How It Works</Text>
        </Pressable>
      </View>

      {stats.users != null && (
        <Text style={{ fontSize: 13, fontWeight: '500', color: 'rgba(255,255,255,0.6)', marginTop: 16 }}>
          Join {formatCount(stats.users)} dog owners already using k9d8
        </Text>
      )}

      {/* Phone Row */}
      {isMobile ? (
        <View style={{ marginTop: 40, marginBottom: -80 }}>
          <HeroCarousel />
        </View>
      ) : (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            justifyContent: 'center',
            gap: isTablet ? 28 : 40,
            marginTop: 48,
            marginBottom: -40,
          }}
        >
          <HeroPhone
            screenshot={require('../assets/screenshots/map-explore.png')}
            size="small"
            rotation={-4}
          />
          <HeroPhone
            screenshot={require('../assets/screenshots/schedule-playdate.png')}
            size="large"
          />
          <HeroPhone
            screenshot={require('../assets/screenshots/park-detail.png')}
            size="small"
            rotation={4}
          />
        </View>
      )}
    </LinearGradient>
  );
}

// Bullet Point Component
interface BulletPointProps {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  accentColor: string;
  bgColor: string;
}

function BulletPoint({ icon, text, accentColor, bgColor }: BulletPointProps) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          backgroundColor: bgColor,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={icon} size={16} color={accentColor} />
      </View>
      <Text style={{ fontSize: 15, fontWeight: '500', color: '#1A1918', flex: 1, lineHeight: 21 }}>
        {text}
      </Text>
    </View>
  );
}

// Phone Mockup Component
function PhoneMockup({ screenshot }: { screenshot: any }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const phoneWidth = isMobile ? 240 : isTablet ? 260 : 300;
  const phoneHeight = isMobile ? 496 : isTablet ? 538 : 620;

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <View
        style={{
          width: phoneWidth,
          height: phoneHeight,
          backgroundColor: '#1A1918',
          borderRadius: 38,
          padding: 8,
          shadowColor: '#1A1918',
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.13,
          shadowRadius: 40,
        }}
      >
        <Image
          source={screenshot}
          style={{
            width: '100%',
            height: '100%',
            borderRadius: 30,
          }}
          resizeMode="cover"
        />
      </View>
    </View>
  );
}

// Feature Row Component
interface FeatureRowProps {
  tag: string;
  tagIcon: keyof typeof Ionicons.glyphMap;
  accentColor: string;
  accentBg: string;
  title: string;
  description: string;
  bullets: { icon: keyof typeof Ionicons.glyphMap; text: string }[];
  screenshot: any;
  imageOnLeft?: boolean;
  bgColor: string;
}

function FeatureRow({
  tag, tagIcon, accentColor, accentBg,
  title, description, bullets, screenshot,
  imageOnLeft = true, bgColor,
}: FeatureRowProps) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;

  const phoneElement = <PhoneMockup screenshot={screenshot} />;

  const textElement = (
    <View style={{ flex: 1, gap: 24, maxWidth: 500 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Ionicons name={tagIcon} size={20} color={accentColor} />
        <Text style={{ fontSize: 14, fontWeight: '600', color: accentColor, letterSpacing: 0.5 }}>
          {tag}
        </Text>
      </View>
      <Text
        style={{
          fontSize: isMobile ? 28 : isTablet ? 32 : 40,
          fontWeight: '700',
          color: '#1A1918',
          letterSpacing: -1,
          lineHeight: isMobile ? 34 : isTablet ? 38 : 46,
        }}
      >
        {title}
      </Text>
      <Text style={{ fontSize: isMobile ? 15 : 17, color: '#6D6C6A', lineHeight: isMobile ? 24 : 27 }}>
        {description}
      </Text>
      <View style={{ gap: 16 }}>
        {bullets.map((b, i) => (
          <BulletPoint key={i} icon={b.icon} text={b.text} accentColor={accentColor} bgColor={accentBg} />
        ))}
      </View>
    </View>
  );

  return (
    <View style={{ width: '100%', backgroundColor: bgColor, paddingVertical: isMobile ? 60 : 80 }}>
      <Container>
        {isMobile ? (
          <View style={{ gap: 40, alignItems: 'center' }}>
            {phoneElement}
            {textElement}
          </View>
        ) : (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: isTablet ? 40 : 80,
            }}
          >
            {imageOnLeft ? (
              <>
                {phoneElement}
                {textElement}
              </>
            ) : (
              <>
                {textElement}
                {phoneElement}
              </>
            )}
          </View>
        )}
      </Container>
    </View>
  );
}

// Features Section
function FeaturesSection() {
  return (
    <>
      <FeatureRow
        tag="Explore"
        tagIcon="location"
        accentColor="#3D8A5A"
        accentBg="#C8F0D8"
        title="Find the perfect park for your pup"
        description="Browse an interactive map of dog-friendly parks near you. Filter by amenities, see live pup counts, and discover hidden gems in your neighborhood."
        bullets={[
          { icon: 'navigate', text: 'Interactive map with real-time park activity' },
          { icon: 'paw', text: 'See how many pups are at each park right now' },
          { icon: 'options', text: 'Filter by fenced areas, water access, and more' },
        ]}
        screenshot={require('../assets/screenshots/map-explore.png')}
        imageOnLeft={true}
        bgColor="#F5F4F1"
      />
      <FeatureRow
        tag="Schedule"
        tagIcon="calendar"
        accentColor="#D89575"
        accentBg="#F5E0DA"
        title="Plan the perfect play date in seconds"
        description="Pick a park, invite your crew, set the time — done. Scheduling meetups for your dog has never been this easy or this fun."
        bullets={[
          { icon: 'time', text: 'Set date, time, and duration in one tap' },
          { icon: 'people', text: 'Invite friends and set max group size' },
          { icon: 'notifications', text: 'Get reminders so you never miss a meetup' },
        ]}
        screenshot={require('../assets/screenshots/schedule-playdate.png')}
        imageOnLeft={false}
        bgColor="#FFFFFF"
      />
      <FeatureRow
        tag="Profiles"
        tagIcon="heart"
        accentColor="#5BA4A4"
        accentBg="#D4EDED"
        title="Build your pack, one profile at a time"
        description="Create detailed profiles for each of your dogs — breed, age, temperament, and more. Other owners see exactly who they're meeting up with."
        bullets={[
          { icon: 'camera', text: 'Add photos to show off your pup\'s personality' },
          { icon: 'paw', text: 'Track breed, size, age, and temperament' },
          { icon: 'shield-checkmark', text: 'Help other owners know what to expect' },
        ]}
        screenshot={require('../assets/screenshots/add-dog.png')}
        imageOnLeft={true}
        bgColor="#F5F4F1"
      />
    </>
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

// Social Proof Section
function SocialProofSection({ stats }: { stats: LandingStats }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const hasStats = stats.users != null || stats.parks != null || stats.playdates != null;
  if (!hasStats) return null;

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
          {stats.users != null && <Stat number={formatCount(stats.users)} label="Active Users" />}
          {stats.parks != null && <Stat number={formatCount(stats.parks)} label="Dog Parks" />}
          {stats.playdates != null && <Stat number={formatCount(stats.playdates)} label="Playdates Created" />}
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
  const stats = useLandingStats();

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
          <HeroSection stats={stats} />
          <FeaturesSection />
          <BenefitsSection />
          <SocialProofSection stats={stats} />
          <FinalCTASection />
        </View>
        <Footer />
      </ScrollView>
    </>
  );
}
