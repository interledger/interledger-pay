import { conform, useForm } from "@conform-to/react";
import { getFieldsetConstraint, parse } from "@conform-to/zod";
import { json, redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, type MetaFunction, useActionData } from "@remix-run/react";
import { z } from "zod";
import { Header } from "~/components/header";
import { Button } from "~/components/ui/button";
import { Field } from "~/components/ui/form/form";
import { useDialPadContext } from "~/lib/context/dialpad";
import { getWalletAddress } from "~/lib/open-payments.server";
import { commitSession, getSession } from "~/session";

export const meta: MetaFunction = () => {
  return [
    { title: "Interledger Pay" },
    { name: "description", content: "Welcome to Interledger Pay!" },
  ];
};

const schema = z.object({
  walletAddress: z
    .string()
    .transform((val) => val.replace("$", "https://"))
    .pipe(z.string().url({ message: "Invalid wallet address." })),
});

export default function Index() {
  const { setAmountValue } = useDialPadContext();
  const actionData = useActionData<typeof action>();
  const [form, fields] = useForm({
    id: "ilpay-form",
    constraint: getFieldsetConstraint(schema),
    lastSubmission: actionData,
    shouldRevalidate: "onSubmit",
  });

  return (
    <div className="flex justify-center flex-col h-full w-full gap-10 sm:px-20 px-4">
      <Header />
      <div className="text-3xl">Pay anyone anywhere in the world.</div>
      <Form method="POST" {...form.props}>
        <div className="flex flex-col gap-4">
          <Field
            type="text"
            label="Enter your wallet address"
            placeholder="Wallet address"
            className="max-w-96"
            autoFocus={true}
            {...conform.input(fields.walletAddress)}
            errors={fields.walletAddress.errors}
          />
          <Button
            aria-label="pay-now"
            type="submit"
            onClick={() => setAmountValue("0")}
          >
            Pay now
          </Button>
        </div>
      </Form>
    </div>
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

  const walletAddress = await getWalletAddress(submission.value.walletAddress);

  session.set("wallet-address", {
    walletAddress: submission.value.walletAddress.trim(),
    assetCode: walletAddress.assetCode,
  });
  return redirect("/ilpay", {
    headers: { "Set-Cookie": await commitSession(session) },
  });
}
