import { json, redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
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

  const requestAmount = formatAmount({
    value: incomingPayment.incomingAmount.value,
    assetCode: incomingPayment.incomingAmount.assetCode,
    assetScale: incomingPayment.incomingAmount.assetScale,
  });

  const dateRequested = formatDate({
    date: incomingPayment.createdAt,
  });

  return json({
    requestAmount: requestAmount,
    dateRequested: dateRequested,
    note: incomingPayment.metadata.description,
    url: incomingPayment.id,
  } as const);
}

export default function ShareRequest() {
  const data = useLoaderData<typeof loader>();
  return (
    <>
      <Header />
      <Link to={`/request`} className="flex gap-2 items-center justify-end">
        <BackNav />
        <span className="hover:text-green-1">Request payment</span>
      </Link>
      <div className="flex h-full flex-col justify-center gap-10">
        <AmountDisplay />
        <div className="mx-auto w-full max-w-sm">
          <Field
            label="Amount requested"
            value={data.requestAmount.amount}
            variant="info"
          ></Field>
          <Field
            label="Date requested"
            value={data.dateRequested}
            variant="info"
          ></Field>
          <Field label="Request note" value={data.note} variant="info"></Field>
          <div className="mb-6 mx-4 flex gap-4 font-light text-sm justify-center items-center before:content-[''] after:content-[''] before:border after:border before:border-input after:border-inout before:flex-1 after:flex-1 before:border-solid after:border-solid">
            Share link
          </div>
          <Field
            label="Payment link"
            variant="highlight"
            value={data.url}
            className="flex-1 -z-1"
            trailing={
              <>
                <CopyButton
                  aria-label="copy payment link"
                  className="h-7 w-7"
                  size="sm"
                  value={data.url}
                  variant="input"
                ></CopyButton>
              </>
            }
          ></Field>
          <Button variant="outline" size="xl">
            Share payment link
          </Button>
          <Link to="/">
            <Button className="mt-8" size="xl">
              Close
            </Button>
          </Link>
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