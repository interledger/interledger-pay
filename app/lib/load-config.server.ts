import { createPrivateKey } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { parse } from 'yaml'
import { z } from 'zod'

export class ConfigError extends Error {
  constructor(problems: string[]) {
    super(`Invalid configuration:\n${problems.map((p) => `  - ${p}`).join('\n')}`)
    this.name = 'ConfigError'
  }
}

function url(production: boolean) {
  return z
    .string()
    .url()
    .refine(
      (value) => (production ? /^https:/ : /^https?:/).test(value),
      production ? 'must be an https URL' : 'must be an http(s) URL'
    )
}

const privateKey = z.string().transform((value, ctx) => {
  try {
    const pem = value.trim().startsWith('-----BEGIN')
      ? value
      : Buffer.from(value, 'base64').toString('utf8')
    const key = createPrivateKey(pem)
    if (key.asymmetricKeyType === 'ed25519') return key
  } catch {
    // reported below
  }
  ctx.addIssue({
    code: z.ZodIssueCode.custom,
    message: 'must be an Ed25519 private key in PEM, or base64 encoded PEM'
  })
  return z.NEVER
})

function settingsSchema(production: boolean) {
  return z
    .object({
      host: url(production).refine((value) => {
        const { pathname, search, hash } = new URL(value)
        return pathname === '/' && !search && !hash
      }, 'must be an origin without a path, query or fragment'),
      redirectUrl: url(production).optional(),
      walletAddress: z
        .object({ url: url(production), keyId: z.string().min(1) })
        .strict(),
      stripe: z
        .object({
          publishableKey: z
            .string()
            .regex(/^pk_(test|live)_\w+$/, 'must be a Stripe publishable key')
        })
        .strict()
    })
    .strict()
}

const secretsSchema = z
  .object({
    walletAddress: z.object({ privateKey }).strict(),
    session: z.object({ cookieSecret: z.string().min(32) }).strict(),
    stripe: z
      .object({
        secretKey: z
          .string()
          .regex(/^(sk|rk)_(test|live)_\w+$/, 'must be a Stripe secret key')
      })
      .strict()
  })
  .strict()

function read<T extends z.ZodTypeAny>(
  name: string,
  text: string,
  schema: T,
  problems: string[]
): z.infer<T> | undefined {
  let document: unknown
  try {
    document = parse(text, { uniqueKeys: true })
  } catch (error) {
    problems.push(`${name}: ${(error as Error).message}`)
    return undefined
  }
  const result = schema.safeParse(document)
  if (result.success) return result.data
  for (const issue of result.error.issues) {
    const path = issue.path.join('.')
    problems.push(`${name}: ${path ? `${path}: ` : ''}${issue.message}`)
  }
  return undefined
}

const stripeMode = (key: string) => /_(test|live)_/.exec(key)?.[1]

export function parseConfig(
  files: { settings: string; secrets: string },
  production: boolean
) {
  const problems: string[] = []
  const settings = read('config', files.settings, settingsSchema(production), problems)
  const secrets = read('secrets', files.secrets, secretsSchema, problems)
  if (
    settings &&
    secrets &&
    stripeMode(settings.stripe.publishableKey) !== stripeMode(secrets.stripe.secretKey)
  ) {
    problems.push('stripe: publishableKey and secretKey must both be test or live')
  }
  if (!settings || !secrets || problems.length > 0) {
    throw new ConfigError(problems)
  }

  const host = new URL(settings.host).origin
  return {
    host,
    redirectUrl: settings.redirectUrl ?? `${host}/finish`,
    walletAddress: { ...settings.walletAddress, ...secrets.walletAddress },
    session: secrets.session,
    stripe: { ...settings.stripe, ...secrets.stripe }
  }
}

export type Config = ReturnType<typeof parseConfig>

export function loadConfig(
  settingsFile: string,
  secretsFile: string,
  production: boolean
): Config {
  return parseConfig(
    {
      settings: readFileSync(settingsFile, 'utf8'),
      secrets: readFileSync(secretsFile, 'utf8')
    },
    production
  )
}
