import {
  type AuthenticatedClient,
  type PendingGrant,
  type Quote,
  type WalletAddress,
  createAuthenticatedClient,
  isFinalizedGrant,
  isPendingGrant,
} from "@interledger/open-payments";
import { createId } from "@paralleldrive/cuid2";
import { randomUUID } from "crypto";

async function createClient() {
  return await createAuthenticatedClient({
    keyId: process.env.KEY_ID!,
    privateKey: Buffer.from(process.env.PRIVATE_KEY!, "base64"),
    walletAddressUrl: process.env.WALLET_ADDRESS!,
  });
}

type QuoteResponse = Quote & { incomingPaymentGrantToken: string };

export async function fetchQuote(
  args: {
    walletAddress: string;
    receiver: string;
    amount: number;
    note?: string;
  },
  receiver: WalletAddress
): Promise<QuoteResponse> {
  const opClient = await createClient();
  const walletAddress = await getWalletAddress(args.walletAddress, opClient);

  const amountObj = {
    value: BigInt(
      (args.amount * 10 ** walletAddress.assetScale).toFixed()
    ).toString(),
    assetCode: walletAddress.assetCode,
    assetScale: walletAddress.assetScale,
  };

  const incomingPaymentGrant = await getIncomingPaymentGrant(
    receiver.authServer,
    opClient
  );

  // create incoming payment without incoming amount
  const incomingPayment = await createIncomingPayment({
    accessToken: incomingPaymentGrant.access_token.value,
    walletAddress: receiver,
    note: args.note || "",
    opClient,
  });

  const quoteGrant = await getQuoteGrant({
    authServer: walletAddress.authServer,
    opClient: opClient,
  });

  if (isPendingGrant(quoteGrant)) {
    throw new Error("Expected non-interactive grant");
  }

  // create quote with debit amount, you don't care how much money receiver gets
  const quote = await opClient.quote
    .create(
      {
        url: new URL(walletAddress.id).origin,
        accessToken: quoteGrant.access_token.value,
      },
      {
        method: "ilp",
        walletAddress: walletAddress.id,
        receiver: incomingPayment.id,
        debitAmount: amountObj,
      }
    )
    .catch(() => {
      throw new Error(
        `Could not create quote for receiver ${receiver.publicName}.`
      );
    });

  const response = {
    incomingPaymentGrantToken: incomingPaymentGrant.access_token.value,
    ...quote,
  };

  return response;
}

export async function fetchRequestQuote(args: {
  walletAddress: string;
  incomingPaymentUrl: string;
}) {
  const opClient = await createClient();
  const walletAddress = await getWalletAddress(args.walletAddress, opClient);

  const quoteGrant = await getQuoteGrant({
    authServer: walletAddress.authServer,
    opClient: opClient,
  });

  if (isPendingGrant(quoteGrant)) {
    throw new Error("Expected non-interactive grant");
  }

  // create quote with amount details in incoming payment url
  const quote = await opClient.quote
    .create(
      {
        url: new URL(walletAddress.id).origin,
        accessToken: quoteGrant.access_token.value,
      },
      {
        method: "ilp",
        walletAddress: walletAddress.id,
        receiver: args.incomingPaymentUrl,
      }
    )
    .catch(() => {
      throw new Error(`Could not create quote for request payment.`);
    });

  return quote;
}

type CreateIncomingPaymentParams = {
  accessToken: string;
  walletAddress: WalletAddress;
  note: string;
  opClient: AuthenticatedClient;
};

async function createIncomingPayment({
  accessToken,
  walletAddress,
  note,
  opClient,
}: CreateIncomingPaymentParams) {
  // create incoming payment without amount
  return await opClient.incomingPayment
    .create(
      {
        url: new URL(walletAddress.id).origin,
        accessToken: accessToken,
      },
      {
        expiresAt: new Date(Date.now() + 6000 * 60).toISOString(),
        walletAddress: walletAddress.id,
        metadata: {
          description: note,
        },
      }
    )
    .catch(() => {
      throw new Error("Unable to create incoming payment.");
    });
}

