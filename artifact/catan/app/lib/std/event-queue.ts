interface EventQueueSubscriber<T> {
  onEvent: (event: T) => void;
}

export class EventQueue<T> {
  private subscribers = new Set<EventQueueSubscriber<T>>();
  private queue: T[] = [];
  private isProcessing = false;

  /**
   * Add an event to the queue and process it
   */
  enqueue(event: T): boolean {
    this.queue.push(event);
    this.processQueue();
    return true;
  }

  /**
   * Subscribe to events with optional filtering
   */
  subscribe(subscriber: EventQueueSubscriber<T>): () => void {
    this.subscribers.add(subscriber);

    // Process queue immediately for the new subscriber
    // This ensures they get any events that were queued before they subscribed
    this.processQueue();

    return () => {
      this.subscribers.delete(subscriber);
    };
  }

  /**
   * Process all events in the queue
   */
  private processQueue(): void {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    try {
      // snapshot subscribers to avoid race conditions
      const subscribers = Array.from(this.subscribers);
      // only process items that exist now
      const startLen = this.queue.length;
      const survivors: typeof this.queue = [];

      for (let read = 0; read < startLen; read++) {
        const event = this.queue[read];
        let consumed = false;

        for (const subscriber of subscribers) {
          subscriber.onEvent(event);
          consumed = true;
        }

        if (!consumed) {
          // keep for future passes
          survivors.push(event);
        }
      }

      // keep anything appended during processing
      const appended = this.queue.slice(startLen);
      this.queue.splice(0, this.queue.length, ...survivors, ...appended);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Create ONE async iterator that:
   * - Subscribes to the event queue
   * - Buffers events if the consumer isn't currently waiting
   * - Resolves the consumer's `next()` Promise immediately when an event arrives while waiting
   * - Cleans up (unsubscribe, drain, resolve pending) when iteration ends
   */
  public createGenerator() {
    /**
     * A FIFO queue of events that arrived while the consumer was NOT waiting.
     * If the consumer calls `next()` and we already have an event here, we return it immediately.
     */
    let queue: T[] = [];
    /**
     * If the consumer calls `next()` when the queue is empty, we must "pause" until an event arrives.
     * We do that by returning a Promise from `next()` and saving its resolver here.
     * When a new event arrives, we resolve that pending promise.
     */
    let pending: ((r: IteratorResult<T>) => void) | null = null;
    /**
     * After the iterator is closed (via `return()`), this flag becomes `true`.
     * We use it to:
     * - Drop late events (safety against races)
     * - Short-circuit future `next()` calls and return `{done:true}` immediately
     * - Make `return()` idempotent (safe to call multiple times)
     */
    let closed = false;

    /**
     * Subscribe to the internal event queue exactly ONCE.
     * `unsubscribe()` will detach this listener. We must call it when the iterator ends.
     */
    const unsubscribe = this.subscribe({
      onEvent: (evt: T) => {
        if (closed) {
          return;
        }
        /**
         * If the consumer is already waiting (they called next() and we returned a promise)
         * resolve that promise immediately with this event
         */
        if (pending) {
          const resolve = pending;
          pending = null;
          resolve({ value: evt, done: false });
        } else {
          // otherwise buffer the event so the `next()` call returns it synchronously
          queue.push(evt);
        }
      },
    });

    /**
     * This object IS the iterator.
     * - `next()` is called by the consumer to get the next event.
     * - `return()` is called when the consumer stops iteration (e.g., `for await` loop ends).
     * - `[Symbol.asyncIterator]()` returns `this` so "for await ... of" uses THIS object.
     */
    const iterator: AsyncIterableIterator<T> = {
      async next(): Promise<IteratorResult<T>> {
        if (closed) {
          return { value: undefined as never, done: true };
        }

        const v = queue.shift();
        if (v !== undefined) {
          return { value: v, done: false };
        }

        // No event available right now: "pause" until the next event arrives.
        // We return a Promise and remember `res` in `pending`.
        // When `onEvent` runs, it will resolve this promise.
        return new Promise<IteratorResult<T>>((res) => {
          pending = res;
        });
      },

      async return(): Promise<IteratorResult<T>> {
        // mark the iterator as closed (so future `next()` calls will return immediately)
        if (!closed) {
          closed = true;
          unsubscribe();
          // if someone is currently waiting resolve it so that they are not blocked forever
          if (pending) {
            pending({ value: undefined as never, done: true });
            pending = null;
          }
          // clear the queue
          if (queue.length > 0) {
            queue = [];
          }
        }
        return { value: undefined as never, done: true };
      },
      // this refers to the iterator object itself NOT the class instance!
      [Symbol.asyncIterator]() {
        return this;
      },
    };

    return iterator;
  }
}
