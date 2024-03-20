import { conform, useForm } from "@conform-to/react";
import { getFieldsetConstraint, parse } from "@conform-to/zod";
import { json, redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, Link, useActionData, useLoaderData } from "@remix-run/react";
import { z } from "zod";
import { AmountDisplay } from "~/components/dialpad";
import { Header } from "~/components/header";
import { BackNav } from "~/components/icons";
import { Button } from "~/components/ui/button";
import { Field } from "~/components/ui/form/form";
import { TogglePayment } from "~/components/ui/form/togglePayment";
import { useDialPadContext } from "~/lib/context/dialpad";
import { initializePayment } from "~/lib/open-payments.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const searchParams = new URL(request.url).searchParams;
  const walletAddress = searchParams.get("walletaddress") || "";

  return json({
    walletAddress: walletAddress,
  } as const);
}

const schema = z.object({
  walletAddress: z.string(),
  receiver: z
    .string()
    .transform((val) => val.replace("$", "https://"))
    .pipe(z.string().url({ message: "Invalid wallet address." })),
  amount: z.coerce.number(),
  assetCode: z.string(),
  note: z.string(),
  paymentType: z.string(),
});

export default function Pay() {
  const data = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const { amountValue, assetCode } = useDialPadContext();
  const [form, fields] = useForm({
    id: "pay-form",
    constraint: getFieldsetConstraint(schema),
    lastSubmission: actionData,
    shouldRevalidate: "onSubmit",
  });

  return (
    <>
      <Header />
      <Link
        to={`/ilpay?walletaddress=${data.walletAddress}`}
        className="flex gap-2 items-center justify-end"
      >
        <BackNav />
        <span className="hover:text-green-1">Amount</span>
      </Link>
      <div className="flex h-full flex-col justify-center gap-10">
        <AmountDisplay />
        <div className="mx-auto w-full max-w-sm">
          <Form method="POST" {...form.props}>
            <div className="flex flex-col gap-4">
              <TogglePayment
                type="send"
                // onChange={(newValue) => {
                //   setValue("paymentType, newValue)
                //     // ? "receive"
                //     // : "send";
                // }}
              />
              <Field
                type="text"
                label="Pay from"
                variant="highlight"
                {...conform.input(fields.walletAddress)}
                value={atob(data.walletAddress)}
                readOnly
              />
              <Field
                label="Pay into"
                placeholder="Enter receiver wallet address"
                autoFocus={true}
                {...conform.input(fields.receiver)}
                errors={fields.receiver.errors}
              />
              <Field
                label="Payment note"
                placeholder="Note"
                {...conform.input(fields.note)}
                errors={fields.note.errors}
              />
              <input
                type="hidden"
                {...conform.input(fields.amount)}
                value={Number(amountValue)}
              />
              <input
                type="hidden"
                {...conform.input(fields.assetCode)}
                value={assetCode}
              />
              <input
                type="hidden"
                {...conform.input(fields.paymentType)}
                defaultValue="send"
              />
              <Button aria-label="pay" type="submit" size="xl">
                Pay with Interledger Pay
              </Button>
            </div>
          </Form>
        </div>
      </div>
    </>
  );
}

export async function action({ request }: LoaderFunctionArgs) {
  const formData = await request.formData();
  const submission = await parse(formData, {
    schema,
    async: true,
  });

  if (!submission.value || submission.intent !== "submit") {
    return json(submission);
  }

  const grant = await initializePayment(submission.value);

  return redirect(grant.interact.redirect);
}
