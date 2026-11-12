import {
  type AuthenticatedClient,
  type OutgoingPayment,
  type PendingGrant,
  type Quote,
  type WalletAddress,
  createAuthenticatedClient,
  isFinalizedGrant,
  isPendingGrant
} from '@interledger/open-payments'
import { createId } from '@paralleldrive/cuid2'
import { randomUUID } from 'crypto'
import {
  type PaymentStatus,
  getPaymentStatus,
  toWalletAddressUrl
} from '~/utils/helpers'

async function createClient() {
  return await createAuthenticatedClient({
    keyId: process.env.KEY_ID!,
    privateKey: Buffer.from(process.env.PRIVATE_KEY!, 'base64'),
    walletAddressUrl: process.env.WALLET_ADDRESS!
  })
}

type QuoteResponse = Quote & { incomingPaymentGrantToken: string }

export async function fetchQuote(
  args: {
    walletAddress: string
    receiver: string
    amount: number
    note?: string
  },
  receiver: WalletAddress
): Promise<QuoteResponse> {
  const opClient = await createClient()
  const walletAddress = await getWalletAddress(args.walletAddress, opClient)

  const amountObj = {
    value: BigInt(
      (args.amount * 10 ** walletAddress.assetScale).toFixed()
    ).toString(),
    assetCode: walletAddress.assetCode,
    assetScale: walletAddress.assetScale
  }

  const incomingPaymentGrant = await getIncomingPaymentGrant(
    receiver.authServer,
    opClient
  )

  // create incoming payment without incoming amount
  const incomingPayment = await createIncomingPayment({
    accessToken: incomingPaymentGrant.access_token.value,
    walletAddress: receiver,
    note: args.note || '',
    opClient
  })

  const quoteGrant = await getQuoteGrant({
    authServer: walletAddress.authServer,
    opClient: opClient
  })

  if (isPendingGrant(quoteGrant)) {
    throw new Error('Expected non-interactive grant')
  }

  // create quote with debit amount, you don't care how much money receiver gets
  const quote = await opClient.quote
    .create(
      {
        url: walletAddress.resourceServer,
        accessToken: quoteGrant.access_token.value
      },
      {
        method: 'ilp',
        walletAddress: walletAddress.id,
        receiver: incomingPayment.id,
        debitAmount: amountObj
      }
    )
    .catch(() => {
      throw new Error(
        `Could not create quote for receiver ${receiver.publicName}.`
      )
    })

  const response = {
    incomingPaymentGrantToken: incomingPaymentGrant.access_token.value,
    ...quote
  }

  return response
}

export async function fetchRequestQuote(args: {
  walletAddress: string
  incomingPaymentUrl: string
}) {
  const opClient = await createClient()
  const walletAddress = await getWalletAddress(args.walletAddress, opClient)

  const quoteGrant = await getQuoteGrant({
    authServer: walletAddress.authServer,
    opClient: opClient
  })

  if (isPendingGrant(quoteGrant)) {
    throw new Error('Expected non-interactive grant')
  }

  // create quote with amount details in incoming payment url
  const quote = await opClient.quote
    .create(
      {
        url: walletAddress.resourceServer,
        accessToken: quoteGrant.access_token.value
      },
      {
        method: 'ilp',
        walletAddress: walletAddress.id,
        receiver: args.incomingPaymentUrl
      }
    )
    .catch(() => {
      throw new Error(`Could not create quote for request payment.`)
    })

  return quote
}

type CreateIncomingPaymentParams = {
  accessToken: string
  walletAddress: WalletAddress
  note: string
  opClient: AuthenticatedClient
}

async function createIncomingPayment({
  accessToken,
  walletAddress,
  note,
  opClient
}: CreateIncomingPaymentParams) {
  // create incoming payment without amount
  return await opClient.incomingPayment
    .create(
      {
        url: walletAddress.resourceServer,
        accessToken: accessToken
      },
      {
        expiresAt: new Date(Date.now() + 6000 * 60).toISOString(),
        walletAddress: walletAddress.id,
        metadata: {
          description: note
        }
      }
    )
    .catch(() => {
      throw new Error('Unable to create incoming payment.')
    })
}

export async function createRequestPayment(args: {
  walletAddress: string
  amount: number
  note?: string
}) {
  const opClient = await createClient()
  const walletAddress = await getWalletAddress(args.walletAddress, opClient)

  const amountObj = {
    value: BigInt(
      (args.amount * 10 ** walletAddress.assetScale).toFixed()
    ).toString(),
    assetCode: walletAddress.assetCode,
    assetScale: walletAddress.assetScale
  }

  const incomingPaymentGrant = await getIncomingPaymentGrant(
    walletAddress.authServer,
    opClient
  )

  // create incoming payment with amount
  return await opClient.incomingPayment
    .create(
      {
        url: walletAddress.resourceServer,
        accessToken: incomingPaymentGrant.access_token.value
      },
      {
        expiresAt: new Date(Date.now() + 6000 * 60 * 5).toISOString(),
        walletAddress: walletAddress.id,
        incomingAmount: amountObj,
        metadata: {
          description: args.note
        }
      }
    )
    .catch(() => {
      throw new Error('Unable to create incoming payment for request.')
    })
}

