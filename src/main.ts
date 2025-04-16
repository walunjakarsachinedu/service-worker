import './style.css'

const networkStatus = document.getElementById("network-status") as HTMLElement | null;

// registering service worker
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/sw.js")
    .then(() => console.log("Service Worker registered."))
    .catch((error) => console.error("Service Worker registration failed:", error));
}

// Handle network status updates
handleNetworkStatus();
window.addEventListener("online", () => handleNetworkStatus());
window.addEventListener("offline", () => handleNetworkStatus());

function handleNetworkStatus() {
  if (navigator.onLine) {
    if (networkStatus) {
      networkStatus.textContent = "";
    }
    sendMsgToServiceWorker("online");
  } else {
    if (networkStatus) {
      networkStatus.textContent = "You are seeing cached offline content";
    }
    sendMsgToServiceWorker("offline");
  }
}

function sendMsgToServiceWorker(msgType: "online" | "offline") {
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

