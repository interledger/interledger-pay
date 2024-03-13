import { Button } from "~/components/ui/button";
import { DialPad } from "~/components/dialpad";
import { Header } from "~/components/header";

export default function Ilpay() {
  return (
    <>
      <Header />
      <div className="flex justify-center items-center flex-col h-full px-5">
        <div className="h-2/3 items-center justify-center flex flex-col gap-10 w-full max-w-sm">
          <DialPad />
          <div className="flex justify-evenly gap-2">
            <Button
              aria-label="request"
              type="submit"
              variant="outline"
              size="sm"
            >
              Request
            </Button>
            <Button aria-label="pay" type="submit" size={"sm"}>
              Pay
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
