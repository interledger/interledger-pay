import { conform, useForm } from "@conform-to/react";
import { getFieldsetConstraint, parse } from "@conform-to/zod";
import { json, redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { z } from "zod";
import { AmountDisplay } from "~/components/dialpad";
import { Header } from "~/components/header";
import { Button } from "~/components/ui/button";
import { Field } from "~/components/ui/form/form";
import { useDialPadContext } from "~/lib/context/dialpad";
import { initializePayment } from "~/lib/open-payments.server";

const schema = z.object({
  walletAddress: z.string(),
  receiver: z.string(),
  amount: z.coerce.number(),
  assetCode: z.string(),
  note: z.string(),
});

export default function Pay() {
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
      <div className="flex h-full flex-col justify-center gap-10">
        <AmountDisplay />
        <div className="mx-auto w-full max-w-sm">
          <Form method="POST" {...form.props}>
            <div className="flex flex-col gap-4">
              <Field
                type="text"
                label="Pay from"
                placeholder="Enter your wallet address"
                autoFocus={true}
                {...conform.input(fields.walletAddress)}
                errors={fields.walletAddress.errors}
              />
              <Field
                label="Pay into"
                placeholder="Enter receiver wallet address"
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
