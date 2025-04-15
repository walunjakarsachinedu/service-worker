// registering onclick handler
const storeBtn = document.getElementById("store-btn");
storeBtn.onclick = () => sendMsgToServiceWorker("store-data");

// registering service worker
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("service-worker.js")
    .then(() => console.log("Service Worker registered."));
}

window.addEventListener("online", () => sendMsgToServiceWorker("online"));
window.addEventListener("offline", () => sendMsgToServiceWorker("offline"));

function sendMsgToServiceWorker(msgType) {
  if (!("serviceWorker" in navigator)) return;
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
}
