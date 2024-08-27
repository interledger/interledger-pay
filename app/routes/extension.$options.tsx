// We can use the $options to pass in all the options:
// receiver, amount, message, etc. The CSS for the iframe will be present
// in the $options as well

import {
  type LoaderFunctionArgs,
} from "@remix-run/node";
import type { MetaFunction } from "@remix-run/react";

export const meta: MetaFunction = () => {
  return [
    { title: "Interledger Pay" },
    { name: "description", content: "Transaction by Interledger Pay!" },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
    console.log(new URL(request.url))
}

export default function Extension() {
    return <>test</>
}
