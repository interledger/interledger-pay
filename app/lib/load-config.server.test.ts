import assert from 'node:assert/strict'
import { generateKeyPairSync } from 'node:crypto'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, it } from 'node:test'
import { stringify } from 'yaml'
import { ConfigError, loadConfig, parseConfig } from './load-config.server'

const ed25519 = generateKeyPairSync('ed25519')
  .privateKey.export({ type: 'pkcs8', format: 'pem' })
  .toString()

const settings = {
  host: 'https://pay.example.com',
  walletAddress: {
    url: 'https://ilp.example.com/pay',
    keyId: 'key-1'
  },
  stripe: { publishableKey: 'pk_test_abc' }
}

const secrets = {
  walletAddress: { privateKey: ed25519 },
  session: { cookieSecret: 'x'.repeat(32) },
  stripe: { secretKey: 'sk_test_abc' }
}

function parse(
  overrides: { settings?: object; secrets?: object } = {},
  production = true
) {
  return parseConfig(
    {
      settings: stringify(overrides.settings ?? settings),
      secrets: stringify(overrides.secrets ?? secrets)
    },
    production
  )
}

function problems(fn: () => unknown) {
  try {
    fn()
  } catch (error) {
    assert.ok(error instanceof ConfigError)
    return error.message
  }
  assert.fail('expected a ConfigError')
}

describe('parseConfig', () => {
  it('combines the files and derives the redirect URL from the host', () => {
    const config = parse()
    assert.equal(config.redirectUrl, 'https://pay.example.com/finish')
    assert.equal(config.walletAddress.keyId, 'key-1')
    assert.equal(config.walletAddress.privateKey.asymmetricKeyType, 'ed25519')
    assert.equal(config.stripe.secretKey, 'sk_test_abc')
  })

  it('accepts a base64 encoded PEM private key', () => {
    const config = parse({
      secrets: {
        ...secrets,
        walletAddress: { privateKey: Buffer.from(ed25519).toString('base64') }
      }
    })
    assert.equal(config.walletAddress.privateKey.asymmetricKeyType, 'ed25519')
  })

  it('rejects a key that is not Ed25519', () => {
    const rsa = generateKeyPairSync('rsa', { modulusLength: 2048 })
      .privateKey.export({ type: 'pkcs8', format: 'pem' })
      .toString()
    const message = problems(() =>
      parse({ secrets: { ...secrets, walletAddress: { privateKey: rsa } } })
    )
    assert.match(message, /secrets: walletAddress\.privateKey: must be an Ed25519/)
  })

  it('rejects Stripe keys of different modes', () => {
    const message = problems(() =>
      parse({ secrets: { ...secrets, stripe: { secretKey: 'sk_live_abc' } } })
    )
    assert.match(message, /stripe: .*both be test or live/)
  })

  it('rejects a secret in the config file', () => {
    const message = problems(() =>
      parse({ settings: { ...settings, session: { cookieSecret: 'y' } } })
    )
    assert.match(message, /config: Unrecognized key\(s\) in object: 'session'/)
  })

  it('reports every problem at once', () => {
    const message = problems(() =>
      parse({
        settings: { ...settings, host: 'http://pay.example.com', unknown: 1 },
        secrets: { ...secrets, session: { cookieSecret: 'short' } }
      })
    )
    assert.match(message, /config: host: must be an https URL/)
    assert.match(message, /Unrecognized key\(s\) in object: 'unknown'/)
    assert.match(message, /secrets: session\.cookieSecret:/)
  })

  it('allows http URLs outside production', () => {
    const config = parse(
      { settings: { ...settings, host: 'http://localhost:5280' } },
      false
    )
    assert.equal(config.redirectUrl, 'http://localhost:5280/finish')
  })
})

describe('loadConfig', () => {
  it('reports a file it cannot read with the problems of the other', () => {
    const dir = mkdtempSync(join(tmpdir(), 'interledger-pay-'))
    const settingsFile = join(dir, 'config.yaml')
    writeFileSync(settingsFile, stringify({ ...settings, host: 'nope' }))
    const message = problems(() =>
      loadConfig(settingsFile, join(dir, 'missing.yaml'), true)
    )
    assert.match(message, /config: host:/)
    assert.match(message, /secrets: ENOENT: .*missing\.yaml/)
  })
})
