"use client";

/**
 * Offline sync queue for training writes (session finalize + shot logs).
 * Persists pending requests in IndexedDB and flushes them when back online
 * (Req. 8.3). Falls back to a no-op if IndexedDB is unavailable.
 */

export interface QueuedRequest {
  id: string;
  url: string;
  method: string;
  body: string;
  createdAt: number;
}

const DB_NAME = "hoopmind-offline";
const STORE = "queue";

function openDb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof indexedDB === "undefined") return resolve(null);
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T> | void,
): Promise<T | undefined> {
  const db = await openDb();
  if (!db) return undefined;
  return new Promise<T | undefined>((resolve) => {
    const tx = db.transaction(STORE, mode);
    const store = tx.objectStore(STORE);
    const request = fn(store);
    tx.oncomplete = () =>
      resolve(request && "result" in request ? request.result : undefined);
    tx.onerror = () => resolve(undefined);
  });
}

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Try a request now; if offline/failed, enqueue it for later. */
export async function sendOrQueue(
  url: string,
  method: string,
  body: unknown,
): Promise<{ ok: boolean; queued: boolean }> {
  const payload = JSON.stringify(body);
  if (typeof navigator !== "undefined" && navigator.onLine) {
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: payload,
      });
      if (res.ok) return { ok: true, queued: false };
    } catch {
      // fall through to enqueue
    }
  }
  await withStore("readwrite", (store) =>
    store.put({ id: uid(), url, method, body: payload, createdAt: Date.now() }),
  );
  return { ok: false, queued: true };
}

async function getAll(): Promise<QueuedRequest[]> {
  const result = await withStore<QueuedRequest[]>("readonly", (store) =>
    store.getAll() as IDBRequest<QueuedRequest[]>,
  );
  return result ?? [];
}

async function remove(id: string): Promise<void> {
  await withStore("readwrite", (store) => store.delete(id));
}

/** Flush all queued requests. Safe to call repeatedly. */
export async function flushQueue(): Promise<number> {
  if (typeof navigator !== "undefined" && !navigator.onLine) return 0;
  const items = (await getAll()).sort((a, b) => a.createdAt - b.createdAt);
  let flushed = 0;
  for (const item of items) {
    try {
      const res = await fetch(item.url, {
        method: item.method,
        headers: { "Content-Type": "application/json" },
        body: item.body,
      });
      if (res.ok) {
        await remove(item.id);
        flushed++;
      }
    } catch {
      break; // still offline; stop and retry later
    }
  }
  return flushed;
}

/** Register listeners so the queue flushes automatically on reconnect. */
export function initAutoFlush(): () => void {
  if (typeof window === "undefined") return () => undefined;
  const handler = () => void flushQueue();
  window.addEventListener("online", handler);
  // Opportunistic flush on load.
  void flushQueue();
  return () => window.removeEventListener("online", handler);
}
