jest.mock('../../src/lib/supabase');
jest.mock('../../src/utils/fileUpload', () => ({
  readFileForUpload: jest.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
}));

import { getDogsByOwner, getDogWithOwner, getDogById, createDog, updateDog, deleteDog, uploadDogPhoto } from '../../src/services/dogs';
import { supabase } from '../../src/lib/supabase';

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

function mockFrom(resolvedValue: { data: any; error: any }) {
  const chain: any = {};
  const methods = ['select', 'insert', 'update', 'delete', 'eq', 'neq', 'is', 'order', 'limit', 'single', 'maybeSingle'];
  for (const m of methods) chain[m] = jest.fn().mockReturnValue(chain);
  chain.then = (resolve: any) => Promise.resolve(resolve(resolvedValue));
  mockSupabase.from.mockReturnValue(chain);
  return chain;
}

beforeEach(() => jest.clearAllMocks());

describe('dogs service', () => {
  describe('getDogsByOwner', () => {
    it('returns dogs for an owner', async () => {
      const dogs = [{ id: 'dog-1', name: 'Buddy' }];
      mockFrom({ data: dogs, error: null });
      const result = await getDogsByOwner('user-1');
      expect(result).toEqual(dogs);
      expect(mockSupabase.from).toHaveBeenCalledWith('dogs');
    });

    it('throws on error', async () => {
      mockFrom({ data: null, error: { message: 'fail' } });
      await expect(getDogsByOwner('user-1')).rejects.toEqual({ message: 'fail' });
    });
  });

  describe('getDogWithOwner', () => {
    it('returns dog with owner profile', async () => {
      const dog = { id: 'dog-1', name: 'Buddy', owner: { id: 'user-1' } };
      mockFrom({ data: dog, error: null });
      const result = await getDogWithOwner('dog-1');
      expect(result).toEqual(dog);
    });
  });

  describe('getDogById', () => {
    it('returns a single dog', async () => {
      const dog = { id: 'dog-1', name: 'Buddy' };
      mockFrom({ data: dog, error: null });
      const result = await getDogById('dog-1');
      expect(result).toEqual(dog);
    });
  });

  describe('createDog', () => {
    it('inserts and returns a dog', async () => {
      const dog = { id: 'dog-1', name: 'Buddy', owner_id: 'user-1' };
      mockFrom({ data: dog, error: null });
      const result = await createDog({ name: 'Buddy', owner_id: 'user-1' } as any);
      expect(result).toEqual(dog);
    });

    it('throws on error', async () => {
      mockFrom({ data: null, error: { message: 'insert fail' } });
      await expect(createDog({ name: 'Buddy' } as any)).rejects.toEqual({ message: 'insert fail' });
    });
  });

  describe('updateDog', () => {
    it('updates and returns a dog', async () => {
      const dog = { id: 'dog-1', name: 'Max' };
      mockFrom({ data: dog, error: null });
      const result = await updateDog('dog-1', { name: 'Max' });
      expect(result).toEqual(dog);
    });
  });

  describe('deleteDog', () => {
    it('soft-deletes by setting is_active to false', async () => {
      const chain = mockFrom({ data: null, error: null });
      await deleteDog('dog-1');
      expect(chain.update).toHaveBeenCalledWith({ is_active: false });
    });
  });

  describe('uploadDogPhoto', () => {
    it('uploads and returns public URL', async () => {
      const bucket = {
        upload: jest.fn().mockResolvedValue({ data: { path: 'test' }, error: null }),
        getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/photo.jpg' } }),
        remove: jest.fn(),
        download: jest.fn(),
      };
      mockSupabase.storage.from.mockReturnValue(bucket as any);
      const result = await uploadDogPhoto('user-1', 'file:///photo.jpg');
      expect(result).toBe('https://example.com/photo.jpg');
      expect(bucket.upload).toHaveBeenCalled();
    });

    it('throws on upload error', async () => {
      const bucket = {
        upload: jest.fn().mockResolvedValue({ data: null, error: { message: 'upload fail' } }),
        getPublicUrl: jest.fn(),
        remove: jest.fn(),
        download: jest.fn(),
      };
      mockSupabase.storage.from.mockReturnValue(bucket as any);
      await expect(uploadDogPhoto('user-1', 'file:///photo.jpg')).rejects.toEqual({ message: 'upload fail' });
    });
  });
});
