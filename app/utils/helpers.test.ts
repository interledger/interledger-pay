import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { toWalletAddressUrl } from './helpers'

describe('toWalletAddressUrl', () => {
  it('resolves a payment pointer with a path to that path', () => {
    assert.equal(
      toWalletAddressUrl('$ilp.interledger-test.dev/sabine_usd'),
      'https://ilp.interledger-test.dev/sabine_usd'
    )
    assert.equal(
      toWalletAddressUrl('$wallet.example/alice/usd'),
      'https://wallet.example/alice/usd'
    )
  })

  it('resolves a payment pointer without a path to /.well-known/pay', () => {
    assert.equal(
      toWalletAddressUrl('$boot1.dassie.xyz'),
      'https://boot1.dassie.xyz/.well-known/pay'
    )
    assert.equal(
      toWalletAddressUrl('$sabine.com/'),
      'https://sabine.com/.well-known/pay'
    )
  })

  it('drops a trailing slash after the path', () => {
    assert.equal(
      toWalletAddressUrl('$wallet.example/alice/'),
      'https://wallet.example/alice'
    )
  })

  it('ignores surrounding whitespace', () => {
    assert.equal(
      toWalletAddressUrl('  $wallet.example/alice \n'),
      'https://wallet.example/alice'
    )
    assert.equal(
      toWalletAddressUrl(' $sabine.com '),
      'https://sabine.com/.well-known/pay'
    )
  })

  it('keeps a wallet address URL as it is', () => {
    assert.equal(
      toWalletAddressUrl('https://ilp.interledger-test.dev/sabine_usd'),
      'https://ilp.interledger-test.dev/sabine_usd'
    )
    assert.equal(
      toWalletAddressUrl('https://wallet.example/$alice'),
      'https://wallet.example/$alice'
    )
  })
})
