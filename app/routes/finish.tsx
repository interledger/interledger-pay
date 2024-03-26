import { useForm } from "@conform-to/react";
import { type LoaderFunctionArgs, json, redirect } from "@remix-run/node";
import { Form, Link, useActionData, useLoaderData } from "@remix-run/react";
import { Header } from "~/components/header";
import { FinishCheck, FinishError } from "~/components/icons";
import { Button } from "~/components/ui/button";
import { prisma } from "~/lib/db.server";
import { send } from "~/lib/open-payments.server";
import { destroySession, getSession } from "~/session";

export async function loader({ request }: LoaderFunctionArgs) {
  const searchParams = new URL(request.url).searchParams;

  const paymentId = searchParams.get("paymentId");
  const interactRef = searchParams.get("interact_ref");
  const result = searchParams.get("result");

  if (result === "grant_rejected") {
    return json({
      isRejected: true,
      message: "Payment was successfully declined",
      color: "red",
      error: false,
    } as const);
  }

  if (!paymentId || !interactRef) {
    throw redirect("/");
  }

  const payment = await prisma.payment.findUnique({
    where: {
      id: paymentId,
      processedAt: null,
    },
  });

  if (!payment) {
    console.error(`[FINISH] Could not find payment with ID: '${paymentId}'`);
    return json({
      isRejected: true,
      message: "An Error occured",
      color: "red",
      error: true,
    } as const);
  }

  const session = await getSession(request.headers.get("Cookie"));
  const quote = session.get("quote");

  await send(
    payment,
    interactRef,
    quote.incomingPaymentGrantToken,
    quote.receiver
  );

  return json({
    isRejected: false,
    message: "Payment successful",
    color: "green",
    error: false,
  } as const);
}

export default function Finish() {
  const data = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [form] = useForm({
    id: "finish-form",
    lastSubmission: actionData,
  });

  return (
    <>
      <Header />
      <div className="flex justify-center items-center flex-col h-full px-5 gap-8">
        {data.error ? (
          <>
            <FinishError />
            <div className="text-destructive uppercase sm:text-2xl font-medium text-center">
              {data.message}
            </div>
            <div className="flex gap-2">
              <Button variant="outline_destructive" size="sm">
                Try again
              </Button>{" "}
              <Link to="/">
                <Button variant="outline" size="sm">
                  Home
                </Button>
              </Link>
            </div>
          </>
        ) : data.color === "red" ? (
          <>
            <FinishCheck color="red" />
            <div className="text-destructive uppercase sm:text-2xl font-medium text-center">
              {data.message}
            </div>{" "}
            <Form method="POST" {...form.props}>
              <Button variant="outline" size="sm" type="submit">
                Home
              </Button>
            </Form>
          </>
        ) : (
          <>
            <FinishCheck />
            <div className="text-green-1 uppercase sm:text-2xl font-medium text-center">
              {data.message}
            </div>
            <Form method="POST" {...form.props}>
              <Button variant="outline" size="sm" type="submit">
                Home
              </Button>
            </Form>
          </>
        )}
      </div>
    </>
  );
}

export async function action({ request }: LoaderFunctionArgs) {
  const session = await getSession(request.headers.get("Cookie"));

  return redirect("/", {
    headers: { "Set-Cookie": await destroySession(session) },
  });
}
