// registering onclick handler
const storeBtn = document.getElementById("store-btn");
storeBtn.onclick = () => {
  const msgType = "store-data";
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: msgType,
    });
  } else {
    navigator.serviceWorker.ready.then((registration) => {
      registration.active?.postMessage({
        type: msgType,
      });
    });
  }
};

// registering service worker
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("service-worker.js")
    .then(() => console.log("Service Worker registered."));
}
