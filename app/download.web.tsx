import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, Linking, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SEOHead, StructuredData, mobileAppSchema } from '@/src/components/seo';
import { getParkStateCounts, getParkCityCounts } from '@/src/services/parks';
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

interface StoreButtonProps {
  label: string;
  sublabel: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  variant?: 'dark' | 'light';
}

function StoreButton({ label, sublabel, icon, onPress, variant = 'dark' }: StoreButtonProps) {
  const isDark = variant === 'dark';
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: isDark ? '#1A1918' : '#FFFFFF',
        paddingHorizontal: isDark ? 24 : 28,
        paddingVertical: 14,
        borderRadius: 12,
        gap: 10,
      }}
    >
      <Ionicons name={icon} size={22} color={isDark ? '#fff' : '#1A1918'} />
      <View>
        <Text style={{ fontSize: 10, color: isDark ? 'rgba(255,255,255,0.73)' : '#6D6C6A' }}>{sublabel}</Text>
        <Text style={{ fontSize: 17, fontWeight: '600', color: isDark ? '#fff' : '#1A1918' }}>{label}</Text>
      </View>
    </Pressable>
  );
}

const FEATURES = [
  {
    icon: 'map' as const,
    title: 'Interactive Dog Park Map',
    description: 'Discover off-leash parks near you with real-time info on amenities, hours, and current visitors.',
  },
  {
    icon: 'calendar' as const,
    title: 'Playdate Scheduling',
    description: 'Schedule playdates with other dog owners at your favorite parks. Never visit an empty park again.',
  },
  {
    icon: 'chatbubble' as const,
    title: 'Direct Messaging',
    description: 'Chat directly with dog owners you meet at the park. Coordinate meetups and share tips.',
  },
  {
    icon: 'paw' as const,
    title: 'Dog Profiles',
    description:
      'Create profiles for your pups with photos, breed info, and personality traits so others can get to know them.',
  },
];

