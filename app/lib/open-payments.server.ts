import {
  type AuthenticatedClient,
  type PendingGrant,
  type Quote,
  type WalletAddress,
  createAuthenticatedClient,
  isPendingGrant,
} from "@interledger/open-payments";
import { prisma } from "./db.server";
import { type Payment } from "@prisma/client";
import { createId } from "@paralleldrive/cuid2";
import { randomUUID } from "crypto";

async function createClient() {
  return await createAuthenticatedClient({
    keyId: process.env.KEY_ID!,
    privateKey: Buffer.from(process.env.PRIVATE_KEY!, "base64"),
    walletAddressUrl: process.env.WALLET_ADDRESS!,
  });
}

export async function fetchQuote(args: {
  walletAddress: string;
  receiver: string;
  amount: number;
  note: string;
}) {
  const opClient = await createClient();
  const walletAddress = await getWalletAddress(args.walletAddress, opClient);
  const receiver = await getWalletAddress(args.receiver, opClient);

  const incomingPaymentGrant = await getNonInteractiveGrant(
    receiver.authServer,
    opClient
  );

  const incomingPayment = await createIncomingPayment({
    accessToken: incomingPaymentGrant.access_token.value,
    walletAddress: receiver,
    amount: args.amount,
    note: args.note,
    opClient,
  });

  const quote = await createQuote({
    walletAddress: walletAddress,
    receiver: incomingPayment.id,
    opClient,
  });

  return quote;
}

export async function initializePayment(args: {
  walletAddress: string;
  quote: Quote;
}) {
  const opClient = await createClient();
  const walletAddress = await getWalletAddress(args.walletAddress, opClient);
  const clientNonce = randomUUID();
  const paymentId = createId();

  const outgoingPaymentGrant = await createOutgoingPaymentGrant({
    walletAddress: walletAddress,
    debitAmount: args.quote.debitAmount,
    receiveAmount: args.quote.receiveAmount,
    nonce: clientNonce,
    paymentId: paymentId,
    opClient,
  });

  await prisma.payment.create({
    data: {
      id: paymentId,
      walletAddress: walletAddress.id,
      continueToken: outgoingPaymentGrant.continue.access_token.value,
      continueUri: outgoingPaymentGrant.continue.uri,
      quote: args.quote.id,
    },
  });

  return outgoingPaymentGrant;
}

export async function createRequestPayment(args: {
  walletAddress: string;
  amount: number;
  note: string;
}) {
  const opClient = await createClient();
  const walletAddress = await getWalletAddress(args.walletAddress, opClient);

  const amountObj = {
    value: BigInt(args.amount * 10 ** walletAddress.assetScale).toString(),
    assetCode: walletAddress.assetCode,
    assetScale: walletAddress.assetScale,
  };

  const incomingPaymentGrant = await getNonInteractiveGrant(
    walletAddress.authServer,
    opClient
  );

  return await opClient.incomingPayment
    .create(
      {
        url: new URL(walletAddress.id).origin,
        accessToken: incomingPaymentGrant.access_token.value,
      },
      {
        expiresAt: new Date(Date.now() + 6000 * 60 * 5).toISOString(),
        walletAddress: walletAddress.id,
        incomingAmount: amountObj,
        metadata: {
          description: args.note,
        },
      }
    )
    .catch(() => {
      throw new Error("Unable to create incoming payment for request.");
    });
}

export async function getWalletAddress(
  url: string,
  opClient?: AuthenticatedClient
) {
  opClient = opClient ? opClient : await createClient();

  const walletAddress = await opClient.walletAddress
    .get({
      url: url,
    })
    .catch(() => {
      throw new Error("Invalid payment pointer.");
    });

  return walletAddress;
}

async function getNonInteractiveGrant(
  url: string,
  opClient: AuthenticatedClient
) {
  const nonInteractiveGrant = await opClient.grant.request(
    {
      url: url,
    },
    {
      access_token: {
        access: [
          {
            type: "incoming-payment",
            actions: ["read", "create"],
          },
        ],
      },
    }
  );

  if (isPendingGrant(nonInteractiveGrant)) {
    throw new Error("Expected non-interactive grant");
  }

  return nonInteractiveGrant;
}

