import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/colors';
import { useAuth } from '@/src/hooks/useAuth';
import { usePlaydates } from '@/src/hooks/usePlaydates';
import { useDogs } from '@/src/hooks/useDogs';
import { PlaydateForm } from '@/src/components/playdates/PlaydateForm';
import type { PlaydateFormData } from '@/src/components/playdates/PlaydateForm';
import type { Park } from '@/src/types/database';
import { supabase } from '@/src/lib/supabase';
import { rsvpToPlayDate } from '@/src/services/playdates';

export default function CreatePlaydateScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { create } = usePlaydates();
  const { dogs } = useDogs(session?.user?.id);
  const params = useLocalSearchParams<{ parkId?: string }>();

  const [parks, setParks] = useState<Park[]>([]);
  const [loadingParks, setLoadingParks] = useState(true);

  useEffect(() => {
    async function loadParks() {
      try {
        const { data, error } = await supabase
          .from('parks')
          .select('*')
          .order('name');

        if (error) throw error;
        setParks(data as Park[]);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to load parks';
        Alert.alert('Error', message);
      } finally {
        setLoadingParks(false);
      }
    }

    loadParks();
  }, []);

  const handleSubmit = useCallback(
    async (data: PlaydateFormData) => {
      if (!session?.user?.id) return;

      try {
        const playDate = await create({
          organizer_id: session.user.id,
          park_id: data.park_id,
          title: data.title,
          description: data.description || null,
          starts_at: data.starts_at.toISOString(),
          ends_at: data.ends_at.toISOString(),
          max_dogs: data.max_dogs,
        });

        if (data.dog_ids.length > 0) {
          await Promise.all(
            data.dog_ids.map((dogId) =>
              rsvpToPlayDate(playDate.id, session.user.id, dogId, 'going'),
            ),
          );
        }

        router.back();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to create play date';
        Alert.alert('Error', message);
      }
    },
    [session, create, router],
  );

  if (loadingParks) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F4F1' }}>
        <ActivityIndicator size="large" color="#3D8A5A" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F4F1' }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#FFFFFF',
          paddingHorizontal: 16,
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: '#E5E4E1',
        }}
      >
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          style={{ width: 40, height: 40, justifyContent: 'center', alignItems: 'center' }}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </Pressable>
        <Text style={{ fontSize: 18, fontWeight: '600', color: '#1A1918', marginLeft: 12 }}>
          Schedule a Play Date
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        <PlaydateForm
          parks={parks}
          dogs={dogs}
          defaultValues={params.parkId ? { park_id: params.parkId } : undefined}
          onSubmit={handleSubmit}
          submitLabel="Schedule Play Date"
        />
      </ScrollView>
    </View>
  );
}
