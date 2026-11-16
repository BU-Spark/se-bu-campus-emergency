import { useEffect, useState } from 'react';

export type QueryState<T> = {
  data: T | undefined;
  error: Error | undefined;
  loading: boolean;
  /** Runs the fetcher again, e.g. from a "Try again" button. */
  reload: () => void;
};

type Result<T> = {
  fetcher: () => Promise<T>;
  attempt: number;
  data?: T;
  error?: Error;
};

/**
 * Runs an async fetcher and tracks its loading and error state.
 * `fetcher` must be stable between renders (a module-level function or wrapped in `useCallback`);
 * a new fetcher triggers a new request.
 */
export function useQuery<T>(fetcher: () => Promise<T>): QueryState<T> {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<Result<T>>();

  useEffect(() => {
    let cancelled = false;
    fetcher().then(
      (data) => {
        if (!cancelled) setResult({ fetcher, attempt, data });
      },
      (error: unknown) => {
        if (!cancelled) {
          setResult({ fetcher, attempt, error: error instanceof Error ? error : new Error(String(error)) });
        }
      }
    );
    return () => {
      cancelled = true;
    };
  }, [fetcher, attempt]);

  // The result belongs to an earlier request until the current one settles.
  const isCurrent = result?.fetcher === fetcher && result.attempt === attempt;

  return {
    data: isCurrent ? result.data : undefined,
    error: isCurrent ? result.error : undefined,
    loading: !isCurrent,
    reload: () => setAttempt((n) => n + 1),
  };
}
