/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  readonly VITE_SENTRY_DSN?: string
  readonly VITE_SENTRY_ENVIRONMENT?: string
  readonly VITE_ENCRYPTION_KEY?: string
  readonly VITE_JWT_SECRET?: string
  readonly VITE_SESSION_SECRET?: string
  readonly VITE_SUPABASE_SERVICE_ROLE_KEY?: string
  readonly DEV?: boolean
  readonly PROD?: boolean
  readonly MODE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}