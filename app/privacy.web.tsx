import React from 'react';
import { View, Text, ScrollView, useWindowDimensions, Linking, Pressable } from 'react-native';
import { SEOHead } from '@/src/components/seo';
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

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Text
      style={{
        fontSize: 24,
        fontWeight: '700',
        color: '#1A1918',
        marginTop: 32,
        marginBottom: 16,
        letterSpacing: -0.3,
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
        fontSize: 18,
        fontWeight: '600',
        color: '#1A1918',
        marginTop: 24,
        marginBottom: 12,
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
        fontSize: 15,
        color: '#6D6C6A',
        lineHeight: 24,
        marginBottom: 12,
      }}
    >
      {children}
    </Text>
  );
}

function BulletPoint({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', marginBottom: 8, paddingLeft: 16 }}>
      <Text style={{ fontSize: 15, color: '#6D6C6A', marginRight: 8 }}>•</Text>
      <Text style={{ fontSize: 15, color: '#6D6C6A', lineHeight: 24, flex: 1 }}>{children}</Text>
    </View>
  );
}

function TableRow({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E4E1',
        paddingVertical: 12,
      }}
    >
      <Text style={{ fontSize: 14, color: '#1A1918', fontWeight: '500', flex: 1 }}>{label}</Text>
      <Text style={{ fontSize: 14, color: '#6D6C6A', flex: 2 }}>{value}</Text>
    </View>
  );
}

