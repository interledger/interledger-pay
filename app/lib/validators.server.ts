import { createAuthenticatedClient } from "@interledger/open-payments";
import { getWalletAddress } from "./open-payments.server";

async function createClient() {
  return await createAuthenticatedClient({
    keyId: process.env.KEY_ID!,
    privateKey: Buffer.from(process.env.PRIVATE_KEY!, "base64"),
    walletAddressUrl: process.env.WALLET_ADDRESS!,
  });
}

export async function getValidWalletAddress(walletAddress: string) {
  const opClient = await createClient();
  const response = await getWalletAddress(walletAddress, opClient);
  return response;
}
