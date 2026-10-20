import { supabase } from '@/lib/supabase';
import { getAedBuildings, getContacts, getEmergencyTypes, getGuidanceSteps } from '@/services/emergency-data';

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
    const step = { id: 1, section: null, step_order: 1, title: 'Alert', body: 'Call BUPD.', link: null };
    const contact = (id: string) => ({ id, name: id, description: '', phone: '911', address: null, campus: 'ALL' });
    const query = mockQuery({
      data: [
        {
          ...step,
          guidance_step_contacts: [
            { sort_order: 2, contacts: contact('second') },
            { sort_order: 1, contacts: contact('first') },
          ],
        },
      ],
      error: null,
    });

    await expect(getGuidanceSteps('fire')).resolves.toEqual([
      { ...step, contacts: [contact('first'), contact('second')] },
    ]);
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
    const contact = {
      id: '911',
      name: 'Emergency (911)',
      description: 'Fire',
      phone: '911',
      campus: 'ALL',
      sort_order: 1,
    };
    const query = mockQuery({
      data: [{ ...contact, emergency_contacts: [{ emergency_type_id: 'fire' }] }],
      error: null,
    });

    await expect(getContacts()).resolves.toEqual([{ ...contact, emergencies: ['fire'] }]);
    expect(mockFrom).toHaveBeenCalledWith('contacts');
    expect(query.order).toHaveBeenCalledWith('sort_order', { ascending: true });
  });

  it('throws a descriptive error when the request fails', async () => {
    mockQuery({ data: null, error: { message: 'permission denied' } });

    await expect(getContacts()).rejects.toThrow('Failed to load contacts: permission denied');
  });
});

describe('getAedBuildings', () => {
  it('returns buildings with their AEDs in display order', async () => {
    const aed = (id: string, sort_order: number) => ({
      id,
      floor: '01',
      room: '100',
      location_note: 'Lobby',
      sort_order,
    });
    const query = mockQuery({
      data: [
        {
          id: '501',
          name: 'FitRec',
          address: '915 Commonwealth Avenue',
          campus: 'CRC',
          aeds: [aed('b', 2), aed('a', 1)],
        },
      ],
      error: null,
    });

    const [building] = await getAedBuildings();
    expect(building.aeds.map((a) => a.id)).toEqual(['a', 'b']);
    expect(mockFrom).toHaveBeenCalledWith('buildings');
    expect(query.select).toHaveBeenCalledWith(expect.stringContaining('aeds('));
    expect(query.order).toHaveBeenCalledWith('name', { ascending: true });
  });

  it('throws a descriptive error when the request fails', async () => {
    mockQuery({ data: null, error: { message: 'network down' } });

    await expect(getAedBuildings()).rejects.toThrow('Failed to load AED locations: network down');
  });
});
