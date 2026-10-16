import { supabase } from '@/lib/supabase';
import { getContacts, getEmergencyTypes, getGuidanceSteps } from '@/services/emergency-data';

jest.mock('@/lib/supabase', () => ({ supabase: { from: jest.fn() } }));

const mockFrom = supabase.from as jest.Mock;

type QueryResult = { data: unknown; error: { message: string } | null };

type MockQueryBuilder = {
  select: jest.Mock<MockQueryBuilder>;
  eq: jest.Mock<MockQueryBuilder>;
  order: jest.Mock<Promise<QueryResult>>;
};

/** Fakes Supabase's chainable query builder; `order()` ends the chain and resolves to `result`. */
function mockQuery(result: QueryResult): MockQueryBuilder {
  const builder: MockQueryBuilder = {
    select: jest.fn(() => builder),
    eq: jest.fn(() => builder),
    order: jest.fn(() => Promise.resolve(result)),
  };
  mockFrom.mockReturnValue(builder);
  return builder;
}

beforeEach(() => {
  mockFrom.mockReset();
});

describe('getEmergencyTypes', () => {
  it('returns emergency types ordered by sort_order', async () => {
    const rows = [{ id: 'fire', name: 'Fire', sort_order: 1 }];
    const query = mockQuery({ data: rows, error: null });

    await expect(getEmergencyTypes()).resolves.toEqual(rows);
    expect(mockFrom).toHaveBeenCalledWith('emergency_types');
    expect(query.order).toHaveBeenCalledWith('sort_order', { ascending: true });
  });

  it('throws a descriptive error when the request fails', async () => {
    mockQuery({ data: null, error: { message: 'network down' } });

    await expect(getEmergencyTypes()).rejects.toThrow('Failed to load emergency types: network down');
  });
});

describe('getGuidanceSteps', () => {
  it('returns only the steps for the requested emergency type, in order', async () => {
    const rows = [{ id: 1, section: null, step_order: 1, title: 'Rescue', body: 'Rescue people from scene of fire.' }];
    const query = mockQuery({ data: rows, error: null });

    await expect(getGuidanceSteps('fire')).resolves.toEqual(rows);
    expect(mockFrom).toHaveBeenCalledWith('guidance_steps');
    expect(query.eq).toHaveBeenCalledWith('emergency_type_id', 'fire');
    expect(query.order).toHaveBeenCalledWith('step_order', { ascending: true });
  });

  it('includes the emergency type in the error message', async () => {
    mockQuery({ data: null, error: { message: 'timeout' } });

    await expect(getGuidanceSteps('fire')).rejects.toThrow('Failed to load guidance for "fire": timeout');
  });
});

describe('getContacts', () => {
  it('returns contacts ordered by sort_order', async () => {
    const rows = [
      { id: '911', name: 'Emergency (911)', description: 'Fire', phone: '911', campus: 'ALL', sort_order: 1 },
    ];
    const query = mockQuery({ data: rows, error: null });

    await expect(getContacts()).resolves.toEqual(rows);
    expect(mockFrom).toHaveBeenCalledWith('contacts');
    expect(query.order).toHaveBeenCalledWith('sort_order', { ascending: true });
  });

  it('throws a descriptive error when the request fails', async () => {
    mockQuery({ data: null, error: { message: 'permission denied' } });

    await expect(getContacts()).rejects.toThrow('Failed to load contacts: permission denied');
  });
});