export default function DownloadPage() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;

  const [totalParks, setTotalParks] = useState(0);
  const [totalCities, setTotalCities] = useState(0);
  const [totalStates, setTotalStates] = useState(0);

  useEffect(() => {
    getParkStateCounts()
      .then((states) => {
        setTotalStates(states.length);
        setTotalParks(states.reduce((sum, s) => sum + s.count, 0));
      })
      .catch(() => {});
    getParkCityCounts()
      .then((cities) => setTotalCities(cities.length))
      .catch(() => {});
  }, []);

  const stats = [
    { value: totalParks > 0 ? totalParks.toLocaleString() + '+' : '—', label: 'Dog Parks Listed' },
    { value: totalCities > 0 ? totalCities.toLocaleString() : '—', label: 'Cities Covered' },
    { value: totalStates > 0 ? String(totalStates) : '—', label: 'States' },
  ];

  return (
    <>
      <SEOHead
        title="Download k9d8 - Free Dog Playdate App for iOS & Android"
        description="Download k9d8 for free on iOS and Android. Find dog parks, schedule playdates, and connect with dog owners near you."
        url="/download"
      />
      <StructuredData data={mobileAppSchema()} />
      <ScrollView style={{ flex: 1, backgroundColor: '#F5F4F1' }} contentContainerStyle={{ minHeight: '100%' }}>
        <NavBar />

        <View role="main">
          {/* Hero Section */}
          <View
            style={{
              width: '100%',
              backgroundColor: '#FAFAF8',
              paddingVertical: isMobile ? 48 : 80,
              paddingHorizontal: isMobile ? 24 : 48,
            }}
          >
            <View
              style={{
                width: '100%',
                maxWidth: MAX_WIDTH,
                marginHorizontal: 'auto',
                flexDirection: isMobile ? 'column' : 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: isMobile ? 40 : 64,
              }}
            >
              {/* Hero Left */}
              <View
                style={{
                  gap: 32,
                  maxWidth: isMobile ? undefined : 520,
                  alignItems: isMobile ? 'center' : 'flex-start',
                }}
              >
                {/* Badge */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    backgroundColor: '#C8F0D8',
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 100,
                  }}
                >
                  <Ionicons name="star" size={16} color="#3D8A5A" />
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#3D8A5A' }}>
                    Free forever &bull; No credit card required
                  </Text>
                </View>

                {/* Heading */}
                <Text
                  role="heading"
                  aria-level={1}
                  style={{
                    fontSize: isMobile ? 32 : isTablet ? 36 : 44,
                    fontWeight: '700',
                    color: '#1A1918',
                    letterSpacing: -1,
                    lineHeight: isMobile ? 38 : isTablet ? 43 : 50,
                    textAlign: isMobile ? 'center' : 'left',
                  }}
                >
                  Find dog parks.{'\n'}Make friends.{'\n'}Schedule playdates.
                </Text>

                {/* Subtitle */}
                <Text
                  style={{
                    fontSize: isMobile ? 16 : 18,
                    color: '#6D6C6A',
                    lineHeight: isMobile ? 25 : 29,
                    textAlign: isMobile ? 'center' : 'left',
                    maxWidth: 460,
                  }}
                >
                  k9d8 is the free app that connects dog owners with nearby parks, real-time check-ins, and a community
                  of dog lovers.
                </Text>

                {/* Store Buttons */}
                <View style={{ flexDirection: isMobile ? 'column' : 'row', gap: 16 }}>
                  <StoreButton
                    label="App Store"
                    sublabel="Download on the"
                    icon="logo-apple"
                    onPress={() => Linking.openURL('https://apps.apple.com')}
                  />
                  <StoreButton
                    label="Google Play"
                    sublabel="Get it on"
                    icon="logo-google-playstore"
                    onPress={() => Linking.openURL('https://play.google.com')}
                  />
                </View>
              </View>

              {/* Phone Mockup */}
              {!isMobile && (
                <View
                  style={{
                    width: isTablet ? 260 : 320,
                    height: isTablet ? 470 : 580,
                    borderRadius: 40,
                    backgroundColor: '#FFFFFF',
                    borderWidth: 2,
                    borderColor: '#E5E4E1',
                    overflow: 'hidden',
                    shadowColor: '#1A1918',
                    shadowOffset: { width: 0, height: 16 },
                    shadowOpacity: 0.08,
                    shadowRadius: 48,
                  }}
                >
                  {/* Phone Status Bar */}
                  <View
                    style={{
                      height: 44,
                      backgroundColor: '#3D8A5A',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingHorizontal: 24,
                    }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>9:41</Text>
                    <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                      <Ionicons name="cellular" size={14} color="#fff" />
                      <Ionicons name="wifi" size={14} color="#fff" />
                      <Ionicons name="battery-full" size={14} color="#fff" />
                    </View>
                  </View>

                  {/* Phone Header */}
                  <View style={{ backgroundColor: '#3D8A5A', padding: 16, paddingHorizontal: 20, gap: 12 }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#fff' }}>Good morning, Sarah!</Text>
                    <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.73)' }}>3 parks nearby</Text>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: 'rgba(255,255,255,0.13)',
                        borderRadius: 8,
                        paddingHorizontal: 14,
                        paddingVertical: 10,
                        gap: 8,
                      }}
                    >
                      <Ionicons name="search" size={14} color="rgba(255,255,255,0.6)" />
                      <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>Search parks...</Text>
                    </View>
                  </View>

                  {/* Phone Content */}
                  <View style={{ flex: 1, backgroundColor: '#F5F4F1', padding: 16, gap: 14 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#1A1918' }}>Nearby Parks</Text>
                    {['Riverside Dog Park', 'Oakwood Off-Leash Area'].map((name) => (
                      <View
                        key={name}
                        style={{
                          backgroundColor: '#fff',
                          borderRadius: 12,
                          overflow: 'hidden',
                          shadowColor: '#1A1918',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.03,
                          shadowRadius: 8,
                        }}
                      >
                        <View style={{ height: isTablet ? 60 : 80, backgroundColor: '#E5E4E1' }} />
                        <View style={{ padding: 12, gap: 4 }}>
                          <Text style={{ fontSize: 13, fontWeight: '600', color: '#1A1918' }}>{name}</Text>
                          <Text style={{ fontSize: 11, color: '#6D6C6A' }}>0.8 mi away</Text>
                        </View>
                      </View>
                    ))}
                  </View>

                  {/* Phone Tab Bar */}
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-around',
                      backgroundColor: '#fff',
                      paddingTop: 10,
                      paddingBottom: 24,
                      paddingHorizontal: 20,
                      borderTopWidth: 1,
                      borderTopColor: '#E5E4E1',
                    }}
                  >
                    {(['home', 'map', 'calendar', 'person'] as const).map((icon) => (
                      <View key={icon} style={{ alignItems: 'center', gap: 4 }}>
                        <Ionicons
                          name={icon === 'home' ? 'home' : icon === 'map' ? 'map' : icon === 'calendar' ? 'calendar' : 'person'}
                          size={20}
                          color={icon === 'home' ? '#3D8A5A' : '#9C9B99'}
                        />
                        <Text
                          style={{
                            fontSize: 10,
                            fontWeight: '500',
                            color: icon === 'home' ? '#3D8A5A' : '#9C9B99',
                          }}
                        >
                          {icon === 'home' ? 'Home' : icon === 'map' ? 'Explore' : icon === 'calendar' ? 'Playdates' : 'Profile'}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Features Section */}
          <View style={{ width: '100%', paddingVertical: isMobile ? 48 : 72 }}>
            <Container style={{ gap: 48 }}>
              {/* Features Header */}
              <View style={{ alignItems: 'center', gap: 12 }}>
                <Text
                  role="heading"
                  aria-level={2}
                  style={{
                    fontSize: isMobile ? 24 : 32,
                    fontWeight: '700',
                    color: '#1A1918',
                    letterSpacing: -0.5,
                    textAlign: 'center',
                  }}
                >
                  Everything you need at the park
                </Text>
                <Text
                  style={{
                    fontSize: isMobile ? 14 : 16,
                    color: '#6D6C6A',
                    textAlign: 'center',
                    maxWidth: 500,
                  }}
                >
                  k9d8 makes every park visit better with these powerful features.
                </Text>
              </View>

              {/* Feature Cards Grid */}
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: 24,
                }}
              >
                {FEATURES.map((feat) => (
                  <View
                    key={feat.title}
                    style={{
                      width: isMobile ? '100%' : `${(100 - 2.2) / 2}%`,
                      backgroundColor: '#FFFFFF',
                      borderRadius: 16,
                      padding: isMobile ? 24 : 28,
                      gap: 16,
                      shadowColor: '#1A1918',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.03,
                      shadowRadius: 12,
                    }}
                  >
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        backgroundColor: '#C8F0D8',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <Ionicons name={feat.icon} size={22} color="#3D8A5A" />
                    </View>
                    <Text style={{ fontSize: 17, fontWeight: '600', color: '#1A1918' }}>{feat.title}</Text>
                    <Text style={{ fontSize: 14, color: '#6D6C6A', lineHeight: 22 }}>{feat.description}</Text>
                  </View>
                ))}
              </View>
            </Container>
          </View>

          {/* Stats Section */}
          <View
            style={{
              width: '100%',
              backgroundColor: '#FFFFFF',
              borderTopWidth: 1,
              borderBottomWidth: 1,
              borderColor: '#E5E4E1',
              paddingVertical: isMobile ? 32 : 56,
            }}
          >
            <Container>
              <View
                style={{
                  flexDirection: isMobile ? 'column' : 'row',
                  alignItems: 'center',
                  justifyContent: 'space-around',
                  gap: isMobile ? 24 : 0,
                }}
              >
                {stats.map((stat, i) => (
                  <React.Fragment key={stat.label}>
                    {i > 0 && !isMobile && (
                      <View style={{ width: 1, height: 60, backgroundColor: '#E5E4E1' }} />
                    )}
                    {i > 0 && isMobile && (
                      <View style={{ width: 80, height: 1, backgroundColor: '#E5E4E1' }} />
                    )}
                    <View style={{ alignItems: 'center', gap: 4 }}>
                      <Text
                        style={{
                          fontSize: isMobile ? 28 : 36,
                          fontWeight: '700',
                          color: '#3D8A5A',
                          letterSpacing: -0.5,
                        }}
                      >
                        {stat.value}
                      </Text>
                      <Text style={{ fontSize: 15, color: '#6D6C6A' }}>{stat.label}</Text>
                    </View>
                  </React.Fragment>
                ))}
              </View>
            </Container>
          </View>

          {/* CTA Section */}
          <View style={{ width: '100%', paddingVertical: isMobile ? 40 : 64 }}>
            <Container>
              <View
                style={{
                  alignItems: 'center',
                  backgroundColor: '#3D8A5A',
                  borderRadius: 24,
                  paddingVertical: isMobile ? 40 : 56,
                  paddingHorizontal: isMobile ? 24 : 64,
                  gap: 24,
                }}
              >
                <Text
                  style={{
                    fontSize: isMobile ? 22 : 30,
                    fontWeight: '700',
                    color: '#FFFFFF',
                    letterSpacing: -0.5,
                    textAlign: 'center',
                  }}
                >
                  Ready to find your new favorite dog park?
                </Text>
                <Text
                  style={{
                    fontSize: isMobile ? 14 : 16,
                    color: 'rgba(255,255,255,0.8)',
                    textAlign: 'center',
                    lineHeight: isMobile ? 22 : 26,
                    maxWidth: 580,
                  }}
                >
                  Download k9d8 for free and join thousands of dog owners who are already connecting at parks near them.
                </Text>
                <View style={{ flexDirection: isMobile ? 'column' : 'row', gap: 16 }}>
                  <StoreButton
                    label="App Store"
                    sublabel="Download on the"
                    icon="logo-apple"
                    variant="light"
                    onPress={() => Linking.openURL('https://apps.apple.com')}
                  />
                  <StoreButton
                    label="Google Play"
                    sublabel="Get it on"
                    icon="logo-google-playstore"
                    variant="light"
                    onPress={() => Linking.openURL('https://play.google.com')}
                  />
                </View>
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
