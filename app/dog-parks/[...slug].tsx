import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/src/hooks/useAuth';
import ParkDetailAuth from '@/src/components/web/ParkDetailAuth';

const STATE_SLUGS = ['alabama', 'arizona', 'arkansas', 'california', 'colorado', 'connecticut', 'delaware', 'florida', 'georgia', 'hawaii', 'idaho', 'illinois', 'indiana', 'iowa', 'kansas', 'kentucky', 'louisiana', 'maine', 'maryland', 'massachusetts', 'michigan', 'minnesota', 'mississippi', 'missouri', 'montana', 'nebraska', 'nevada', 'new-hampshire', 'new-jersey', 'new-mexico', 'new-york', 'north-carolina', 'north-dakota', 'ohio', 'oklahoma', 'oregon', 'pennsylvania', 'rhode-island', 'south-carolina', 'south-dakota', 'tennessee', 'texas', 'utah', 'vermont', 'virginia', 'washington', 'west-virginia', 'wisconsin', 'wyoming'];

export default function DogParkSlugPage() {
  const { slug } = useLocalSearchParams<{ slug: string | string[] }>();
  const { session } = useAuth();
  const router = useRouter();

  const slugParts = Array.isArray(slug) ? slug : slug ? [slug] : [];

  // Determine the park identifier to pass to ParkDetailAuth
  let parkSlugOrId: string | null = null;
  let stateSlug: string | undefined;

  if (slugParts.length === 1) {
    // Direct ID link, e.g. /dog-parks/5ea7d528-...
    parkSlugOrId = slugParts[0];
  } else if (slugParts.length >= 2 && STATE_SLUGS.includes(slugParts[0])) {
    // State + park slug, e.g. /dog-parks/texas/central-bark
    stateSlug = slugParts[0];
    parkSlugOrId = slugParts.slice(1).join('/');
  }

  if (parkSlugOrId) {
    if (!session) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F4F1', padding: 24, gap: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#1A1918' }}>Sign in to view park details</Text>
          <Pressable
            onPress={() => router.push('/(auth)/sign-in')}
            style={{ backgroundColor: '#3D8A5A', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 9999 }}
          >
            <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>Sign In</Text>
          </Pressable>
        </View>
      );
    }
    return <ParkDetailAuth slugOrId={parkSlugOrId} state={stateSlug} />;
  }

  // Unrecognized route — go back
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F4F1', padding: 24, gap: 16 }}>
      <Text style={{ fontSize: 16, color: '#6D6C6A' }}>This page is not available in the app.</Text>
      <Pressable onPress={() => router.back()}>
        <Text style={{ fontSize: 15, fontWeight: '600', color: '#3D8A5A' }}>Go Back</Text>
      </Pressable>
    </View>
  );
}
