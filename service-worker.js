const dbName = "expense-app";
const dbVersion = 1;
const objStoreName = "ui-assets";

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

self.addEventListener("message", async (event) => {
  const { type } = event.data;
  const dbInstance = await db.catch(() => null);

  if (type === "store-data" && dbInstance) {
    const tx = dbInstance.transaction([objStoreName], "readwrite"); // or "readonly"
    const store = tx.objectStore(objStoreName);
    store.add({
      id: "index.html",
      content: `<html><head><link rel="stylesheet" href="style.css"></head><div>hello world</div></html>`,
    });
    store.add({
      id: "style.css",
      content: ".body { background-color: rgb(31,31,31); }",
    });
  }
});
