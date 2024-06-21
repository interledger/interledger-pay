import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react/jsx-runtime";
import { useDialogContext } from "~/lib/context/dialog";
import { Header } from "./header";
import { Field } from "./ui/form/form";
import { Button } from "./ui/button";
import { Form } from "@remix-run/react";
import { useForm } from "@conform-to/react";
import { Loader } from "./loader";
import { useBackdropContext } from "~/lib/context/backdrop";

export type QuoteArgs = {
  receiverName: string;
  receiveAmount: string;
  debitAmount: string;
};

export default function Quote({
  receiverName,
  receiveAmount,
  debitAmount,
}: QuoteArgs) {
  const { open, setOpen } = useDialogContext();
  const { setIsLoading } = useBackdropContext();
  setIsLoading(true);

  const [form] = useForm({
    id: "quote-form",
    shouldRevalidate: "onSubmit",
  });

  if (receiverName !== "") {
    setIsLoading(false);
  }

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={() => setOpen(false)}>
        <Transition.Child
          as={Fragment}
          enter="transition-opacity duration-500"
          enterFrom="opacity-5"
          enterTo="opacity-5"
          leave="transition-opacity duration-500"
          leaveFrom="opacity-10"
          leaveTo="opacity-10"
        >
          <div className="fixed opacity-50 inset-0 bg-background-dark" />
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
              <Dialog.Panel className="relative w-full max-w-sm space-y-4 overflow-hidden rounded-lg px-4 py-8 shadow-2xl bg-foreground">
                <Header />
                <div className="flex h-full flex-col justify-center gap-10 pt-5">
                  <div className="mx-auto w-full max-w-sm">
                    <Loader type="small" />
                    <Form method="POST" {...form.props}>
                      <Field
                        label="You send"
                        value={debitAmount}
                        variant="info"
                      ></Field>
                      <Field
                        label={`${receiverName} gets`}
                        value={receiveAmount}
                        variant="info"
                      ></Field>
                      <div className="flex justify-center items-center gap-3">
                        <Button
                          aria-label="confirm-pay"
                          type="submit"
                          value="confirm"
                          name="intent"
                        >
                          Confirm payment
                        </Button>
                        <Button
                          aria-label="cancel-pay"
                          type="submit"
                          variant="destructive"
                          value="cancel"
                          name="intent"
                          onClick={() => setOpen(false)}
                        >
                          Cancel payment
                        </Button>
                      </div>
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
