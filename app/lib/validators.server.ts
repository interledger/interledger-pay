import { createAuthenticatedClient } from '@interledger/open-payments'
import { getWalletAddress } from './open-payments.server'
import { toWalletAddressUrl } from '~/utils/helpers'

async function createClient() {
  return await createAuthenticatedClient({
    keyId: process.env.KEY_ID!,
    privateKey: Buffer.from(process.env.PRIVATE_KEY!, 'base64'),
    walletAddressUrl: process.env.WALLET_ADDRESS!
  })
}

// accepts a wallet address URL or a payment pointer ($wallet.example/alice)
export async function getValidWalletAddress(walletAddress: string) {
  const opClient = await createClient()
  const response = await getWalletAddress(
    toWalletAddressUrl(walletAddress),
    opClient
  )
  return response
}
