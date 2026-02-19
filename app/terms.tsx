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

export default function TermsOfServicePage() {
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
            Terms of Service
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
          Welcome to k9d8! These Terms of Service govern your use of the k9d8 mobile application and related services.
        </Paragraph>

        <SectionTitle>1. Acceptance of Terms</SectionTitle>
        <Paragraph>
          By creating an account or using k9d8, you agree to be bound by these Terms and our Privacy Policy.
        </Paragraph>

        <SectionTitle>2. Eligibility</SectionTitle>
        <Paragraph>You must be at least 13 years old to use k9d8.</Paragraph>
        <BulletPoint>You are at least 13 years of age</BulletPoint>
        <BulletPoint>You have parental consent if under 18</BulletPoint>
        <BulletPoint>You will comply with these Terms</BulletPoint>

        <SectionTitle>3. Account Registration</SectionTitle>
        <Paragraph>When registering, you agree to:</Paragraph>
        <BulletPoint>Provide accurate information</BulletPoint>
        <BulletPoint>Keep your password secure</BulletPoint>
        <BulletPoint>Be responsible for account activity</BulletPoint>

        <SectionTitle>4. User Conduct</SectionTitle>
        <Paragraph>You agree NOT to:</Paragraph>
        <BulletPoint>Harass or abuse other users</BulletPoint>
        <BulletPoint>Post offensive or illegal content</BulletPoint>
        <BulletPoint>Impersonate others</BulletPoint>
        <BulletPoint>Upload viruses or malware</BulletPoint>
        <BulletPoint>Scrape or use automated access</BulletPoint>

        <SectionTitle>5. Content</SectionTitle>
        <Paragraph>
          You retain ownership of content you post. By posting, you grant k9d8 a license to display your content in connection with the Service.
        </Paragraph>

        <SectionTitle>6. Safety and Liability</SectionTitle>
        <SubSectionTitle>Dog Safety</SubSectionTitle>
        <Paragraph>You are responsible for:</Paragraph>
        <BulletPoint>Your dog&apos;s behavior and health</BulletPoint>
        <BulletPoint>Following local laws and regulations</BulletPoint>
        <BulletPoint>Making informed decisions about meetups</BulletPoint>

        <SubSectionTitle>In-Person Meetings</SubSectionTitle>
        <Paragraph>When meeting other users:</Paragraph>
        <BulletPoint>Meet in public places</BulletPoint>
        <BulletPoint>Exercise caution</BulletPoint>
        <BulletPoint>Report concerning behavior</BulletPoint>

        <SectionTitle>7. Intellectual Property</SectionTitle>
        <Paragraph>
          k9d8 and its content are protected by copyright and other laws. You may not copy or distribute our Service without permission.
        </Paragraph>

        <SectionTitle>8. Termination</SectionTitle>
        <Paragraph>
          You may delete your account at any time. We may suspend or terminate accounts for violations of these Terms.
        </Paragraph>

        <SectionTitle>9. Disclaimers</SectionTitle>
        <Paragraph>
          THE SERVICE IS PROVIDED &quot;AS IS&quot; WITHOUT WARRANTIES. WE ARE NOT LIABLE FOR DAMAGES ARISING FROM YOUR USE OF THE SERVICE.
        </Paragraph>

        <SectionTitle>10. Changes to Terms</SectionTitle>
        <Paragraph>
          We may modify these Terms at any time. Continued use constitutes acceptance of updated Terms.
        </Paragraph>

        <SectionTitle>11. Contact Us</SectionTitle>
        <BulletPoint>Email: support@k9d8.com</BulletPoint>

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