export async function initializePayment(args: {
  walletAddress: string
  quote: Quote
}) {
  const opClient = await createClient()
  const walletAddress = await getWalletAddress(args.walletAddress, opClient)
  const clientNonce = randomUUID()
  const paymentId = createId()

  const outgoingPaymentGrant = await createOutgoingPaymentGrant({
    walletAddress: walletAddress,
    debitAmount: args.quote.debitAmount,
    receiveAmount: args.quote.receiveAmount,
    nonce: clientNonce,
    paymentId: paymentId,
    opClient
  })

  return outgoingPaymentGrant
}

export interface Amount {
  value: string
  assetCode: string
  assetScale: number
}

type CreateOutgoingPaymentParams = {
  walletAddress: WalletAddress
  debitAmount?: Amount
  receiveAmount?: Amount
  nonce?: string
  paymentId: string
  opClient: AuthenticatedClient
}

async function createOutgoingPaymentGrant(
  params: CreateOutgoingPaymentParams
): Promise<PendingGrant> {
  const { walletAddress, debitAmount, nonce, paymentId, opClient } = params

  const grant = await opClient.grant
    .request(
      {
        url: walletAddress.authServer
      },
      {
        access_token: {
          access: [
            {
              identifier: walletAddress.id,
              type: 'outgoing-payment',
              actions: ['create', 'read', 'list'],
              limits: {
                debitAmount: debitAmount
              }
            }
          ]
        },
        interact: {
          start: ['redirect'],
          finish: {
            method: 'redirect',
            uri: `${process.env.REDIRECT_URL}?paymentId=${paymentId}`,
            nonce: nonce || ''
          }
        }
      }
    )
    .catch(() => {
      throw new Error('Could not retrieve outgoing payment grant.')
    })

  if (!isPendingGrant(grant)) {
    throw new Error('Expected interactive outgoing payment grant.')
  }

  return grant
}

export async function finishPayment(
  payment: PendingGrant,
  quote: Quote,
  walletAddress: WalletAddress,
  interactRef: string
): Promise<{
  url: string
  accessToken: string
  receivedBefore: string | undefined
}> {
  const opClient = await createClient()

  const continuation = await opClient.grant.continue(
    {
      accessToken: payment.continue.access_token.value,
      url: payment.continue.uri
    },
    {
      interact_ref: interactRef
    }
  )

  if (!isFinalizedGrant(continuation)) {
    throw new Error('Expected finalized grant. Received non-finalized grant.')
  }

  // what the receiver already got before this payment; the incoming
  // payment total can include other payments (request links)
  const receivedBefore = await opClient.incomingPayment
    .getPublic({ url: quote.receiver })
    .then((incomingPayment) => incomingPayment.receivedAmount?.value ?? '0')
    .catch(() => undefined)

  const url = walletAddress.resourceServer

  const outgoingPayment = await opClient.outgoingPayment
    .create(
      {
        url: url,
        accessToken: continuation.access_token.value
      },
      {
        walletAddress: walletAddress.id,
        quoteId: quote.id,
        metadata: {
          description: 'Payment at Interledger Pay'
        }
      }
    )
    .catch((error) => {
      throw new Error('Could not create outgoing payment.')
    })

  return {
    url: outgoingPayment.id,
    accessToken: continuation.access_token.value,
    receivedBefore
  }
}

function timeout(delay: number) {
  return new Promise((res) => setTimeout(res, delay))
}

// red: failed, green: successful, orange: partly sent, yellow: still sending
export type PaymentResultColor = 'red' | 'green' | 'orange' | 'yellow'

export type PaymentResultType = {
  message: string
  color: PaymentResultColor
  error: boolean
}

// how often and how long the finish page checks the outgoing payment;
// some payments take a while (slow or multi-hop paths, settlement first),
// so wait long enough. The last check can still take a few requests
// (up to 5 s each), so ABORT_DELAY in app/entry.server.tsx must stay
// well above PAYMENT_STATUS_TIMEOUT
const PAYMENT_STATUS_INTERVAL = 1_500
export const PAYMENT_STATUS_TIMEOUT = 40_000
// stop early when the outgoing payment cannot be read this many times in a row
const MAX_FAILED_CHECKS = 5

