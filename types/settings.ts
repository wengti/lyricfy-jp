export interface UserApiKeys {
  openrouter_api_key: string | null
  updated_at?: string
}

export interface MaskedApiKeys {
  openrouter_api_key: string | null // e.g. "••••••••1234"
  updated_at?: string
}

export type ApiKeyFormState = {
  openrouter_api_key: string
}
