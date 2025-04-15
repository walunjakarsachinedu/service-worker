const dbName = "expense-app";
const dbVersion = 1;
const objStoreName = "ui-assets";
let isOnline = true;

let db = new Promise((resolve, reject) => {
  const request = indexedDB.open(dbName, dbVersion);
  request.onupgradeneeded = (e) => {
    const db = e.target.result;
    db.createObjectStore(objStoreName, {
      keyPath: "id",
    });
  };
  request.onsuccess = (e) => resolve(e.target.result);
  request.onerror = (e) => reject(e.target.error);
});

db.catch((err) => console.error("error while opening database", err));

const mimeMap = {
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

async function storeContent(id, content) {
  const dbInstance = await db.catch(() => null);
  if (!dbInstance) return;

  const tx = dbInstance.transaction([objStoreName], "readwrite");
  const store = tx.objectStore(objStoreName);
  store.put({ id, content });
}

function isRootPath(path) {
  if (!path) return false;
  const regex = /^https?:\/\/[^/]+\/?$/;
  return regex.test(path);
}

function extractFilenameFromUrl(url) {
  if (!url) return null;
  if (isRootPath(url)) return "index.html";

  const regex = /https?:\/\/[^/]+\/(?:.*\/)?([^/?#]+\.[^/?#]+)(?:[?#].*)?$/;
  const match = url.match(regex);
  return match?.[1] ?? null;
}

async function fetchAndCache(request) {
  console.log("exec fetchAndCache for ", request.url);
  const fileName = extractFilenameFromUrl(request.url);
  const response = await fetch(request);
  if (fileName) {
    const cloned = response.clone();
    const content = await cloned.text();
    await storeContent(fileName, content);
  }
  return response;
}

async function getOfflineResponse(request) {
  console.log("exec getOfflineResponse for ", request.url);
  const fileName = extractFilenameFromUrl(request.url);
  const dbInstance = await db.catch(() => null);
  if (!dbInstance) return new Response("Failed to connect to database", { status: 503 });

  const tx = dbInstance.transaction([objStoreName], "readonly");
  const store = tx.objectStore(objStoreName);
  const stored = await new Promise((resolve) => {
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

self.addEventListener("fetch", (event) => {
  event.respondWith(
    isOnline
      ? fetchAndCache(event.request).catch(() => getOfflineResponse(event.request))
      : getOfflineResponse(event.request)
  );
});

self.addEventListener("message", async (event) => {
  const { type } = event.data;

  if (type === "online") {
    isOnline = true;
    console.log("service worker : online");
  } else if (type === "offline") {
    isOnline = false;
    console.log("service worker : offline");
  }
});
