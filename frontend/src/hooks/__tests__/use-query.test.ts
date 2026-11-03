import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useQuery } from '@/hooks/use-query';

describe('useQuery', () => {
  it('starts loading, then returns data', async () => {
    const fetcher = jest.fn().mockResolvedValue(['fire']);
    const { result } = await renderHook(() => useQuery(fetcher));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual(['fire']);
    expect(result.current.error).toBeUndefined();
  });

  it('returns the error when the fetcher fails', async () => {
    const fetcher = jest.fn().mockRejectedValue(new Error('network down'));
    const { result } = await renderHook(() => useQuery(fetcher));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toBeUndefined();
    expect(result.current.error?.message).toBe('network down');
  });

  it('fetches again when reload is called', async () => {
    const fetcher = jest.fn().mockRejectedValueOnce(new Error('network down')).mockResolvedValueOnce(['fire']);
    const { result } = await renderHook(() => useQuery(fetcher));
    await waitFor(() => expect(result.current.error).toBeDefined());

    await act(() => result.current.reload());

    await waitFor(() => expect(result.current.data).toEqual(['fire']));
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});
