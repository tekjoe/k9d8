import { supabase } from '../lib/supabase';
import type { Dog, Profile, Database } from '../types/database';

export interface DogWithOwner extends Dog {
  owner: Profile;
}

type DogInsert = Database['public']['Tables']['dogs']['Insert'];
type DogUpdate = Database['public']['Tables']['dogs']['Update'];

export async function getDogsByOwner(ownerId: string): Promise<Dog[]> {
  const { data, error } = await supabase
    .from('dogs')
    .select('*')
    .eq('owner_id', ownerId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getDogWithOwner(id: string): Promise<DogWithOwner> {
  const { data, error } = await supabase
    .from('dogs')
    .select('*, owner:profiles!owner_id(*)')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as DogWithOwner;
}

export async function getDogById(id: string): Promise<Dog> {
  const { data, error } = await supabase
    .from('dogs')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function createDog(data: DogInsert): Promise<Dog> {
  const { data: dog, error } = await supabase
    .from('dogs')
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return dog;
}

export async function updateDog(id: string, data: DogUpdate): Promise<Dog> {
  const { data: dog, error } = await supabase
    .from('dogs')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return dog;
}

export async function deleteDog(id: string): Promise<void> {
  const { error } = await supabase
    .from('dogs')
    .update({ is_active: false })
    .eq('id', id);

  if (error) throw error;
}

export async function uploadDogPhoto(
  userId: string,
  uri: string,
): Promise<string> {
  const timestamp = Date.now();
  const filePath = `${userId}/${timestamp}.jpg`;

  const response = await fetch(uri);
  const blob = await response.blob();

  const { error: uploadError } = await supabase.storage
    .from('dog-photos')
    .upload(filePath, blob, {
      contentType: 'image/jpeg',
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('dog-photos')
    .getPublicUrl(filePath);

  return data.publicUrl;
}
