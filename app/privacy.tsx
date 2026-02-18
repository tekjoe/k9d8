import React from 'react';
import { View, Text, ScrollView, useWindowDimensions, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Text
      style={{
        fontSize: 20,
        fontWeight: '700',
        color: '#1A1918',
        marginTop: 28,
        marginBottom: 12,
      }}
    >
      {children}
    </Text>
  );
}

function SubSectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Text
      style={{
        fontSize: 16,
        fontWeight: '600',
        color: '#1A1918',
        marginTop: 20,
        marginBottom: 8,
      }}
    >
      {children}
    </Text>
  );
}

function Paragraph({ children }: { children: React.ReactNode }) {
  return (
    <Text
      style={{
        fontSize: 14,
        color: '#6D6C6A',
        lineHeight: 22,
        marginBottom: 10,
      }}
    >
      {children}
    </Text>
  );
}

function BulletPoint({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', marginBottom: 6, paddingLeft: 12 }}>
      <Text style={{ fontSize: 14, color: '#6D6C6A', marginRight: 6 }}>•</Text>
      <Text style={{ fontSize: 14, color: '#6D6C6A', lineHeight: 22, flex: 1 }}>{children}</Text>
    </View>
  );
}

export default function PrivacyPolicyPage() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F4F1' }}>
      {/* Header */}
      <View
        style={{
          backgroundColor: '#FAFAF8',
          paddingTop: 60,
          paddingBottom: 16,
          paddingHorizontal: 20,
          borderBottomWidth: 1,
          borderBottomColor: '#E5E4E1',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons
            name="arrow-back"
            size={24}
            color="#1A1918"
            onPress={() => router.back()}
          />
          <Text
            style={{
              fontSize: 18,
              fontWeight: '600',
              color: '#1A1918',
              marginLeft: 12,
            }}
          >
            Privacy Policy
          </Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
      >
        <Text
          style={{
            fontSize: 12,
            color: '#9C9B99',
            marginBottom: 16,
          }}
        >
          Effective Date: February 18, 2026
        </Text>

        <Paragraph>
          k9d8 (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application.
        </Paragraph>

        <SectionTitle>1. Information We Collect</SectionTitle>
        
        <SubSectionTitle>Personal Information</SubSectionTitle>
        <BulletPoint>Account: Name, email, password, profile photo</BulletPoint>
        <BulletPoint>Dog Info: Name, breed, size, temperament, photos</BulletPoint>
        <BulletPoint>Content: Check-ins, playdates, messages</BulletPoint>

        <SubSectionTitle>Location Data</SubSectionTitle>
        <Paragraph>
          We collect GPS location when you use the map, check in at parks, or enable location features. You can disable this in device settings.
        </Paragraph>

        <SubSectionTitle>Device Info</SubSectionTitle>
        <BulletPoint>Device model, OS, app version</BulletPoint>
        <BulletPoint>Device ID for notifications</BulletPoint>
        <BulletPoint>IP address for security</BulletPoint>
        <BulletPoint>Usage patterns and crash logs</BulletPoint>

        <SectionTitle>2. How We Use Information</SectionTitle>
        <BulletPoint>Provide core features (profiles, check-ins, messaging)</BulletPoint>
        <BulletPoint>Recommend nearby parks and connections</BulletPoint>
        <BulletPoint>Send notifications and support responses</BulletPoint>
        <BulletPoint>Improve app experience and security</BulletPoint>

        <SectionTitle>3. How We Share Information</SectionTitle>
        
        <SubSectionTitle>With Other Users</SubSectionTitle>
        <BulletPoint>Public: Your profile and dogs&apos; basic info</BulletPoint>
        <BulletPoint>Check-ins: Others at same park see you&apos;re there</BulletPoint>
        <BulletPoint>Friends: Full profile shared with connections</BulletPoint>

        <SubSectionTitle>Service Providers</SubSectionTitle>
        <BulletPoint>Supabase (database)</BulletPoint>
        <BulletPoint>Firebase (analytics, notifications)</BulletPoint>
        <BulletPoint>Mapbox (maps)</BulletPoint>

        <SubSectionTitle>We Do Not</SubSectionTitle>
        <BulletPoint>Sell your personal information</BulletPoint>
        <BulletPoint>Share data for advertising</BulletPoint>
        <BulletPoint>Share exact location publicly</BulletPoint>

        <SectionTitle>4. Data Retention</SectionTitle>
        <BulletPoint>Account data: Until deletion</BulletPoint>
        <BulletPoint>Check-ins: 2 years</BulletPoint>
        <BulletPoint>Analytics: 26 months</BulletPoint>
        <BulletPoint>Crash logs: 90 days</BulletPoint>

        <SectionTitle>5. Your Rights</SectionTitle>
        <BulletPoint>Access your personal information</BulletPoint>
        <BulletPoint>Request corrections or deletion</BulletPoint>
        <BulletPoint>Export your data</BulletPoint>
        <BulletPoint>Object to certain processing</BulletPoint>
        <Paragraph style={{ marginTop: 8 }}>
          Contact privacy@k9d8.app to exercise your rights. We respond within 30 days.
        </Paragraph>

        <SectionTitle>6. Security</SectionTitle>
        <Paragraph>
          We use encryption, secure authentication, and regular audits to protect your data. No internet transmission is 100% secure.
        </Paragraph>

        <SectionTitle>7. Children</SectionTitle>
        <Paragraph>
          k9d8 is not for children under 13 (16 in EU). Contact us if you believe a child has provided information.
        </Paragraph>

        <SectionTitle>8. Contact Us</SectionTitle>
        <BulletPoint>Email: privacy@k9d8.app</BulletPoint>
        <BulletPoint>DPO (EU): dpo@k9d8.app</BulletPoint>

        <Text
          style={{
            fontSize: 12,
            color: '#9C9B99',
            marginTop: 32,
            textAlign: 'center',
          }}
        >
          Last Updated: February 18, 2026
        </Text>
      </ScrollView>
    </View>
  );
}
