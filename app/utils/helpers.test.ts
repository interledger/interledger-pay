import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { getPaymentStatus, toWalletAddressUrl } from './helpers'

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

describe('getPaymentStatus', () => {
  it('is completed when the full debit amount was sent', () => {
    assert.equal(
      getPaymentStatus({
        failed: false,
        sentAmount: '200',
        debitAmount: '200'
      }),
      'completed'
    )
  })

  it('is completed when the receiver got the full amount and sending stopped', () => {
    // sentAmount can leave out fees, so it may stay below debitAmount
    assert.equal(
      getPaymentStatus({
        failed: false,
        sentAmount: '198',
        debitAmount: '200',
        previousSentAmount: '198',
        receivedBefore: '0',
        receivedAmount: '198',
        receiveAmount: '198'
      }),
      'completed'
    )
  })

  it('is sending when the receiver got the quoted amount but sending goes on', () => {
    // receiveAmount is the quoted minimum; the sender may still send more
    assert.equal(
      getPaymentStatus({
        failed: false,
        sentAmount: '1900000',
        debitAmount: '2000000',
        previousSentAmount: '1700000',
        receivedBefore: '0',
        receivedAmount: '1900000',
        receiveAmount: '1900000'
      }),
      'sending'
    )
    assert.equal(
      getPaymentStatus({
        failed: false,
        sentAmount: '198',
        debitAmount: '200',
        receivedBefore: '0',
        receivedAmount: '198',
        receiveAmount: '198'
      }),
      'sending'
    )
  })

  it('is sending while only part of the amount was sent', () => {
    // 1.1 of 2 XRP sent, wallet still settling
    assert.equal(
      getPaymentStatus({
        failed: false,
        sentAmount: '1100000',
        debitAmount: '2000000',
        previousSentAmount: '1100000',
        receivedBefore: '0',
        receivedAmount: '1100000',
        receiveAmount: '2000000'
      }),
      'sending'
    )
    assert.equal(
      getPaymentStatus({ failed: false, sentAmount: '0', debitAmount: '200' }),
      'sending'
    )
  })

  it('is sending when nothing was sent, even if others already paid the receiver', () => {
    // request link paid in part by someone else before
    assert.equal(
      getPaymentStatus({
        failed: false,
        sentAmount: '0',
        debitAmount: '400',
        previousSentAmount: '0',
        receivedAmount: '600',
        receiveAmount: '400'
      }),
      'sending'
    )
  })

  it('is partial when the payment failed after sending part of it', () => {
    assert.equal(
      getPaymentStatus({
        failed: true,
        sentAmount: '1100000',
        debitAmount: '2000000'
      }),
      'partial'
    )
  })

  it('counts only what the receiver got since this payment started', () => {
    // request link that already had 600 before this payment of 400
    assert.equal(
      getPaymentStatus({
        failed: false,
        sentAmount: '50',
        debitAmount: '400',
        previousSentAmount: '50',
        receivedBefore: '600',
        receivedAmount: '650',
        receiveAmount: '400'
      }),
      'sending'
    )
    assert.equal(
      getPaymentStatus({
        failed: false,
        sentAmount: '396',
        debitAmount: '400',
        previousSentAmount: '396',
        receivedBefore: '600',
        receivedAmount: '1000',
        receiveAmount: '400'
      }),
      'completed'
    )
  })

  it('ignores the receiver side when the amount before is not known', () => {
    assert.equal(
      getPaymentStatus({
        failed: false,
        sentAmount: '396',
        debitAmount: '400',
        previousSentAmount: '396',
        receivedAmount: '400',
        receiveAmount: '400'
      }),
      'sending'
    )
  })

  it('is partial when the payment failed, even with the full amount sent', () => {
    assert.equal(
      getPaymentStatus({ failed: true, sentAmount: '200', debitAmount: '200' }),
      'partial'
    )
  })

  it('is failed when the payment failed without sending anything', () => {
    assert.equal(
      getPaymentStatus({ failed: true, sentAmount: '0', debitAmount: '200' }),
      'failed'
    )
  })

  it('ignores the receiver side when it is not known', () => {
    assert.equal(
      getPaymentStatus({
        failed: false,
        sentAmount: '100',
        debitAmount: '200',
        previousSentAmount: '100',
        receivedAmount: '100'
      }),
      'sending'
    )
  })
})
