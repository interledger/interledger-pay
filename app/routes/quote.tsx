import { useForm } from "@conform-to/react";
import { Dialog, Transition } from "@headlessui/react";
import { type Quote } from "@interledger/open-payments";
import { json, redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { Fragment } from "react/jsx-runtime";
import { Header } from "~/components/header";
import { Button } from "~/components/ui/button";
import { Field } from "~/components/ui/form/form";
import { useDialogContext } from "~/lib/context/dialog";
import { initializePayment } from "~/lib/open-payments.server";
import { commitSession, destroySession, getSession } from "~/session";
import { formatAmount } from "~/utils/helpers";

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const quote = session.get("quote");

  if (quote === undefined) {
    throw new Error("Payment session expired.");
  }

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

  return json({
    receiveAmount: receiveAmount.amountWithCurrency,
    debitAmount: debitAmount.amountWithCurrency,
  } as const);
}

export default function Quote() {
  const { open, setOpen } = useDialogContext();

  const data = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [form] = useForm({
    id: "quote-form",
    lastSubmission: actionData,
    shouldRevalidate: "onSubmit",
  });

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={() => setOpen(false)}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-background-dark transition-opacity" />
        </Transition.Child>
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4"
              enterTo="opacity-100 translate-y-0"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-4"
            >
              <Dialog.Panel className="relative w-full max-w-sm space-y-4 overflow-hidden rounded-lg px-4 py-8 shadow-xl bg-foreground">
                <Header />
                <div className="flex h-full flex-col justify-center gap-10 pt-5">
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
                      <Button
                        aria-label="confirm-pay"
                        type="submit"
                        size="xl"
                        className="mb-5"
                        value="CONFIRM"
                        name="action"
                      >
                        Confirm payment
                      </Button>
                      <Button
                        aria-label="cancel-pay"
                        type="submit"
                        size="xl"
                        variant="destructive"
                        value="CANCEL"
                        name="action"
                        onClick={() => setOpen(false)}
                      >
                        Cancel payment
                      </Button>
                    </Form>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

export async function action({ request }: LoaderFunctionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const formData = await request.formData();

  if (formData.get("action") === "CONFIRM") {
    const quote = session.get("quote");
    const walletAddressInfo = session.get("wallet-address");

    if (quote === undefined || walletAddressInfo === undefined) {
      throw new Error("Payment session expired.");
    }

    const grant = await initializePayment({
      walletAddress: walletAddressInfo.walletAddress.id,
      quote: quote,
    });

    session.set("payment-grant", grant);
    return redirect(grant.interact.redirect, {
      headers: { "Set-Cookie": await commitSession(session) },
    });
  }

  return redirect("/", {
    headers: { "Set-Cookie": await destroySession(session) },
  });
}
