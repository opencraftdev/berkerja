import { useState, useEffect, useCallback } from 'react';

export interface ScraperProgress {
  type: 'progress' | 'done' | 'error' | 'info' | 'warning';
  page?: number;
  total?: number;
  jobs?: number;
  message?: string;
  error?: string;
  jobsDone?: unknown[];
  selectorUpdated?: boolean;
}

interface UseScraperSSEOptions {
  onDone?: (jobs: unknown[], selectorUpdated: boolean) => void;
  onError?: (error: string) => void;
}

export function useScraperSSE(options: UseScraperSSEOptions = {}) {
  const [status, setStatus] = useState<'idle' | 'scraping' | 'done' | 'error'>('idle');
  const [progress, setProgress] = useState<ScraperProgress | null>(null);

  const startScraping = useCallback(
    async (keyword: string, platform: string) => {
      setStatus('scraping');
      setProgress(null);

      try {
        const response = await fetch('/api/jobs/scrape', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ keyword, platform }),
          credentials: 'include',
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error ?? 'Scraping failed');
        }

        const contentType = response.headers.get('Content-Type');
        if (contentType?.includes('text/event-stream')) {
          const reader = response.body?.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          if (!reader) throw new Error('No response body');

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';

            for (let i = 0; i < lines.length; i++) {
              const line = lines[i];
              if (line.startsWith('event: ')) {
                const eventType = line.slice(7);
                const dataLine = lines[i + 1] ?? '';
                if (dataLine.startsWith('data: ')) {
                  i++;
                  try {
                    const data = JSON.parse(dataLine.slice(6));
                    setProgress(data);

                    if (eventType === 'done') {
                      setStatus('done');
                      options.onDone?.(data.jobs ?? [], data.selectorUpdated ?? false);
                    } else if (eventType === 'error') {
                      setStatus('error');
                      options.onError?.(data.error ?? 'Unknown error');
                    }
                  } catch {
                    // Ignore parse errors
                  }
                }
              }
            }
          }
        } else {
          // Regular JSON response
          const data = await response.json();
          if (data.error) {
            setStatus('error');
            options.onError?.(data.error);
          } else {
            setStatus('done');
            options.onDone?.(data.jobs ?? [], data.selectorUpdated ?? false);
          }
        }
      } catch (err) {
        setStatus('error');
        options.onError?.(err instanceof Error ? err.message : 'Scraping failed');
      }
    },
    [options]
  );

  useEffect(() => {
    return () => {
      // Cleanup if needed
    };
  }, []);

  return { status, progress, startScraping };
}
