import { supabase } from '../../src/lib/supabase';

const mockedSupabase = supabase as jest.Mocked<typeof supabase>;

/**
 * Configure supabase.from() to return a chainable mock
 * that resolves to { data, error } when awaited.
 */
export function mockSupabaseQuery(
  data: any = null,
  error: any = null
) {
  const result = { data, error };

  const chain: Record<string, any> = {};
  const methods = [
    'select', 'insert', 'update', 'delete', 'upsert',
    'eq', 'neq', 'gt', 'gte', 'lt', 'lte',
    'like', 'ilike', 'is', 'in', 'contains',
    'order', 'limit', 'range', 'single', 'maybeSingle',
    'not', 'or', 'filter', 'match', 'textSearch',
    'csv', 'returns',
  ];

  for (const method of methods) {
    chain[method] = jest.fn().mockReturnValue(chain);
  }

  // Make the chain awaitable
  chain.then = (resolve: (value: any) => any) => Promise.resolve(resolve(result));

  mockedSupabase.from.mockReturnValue(chain as any);

  return { chain, result };
}

/**
 * Configure supabase.rpc() to resolve with { data, error }.
 */
export function mockSupabaseRpc(data: any = null, error: any = null) {
  mockedSupabase.rpc.mockResolvedValue({ data, error } as any);
}

/**
 * Configure supabase.auth methods.
 */
export function mockSupabaseAuth(method: keyof typeof supabase.auth, value: any) {
  (mockedSupabase.auth[method] as jest.Mock).mockResolvedValue(value);
}

/**
 * Configure supabase.storage.from() methods.
 */
export function mockSupabaseStorage(overrides: {
  upload?: { data: any; error: any };
  getPublicUrl?: { data: any };
  remove?: { data: any; error: any };
} = {}) {
  const bucket = {
    upload: jest.fn().mockResolvedValue(overrides.upload ?? { data: { path: 'test-path' }, error: null }),
    getPublicUrl: jest.fn().mockReturnValue(overrides.getPublicUrl ?? { data: { publicUrl: 'https://example.com/test.jpg' } }),
    remove: jest.fn().mockResolvedValue(overrides.remove ?? { data: null, error: null }),
    download: jest.fn().mockResolvedValue({ data: new Blob(), error: null }),
  };

  mockedSupabase.storage.from.mockReturnValue(bucket as any);
  return bucket;
}

export { mockedSupabase };
