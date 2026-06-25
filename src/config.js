const config = {
  // Laravel backend (same API the mobile app uses).
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',

  // Reverb (WebSockets) — keep in sync with backend .env (REVERB_*).
  REVERB_KEY: import.meta.env.VITE_REVERB_KEY || '6yzfwgwpjsql1finaqaq',
  REVERB_HOST: import.meta.env.VITE_REVERB_HOST || 'localhost',
  REVERB_PORT: Number(import.meta.env.VITE_REVERB_PORT || 8090),
  REVERB_SCHEME: import.meta.env.VITE_REVERB_SCHEME || 'ws',
}




export default config
