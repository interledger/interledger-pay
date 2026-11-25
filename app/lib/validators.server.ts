import { createClient, getWalletAddress } from './open-payments.server'

export async function getValidWalletAddress(walletAddress: string) {
  const opClient = await createClient()
  const response = await getWalletAddress(walletAddress, opClient)
  return response
}
