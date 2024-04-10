import { useForm } from "@conform-to/react";
import { json, redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, Link, useActionData, useLoaderData } from "@remix-run/react";
import { AmountDisplay } from "~/components/dialpad";
import { Header } from "~/components/header";
import { BackNav } from "~/components/icons";
import { Button } from "~/components/ui/button";
import { CopyButton } from "~/components/ui/copyButton";
import { Field } from "~/components/ui/form/form";
import { destroySession, getSession } from "~/session";
import { formatAmount, formatDate } from "~/utils/helpers";

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const incomingPayment = session.get("incoming-payment");

  if (incomingPayment === undefined) {
    throw new Error("Payment session expired.");
  }

  const requestAmount = formatAmount({
    value: incomingPayment.incomingAmount.value,
    assetCode: incomingPayment.incomingAmount.assetCode,
    assetScale: incomingPayment.incomingAmount.assetScale,
  });

  const dateRequested = formatDate({
    date: incomingPayment.createdAt,
  });
  const url = `${process.env.INTERLEDGER_PAY_HOST}/payment?url=${btoa(
    incomingPayment.id
  )}&receiver=${btoa(incomingPayment.walletAddress)}`;

  return json({
    requestAmount: requestAmount.amountWithCurrency,
    dateRequested: dateRequested,
    note: incomingPayment.metadata.description,
    paymentUrl: url,
  } as const);
}

export default function ShareRequest() {
  const data = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  const [form] = useForm({
    id: "shareRequest-form",
    lastSubmission: actionData,
  });

  return (
    <>
      <Header />
      <Link to="/request" className="flex gap-2 items-center justify-end">
        <BackNav />
        <span className="hover:text-green-1">Request payment</span>
      </Link>
      <div className="flex h-full flex-col justify-center gap-10">
        <AmountDisplay />
        <div className="mx-auto w-full max-w-sm">
          <Form method="POST" {...form.props}>
            <Field
              label="Amount requested"
              defaultValue={data.requestAmount}
              variant="info"
            ></Field>
            <Field
              label="Date requested"
              defaultValue={data.dateRequested}
              variant="info"
            ></Field>
            <Field
              label="Request note"
              defaultValue={data.note}
              variant="info"
            ></Field>
            <div className="mb-6 mx-4 flex gap-4 font-light text-sm justify-center items-center before:content-[''] after:content-[''] before:border after:border before:border-input after:border-inout before:flex-1 after:flex-1 before:border-solid after:border-solid">
              Share link
            </div>
            <Field
              label="Payment link"
              variant="highlight"
              defaultValue={data.paymentUrl}
              className="flex-1 -z-1"
              trailing={
                <>
                  <CopyButton
                    aria-label="copy payment link"
                    className="h-7 w-7"
                    size="sm"
                    value={data.paymentUrl}
                    variant="input"
                  ></CopyButton>
                </>
              }
            ></Field>
            <Button
              variant="outline"
              size="xl"
              type="button"
              onClick={() => {
                navigator.share({
                  title: "Payment link",
                  text: "Interledger Pay payment link:",
                  url: data.paymentUrl,
                });
              }}
            >
              Share payment link
            </Button>
            <Button type="submit" className="mt-8" size="xl">
              Close
            </Button>
          </Form>
        </div>
      </div>
    </>
  );
}

export async function action({ request }: LoaderFunctionArgs) {
  const session = await getSession(request.headers.get("Cookie"));

  return redirect("/", {
    headers: {
      "Set-Cookie": await destroySession(session),
    },
  });
}
