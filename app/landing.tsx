import React, { useState } from 'react';
import { View, Text, Pressable, Image, ScrollView, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const MAX_WIDTH = 1200;

function Container({ children, style }: { children: React.ReactNode; style?: any }) {
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
          <Text style={{ fontSize: 24, fontWeight: '700', color: '#1A1918' }}>k9d8</Text>
          
          {!isMobile && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 40 }}>
              <Pressable>
                <Text style={{ fontSize: 15, fontWeight: '500', color: '#6D6C6A' }}>Features</Text>
              </Pressable>
              <Pressable>
                <Text style={{ fontSize: 15, fontWeight: '500', color: '#6D6C6A' }}>How it Works</Text>
              </Pressable>
              <Pressable>
                <Text style={{ fontSize: 15, fontWeight: '500', color: '#6D6C6A' }}>About</Text>
              </Pressable>
              <Pressable onPress={() => router.push('/(auth)/sign-in')}>
                <Text style={{ fontSize: 15, fontWeight: '500', color: '#6D6C6A' }}>Log In</Text>
              </Pressable>
              <Pressable 
                onPress={() => router.push('/(auth)/sign-up')}
                style={{ 
                  backgroundColor: '#3D8A5A', 
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
              <Ionicons name={mobileMenuOpen ? 'close' : 'menu'} size={28} color="#1A1918" />
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
              borderBottomColor: '#E5E4E1',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              gap: 20,
            }}
          >
            <Pressable onPress={() => setMobileMenuOpen(false)}>
              <Text style={{ fontSize: 16, fontWeight: '500', color: '#6D6C6A' }}>Features</Text>
            </Pressable>
            <Pressable onPress={() => setMobileMenuOpen(false)}>
              <Text style={{ fontSize: 16, fontWeight: '500', color: '#6D6C6A' }}>How it Works</Text>
            </Pressable>
            <Pressable onPress={() => setMobileMenuOpen(false)}>
              <Text style={{ fontSize: 16, fontWeight: '500', color: '#6D6C6A' }}>About</Text>
            </Pressable>
            <View style={{ height: 1, backgroundColor: '#E5E4E1', marginVertical: 4 }} />
            <Pressable 
              onPress={() => {
                setMobileMenuOpen(false);
                router.push('/(auth)/sign-in');
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: '500', color: '#1A1918' }}>Log In</Text>
            </Pressable>
            <Pressable 
              onPress={() => {
                setMobileMenuOpen(false);
                router.push('/(auth)/sign-up');
              }}
              style={{ 
                backgroundColor: '#3D8A5A', 
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

export default function LandingPage() {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#F5F4F1' }}
      contentContainerStyle={{ minHeight: '100%' }}
    >
      <Header />
      <HeroSection />
    </ScrollView>
  );
}
