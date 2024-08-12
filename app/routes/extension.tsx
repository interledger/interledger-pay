import { conform, useForm } from "@conform-to/react";
import { getFieldsetConstraint, parse } from "@conform-to/zod";
import { type WalletAddress } from "@interledger/open-payments";
import {
  type ActionFunctionArgs,
  json,
  redirect,
  type LoaderFunctionArgs,
} from "@remix-run/node";
import type { MetaFunction } from "@remix-run/react";
import {
  Form,
  Link,
  useActionData,
  useLoaderData,
  useNavigation,
} from "@remix-run/react";
import { z } from "zod";
import { AmountDisplay, DialPad } from "~/components/dialpad";
import { PresetPad } from "~/components/presets";
import Quote from "~/components/quoteDialog";
import { Button } from "~/components/ui/button";
import { Field } from "~/components/ui/form/form";
import { useDialogContext } from "~/lib/context/dialog";
import { useDialPadContext } from "~/lib/context/dialpad";
import { fetchQuote, initializePayment } from "~/lib/open-payments.server";
import { getValidWalletAddress } from "~/lib/validators.server";
import { commitSession, destroySession, getSession } from "~/session";
import {
  isMessageEvent,
  formatAmount,
  objectToUrlParams,
  predefinedPaymentValues,
  sanitizeAndAddCss,
} from "~/utils/helpers";
import { useEffect, useState } from "react";
import { cn } from "~/lib/cn";

export const meta: MetaFunction = () => {
  return [
    { title: "Interledger Pay" },
    { name: "description", content: "Transaction by Interledger Pay!" },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request.headers.get("Cookie"));

  const params = new URL(request.url).searchParams;
  const receiver = params.get("receiver");
  const amount = params.get("amount");
  const asset = params.get("asset");
  const note = params.get("note");
  const action = params.get("action");

  const isQuote = params.get("quote") || false;
  let receiverName = "";
  let receiveAmount = null;
  let debitAmount = null;

  let isValidRequest = receiver !== undefined;
  let receiverWalletAddressInfo;

  try {
    if (receiver) {
      const formattedReceiver = String(receiver).replace("$", "https://");
      receiverWalletAddressInfo = await getValidWalletAddress(
        formattedReceiver
      );
    }
  } catch (error) {
    isValidRequest = false;
  }

  const assetScale = 2;
  const formattedAmount = formatAmount({
    value: amount ? String(Number(amount) * Math.pow(10, assetScale)) : "0",
    assetCode: asset || "usd",
    assetScale,
  });

  if (isQuote && isValidRequest && receiverWalletAddressInfo) {
    const quote = session.get("quote");

    if (quote === undefined) {
      throw new Error("Payment session expired.");
    }

    receiverName =
      receiverWalletAddressInfo.publicName === undefined
        ? "Recepient"
        : receiverWalletAddressInfo.publicName;

    receiveAmount = formatAmount({
      value: quote.receiveAmount.value,
      assetCode: quote.receiveAmount.assetCode,
      assetScale: quote.receiveAmount.assetScale,
    });

    debitAmount = formatAmount({
      value: quote.debitAmount.value,
      assetCode: quote.debitAmount.assetCode,
      assetScale: quote.debitAmount.assetScale,
    });
  }

  return json({
    receiverWalletAddress: receiverWalletAddressInfo
      ? receiverWalletAddressInfo.id
      : undefined,
    amount: formattedAmount,
    currency: asset ? asset : "usd",
    note: note ? note : null,
    action: action ? action : null,
    isValidRequest: isValidRequest,
    receiveAmount: receiveAmount ? receiveAmount.amountWithCurrency : null,
    debitAmount: debitAmount ? debitAmount.amountWithCurrency : null,
    receiverName: receiverName,
    isQuote: isQuote,
  } as const);
}

const schema = z.object({
  walletAddress: z.string(),
  receiver: z
    .string()
    .transform((val) => val.replace("$", "https://"))
    .pipe(z.string().url({ message: "The input is not a wallet address." })),
  amount: z.coerce.number(),
  note: z.string().optional(),
  action: z.string().optional(),
});

const addCssFromMessage = (e: Event) => {
  if (!isMessageEvent(e)) {
    throw new Error("not a message event");
  }

  // check if it's received in expected format
  if (e.data?.configCss) {
    const existingStyle = document.getElementById("wm_tools_styles");
    if (existingStyle) {
      existingStyle.remove();
    }
    sanitizeAndAddCss(e.data.configCss);
  }
};

