import Echo from 'laravel-echo'
import Pusher from 'pusher-js'
import config from '../config'
import useAuthStore from '../store/authStore'

window.Pusher = Pusher

let echo = null

// Lazily create the Echo (Reverb) client, authenticating private channels with
// the admin's Sanctum token via the admin broadcasting-auth endpoint.
export const getEcho = () => {
  if (echo) return echo

  const origin = config.BASE_URL.replace(/\/api\/v1\/?$/, '')

  echo = new Echo({
    broadcaster: 'reverb',
    key: config.REVERB_KEY,
    wsHost: config.REVERB_HOST,
    wsPort: config.REVERB_PORT,
    wssPort: config.REVERB_PORT,
    forceTLS: config.REVERB_SCHEME === 'wss',
    enabledTransports: ['ws', 'wss'],
    authEndpoint: `${origin}/api/v1/admin/broadcasting/auth`,
    auth: { headers: { Authorization: `Bearer ${useAuthStore.getState().token}` } },
  })

  return echo
}

export const disconnectEcho = () => {
  if (echo) {
    try { echo.disconnect() } catch { /* noop */ }
    echo = null
  }
}