type CreateIncomingPaymentParams = {
  walletAddress: WalletAddress;
  accessToken: string;
  amount: number;
  note: string;
  opClient: AuthenticatedClient;
};

async function createIncomingPayment({
  accessToken,
  walletAddress,
  amount,
  note,
  opClient,
}: CreateIncomingPaymentParams) {
  const amountObj = {
    value: BigInt(amount * 10 ** walletAddress.assetScale).toString(),
    assetCode: walletAddress.assetCode,
    assetScale: walletAddress.assetScale,
  };

  return await opClient.incomingPayment
    .create(
      {
        url: new URL(walletAddress.id).origin,
        accessToken: accessToken,
      },
      {
        expiresAt: new Date(Date.now() + 6000 * 60 * 5).toISOString(),
        walletAddress: walletAddress.id,
        incomingAmount: amountObj,
        metadata: {
          description: note,
        },
      }
    )
    .catch(() => {
      throw new Error("Unable to create incoming payment.");
    });
}

type CreateQuoteParams = {
  walletAddress: WalletAddress;
  receiver: string;
  opClient: AuthenticatedClient;
};

async function createQuote({
  walletAddress,
  receiver,
  opClient,
}: CreateQuoteParams): Promise<Quote> {
  const quoteGrant = await opClient.grant
    .request(
      {
        url: walletAddress.authServer,
      },
      {
        access_token: {
          access: [
            {
              type: "quote",
              actions: ["create", "read"],
            },
          ],
        },
      }
    )
    .catch(() => {
      throw new Error("Could not retrieve quote grant.");
    });

  if (isPendingGrant(quoteGrant)) {
    throw new Error("Expected non-interactive grant");
  }

  return await opClient.quote
    .create(
      {
        url: new URL(walletAddress.id).origin,
        accessToken: quoteGrant.access_token.value,
      },
      {
        method: "ilp",
        walletAddress: walletAddress.id,
        receiver: receiver,
      }
    )
    .catch(() => {
      throw new Error(`Could not create quote for receiver ${receiver}.`);
    });
}

export interface Amount {
  value: string;
  assetCode: string;
  assetScale: number;
}

type CreateOutgoingPaymentParams = {
  walletAddress: WalletAddress;
  debitAmount: Amount;
  receiveAmount: Amount;
  nonce: string;
  paymentId: string;
  opClient: AuthenticatedClient;
};

async function createOutgoingPaymentGrant(
  params: CreateOutgoingPaymentParams
): Promise<PendingGrant> {
  const {
    walletAddress,
    debitAmount,
    receiveAmount,
    nonce,
    paymentId,
    opClient,
  } = params;

  const grant = await opClient.grant
    .request(
      {
        url: walletAddress.authServer,
      },
      {
        access_token: {
          access: [
            {
              identifier: walletAddress.id,
              type: "outgoing-payment",
              actions: ["create", "read", "list"],
              limits: {
                debitAmount: debitAmount,
                receiveAmount: receiveAmount,
              },
            },
          ],
        },
        interact: {
          start: ["redirect"],
          finish: {
            method: "redirect",
            uri: `${process.env.REDIRECT_URL}?paymentId=${paymentId}`,
            nonce: nonce,
          },
        },
      }
    )
    .catch(() => {
      throw new Error("Could not retrieve outgoing payment grant.");
    });

  if (!isPendingGrant(grant)) {
    throw new Error("Expected interactive outgoing payment grant.");
  }

  return grant;
}

export async function send(
  payment: Payment,
  interactRef: string
): Promise<void> {
  const opClient = await createClient();

  const continuation = await opClient.grant.continue(
    {
      accessToken: payment.continueToken,
      url: payment.continueUri,
    },
    {
      interact_ref: interactRef,
    }
  );

  await opClient.outgoingPayment.create(
    {
      url: new URL(payment.walletAddress).origin,
      accessToken: continuation.access_token.value,
    },
    {
      walletAddress: payment.walletAddress,
      quoteId: payment.quote,
      metadata: {
        description: "Payment at Interledger Pay",
      },
    }
  );

  await prisma.payment.update({
    where: {
      id: payment.id,
    },
    data: {
      processedAt: new Date(),
    },
  });
}
