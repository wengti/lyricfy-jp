export interface UserApiKeys {
  openrouter_api_key: string | null
  spotify_client_id: string | null
  spotify_client_secret: string | null
  genius_access_token: string | null
  updated_at?: string
}

export interface MaskedApiKeys {
  openrouter_api_key: string | null // e.g. "••••••••1234"
  spotify_client_id: string | null
  spotify_client_secret: string | null
  genius_access_token: string | null
  updated_at?: string
}

export type ApiKeyFormState = {
  openrouter_api_key: string
  spotify_client_id: string
  spotify_client_secret: string
  genius_access_token: string
}