export default function Extension() {
  const data = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const { amountValue, setAmountValue, setAssetCode } = useDialPadContext();
  const { setOpen } = useDialogContext();
  const [displayDialPad, setDisplayDialPad] = useState(false);
  const [form, fields] = useForm({
    id: "extension-pay-form",
    constraint: getFieldsetConstraint(schema),
    lastSubmission: actionData,
    shouldRevalidate: "onSubmit",
  });

  data.isQuote ? setOpen(true) : setOpen(false);

  useEffect(() => {
    setAssetCode(data.currency);
    const formattedNumber = data.amount.amount.toFixed(2);
    setAmountValue(String(formattedNumber));
  }, [data.amount]);

  useEffect(() => {
    window.addEventListener("message", addCssFromMessage);
    return () => {
      window.removeEventListener("message", addCssFromMessage);
    };
  }, []);

  return (
    <>
      <div className="flex flex-col justify-center gap-10">
        {data.isValidRequest ? (
          <>
            <div
              className={cn(
                "mx-auto w-full max-w-sm flex flex-col justify-center items-center text-muted",
                displayDialPad ? "" : "hidden"
              )}
            >
              <DialPad />
              <div className="flex flex-col gap-2">
                <div className="flex justify-center mt-8">
                  <Button
                    className="wmt-formattable-button"
                    aria-label="continue"
                    value="continue"
                    onClick={() => {
                      const formattedNumber = Number(amountValue).toFixed(2);
                      setAmountValue(String(formattedNumber));
                      setDisplayDialPad(false);
                    }}
                  >
                    Continue
                  </Button>
                </div>
              </div>
            </div>
            <div
              className={cn(
                "mx-auto w-full max-w-sm",
                displayDialPad ? "hidden" : ""
              )}
            >
              <AmountDisplay />
              <div className="mx-auto w-full max-w-sm my-6">
                <PresetPad
                  values={predefinedPaymentValues}
                  currency={data.amount.symbol}
                  onMore={() => setDisplayDialPad(true)}
                />
              </div>
              <Form method="POST" {...form.props}>
                <div className="flex flex-col gap-2">
                  <Field
                    type="text"
                    label="Pay from"
                    placeholder="Enter wallet address"
                    {...conform.input(fields.walletAddress)}
                    autoFocus={true}
                  />
                  <Field
                    type="text"
                    label="Pay into"
                    variant="highlight"
                    value={data.receiverWalletAddress}
                    readOnly
                    {...conform.input(fields.receiver)}
                    errors={fields.receiver.errors}
                  />
                  <Field
                    label="Payment note"
                    defaultValue={data.note || ""}
                    placeholder="Note"
                    {...conform.input(fields.note)}
                    errors={fields.note.errors}
                  />
                  <input
                    type="hidden"
                    {...conform.input(fields.amount)}
                    defaultValue={Number(amountValue || 0)}
                  />
                  <div className="flex justify-center">
                    <Button
                      className="wmt-formattable-button disabled:pointer-events-auto disabled:cursor-progress"
                      aria-label="pay"
                      type="submit"
                      name="intent"
                      value="pay"
                      disabled={isSubmitting}
                    >
                      {data.action || "Pay"}
                    </Button>
                    <input
                      type="hidden"
                      {...conform.input(fields.action)}
                      defaultValue={data.action || undefined}
                    />
                  </div>
                </div>
              </Form>
            </div>
            <Quote
              receiverName={data.receiverName}
              receiveAmount={data.receiveAmount || ""}
              debitAmount={data.debitAmount || ""}
            />
          </>
        ) : (
          <div>
            <div className="m-4 text-destructive sm:text-md font-medium">
              Invalid request
            </div>
            <Link target="_blank" to="/">
              <Button variant="outline" size="sm">
                Open Interledger pay
              </Button>
            </Link>
          </div>
        )}
      </div>
    </>
  );
}

export async function action({ request }: ActionFunctionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  session.set("fromExtension", true);

  let walletAddress;
  let receiver = {} as WalletAddress;

  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "pay") {
    const submission = await parse(formData, {
      schema: schema.superRefine(async (data, context) => {
        try {
          data.walletAddress = String(data.walletAddress).replace(
            "$",
            "https://"
          );

          walletAddress = await getValidWalletAddress(data.walletAddress);
          receiver = await getValidWalletAddress(data.receiver);

          session.set("wallet-address", {
            walletAddress: walletAddress,
          });
          session.set("receiver-wallet-address", receiver);

          return data;
        } catch (error) {
          context.addIssue({
            path: ["walletAddress"],
            code: z.ZodIssueCode.custom,
            message: "Wallet address is not valid.",
          });
        }
      }),
      async: true,
    });

    if (!submission.value || submission.intent !== "submit") {
      return json(submission);
    }

    const quote = await fetchQuote(submission.value, receiver);
    session.set("quote", quote);
    session.set("submission", submission);

    return redirect(
      `/extension?quote=true&${objectToUrlParams(submission.value)}`,
      {
        headers: { "Set-Cookie": await commitSession(session) },
      }
    );
  } else if (intent === "confirm") {
    const quote = session.get("quote");
    walletAddress = session.get("wallet-address");

    if (quote === undefined || walletAddress === undefined) {
      throw new Error("Payment session expired.");
    }

    const grant = await initializePayment({
      walletAddress: walletAddress.walletAddress.id,
      quote: quote,
    });

    session.set("payment-grant", grant);
    return redirect(grant.interact.redirect, {
      headers: { "Set-Cookie": await commitSession(session) },
    });
  } else {
    const submission = session.get("submission");
    const params = submission?.value
      ? objectToUrlParams(submission?.value)
      : "";
    return redirect(`/extension?${params}`, {
      headers: { "Set-Cookie": await destroySession(session) },
    });
  }
}
