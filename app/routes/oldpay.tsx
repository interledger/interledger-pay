import { conform, useForm } from "@conform-to/react";
import { getFieldsetConstraint, parse } from "@conform-to/zod";
import {
  type DataFunctionArgs,
  type MetaFunction,
  json,
  redirect,
} from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { z } from "zod";
import { Field } from "~/components/ui/form/form";
// import { useIsPending } from "~/lib/hooks";
import { initializePayment } from "~/lib/open-payments.server";

export const meta: MetaFunction = () => {
  return [
    { title: "Interledger Pay" },
    { name: "description", content: "Welcome to Interledger Pay!" },
  ];
};

const schema = z.object({
  walletAddress: z.string(),
  receiver: z.string(),
  amount: z.coerce.number(),
});

export default function Index() {
  const actionData = useActionData<typeof action>();
  //   const isPending = useIsPending();
  const [form, fields] = useForm({
    id: "pay-form",
    constraint: getFieldsetConstraint(schema),
    lastSubmission: actionData,
    shouldRevalidate: "onSubmit",
  });

  return (
    <div className="flex min-h-full flex-col justify-center pb-32 pt-20">
      <div className="mx-auto w-full max-w-md">
        <div className="mx-auto w-full max-w-md px-8">
          <Form method="POST" {...form.props}>
            <Field
              type="text"
              label="Wallet address"
              placeholder="Wallet address"
              autoFocus={true}
              {...conform.input(fields.walletAddress)}
              errors={fields.walletAddress.errors}
            />
            <Field
              label="Receiver"
              placeholder="Receiver"
              {...conform.input(fields.receiver)}
              errors={fields.receiver.errors}
            />
            <Field
              label="Amount"
              placeholder="Amount"
              {...conform.input(fields.amount)}
              errors={fields.amount.errors}
            />
            {/* <PayButton className="w-full" type="submit" disabled={isPending}>
              Pay
            </PayButton> */}
          </Form>
        </div>
      </div>
    </div>
  );
}

export async function action({ request }: DataFunctionArgs) {
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
