export interface UserApiKeys {
  openrouter_api_key: string | null
  genius_access_token: string | null
  updated_at?: string
}

export interface MaskedApiKeys {
  openrouter_api_key: string | null // e.g. "••••••••1234"
  genius_access_token: string | null
  updated_at?: string
}

export type ApiKeyFormState = {
  openrouter_api_key: string
  genius_access_token: string
}
