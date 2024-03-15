import { Button } from "~/components/ui/button";
import { DialPad } from "~/components/dialpad";
import { Header } from "~/components/header";
import { Link } from "@remix-run/react";

export default function Ilpay() {
  return (
    <>
      <Header />
      <div className="flex justify-center items-center flex-col h-full px-5">
        <div className="h-2/3 items-center justify-center flex flex-col gap-10 w-full max-w-sm">
          <DialPad />
          <div className="flex justify-evenly gap-2">
            <Button aria-label="request" variant="outline" size="sm">
              <Link to="/request">Request</Link>
            </Button>
            <Button aria-label="pay" size={"sm"}>
              <Link to="/pay">Pay</Link>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
