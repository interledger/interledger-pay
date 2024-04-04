import { conform, useForm } from "@conform-to/react";
import { getFieldsetConstraint, parse } from "@conform-to/zod";
import { type LoaderFunctionArgs, json, redirect } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { z } from "zod";
import { AmountDisplay } from "~/components/dialpad";
import { Header } from "~/components/header";
import { Button } from "~/components/ui/button";
import { Field } from "~/components/ui/form/form";
import { useDialogContext } from "~/lib/context/dialog";
import {
  fetchRequestQuote,
  getRequestPaymentDetails,
} from "~/lib/open-payments.server";
import { commitSession, getSession } from "~/session";
import { formatAmount, formatDate } from "~/utils/helpers";

export async function loader({ request }: LoaderFunctionArgs) {
  const searchParams = new URL(request.url).searchParams;

  const paymentId = searchParams.get("url");
  const receiver = searchParams.get("receiver");
  const paymentDetails = await getRequestPaymentDetails(
    atob(paymentId || ""),
    atob(receiver || "")
  );

  const requestedAmount = paymentDetails.incomingAmount
    ? formatAmount({
        value: paymentDetails.incomingAmount?.value,
        assetCode: paymentDetails.incomingAmount?.assetCode,
        assetScale: paymentDetails.incomingAmount?.assetScale,
      })
    : null;

  return json({
    receiver: paymentDetails.walletAddress,
    url: atob(paymentId || ""),
    requestedAmount: requestedAmount,
    note: paymentDetails.metadata?.description + "",
    date: formatDate({ date: paymentDetails.createdAt }),
  } as const);
}

const schema = z.object({
  walletAddress: z
    .string()
    .transform((val) => val.replace("$", "https://"))
    .pipe(z.string().url({ message: "Invalid wallet address." })),
  incomingPaymentUrl: z.string(),
});

export default function PayRequest() {
  const data = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const { setOpen } = useDialogContext();
  const [form, fields] = useForm({
    id: "payment-form",
    constraint: getFieldsetConstraint(schema),
    lastSubmission: actionData,
    shouldRevalidate: "onSubmit",
  });

  return (
    <>
      <Header />
      <div className="flex h-full flex-col justify-center gap-10">
        <AmountDisplay
          displayAmount={data.requestedAmount?.amountWithCurrency}
        />
        <div className="mx-auto w-full max-w-sm">
          <Form method="POST" {...form.props}>
            <Field
              label="Amount requested"
              defaultValue={data.requestedAmount?.amountWithCurrency}
              variant="highlight"
              readOnly
            ></Field>
            <Field
              label="Pay into"
              defaultValue={data.receiver}
              variant="highlight"
              readOnly
            ></Field>
            <Field
              label="Date requested"
              defaultValue={data.date}
              variant="highlight"
              readOnly
            ></Field>
            <Field
              label="Request note"
              defaultValue={data.note}
              variant="highlight"
              readOnly
            ></Field>
            <Field
              label="Pay from"
              type="text"
              placeholder="Enter your wallet address"
              {...conform.input(fields.walletAddress)}
            ></Field>
            <input
              type="hidden"
              {...conform.input(fields.incomingPaymentUrl)}
              value={data.url || ""}
            />
            <Button
              aria-label="pay"
              type="submit"
              size="xl"
              onClick={() => setOpen(true)}
            >
              Pay with Interledger Pay
            </Button>
          </Form>
        </div>
      </div>
    </>
  );
}

export async function action({ request }: LoaderFunctionArgs) {
  const session = await getSession(request.headers.get("Cookie"));

  const formData = await request.formData();
  const submission = await parse(formData, {
    schema,
    async: true,
  });

  if (!submission.value || submission.intent !== "submit") {
    return json(submission);
  }

  const quote = await fetchRequestQuote(submission.value);
  session.set("quote", quote);
  session.set("wallet-address", {
    walletAddress: submission.value.walletAddress.trim(),
  });
  session.set("isRequestPayment", true);

  return redirect(`/quote`, {
    headers: { "Set-Cookie": await commitSession(session) },
  });
}
