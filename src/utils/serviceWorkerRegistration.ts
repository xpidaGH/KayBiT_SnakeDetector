/**
 * Service Worker Registration & PWA Lifecycle Manager
 */

export interface SWRegistrationCallbacks {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onOfflineReady?: () => void;
  onError?: (error: Error) => void;
}

export function registerServiceWorker(callbacks: SWRegistrationCallbacks = {}): void {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    console.log("[PWA] Service Worker is not supported in this browser environment.");
    return;
  }

  window.addEventListener("load", () => {
    const swUrl = "/sw.js";

    navigator.serviceWorker
      .register(swUrl)
      .then((registration) => {
        console.log("[PWA] Service Worker successfully registered with scope:", registration.scope);

        if (callbacks.onSuccess) {
          callbacks.onSuccess(registration);
        }

        // Check if there is an updated worker waiting
        if (registration.waiting) {
          if (callbacks.onUpdate) {
            callbacks.onUpdate(registration);
          }
        }

        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (installingWorker == null) {
            return;
          }

          installingWorker.onstatechange = () => {
            if (installingWorker.state === "installed") {
              if (navigator.serviceWorker.controller) {
                // New content available; will be used when all tabs close
                console.log("[PWA] New version is available. Content will update on next session.");
                if (callbacks.onUpdate) {
                  callbacks.onUpdate(registration);
                }
              } else {
                // Content cached for offline use
                console.log("[PWA] Content is cached for offline use.");
                if (callbacks.onOfflineReady) {
                  callbacks.onOfflineReady();
                }
              }
            }
          };
        };
      })
      .catch((error) => {
        console.warn("[PWA] Service Worker registration failed:", error);
        if (callbacks.onError) {
          callbacks.onError(error);
        }
      });
  });
}

export function unregisterServiceWorker(): void {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
}
