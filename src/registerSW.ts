/** Dispatched on window when a new service worker is installed and waiting to activate. */
export const SW_UPDATE_EVENT = 'sw-update-ready'

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return

  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js')

      const notifyIfWaiting = () => {
        if (reg.waiting && navigator.serviceWorker.controller) {
          window.dispatchEvent(new CustomEvent(SW_UPDATE_EVENT, { detail: reg }))
        }
      }
      notifyIfWaiting()

      reg.addEventListener('updatefound', () => {
        const installing = reg.installing
        installing?.addEventListener('statechange', () => {
          if (installing.state === 'installed') notifyIfWaiting()
        })
      })

      // Reload once the new worker takes control (triggered by applyUpdate below).
      let reloaded = false
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (reloaded) return
        reloaded = true
        window.location.reload()
      })
    } catch {
      // Offline support is a bonus, not a requirement — fail silently.
    }
  })
}

export function applyUpdate(reg: ServiceWorkerRegistration) {
  reg.waiting?.postMessage({ type: 'SKIP_WAITING' })
}
