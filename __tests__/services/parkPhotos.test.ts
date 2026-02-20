jest.mock('../../src/lib/supabase');
jest.mock('../../src/utils/fileUpload', () => ({
  readFileForUpload: jest.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
}));

import { uploadParkPhoto, getParkPhotos, voteParkPhoto, unvoteParkPhoto, deleteParkPhoto, getFeaturedPhotosForParks, reportParkPhoto } from '../../src/services/parkPhotos';
import { supabase } from '../../src/lib/supabase';

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

function mockAuth(userId: string | null) {
  mockSupabase.auth.getUser.mockResolvedValue({
    data: { user: userId ? { id: userId } : null },
    error: null,
  } as any);
}

function mockFrom(resolvedValue: { data: any; error: any }) {
  const chain: any = {};
  const methods = ['select', 'insert', 'update', 'delete', 'eq', 'neq', 'is', 'order', 'limit', 'single', 'maybeSingle', 'or', 'in'];
  for (const m of methods) chain[m] = jest.fn().mockReturnValue(chain);
  chain.then = (resolve: any) => Promise.resolve(resolve(resolvedValue));
  mockSupabase.from.mockReturnValue(chain);
  return chain;
}

beforeEach(() => jest.clearAllMocks());

describe('parkPhotos service', () => {
  describe('uploadParkPhoto', () => {
    it('uploads photo and creates record', async () => {
      const bucket = {
        upload: jest.fn().mockResolvedValue({ data: { path: 'test' }, error: null }),
        getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/photo.jpg' } }),
        remove: jest.fn(),
        download: jest.fn(),
      };
      mockSupabase.storage.from.mockReturnValue(bucket as any);
      const photo = { id: 'ph1', photo_url: 'https://example.com/photo.jpg' };
      mockFrom({ data: photo, error: null });

      const result = await uploadParkPhoto('u1', 'p1', 'file:///photo.jpg');
      expect(result.vote_count).toBe(0);
      expect(result.user_has_voted).toBe(false);
    });

    it('throws on upload error', async () => {
      const bucket = {
        upload: jest.fn().mockResolvedValue({ data: null, error: { message: 'upload fail' } }),
        getPublicUrl: jest.fn(),
        remove: jest.fn(),
        download: jest.fn(),
      };
      mockSupabase.storage.from.mockReturnValue(bucket as any);
      await expect(uploadParkPhoto('u1', 'p1', 'file:///photo.jpg')).rejects.toEqual({ message: 'upload fail' });
    });
  });

  describe('getParkPhotos', () => {
    it('returns photos with vote counts', async () => {
      let callCount = 0;
      mockSupabase.from.mockImplementation(() => {
        callCount++;
        const chain: any = {};
        const methods = ['select', 'insert', 'update', 'delete', 'eq', 'neq', 'is', 'order', 'limit', 'single', 'maybeSingle', 'or', 'in'];
        for (const m of methods) chain[m] = jest.fn().mockReturnValue(chain);
        if (callCount === 1) {
          chain.then = (resolve: any) => Promise.resolve(resolve({
            data: [{ id: 'ph1', park_id: 'p1', photo_url: 'url' }],
            error: null,
          }));
        } else {
          chain.then = (resolve: any) => Promise.resolve(resolve({ data: [], error: null }));
        }
        return chain as any;
      });

      const result = await getParkPhotos('p1');
      expect(result.length).toBe(1);
      expect(result[0].vote_count).toBe(0);
    });

    it('returns photos with votes and user vote status', async () => {
      let callCount = 0;
      mockSupabase.from.mockImplementation(() => {
        callCount++;
        const chain: any = {};
        const methods = ['select', 'insert', 'update', 'delete', 'eq', 'neq', 'is', 'order', 'limit', 'single', 'maybeSingle', 'or', 'in'];
        for (const m of methods) chain[m] = jest.fn().mockReturnValue(chain);
        if (callCount === 1) {
          chain.then = (resolve: any) => Promise.resolve(resolve({
            data: [{ id: 'ph1', park_id: 'p1', photo_url: 'url' }],
            error: null,
          }));
        } else if (callCount === 2) {
          // votes
          chain.then = (resolve: any) => Promise.resolve(resolve({
            data: [{ photo_id: 'ph1' }, { photo_id: 'ph1' }],
            error: null,
          }));
        } else {
          // user votes
          chain.then = (resolve: any) => Promise.resolve(resolve({
            data: [{ photo_id: 'ph1' }],
            error: null,
          }));
        }
        return chain as any;
      });

      const result = await getParkPhotos('p1', 'u1');
      expect(result[0].vote_count).toBe(2);
      expect(result[0].user_has_voted).toBe(true);
    });
  });

  describe('voteParkPhoto', () => {
    it('inserts a vote', async () => {
      mockAuth('u1');
      mockFrom({ data: null, error: null });
      await voteParkPhoto('ph1');
      expect(mockSupabase.from).toHaveBeenCalledWith('park_photo_votes');
    });

    it('toggles vote on duplicate (23505)', async () => {
      mockAuth('u1');
      // First call to from() for insert returns duplicate error,
      // second call for delete (unvote) succeeds
      let callCount = 0;
      mockSupabase.from.mockImplementation(() => {
        callCount++;
        const chain: any = {};
        const methods = ['select', 'insert', 'update', 'delete', 'eq', 'neq', 'is', 'order', 'limit', 'single', 'maybeSingle', 'or', 'in'];
        for (const m of methods) chain[m] = jest.fn().mockReturnValue(chain);
        if (callCount === 1) {
          chain.then = (resolve: any) => Promise.resolve(resolve({ data: null, error: { code: '23505', message: 'duplicate' } }));
        } else {
          // getUser call + unvote delete
          chain.then = (resolve: any) => Promise.resolve(resolve({ data: null, error: null }));
        }
        return chain as any;
      });
      // Mock getUser for the unvote call
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null } as any);
      await voteParkPhoto('ph1');
    });

    it('throws when not authenticated', async () => {
      mockAuth(null);
      await expect(voteParkPhoto('ph1')).rejects.toThrow('Not authenticated');
    });
  });

  describe('unvoteParkPhoto', () => {
    it('deletes a vote', async () => {
      mockAuth('u1');
      const chain = mockFrom({ data: null, error: null });
      await unvoteParkPhoto('ph1');
      expect(chain.delete).toHaveBeenCalled();
    });
  });

  describe('deleteParkPhoto', () => {
    it('removes from storage and deletes record', async () => {
      const bucket = {
        upload: jest.fn(),
        getPublicUrl: jest.fn(),
        remove: jest.fn().mockResolvedValue({ data: null, error: null }),
        download: jest.fn(),
      };
      mockSupabase.storage.from.mockReturnValue(bucket as any);
      const chain = mockFrom({ data: null, error: null });

      await deleteParkPhoto('ph1', 'https://storage.example.com/park-photos/u1/123.jpg');
      expect(bucket.remove).toHaveBeenCalledWith(['u1/123.jpg']);
      expect(chain.delete).toHaveBeenCalled();
    });
  });

  describe('getFeaturedPhotosForParks', () => {
    it('returns empty object for empty park IDs', async () => {
      const result = await getFeaturedPhotosForParks([]);
      expect(result).toEqual({});
    });

    it('returns top-voted photo per park', async () => {
      let callCount = 0;
      mockSupabase.from.mockImplementation(() => {
        callCount++;
        const chain: any = {};
        const methods = ['select', 'insert', 'update', 'delete', 'eq', 'neq', 'is', 'order', 'limit', 'single', 'maybeSingle', 'or', 'in'];
        for (const m of methods) chain[m] = jest.fn().mockReturnValue(chain);
        if (callCount === 1) {
          chain.then = (resolve: any) => Promise.resolve(resolve({
            data: [
              { id: 'ph1', park_id: 'p1', photo_url: 'url1' },
              { id: 'ph2', park_id: 'p1', photo_url: 'url2' },
            ],
            error: null,
          }));
        } else {
          chain.then = (resolve: any) => Promise.resolve(resolve({
            data: [{ photo_id: 'ph2' }, { photo_id: 'ph2' }],
            error: null,
          }));
        }
        return chain as any;
      });

      const result = await getFeaturedPhotosForParks(['p1']);
      expect(result['p1']).toBe('url2'); // ph2 has more votes
    });
  });

  describe('reportParkPhoto', () => {
    it('inserts a report', async () => {
      mockAuth('u1');
      mockFrom({ data: null, error: null });
      await reportParkPhoto('ph1', 'inappropriate');
      expect(mockSupabase.from).toHaveBeenCalledWith('park_photo_reports');
    });

    it('throws for duplicate report', async () => {
      mockAuth('u1');
      mockFrom({ data: null, error: { code: '23505', message: 'duplicate' } });
      await expect(reportParkPhoto('ph1', 'spam')).rejects.toThrow('You have already reported this photo.');
    });

    it('throws when not authenticated', async () => {
      mockAuth(null);
      await expect(reportParkPhoto('ph1', 'spam')).rejects.toThrow('Not authenticated');
    });
  });
});
