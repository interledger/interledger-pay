import {
    createAuthenticatedClient,
    isPendingGrant,
} from "@interledger/open-payments";
import { prisma } from "./db.server";
import { type Payment } from "@prisma/client";
import { createId } from "@paralleldrive/cuid2";

async function createClient() {
    return await createAuthenticatedClient({
        keyId: process.env.KEY_ID!,
        privateKey: Buffer.from(process.env.PRIVATE_KEY!, "base64"),
        walletAddressUrl: process.env.WALLET_ADDRESS!,
    });
}

export async function initializePayment(args: {
    walletAddress: string;
    receiver: string;
    amount: number;
}) {
    const client = await createClient();

    const walletAddress = await client.walletAddress.get({
        url: args.walletAddress,
    });

    const receiver = await client.walletAddress.get({
        url: args.receiver,
    });

    const incomingPaymentGrant = await client.grant.request(
        {
            url: receiver.authServer,
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

    if (isPendingGrant(incomingPaymentGrant)) {
        throw new Error("Expected non-interactive grant");
    }

    const quoteGrant = await client.grant.request(
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
    );

    if (isPendingGrant(quoteGrant)) {
        throw new Error("Expected non-interactive grant");
    }

    const nonce = crypto.randomUUID();
    const amountObj = {
        value: BigInt(args.amount * 10 ** walletAddress.assetScale).toString(),
        assetCode: walletAddress.assetCode,
        assetScale: walletAddress.assetScale,
    };

    const incomingPayment = await client.incomingPayment.create(
        {
            url: new URL(receiver.id).origin,
            accessToken: incomingPaymentGrant.access_token.value,
        },
        {
            walletAddress: receiver.id,
            incomingAmount: amountObj,
            metadata: {
                description: "Payment from Interledger Pay",
            },
            expiresAt: new Date(Date.now() + 6000 * 60 * 5).toISOString(),
        }
    );

    const quote = await client.quote.create(
        {
            url: new URL(walletAddress.id).origin,
            accessToken: quoteGrant.access_token.value,
        },
        {
            method: "ilp",
            walletAddress: walletAddress.id,
            receiver: incomingPayment.id,
        }
    );

    const paymentId = createId();

    const outgoingPaymentGrant = await client.grant.request(
        {
            url: walletAddress.authServer,
        },
        {
            access_token: {
                access: [
                    {
                        identifier: walletAddress.id,
                        type: "outgoing-payment",
                        actions: ["create"],
                        limits: {
                            debitAmount: quote.debitAmount,
                            receiveAmount: quote.receiveAmount,
                        },
                    },
                ],
            },
            interact: {
                start: ["redirect"],
                finish: {
                    method: "redirect",
                    uri: `${process.env.REDIRECT_URL}?paymentId=${paymentId}`,
                    nonce,
                },
            },
        }
    );

    if (!isPendingGrant(outgoingPaymentGrant)) {
        throw new Error("Expected interactive grant");
    }

    await prisma.payment.create({
        data: {
            id: paymentId,
            walletAddress: walletAddress.id,
            continueToken: outgoingPaymentGrant.continue.access_token.value,
            continueUri: outgoingPaymentGrant.continue.uri,
            quote: quote.id,
        },
    });

    return outgoingPaymentGrant;
}

export async function send(
    payment: Payment,
    interactRef: string
): Promise<void> {
    const client = await createClient();

    const continuation = await client.grant.continue(
        {
            accessToken: payment.continueToken,
            url: payment.continueUri,
        },
        {
            interact_ref: interactRef,
        }
    );

    await client.outgoingPayment.create(
        {
            url: new URL(payment.walletAddress).origin,
            accessToken: continuation.access_token.value,
        },
        {
            walletAddress: payment.walletAddress,
            quoteId: payment.quote,
            metadata: {
                description: "Payment from Interledger Pay",
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
