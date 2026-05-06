import { useState, useEffect } from 'react'
import API from '../api/api'

type PushState = 'unsupported' | 'denied' | 'subscribed' | 'unsubscribed' | 'loading'

function urlBase64ToUint8Array(base64: string) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(b64)
  return Uint8Array.from(Array.from(raw).map(c => c.charCodeAt(0)))
}

export function usePushNotifications() {
  const [state, setState] = useState<PushState>('loading')

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setState('unsupported')
      return
    }
    if (Notification.permission === 'denied') { setState('denied'); return }

    navigator.serviceWorker.ready.then(reg =>
      reg.pushManager.getSubscription().then(sub => {
        setState(sub ? 'subscribed' : 'unsubscribed')
      })
    ).catch(() => setState('unsubscribed'))
  }, [])

  async function subscribe() {
    if (!('serviceWorker' in navigator)) return
    setState('loading')
    try {
      // Get VAPID public key from backend
      const { data } = await API.get<{ publicKey: string }>('/push/vapid-public-key')
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(data.publicKey),
      })
      const json = sub.toJSON()
      await API.post('/push/subscribe', {
        endpoint: sub.endpoint,
        keys: { p256dh: json.keys?.p256dh, auth: json.keys?.auth },
      })
      setState('subscribed')
    } catch (err: any) {
      if (err?.name === 'NotAllowedError' || Notification.permission === 'denied') {
        setState('denied')
      } else {
        setState('unsubscribed')
        throw err
      }
    }
  }

  async function unsubscribe() {
    setState('loading')
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await API.delete(`/push/unsubscribe?endpoint=${encodeURIComponent(sub.endpoint)}`)
        await sub.unsubscribe()
      }
      setState('unsubscribed')
    } catch {
      setState('subscribed')
    }
  }

  async function sendTest() {
    await API.post('/push/test', {})
  }

  return { state, subscribe, unsubscribe, sendTest }
}
