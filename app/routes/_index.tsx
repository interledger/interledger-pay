import { Link, type MetaFunction } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import { Header } from "~/components/header";

export const meta: MetaFunction = () => {
  return [
    { title: "Interledger Pay" },
    { name: "description", content: "Welcome to Interledger Pay!" },
  ];
};

export default function Index() {
  return (
    <div className="flex justify-center flex-col h-full w-full gap-10 px-5">
      <Header />
      <div className="text-3xl">Pay anyone anywhere in the world.</div>
      <Button aria-label="pay-now">
        <Link to="/ilpay">Pay now</Link>
      </Button>
    </div>
  );
}
