import { type KeyObject, createPrivateKey } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { parse } from 'yaml'
import { z } from 'zod'

export type Config = {
  host: string
  redirectUrl: string
  walletAddress: {
    url: string
    keyId: string
    privateKey: KeyObject
  }
  session: {
    cookieSecret: string
  }
  stripe: {
    publishableKey: string
    secretKey: string
  }
}

export class ConfigError extends Error {
  constructor(source: string, problems: string[]) {
    super(
      `Invalid configuration (${source}):\n` +
        problems.map((problem) => `  - ${problem}`).join('\n')
    )
    this.name = 'ConfigError'
  }
}

function url(production: boolean) {
  return z
    .string()
    .url()
    .refine(
      (value) => {
        const { protocol } = new URL(value)
        return production
          ? protocol === 'https:'
          : protocol === 'https:' || protocol === 'http:'
      },
      production ? 'must be an https URL' : 'must be an http(s) URL'
    )
}

function stripeMode(key: string) {
  return /_(test|live)_/.exec(key)?.[1]
}

function parsePrivateKey(value: string): KeyObject {
  const pem = value.trim().startsWith('-----BEGIN')
    ? value
    : Buffer.from(value, 'base64').toString('utf8')
  return createPrivateKey(pem)
}

function schema(production: boolean) {
  return z
    .object({
      host: url(production).refine((value) => {
        const { pathname, search, hash } = new URL(value)
        return pathname === '/' && !search && !hash
      }, 'must be an origin without a path, query or fragment'),
      redirectUrl: url(production).optional(),
      walletAddress: z
        .object({
          url: url(production),
          keyId: z.string().min(1),
          privateKey: z.string().min(1).transform((value, ctx) => {
            try {
              const key = parsePrivateKey(value)
              if (key.asymmetricKeyType !== 'ed25519') {
                ctx.addIssue({
                  code: z.ZodIssueCode.custom,
                  message: `must be an Ed25519 key, got ${key.asymmetricKeyType}`
                })
                return z.NEVER
              }
              return key
            } catch {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'must be a PEM private key, or a base64 encoded one'
              })
              return z.NEVER
            }
          })
        })
        .strict(),
      session: z
        .object({
          cookieSecret: z.string().min(32)
        })
        .strict(),
      stripe: z
        .object({
          publishableKey: z
            .string()
            .regex(/^pk_(test|live)_\w+$/, 'must be a Stripe publishable key'),
          secretKey: z
            .string()
            .regex(/^(sk|rk)_(test|live)_\w+$/, 'must be a Stripe secret key')
        })
        .strict()
        .refine(
          (stripe) =>
            stripeMode(stripe.publishableKey) === stripeMode(stripe.secretKey),
          {
            message: 'publishableKey and secretKey must both be test or live',
            path: ['secretKey']
          }
        )
    })
    .strict()
}

function isMapping(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function merge(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
  problems: string[],
  path: string[] = []
) {
  for (const [key, value] of Object.entries(source)) {
    const keyPath = [...path, key]
    if (!(key in target)) {
      target[key] = value
    } else if (isMapping(target[key]) && isMapping(value)) {
      merge(
        target[key] as Record<string, unknown>,
        value,
        problems,
        keyPath
      )
    } else {
      problems.push(`${keyPath.join('.')}: is set in more than one file`)
    }
  }
}

export function parseConfig(
  documents: Record<string, string>,
  production: boolean
): Config {
  const source = Object.keys(documents).join(', ')
  const problems: string[] = []
  const raw: Record<string, unknown> = {}

  for (const [name, text] of Object.entries(documents)) {
    let document: unknown
    try {
      document = parse(text, { uniqueKeys: true })
    } catch (error) {
      problems.push(`${name}: ${(error as Error).message}`)
      continue
    }
    if (!isMapping(document)) {
      problems.push(`${name}: must be a YAML mapping`)
      continue
    }
    merge(raw, document, problems)
  }
  if (problems.length > 0) {
    throw new ConfigError(source, problems)
  }

  const result = schema(production).safeParse(raw)
  if (!result.success) {
    throw new ConfigError(
      source,
      result.error.issues.map((issue) =>
        issue.path.length > 0
          ? `${issue.path.join('.')}: ${issue.message}`
          : issue.message
      )
    )
  }

  const { host, redirectUrl, ...rest } = result.data
  const origin = new URL(host).origin
  return {
    ...rest,
    host: origin,
    redirectUrl: redirectUrl ?? `${origin}/finish`
  }
}

export function loadConfig(files: string[], production: boolean): Config {
  const documents: Record<string, string> = {}
  const problems: string[] = []
  for (const file of files) {
    try {
      documents[file] = readFileSync(file, 'utf8')
    } catch (error) {
      problems.push(`${file}: ${(error as Error).message}`)
    }
  }
  if (problems.length > 0) {
    throw new ConfigError(files.join(', '), problems)
  }
  return parseConfig(documents, production)
}