export default function PrivacyPolicyPage() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  return (
    <>
      <SEOHead
        title="Privacy Policy - k9d8"
        description="k9d8 privacy policy - Learn how we collect, use, and protect your personal information."
        url="/privacy"
      />
      <ScrollView style={{ flex: 1, backgroundColor: '#F5F4F1' }}>
        <NavBar />

        {/* Hero */}
        <View
          style={{
            backgroundColor: '#FAFAF8',
            paddingTop: isMobile ? 32 : 48,
            paddingBottom: isMobile ? 24 : 32,
          }}
        >
          <Container>
            <Text
              style={{
                fontSize: isMobile ? 28 : 36,
                fontWeight: '700',
                color: '#1A1918',
                letterSpacing: -0.5,
                textAlign: 'center',
              }}
            >
              Privacy Policy
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: '#6D6C6A',
                textAlign: 'center',
                marginTop: 8,
              }}
            >
              Effective Date: February 18, 2026 • Last Updated: February 18, 2026
            </Text>
          </Container>
        </View>

        {/* Content */}
        <Container style={{ paddingTop: 32, paddingBottom: 64 }}>
          <Paragraph>
            k9d8 (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application (the &quot;App&quot;).
          </Paragraph>
          <Paragraph>
            Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the application.
          </Paragraph>

          <SectionTitle>1. Information We Collect</SectionTitle>
          
          <SubSectionTitle>1.1 Personal Information You Provide</SubSectionTitle>
          <Paragraph>We collect information you provide directly to us:</Paragraph>
          <BulletPoint><Text style={{ color: '#1A1918', fontWeight: '500' }}>Account Information:</Text> Name, email address, password (hashed), and profile photo</BulletPoint>
          <BulletPoint><Text style={{ color: '#1A1918', fontWeight: '500' }}>Dog Information:</Text> Dog name, breed, size, temperament, age, and photos</BulletPoint>
          <BulletPoint><Text style={{ color: '#1A1918', fontWeight: '500' }}>Content:</Text> Check-ins, playdates, messages, and photos you share</BulletPoint>

          <SubSectionTitle>1.2 Location Data</SubSectionTitle>
          <Paragraph>
            We collect precise location data (GPS coordinates) when you use the map to find dog parks, check in at a park, or enable location-based features. You can disable location access at any time through your device settings, though certain features will not function without it.
          </Paragraph>

          <SubSectionTitle>1.3 Device and Usage Information</SubSectionTitle>
          <Paragraph>We automatically collect:</Paragraph>
          <BulletPoint>Device model, operating system, and app version</BulletPoint>
          <BulletPoint>Unique device ID for push notifications and analytics</BulletPoint>
          <BulletPoint>IP address for security and analytics</BulletPoint>
          <BulletPoint>Usage patterns and crash logs for app improvement</BulletPoint>

          <SectionTitle>2. How We Use Your Information</SectionTitle>
          <Paragraph>We use your information to:</Paragraph>
          <BulletPoint><Text style={{ color: '#1A1918', fontWeight: '500' }}>Provide Core Features:</Text> Display profiles, facilitate check-ins, enable playdate scheduling and messaging</BulletPoint>
          <BulletPoint><Text style={{ color: '#1A1918', fontWeight: '500' }}>Personalization:</Text> Recommend nearby dog parks and suggest connections</BulletPoint>
          <BulletPoint><Text style={{ color: '#1A1918', fontWeight: '500' }}>Communication:</Text> Send service notifications and respond to support requests</BulletPoint>
          <BulletPoint><Text style={{ color: '#1A1918', fontWeight: '500' }}>Analytics:</Text> Analyze usage patterns and improve user experience</BulletPoint>
          <BulletPoint><Text style={{ color: '#1A1918', fontWeight: '500' }}>Security:</Text> Monitor for suspicious activity and enforce our Terms of Service</BulletPoint>

          <SectionTitle>3. How We Share Your Information</SectionTitle>
          
          <SubSectionTitle>3.1 Information Shared with Other Users</SubSectionTitle>
          <Paragraph>
            By using k9d8, you choose to share certain information with other users:
          </Paragraph>
          <BulletPoint><Text style={{ color: '#1A1918', fontWeight: '500' }}>Public Information:</Text> Your profile name, photo, and dogs&apos; basic info (names, breeds, sizes, photos)</BulletPoint>
          <BulletPoint><Text style={{ color: '#1A1918', fontWeight: '500' }}>Check-ins:</Text> When you check in at a park, other users at that location may see you are there</BulletPoint>
          <BulletPoint><Text style={{ color: '#1A1918', fontWeight: '500' }}>Connections:</Text> Your full profile and activity are shared with friends/connections</BulletPoint>

          <SubSectionTitle>3.2 Service Providers</SubSectionTitle>
          <Paragraph>We share information with third-party vendors who provide services on our behalf:</Paragraph>
          <View style={{ marginTop: 8, marginBottom: 16 }}>
            <TableRow label="Supabase" value="Database hosting" />
            <TableRow label="Firebase" value="Analytics, crash reporting, push notifications" />
            <TableRow label="Mapbox" value="Maps and location services" />
            <TableRow label="Google Cloud" value="Infrastructure hosting" />
          </View>

          <SubSectionTitle>3.3 What We DON&apos;T Do</SubSectionTitle>
          <Paragraph>We do not:</Paragraph>
          <BulletPoint>Sell your personal information to third parties</BulletPoint>
          <BulletPoint>Share your data for advertising purposes</BulletPoint>
          <BulletPoint>Share your exact location publicly (only general &quot;checked in at [park]&quot;)</BulletPoint>

          <SectionTitle>4. Data Retention</SectionTitle>
          <Paragraph>
            We retain your personal information for as long as necessary to fulfill the purposes outlined in this privacy policy:
          </Paragraph>
          <View style={{ marginTop: 8, marginBottom: 16 }}>
            <TableRow label="Account &amp; Profile" value="Until account deletion" />
            <TableRow label="Check-in History" value="2 years from check-in date" />
            <TableRow label="Messages" value="Until account deletion" />
            <TableRow label="Usage Analytics" value="26 months" />
            <TableRow label="Crash Logs" value="90 days" />
          </View>
          <Paragraph>
            When you delete your account, your profile and personal information are deleted within 30 days. Some data may be retained in backups for up to 90 days.
          </Paragraph>

          <SectionTitle>5. Your Privacy Rights</SectionTitle>
          <Paragraph>Depending on your location, you may have the following rights:</Paragraph>
          <BulletPoint><Text style={{ color: '#1A1918', fontWeight: '500' }}>Right to Access:</Text> Request a copy of your personal information</BulletPoint>
          <BulletPoint><Text style={{ color: '#1A1918', fontWeight: '500' }}>Right to Rectification:</Text> Request correction of inaccurate information</BulletPoint>
          <BulletPoint><Text style={{ color: '#1A1918', fontWeight: '500' }}>Right to Erasure:</Text> Request deletion of your personal information</BulletPoint>
          <BulletPoint><Text style={{ color: '#1A1918', fontWeight: '500' }}>Right to Data Portability:</Text> Request your data in a structured format</BulletPoint>
          <BulletPoint><Text style={{ color: '#1A1918', fontWeight: '500' }}>Right to Object:</Text> Object to certain types of processing</BulletPoint>
          
          <SubSectionTitle>How to Exercise Your Rights</SubSectionTitle>
          <BulletPoint><Text style={{ color: '#1A1918', fontWeight: '500' }}>In-App:</Text> Settings &gt; Profile to update info; Settings &gt; Account &gt; Delete Account</BulletPoint>
          <BulletPoint><Text style={{ color: '#1A1918', fontWeight: '500' }}>Email:</Text> Send requests to <Text style={{ color: '#3D8A5A' }}>privacy@k9d8.app</Text></BulletPoint>
          <BulletPoint><Text style={{ color: '#1A1918', fontWeight: '500' }}>Response Time:</Text> We respond to all requests within 30 days</BulletPoint>

          <SectionTitle>6. Security Measures</SectionTitle>
          <Paragraph>We implement appropriate measures to protect your data:</Paragraph>
          <BulletPoint>Encryption in transit (TLS/SSL) and at rest</BulletPoint>
          <BulletPoint>Secure authentication with hashed passwords</BulletPoint>
          <BulletPoint>Limited access to personal data (only necessary personnel)</BulletPoint>
          <BulletPoint>Regular security audits and vulnerability scanning</BulletPoint>
          <Paragraph>
            No method of transmission over the internet is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
          </Paragraph>

          <SectionTitle>7. Children&apos;s Privacy</SectionTitle>
          <Paragraph>
            k9d8 is not intended for use by children under the age of 13 (or 16 in the EU). We do not knowingly collect personal information from children under these ages. If you believe a child has provided personal information, contact us immediately at privacy@k9d8.app.
          </Paragraph>

          <SectionTitle>8. Third-Party Services</SectionTitle>
          <Paragraph>Our App contains links to and uses third-party services:</Paragraph>
          <BulletPoint>Supabase (Database) - supabase.com/privacy</BulletPoint>
          <BulletPoint>Firebase (Analytics) - firebase.google.com/support/privacy</BulletPoint>
          <BulletPoint>Mapbox (Maps) - mapbox.com/legal/privacy</BulletPoint>
          <BulletPoint>Google Play Services - policies.google.com/privacy</BulletPoint>
          <Paragraph>
            We encourage you to review the privacy policies of any third-party services you access through our App.
          </Paragraph>

          <SectionTitle>9. Changes to This Privacy Policy</SectionTitle>
          <Paragraph>
            We may update our Privacy Policy from time to time. We will notify you of changes by posting the new policy on this page and updating the &quot;Last Updated&quot; date. For material changes, we will provide at least 30 days notice through the App or email.
          </Paragraph>
          <Paragraph>
            Your continued use of the App after any changes constitutes acceptance of the updated Privacy Policy.
          </Paragraph>

          <SectionTitle>10. Contact Us</SectionTitle>
          <Paragraph>
            If you have any questions about this Privacy Policy, please contact us:
          </Paragraph>
          <BulletPoint><Text style={{ color: '#1A1918', fontWeight: '500' }}>Email:</Text> privacy@k9d8.app</BulletPoint>
          <BulletPoint><Text style={{ color: '#1A1918', fontWeight: '500' }}>DPO (EU):</Text> dpo@k9d8.app</BulletPoint>
          <BulletPoint><Text style={{ color: '#1A1918', fontWeight: '500' }}>Response Time:</Text> We aim to respond within 48 hours</BulletPoint>

          {/* California Residents Section */}
          <SectionTitle>California Privacy Rights (CCPA)</SectionTitle>
          <Paragraph>
            California residents have specific rights regarding their personal information:
          </Paragraph>
          <BulletPoint><Text style={{ color: '#1A1918', fontWeight: '500' }}>Right to Know:</Text> Request disclosure of personal information collected</BulletPoint>
          <BulletPoint><Text style={{ color: '#1A1918', fontWeight: '500' }}>Right to Delete:</Text> Request deletion of personal information</BulletPoint>
          <BulletPoint><Text style={{ color: '#1A1918', fontWeight: '500' }}>Right to Opt-Out:</Text> We do not sell personal information</BulletPoint>
          <BulletPoint><Text style={{ color: '#1A1918', fontWeight: '500' }}>Right to Non-Discrimination:</Text> Equal service regardless of privacy choices</BulletPoint>
          <Paragraph style={{ marginTop: 12 }}>
            <Text style={{ color: '#1A1918', fontWeight: '500' }}>Do Not Sell My Personal Information:</Text> k9d8 does not sell personal information as defined by CCPA.
          </Paragraph>

          {/* GDPR Section */}
          <SectionTitle>European Privacy Rights (GDPR)</SectionTitle>
          <Paragraph>We process your data under the following legal bases:</Paragraph>
          <BulletPoint><Text style={{ color: '#1A1918', fontWeight: '500' }}>Contract Performance:</Text> To provide the service you requested</BulletPoint>
          <BulletPoint><Text style={{ color: '#1A1918', fontWeight: '500' }}>Legitimate Interests:</Text> For app improvement, security, and fraud prevention</BulletPoint>
          <BulletPoint><Text style={{ color: '#1A1918', fontWeight: '500' }}>Consent:</Text> For optional features like marketing communications</BulletPoint>
          <BulletPoint><Text style={{ color: '#1A1918', fontWeight: '500' }}>Legal Obligation:</Text> When required by law</BulletPoint>
          <Paragraph style={{ marginTop: 12 }}>
            If you believe we have not processed your data in accordance with GDPR, you have the right to complain to your local data protection authority.
          </Paragraph>
        </Container>

        <Footer />
      </ScrollView>
    </>
  );
}
