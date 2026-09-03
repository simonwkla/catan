interface QueueWaiter {
  readonly signal: AbortSignal;
  readonly resolve: () => void;
  readonly reject: (reason?: unknown) => void;
  readonly onAbort: () => void;
}

function abortReason(signal: AbortSignal): unknown {
  return signal.reason ?? new DOMException("The operation was aborted", "AbortError");
}

export class AbortableSerialQueue {
  private active = false;
  private readonly waiters: QueueWaiter[] = [];

  async run<T>(signal: AbortSignal, operation: () => Promise<T>): Promise<T> {
    await this.acquire(signal);

    try {
      signal.throwIfAborted();
      return await operation();
    } finally {
      this.release();
    }
  }

  private acquire(signal: AbortSignal): Promise<void> {
    if (signal.aborted) {
      return Promise.reject(abortReason(signal));
    }

    if (!this.active) {
      this.active = true;
      return Promise.resolve();
    }

    return new Promise<void>((resolve, reject) => {
      const onAbort = () => {
        const index = this.waiters.findIndex((waiter) => waiter.onAbort === onAbort);
        if (index !== -1) {
          this.waiters.splice(index, 1);
        }
        signal.removeEventListener("abort", onAbort);
        reject(abortReason(signal));
      };

      this.waiters.push({ signal, resolve, reject, onAbort });
      signal.addEventListener("abort", onAbort, { once: true });
    });
  }

  private release(): void {
    while (this.waiters.length > 0) {
      const waiter = this.waiters.shift();
      if (!waiter) {
        break;
      }

      waiter.signal.removeEventListener("abort", waiter.onAbort);
      if (waiter.signal.aborted) {
        waiter.reject(abortReason(waiter.signal));
        continue;
      }

      waiter.resolve();
      return;
    }

    this.active = false;
  }
}
