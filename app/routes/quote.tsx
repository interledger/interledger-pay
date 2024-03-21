import { useForm } from "@conform-to/react";
import { type Quote } from "@interledger/open-payments";
import { json, redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, Link, useActionData, useLoaderData } from "@remix-run/react";
import { Header } from "~/components/header";
import { BackNav } from "~/components/icons";
import { Button } from "~/components/ui/button";
import { Field } from "~/components/ui/form/form";
import { initializePayment } from "~/lib/open-payments.server";
import { destroySession, getSession } from "~/session";
import { formatAmount, getFee } from "~/utils/helpers";

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const quote = session.get("quote");

  const receiveAmount = formatAmount({
    value: quote.receiveAmount.value,
    assetCode: quote.receiveAmount.assetCode,
    assetScale: quote.receiveAmount.assetScale,
  });

  const debitAmount = formatAmount({
    value: quote.debitAmount.value,
    assetCode: quote.debitAmount.assetCode,
    assetScale: quote.debitAmount.assetScale,
  });

  const fee = getFee(quote);

  return json({
    fee: fee.amount,
    receiveAmount: receiveAmount.amount,
    debitAmount: debitAmount.amount,
  } as const);
}

export default function Quote() {
  const data = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [form] = useForm({
    id: "quote-form",
    lastSubmission: actionData,
    shouldRevalidate: "onSubmit",
  });

  return (
    <>
      <Header />
      <Link
        to={`/ilpay?walletaddress=`}
        className="flex gap-2 items-center justify-end"
      >
        <BackNav />
        <span className="hover:text-green-1">Pay</span>
      </Link>
      <div className="flex h-full flex-col justify-center gap-10">
        <div className="mx-auto w-full max-w-sm">
          <Form method="POST" {...form.props}>
            <Field
              label="You send exactly"
              value={data.debitAmount}
              variant="info"
            ></Field>
            <Field
              label="Recepient gets"
              value={data.receiveAmount}
              variant="info"
            ></Field>
            <Field label="Fee" value={data.fee} variant="info"></Field>
            <Button
              aria-label="confirm-pay"
              type="submit"
              size="xl"
              className="mb-5"
            >
              Confirm payment
            </Button>
            <Button
              aria-label="cancel-pay"
              type="submit"
              size="xl"
              variant="destructive"
            >
              Cancel payment
            </Button>
          </Form>
        </div>
      </div>
    </>
  );
}

export async function action({ request }: LoaderFunctionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const quote: Quote = session.get("quote");
  const walletAddress = session.get("wallet-address");

  const grant = await initializePayment({
    walletAddress: walletAddress.walletAddress,
    quote: quote,
  });

  return redirect(grant.interact.redirect, {
    headers: {
      "Set-Cookie": await destroySession(session),
    },
  });
}
