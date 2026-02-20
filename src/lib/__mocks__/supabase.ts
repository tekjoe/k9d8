const mockChain = () => {
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

  // Terminal methods resolve to { data, error }
  chain.then = undefined; // make it thenable via override
  (chain as any)[Symbol.for('result')] = { data: null, error: null };

  // Allow the chain to be awaited
  const makeThenable = (c: any) => {
    c.then = (resolve: any) => resolve(c[Symbol.for('result')] ?? { data: null, error: null });
    return c;
  };

  for (const method of methods) {
    const original = chain[method];
    chain[method] = jest.fn((...args: any[]) => {
      original(...args);
      return makeThenable(chain);
    });
  }

  return chain;
};

const mockStorageBucket = () => ({
  upload: jest.fn().mockResolvedValue({ data: { path: 'test-path' }, error: null }),
  getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/test.jpg' } }),
  remove: jest.fn().mockResolvedValue({ data: null, error: null }),
  download: jest.fn().mockResolvedValue({ data: new Blob(), error: null }),
});

const mockChannel = () => {
  const channel: Record<string, any> = {};
  channel.on = jest.fn().mockReturnValue(channel);
  channel.subscribe = jest.fn().mockReturnValue(channel);
  channel.unsubscribe = jest.fn().mockResolvedValue(undefined);
  return channel;
};

export const supabase = {
  from: jest.fn(() => mockChain()),
  auth: {
    getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
    getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
    signInWithPassword: jest.fn().mockResolvedValue({ data: { session: null, user: null }, error: null }),
    signUp: jest.fn().mockResolvedValue({ data: { session: null, user: null }, error: null }),
    signOut: jest.fn().mockResolvedValue({ error: null }),
    signInWithIdToken: jest.fn().mockResolvedValue({ data: { session: null, user: null }, error: null }),
    updateUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
    onAuthStateChange: jest.fn().mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } }),
  },
  storage: {
    from: jest.fn(() => mockStorageBucket()),
  },
  functions: {
    invoke: jest.fn().mockResolvedValue({ data: null, error: null }),
  },
  channel: jest.fn(() => mockChannel()),
  removeChannel: jest.fn().mockResolvedValue(undefined),
  rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
};