export async function checkOutgoingPayment(
  url: string,
  accessToken: string,
  accessTokenIncomingPayment: string | undefined,
  receiver: string,
  isRequestPayment?: boolean,
  receivedBefore?: string
): Promise<PaymentResultType> {
  const opClient = await createClient()
  const deadline = Date.now() + PAYMENT_STATUS_TIMEOUT

  let outgoingPayment: OutgoingPayment | undefined
  let status: PaymentStatus = 'sending'
  let failedChecks = 0

  // check until the payment is final, or until we stop waiting
  for (;;) {
    await timeout(PAYMENT_STATUS_INTERVAL)

    const op = await opClient.outgoingPayment
      .get({ url: url, accessToken: accessToken })
      .catch(() => undefined)

    if (op) {
      failedChecks = 0
      const previousSentAmount = outgoingPayment?.sentAmount.value
      outgoingPayment = op

      status = getPaymentStatus({
        failed: op.failed ?? false,
        sentAmount: op.sentAmount.value,
        debitAmount: op.debitAmount.value
      })

      // the sender may report sentAmount without fees,
      // so also check what the receiver got (public read, no token needed).
      // Not for request payments: others can pay the same request link at
      // the same time, so what the receiver got may not come from this payment
      if (
        !isRequestPayment &&
        status === 'sending' &&
        previousSentAmount === op.sentAmount.value
      ) {
        const incomingPayment = await opClient.incomingPayment
          .getPublic({ url: receiver })
          .catch(() => undefined)

        status = getPaymentStatus({
          failed: op.failed ?? false,
          sentAmount: op.sentAmount.value,
          debitAmount: op.debitAmount.value,
          previousSentAmount: previousSentAmount,
          receivedBefore: receivedBefore,
          receivedAmount: incomingPayment?.receivedAmount?.value,
          receiveAmount: op.receiveAmount.value
        })
      }

      if (status !== 'sending') break
    } else if (++failedChecks >= MAX_FAILED_CHECKS) {
      break
    }

    if (Date.now() + PAYMENT_STATUS_INTERVAL >= deadline) break
  }

  if (outgoingPayment === undefined) {
    throw new Error('Could not check outgoing payment.')
  }

  // complete the incoming payment we created without receive amount, only
  // once the sender is done; completing it earlier cuts off a payment in
  // progress. Request payments have an amount and complete by themselves.
  if (
    !isRequestPayment &&
    accessTokenIncomingPayment &&
    (status === 'completed' || status === 'partial')
  ) {
    await opClient.incomingPayment
      .complete({ url: receiver, accessToken: accessTokenIncomingPayment })
      .catch(() => {
        // the payment itself is done, so still show its result
        console.error(`Could not complete incoming payment ${receiver}.`)
      })
  }

  return getPaymentResult(status)
}

// sentAmount and debitAmount are not shown: debitAmount includes fees and
// sentAmount may not, so the two do not compare well
function getPaymentResult(status: PaymentStatus): PaymentResultType {
  switch (status) {
    case 'completed':
      return { message: 'Payment successful', color: 'green', error: false }
    case 'partial':
      return {
        message: 'Payment was only partly sent. Check your wallet for details.',
        color: 'orange',
        error: true
      }
    case 'failed':
      return {
        message: 'Payment failed. Check your balance and try again.',
        color: 'red',
        error: true
      }
    case 'sending':
      return {
        message:
          'Payment is still in progress. Check your wallet for the final status.',
        color: 'yellow',
        error: false
      }
  }
}

export async function getRequestPaymentDetails(
  paymentUrl: string,
  walletAddress: string
) {
  const opClient = await createClient()

  const receiver = await getWalletAddress(walletAddress, opClient)
  const incomingPaymentGrant = await getIncomingPaymentGrant(
    receiver.authServer,
    opClient
  )

  const paymentDetails = await opClient.incomingPayment
    .get({
      url: paymentUrl,
      accessToken: incomingPaymentGrant.access_token.value
    })
    .catch(() => {
      throw new Error('Could not retrieve payment details.')
    })

  return paymentDetails
}

type QuoteGrantParams = {
  authServer: string
  opClient: AuthenticatedClient
}

export async function getWalletAddress(
  url: string,
  opClient?: AuthenticatedClient
) {
  opClient = opClient ? opClient : await createClient()
  // accepts a wallet address URL or a payment pointer ($wallet.example/alice)
  const walletAddress = await opClient.walletAddress
    .get({
      url: toWalletAddressUrl(url)
    })
    .catch(() => {
      throw new Error('Invalid wallet address.')
    })

  return walletAddress
}

async function getQuoteGrant({ authServer, opClient }: QuoteGrantParams) {
  return await opClient.grant
    .request(
      {
        url: authServer
      },
      {
        access_token: {
          access: [
            {
              type: 'quote',
              actions: ['create', 'read']
            }
          ]
        }
      }
    )
    .catch(() => {
      throw new Error('Could not retrieve quote grant.')
    })
}

async function getIncomingPaymentGrant(
  url: string,
  opClient: AuthenticatedClient
) {
  const nonInteractiveGrant = await opClient.grant.request(
    {
      url: url
    },
    {
      access_token: {
        access: [
          {
            type: 'incoming-payment',
            actions: ['read', 'create', 'complete']
          }
        ]
      }
    }
  )

  if (isPendingGrant(nonInteractiveGrant)) {
    throw new Error('Expected non-interactive grant')
  }

  return nonInteractiveGrant
}
