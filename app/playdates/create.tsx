import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/src/hooks/useAuth';
import { usePlaydates } from '@/src/hooks/usePlaydates';
import { PlaydateForm } from '@/src/components/playdates/PlaydateForm';
import type { PlaydateFormData } from '@/src/components/playdates/PlaydateForm';
import type { Park } from '@/src/types/database';
import { supabase } from '@/src/lib/supabase';

export default function CreatePlaydateScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { create } = usePlaydates();
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
        await create({
          organizer_id: session.user.id,
          park_id: data.park_id,
          title: data.title,
          description: data.description || null,
          starts_at: data.starts_at.toISOString(),
          ends_at: data.ends_at.toISOString(),
          max_dogs: data.max_dogs,
        });
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
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4A90D9" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <PlaydateForm
        parks={parks}
        defaultValues={params.parkId ? { park_id: params.parkId } : undefined}
        onSubmit={handleSubmit}
        submitLabel="Schedule Play Date"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});
