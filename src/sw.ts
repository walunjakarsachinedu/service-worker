const dbName = "expense-app";
const dbVersion = 1;
const objStoreName = "ui-assets";
let isOnline = true;

let db: Promise<IDBDatabase> = new Promise((resolve, reject) => {
  const request = indexedDB.open(dbName, dbVersion);

  request.onupgradeneeded = (e: IDBVersionChangeEvent) => {
    const db = (e.target as IDBRequest)?.result as IDBDatabase;
    db.createObjectStore(objStoreName, { keyPath: "id" });
  };

  request.onsuccess = (e: Event) =>
    resolve((e.target as IDBRequest).result as IDBDatabase);
  request.onerror = (e: Event) => reject((e.target as IDBRequest).error);
});

db.catch((err) => console.error("Error while opening database", err));

const mimeMap: Record<string, string> = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".eot": "application/vnd.ms-fontobject",
  ".map": "application/json", // source maps
  ".ico": "image/x-icon",
  ".txt": "text/plain",
};

interface StoreContentParams {
  id: string;
  content: string;
}

// optimise by processing array in one transaction
async function storeContent({
  id,
  content,
}: StoreContentParams): Promise<void> {
  const dbInstance = await db.catch(() => null);
  if (!dbInstance) return;

  const tx = dbInstance.transaction([objStoreName], "readwrite");
  const store = tx.objectStore(objStoreName);
  store.put({ id, content });
}

function isRootPath(path: string): boolean {
  if (!path) return false;
  const regex = /^https?:\/\/[^/]+\/?$/;
  return regex.test(path);
}

function extractFilenameFromUrl(url: string): string | null {
  if (!url) return null;
  if (isRootPath(url)) return "index.html";

  const regex = /^https?:\/\/[^/]+\/(?:.*\/)?([^/?#]+\.[^/?#]+)(?:[?#].*)?$/;
  const match = url.match(regex);
  return match?.[1] ?? null;
}

async function fetchAndCache(request: Request): Promise<Response> {
  console.log("exec fetchAndCache for ", request.url);
  const fileName = extractFilenameFromUrl(request.url);
  const response = await fetch(request);

  if (fileName) {
    const cloned = response.clone();
    const content = await cloned.text();
    await storeContent({ id: fileName, content: content });
  }

  return response;
}

async function getOfflineResponse(request: Request): Promise<Response> {
  console.log("exec getOfflineResponse for ", request.url);
  const fileName = extractFilenameFromUrl(request.url);

  if (!fileName) return new Response("Invalid URL", { status: 400 });

  const dbInstance = await db.catch(() => null);
  if (!dbInstance)
    return new Response("Failed to connect to database", { status: 503 });

  const tx = dbInstance.transaction([objStoreName], "readonly");
  const store = tx.objectStore(objStoreName);
  const stored = await new Promise<string | null>((resolve) => {
    const req = store.get(fileName);
    req.onsuccess = () => resolve(req.result?.content ?? null);
    req.onerror = () => resolve(null);
  });

  if (!stored) return new Response("Not available offline", { status: 404 });

  const ext = fileName.substring(fileName.lastIndexOf("."));
  const mime = mimeMap[ext] ?? "application/octet-stream";
  return new Response(stored, {
    headers: { "Content-Type": mime },
    status: 200,
  });
}

// Explicitly typing `self` as `ServiceWorkerGlobalScope`
self.addEventListener("fetch", (event: Event) => {
  const fetchEvent = event as FetchEvent; // Explicitly cast event to `FetchEvent`
  fetchEvent.respondWith(
    isOnline
      ? fetchAndCache(fetchEvent.request).catch(() =>
          getOfflineResponse(fetchEvent.request)
        )
      : getOfflineResponse(fetchEvent.request)
  );
});

self.addEventListener("message", async (event: MessageEvent) => {
  const { type } = event.data as { type: "online" | "offline" };

  if (type === "online") {
    isOnline = true;
    console.log("service worker : online");
  } else if (type === "offline") {
    isOnline = false;
    console.log("service worker : offline");
  }
});
