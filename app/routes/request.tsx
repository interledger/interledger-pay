import { conform, useForm } from "@conform-to/react";
import { getFieldsetConstraint, parse } from "@conform-to/zod";
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, Link, useActionData } from "@remix-run/react";
import { z } from "zod";
import { AmountDisplay } from "~/components/dialpad";
import { Header } from "~/components/header";
import { Button } from "~/components/ui/button";
import { Field } from "~/components/ui/form/form";
import { useDialPadContext } from "~/lib/context/dialpad";

const schema = z.object({
  walletAddress: z.string(),
  amount: z.coerce.number(),
  assetCode: z.string(),
  note: z.string(),
});

export default function Request() {
  const actionData = useActionData<typeof action>();
  const { amountValue, assetCode } = useDialPadContext();
  const [form, fields] = useForm({
    id: "request-form",
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
                label="Wallet Address"
                placeholder="Enter your wallet address"
                autoFocus={true}
                {...conform.input(fields.walletAddress)}
                errors={fields.walletAddress.errors}
              />
              <Field
                label="Request note"
                placeholder="Note"
                {...conform.input(fields.note)}
                errors={fields.note.errors}
              />
              <input
                type="hidden"
                {...conform.input(fields.amount)}
                value={amountValue}
              />
              <input
                type="hidden"
                {...conform.input(fields.assetCode)}
                value={assetCode}
              />
              <Button
                aria-label="pay"
                type="submit"
                variant="outline"
                size="xl"
              >
                <Link to="/shareRequest">Create Request</Link>
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

  //   const grant = await initializePayment(submission.value);

  //   return redirect(grant.interact.redirect);
}
