import { conform, useForm } from "@conform-to/react";
import { getFieldsetConstraint, parse } from "@conform-to/zod";
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, Link, useActionData, useLoaderData } from "@remix-run/react";
import { z } from "zod";
import { AmountDisplay } from "~/components/dialpad";
import { Header } from "~/components/header";
import { Button } from "~/components/ui/button";
import { Field } from "~/components/ui/form/form";
import { useDialPadContext } from "~/lib/context/dialpad";

export async function loader({ request }: LoaderFunctionArgs) {
  const searchParams = new URL(request.url).searchParams;
  const walletAddress = searchParams.get("walletaddress") || "";

  return json({
    walletAddress: atob(walletAddress),
  } as const);
}

const schema = z.object({
  walletAddress: z.string(),
  amount: z.coerce.number(),
  assetCode: z.string(),
  note: z.string(),
});

export default function Request() {
  const data = useLoaderData<typeof loader>();
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
                variant="highlight"
                {...conform.input(fields.walletAddress)}
                value={data.walletAddress}
                readOnly
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
              <Link to="/shareRequest">
                <Button
                  aria-label="pay"
                  type="submit"
                  variant="outline"
                  size="xl"
                >
                  Create Request
                </Button>
              </Link>
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
