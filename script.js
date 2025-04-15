const networkStatus = document.getElementById("network-status");

// registering service worker
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("service-worker.js")
    .then(() => console.log("Service Worker registered."));
}



handleNetworkStatus();
window.addEventListener("online", () => handleNetworkStatus());
window.addEventListener("offline", () => handleNetworkStatus());

function handleNetworkStatus() {
  if(navigator.onLine) {
    networkStatus.textContent = ""; 
    sendMsgToServiceWorker("online")
  }
  else {
    networkStatus.textContent = "you are seeing cached offline content"; 
    sendMsgToServiceWorker("offline")
  }
}

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