export async function createRequestPayment(args: {
  walletAddress: string;
  amount: number;
  note?: string;
}) {
  const opClient = await createClient();
  const walletAddress = await getWalletAddress(args.walletAddress, opClient);

  const amountObj = {
    value: BigInt(
      (args.amount * 10 ** walletAddress.assetScale).toFixed()
    ).toString(),
    assetCode: walletAddress.assetCode,
    assetScale: walletAddress.assetScale,
  };

  const incomingPaymentGrant = await getIncomingPaymentGrant(
    walletAddress.authServer,
    opClient
  );

  // create incoming payment with amount
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

  return outgoingPaymentGrant;
}

export interface Amount {
  value: string;
  assetCode: string;
  assetScale: number;
}

type CreateOutgoingPaymentParams = {
  walletAddress: WalletAddress;
  debitAmount?: Amount;
  receiveAmount?: Amount;
  nonce?: string;
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
            nonce: nonce || "",
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

export async function finishPayment(
  payment: PendingGrant,
  quote: Quote,
  walletAddress: WalletAddress,
  interactRef: string
): Promise<{ url: string; accessToken: string }> {
  const opClient = await createClient();

  const continuation = await opClient.grant.continue(
    {
      accessToken: payment.continue.access_token.value,
      url: payment.continue.uri,
    },
    {
      interact_ref: interactRef,
    }
  );

  if (!isFinalizedGrant(continuation)) {
    throw new Error("Expected finalized grant. Received non-finalized grant.");
  }

  const url = new URL(walletAddress.id).origin;

  const outgoingPayment = await opClient.outgoingPayment
    .create(
      {
        url: url,
        accessToken: continuation.access_token.value,
      },
      {
        walletAddress: walletAddress.id,
        quoteId: quote.id,
        metadata: {
          description: "Payment at Interledger Pay",
        },
      }
    )
    .catch(() => {
      throw new Error("Could not create outgoing payment.");
    });

  return {
    url: outgoingPayment.id,
    accessToken: continuation.access_token.value,
  };
}

function timeout(delay: number) {
  return new Promise((res) => setTimeout(res, delay));
}

export type PaymentResultType = {
  message: string;
  color: "red" | "green";
  error: boolean;
};

export async function checkOutgoingPayment(
  url: string,
  accessToken: string,
  accessTokenIncomingPayment: string,
  receiver: string,
  isRequestPayment?: boolean
): Promise<PaymentResultType> {
  const opClient = await createClient();
  await timeout(3000);

  // get outgoing payment, to check if there was enough balance
  const checkOutgoingPaymentResponse = await opClient.outgoingPayment
    .get({
      url: url,
      accessToken: accessToken,
    })
    .then((op) => {
      let paymentResult: PaymentResultType;
      if (Number(op.sentAmount.value) > 0) {
        paymentResult = {
          message: "Payment successful",
          color: "green",
          error: false,
        };
      } else {
        paymentResult = {
          message: "Payment failed. Check your balance and try again.",
          color: "red",
          error: true,
        };
      }

      return paymentResult;
    });

  if (!checkOutgoingPaymentResponse.error) {
    if (!isRequestPayment) {
      // complete incoming payment created without receive amount
      await opClient.incomingPayment
        .complete({
          url: receiver,
          accessToken: accessTokenIncomingPayment,
        })
        .catch(() => {
          throw new Error("Could not complete incoming payment.");
        });
    }
  }

  return checkOutgoingPaymentResponse;
}

export async function getRequestPaymentDetails(
  paymentUrl: string,
  walletAddress: string
) {
  const opClient = await createClient();

  const receiver = await getWalletAddress(walletAddress, opClient);
  const incomingPaymentGrant = await getIncomingPaymentGrant(
    receiver.authServer,
    opClient
  );

  const paymentDetails = await opClient.incomingPayment
    .get({
      url: paymentUrl,
      accessToken: incomingPaymentGrant.access_token.value,
    })
    .catch(() => {
      throw new Error("Could not retrieve payment details.");
    });

  return paymentDetails;
}

type QuoteGrantParams = {
  authServer: string;
  opClient: AuthenticatedClient;
};

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
      throw new Error("Invalid wallet address.");
    });

  return walletAddress;
}

async function getQuoteGrant({ authServer, opClient }: QuoteGrantParams) {
  return await opClient.grant
    .request(
      {
        url: authServer,
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
}

async function getIncomingPaymentGrant(
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
            actions: ["read", "create", "complete"],
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
