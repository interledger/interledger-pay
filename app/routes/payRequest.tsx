import { AmountDisplay } from "~/components/dialpad";
import { Header } from "~/components/header";
import { Button } from "~/components/ui/button";
import { Field } from "~/components/ui/form/form";

export default function PayRequest() {
  return (
    <>
      <Header />
      <div className="flex h-full flex-col justify-center gap-10">
        <AmountDisplay />
        <div className="mx-auto w-full max-w-sm">
          <Field
            label="Amount requested"
            value="kkkkk"
            variant="highlight"
          ></Field>
          <Field
            label="Date requested"
            value="December 31, 2023"
            variant="highlight"
          ></Field>
          <Field label="Pay into" value="Their PP" variant="highlight"></Field>
          <Field
            label="Request note"
            value="Kukac money"
            variant="highlight"
          ></Field>
          <Field
            label="Pay from"
            placeholder="Enter your wallet address"
          ></Field>
          <Button aria-label="pay" type="submit" size="xl">
            Pay with Interledger Pay
          </Button>
        </div>
      </div>
    </>
  );
}
