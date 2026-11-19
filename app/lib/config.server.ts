import { loadConfig } from './load-config.server'

export const config = loadConfig(
  [
    process.env.CONFIG_FILE || 'config.yaml',
    ...(process.env.SECRETS_FILE ? [process.env.SECRETS_FILE] : [])
  ],
  process.env.NODE_ENV === 'production'
)
