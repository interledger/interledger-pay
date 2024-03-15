import { Link } from "@remix-run/react";
import { AmountDisplay } from "~/components/dialpad";
import { Header } from "~/components/header";
import { Button } from "~/components/ui/button";
import { CopyButton } from "~/components/ui/copyButton";
import { Field } from "~/components/ui/form/form";

export default function ShareRequest() {
  return (
    <>
      <Header />
      <div className="flex h-full flex-col justify-center gap-10">
        <AmountDisplay />
        <div className="mx-auto w-full max-w-sm">
          <Field label="Amount requested" value="kkkkk" variant="info"></Field>
          <Field
            label="Date requested"
            value="December 31, 2023"
            variant="info"
          ></Field>
          <Field
            label="Request note"
            value="Kukac money"
            variant="info"
          ></Field>
          <div className="mb-6 mx-4 flex gap-4 font-light text-sm justify-center items-center before:content-[''] after:content-[''] before:border after:border before:border-input after:border-inout before:flex-1 after:flex-1 before:border-solid after:border-solid">
            Share link
          </div>
          <Field
            label="Payment link"
            variant="highlight"
            value="khdkjbdkajh dksjahdjhas"
            className="flex-1 -z-1"
            trailing={
              <>
                <CopyButton
                  aria-label="copy payment link"
                  className="h-7 w-7"
                  size="sm"
                  value="cruel cruel world"
                  variant="input"
                ></CopyButton>
              </>
            }
          ></Field>
          <Button variant="outline" size="xl">
            Share payment link
          </Button>
          <Button className="mt-8" size="xl">
            <Link to="/">Close</Link>
          </Button>
        </div>
      </div>
    </>
  );
}
