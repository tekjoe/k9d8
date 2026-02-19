import React from 'react';
import { View, Text, ScrollView, useWindowDimensions, Linking } from 'react-native';
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

export default function TermsOfServicePage() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  return (
    <>
      <SEOHead
        title="Terms of Service - k9d8"
        description="k9d8 Terms of Service - Rules and guidelines for using our app."
        url="/terms"
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
              Terms of Service
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: '#6D6C6A',
                textAlign: 'center',
                marginTop: 8,
              }}
            >
              Effective Date: February 18, 2026
            </Text>
          </Container>
        </View>

        {/* Content */}
        <Container style={{ paddingTop: 32, paddingBottom: 64 }}>
          <Paragraph>
            Welcome to k9d8! These Terms of Service (&quot;Terms&quot;) govern your use of the k9d8 mobile application and related services (collectively, the &quot;Service&quot;). By accessing or using the Service, you agree to be bound by these Terms. If you do not agree to these Terms, please do not use the Service.
          </Paragraph>

          <SectionTitle>1. Acceptance of Terms</SectionTitle>
          <Paragraph>
            By creating an account, accessing, or using k9d8, you acknowledge that you have read, understood, and agree to be bound by these Terms and our Privacy Policy. If you are using the Service on behalf of an organization, you represent and warrant that you have the authority to bind that organization to these Terms.
          </Paragraph>

          <SectionTitle>2. Eligibility</SectionTitle>
          <Paragraph>
            You must be at least 13 years old to use k9d8. By using the Service, you represent and warrant that:
          </Paragraph>
          <BulletPoint>You are at least 13 years of age</BulletPoint>
          <BulletPoint>You have the legal capacity to enter into these Terms</BulletPoint>
          <BulletPoint>You are not prohibited from using the Service under applicable laws</BulletPoint>
          <BulletPoint>You will comply with these Terms and all applicable laws</BulletPoint>

          <Paragraph>
            If you are between 13 and 18 years old, you must have parental consent to use the Service, and your parent or guardian must review and agree to these Terms on your behalf.
          </Paragraph>

          <SectionTitle>3. Account Registration</SectionTitle>
          <Paragraph>
            To access certain features of k9d8, you must create an account. When registering, you agree to:
          </Paragraph>
          <BulletPoint>Provide accurate, current, and complete information</BulletPoint>
          <BulletPoint>Maintain and promptly update your account information</BulletPoint>
          <BulletPoint>Keep your password secure and confidential</BulletPoint>
          <BulletPoint>Be responsible for all activities that occur under your account</BulletPoint>
          <BulletPoint>Notify us immediately of any unauthorized use of your account</BulletPoint>

          <Paragraph>
            We reserve the right to suspend or terminate your account if any information provided is inaccurate, false, or outdated.
          </Paragraph>

          <SectionTitle>4. User Conduct</SectionTitle>
          <Paragraph>
            You agree to use k9d8 in a manner consistent with its purpose as a social network for dog owners. You agree NOT to:
          </Paragraph>
          <BulletPoint>Use the Service for any illegal purpose or in violation of any laws</BulletPoint>
          <BulletPoint>Harass, abuse, threaten, or intimidate other users</BulletPoint>
          <BulletPoint>Post content that is defamatory, obscene, pornographic, or offensive</BulletPoint>
          <BulletPoint>Impersonate any person or entity, or misrepresent your identity</BulletPoint>
          <BulletPoint>Post false or misleading information</BulletPoint>
          <BulletPoint>Upload viruses, malware, or other harmful code</BulletPoint>
          <BulletPoint>Attempt to gain unauthorized access to the Service or other users&apos; accounts</BulletPoint>
          <BulletPoint>Scrape, crawl, or use automated means to access the Service</BulletPoint>
          <BulletPoint>Use the Service to spam or send unsolicited communications</BulletPoint>
          <BulletPoint>Post content that promotes violence, discrimination, or illegal activities</BulletPoint>

          <SectionTitle>5. Content</SectionTitle>
          
          <SubSectionTitle>5.1 Your Content</SubSectionTitle>
          <Paragraph>
            You retain ownership of any content you post on k9d8, including photos, text, and profile information (&quot;User Content&quot;). By posting content, you grant k9d8 a non-exclusive, royalty-free, worldwide license to use, display, reproduce, and distribute your content in connection with the Service.
          </Paragraph>

          <SubSectionTitle>5.2 Content Standards</SubSectionTitle>
          <Paragraph>
            You are solely responsible for your User Content. You represent and warrant that:
          </Paragraph>
          <BulletPoint>You own or have the necessary rights to post your content</BulletPoint>
          <BulletPoint>Your content does not infringe on any third party&apos;s intellectual property rights</BulletPoint>
          <BulletPoint>Your content does not violate any person&apos;s privacy or publicity rights</BulletPoint>
          <BulletPoint>You have permission to post photos of any dogs or people in your content</BulletPoint>

          <SubSectionTitle>5.3 Content Removal</SubSectionTitle>
          <Paragraph>
            We reserve the right, but not the obligation, to review, monitor, or remove any content at our sole discretion. We may remove content that violates these Terms or that we find objectionable for any reason.
          </Paragraph>

          <SubSectionTitle>5.4 Reporting Content</SubSectionTitle>
          <Paragraph>
            If you encounter content that violates these Terms, please report it to us at support@k9d8.com.
          </Paragraph>

          <SectionTitle>6. Safety and Liability</SectionTitle>
          
          <SubSectionTitle>6.1 Dog Safety</SubSectionTitle>
          <Paragraph>
            k9d8 is a platform for connecting dog owners. You are solely responsible for:
          </Paragraph>
          <BulletPoint>Your dog&apos;s behavior and interactions with other dogs and people</BulletPoint>
          <BulletPoint>Ensuring your dog is properly vaccinated and healthy</BulletPoint>
          <BulletPoint>Following local leash laws and park regulations</BulletPoint>
          <BulletPoint>Making informed decisions about meetups and playdates</BulletPoint>

          <SubSectionTitle>6.2 In-Person Meetings</SubSectionTitle>
          <Paragraph>
            k9d8 facilitates connections between users, but we do not endorse or guarantee any user or their dog. When meeting other users:
          </Paragraph>
          <BulletPoint>Meet in public places</BulletPoint>
          <BulletPoint>Exercise caution and good judgment</BulletPoint>
          <BulletPoint>Inform someone of your plans</BulletPoint>
          <BulletPoint>Report any concerning behavior to us</BulletPoint>

          <SubSectionTitle>6.3 Limitation of Liability</SubSectionTitle>
          <Paragraph>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, K9D8 AND ITS OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE SERVICE, INCLUDING BUT NOT LIMITED TO INJURIES TO YOU, YOUR DOG, OR PROPERTY DAMAGE RESULTING FROM IN-PERSON MEETINGS ARRANGED THROUGH THE SERVICE.
          </Paragraph>

          <SectionTitle>7. Intellectual Property</SectionTitle>
          
          <SubSectionTitle>7.1 Our Intellectual Property</SubSectionTitle>
          <Paragraph>
            k9d8 and its original content, features, and functionality are owned by k9d8 and are protected by copyright, trademark, and other intellectual property laws. You may not copy, modify, distribute, sell, or lease any part of our Service without our written permission.
          </Paragraph>

          <SubSectionTitle>7.2 Feedback</SubSectionTitle>
          <Paragraph>
            We welcome feedback about our Service. By providing feedback, you grant us the right to use it without restriction or compensation to you.
          </Paragraph>

          <SectionTitle>8. Third-Party Services</SectionTitle>
          <Paragraph>
            k9d8 may integrate with third-party services (such as Mapbox, Supabase, and Firebase). Your use of these services is subject to their respective terms of service and privacy policies. We are not responsible for the content or practices of third-party services.
          </Paragraph>

          <SectionTitle>9. Termination</SectionTitle>
          
          <SubSectionTitle>9.1 By You</SubSectionTitle>
          <Paragraph>
            You may delete your account at any time through the app settings. Upon deletion, your account and data will be removed in accordance with our Privacy Policy.
          </Paragraph>

          <SubSectionTitle>9.2 By Us</SubSectionTitle>
          <Paragraph>
            We may suspend or terminate your account, with or without notice, for any violation of these Terms or for any other reason at our sole discretion.
          </Paragraph>

          <SubSectionTitle>9.3 Effect of Termination</SubSectionTitle>
          <Paragraph>
            Upon termination, your right to use the Service immediately ceases. All provisions of these Terms that by their nature should survive termination shall survive, including ownership provisions, warranty disclaimers, and limitations of liability.
          </Paragraph>

          <SectionTitle>10. Disclaimers</SectionTitle>
          <Paragraph>
            THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
          </Paragraph>
          <Paragraph>
            WE DO NOT WARRANT THAT:
          </Paragraph>
          <BulletPoint>The Service will be uninterrupted, secure, or error-free</BulletPoint>
          <BulletPoint>Any defects or errors will be corrected</BulletPoint>
          <BulletPoint>The Service is free of viruses or other harmful components</BulletPoint>
          <BulletPoint>The results of using the Service will meet your requirements</BulletPoint>

          <SectionTitle>11. Indemnification</SectionTitle>
          <Paragraph>
            You agree to indemnify, defend, and hold harmless k9d8 and its officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, and expenses (including reasonable attorneys&apos; fees) arising out of or in connection with:
          </Paragraph>
          <BulletPoint>Your access to or use of the Service</BulletPoint>
          <BulletPoint>Your violation of these Terms</BulletPoint>
          <BulletPoint>Your violation of any third party&apos;s rights</BulletPoint>
          <BulletPoint>Your conduct in connection with the Service</BulletPoint>

          <SectionTitle>12. Changes to Terms</SectionTitle>
          <Paragraph>
            We may modify these Terms at any time. We will notify you of significant changes by posting the new Terms on this page and updating the effective date. Your continued use of the Service after changes constitutes acceptance of the updated Terms.
          </Paragraph>

          <SectionTitle>13. Governing Law</SectionTitle>
          <Paragraph>
            These Terms shall be governed by and construed in accordance with the laws of the United States and the State of [Your State], without regard to its conflict of law provisions. Any disputes arising under these Terms shall be resolved in the courts located in [Your City, State].
          </Paragraph>

          <SectionTitle>14. Severability</SectionTitle>
          <Paragraph>
            If any provision of these Terms is found to be unenforceable or invalid, that provision shall be limited or eliminated to the minimum extent necessary, and the remaining provisions shall remain in full force and effect.
          </Paragraph>

          <SectionTitle>15. Entire Agreement</SectionTitle>
          <Paragraph>
            These Terms, together with our Privacy Policy, constitute the entire agreement between you and k9d8 regarding the use of the Service, superseding any prior agreements.
          </Paragraph>

          <SectionTitle>16. Contact Us</SectionTitle>
          <Paragraph>
            If you have any questions about these Terms, please contact us:
          </Paragraph>
          <BulletPoint>Email: support@k9d8.com</BulletPoint>
          <BulletPoint>Address: [Your Company Address]</BulletPoint>

          <Paragraph style={{ marginTop: 32 }}>
            Thank you for using k9d8!
          </Paragraph>
        </Container>

        <Footer />
      </ScrollView>
    </>
  );
}
