import { EventQueue, parse } from "@/lib/std";

interface SseStreamOptions<_T> {
  url: string;
  event: string;
}

/**
 * Connects to a server-sent events source, deserializes incoming
 * events into `T`, and feeds them into an `EventQueue<T>`.
 */
export class SseClient<T> {
  private readonly queue = new EventQueue<T>();
  private readonly options: Required<SseStreamOptions<T>>;
  private source: EventSource | null = null;

  constructor(options: SseStreamOptions<T>) {
    this.options = options;
  }

  /**
   * Idempotent — opens an EventSource connection if one does not
   * already exist. Subsequent calls are no-ops.
   */
  ensureStream(): void {
    if (this.source) {
      return;
    }

    const es = new EventSource(this.options.url);

    es.addEventListener(this.options.event, (e: MessageEvent<string>) => {
      const parsed = parse(e.data) as T;
      this.queue.enqueue(parsed);
    });

    this.source = es;
  }

  /**
   * Closes the EventSource connection if one is open.
   * Safe to call multiple times.
   */
  endStream(): void {
    if (!this.source) {
      return;
    }

    this.source.close();
    this.source = null;
  }

  /**
   * Subscribe to deserialized events flowing through the queue.
   * Returns an unsubscribe function.
   */
  subscribe() {
    return this.queue.createGenerator();
  }
}
